import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { Stage2Result } from "./enhanced-processor";

export interface SpecimenData {
  reportId: string;
  collectionDate: Date;
  collectorNPI?: string;
  labCLIA?: string;
  accessionNumber: string;
}

export interface ChainOfCustodyData {
  collector?: string;
  collectionTime: Date;
  receivedTime: Date;
  transportMethod?: string;
  temperature?: string;
  notes?: string;
}

export interface Specimen {
  id: string;
  reportId: string;
  accessionNumber: string;
  collectionDate: Date;
  collectorNPI?: string;
  labCLIA?: string;
  chainOfCustody?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class SpecimenTracker {
  /**
   * Create a new specimen record
   */
  async createSpecimen(data: SpecimenData): Promise<Specimen> {
    // In a real implementation, this would create a specimen record in the database
    // For now, we'll store it as parsedData on the report
    const report = await prisma.report.findUnique({
      where: { id: data.reportId },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    const specimenData = {
      id: `SPEC-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Update report with specimen data in parsedData field
    const existingParsedData = report.parsedData ? JSON.parse(report.parsedData) : {};
    
    await prisma.report.update({
      where: { id: data.reportId },
      data: {
        parsedData: JSON.stringify({
          ...existingParsedData,
          specimen: specimenData,
        }),
      },
    });

    return specimenData as Specimen;
  }

  /**
   * Document chain of custody for a specimen
   */
  async documentChainOfCustody(
    specimenId: string,
    custodyData: ChainOfCustodyData
  ): Promise<{ verified: boolean; details: ChainOfCustodyData }> {
    // Validate chain of custody data
    const isValid = this.validateChainOfCustody(custodyData);

    if (!isValid) {
      throw new Error("Invalid chain of custody data");
    }

    // In a real implementation, this would create a chain of custody record
    // For now, we'll return a mock verification
    return {
      verified: true,
      details: {
        ...custodyData,
        transportMethod: custodyData.transportMethod || "courier",
        temperature: custodyData.temperature || "2-8°C",
      },
    };
  }

  /**
   * Get specimen by ID
   */
  async getSpecimen(specimenId: string): Promise<Specimen | null> {
    // Mock implementation - would query specimen table
    // For now, try to find it in report parsedData
    const reports = await prisma.report.findMany({
      where: {
        parsedData: {
          contains: specimenId,
        },
      },
    });

    if (reports.length === 0) {
      return null;
    }

    const report = reports[0];
    if (!report.parsedData) return null;
    
    const parsedData = JSON.parse(report.parsedData);
    const specimen = parsedData?.specimen;
    
    if (specimen && specimen.id === specimenId) {
      return specimen;
    }
    
    return null;
  }

  /**
   * Update specimen status
   */
  async updateSpecimenStatus(
    specimenId: string,
    status: "collected" | "in_transit" | "received" | "processing" | "completed"
  ): Promise<void> {
    const specimen = await this.getSpecimen(specimenId);
    if (!specimen) {
      throw new Error("Specimen not found");
    }

    // Update status in report parsedData
    const report = await prisma.report.findUnique({
      where: { id: specimen.reportId },
    });

    if (report && report.parsedData) {
      const parsedData = JSON.parse(report.parsedData);
      
      await prisma.report.update({
        where: { id: specimen.reportId },
        data: {
          parsedData: JSON.stringify({
            ...parsedData,
            specimen: {
              ...parsedData?.specimen,
              status,
              statusUpdatedAt: new Date(),
            },
          }),
        },
      });
    }
  }

  /**
   * Validate chain of custody data
   */
  private validateChainOfCustody(data: ChainOfCustodyData): boolean {
    // Check required fields
    if (!data.collectionTime || !data.receivedTime) {
      return false;
    }

    // Check that received time is after collection time
    if (data.receivedTime < data.collectionTime) {
      return false;
    }

    // Check that time difference is reasonable (e.g., less than 7 days)
    const timeDiff = data.receivedTime.getTime() - data.collectionTime.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) {
      return false;
    }

    return true;
  }

  /**
   * Generate barcode for specimen tracking
   */
  generateBarcode(accessionNumber: string): string {
    // Mock implementation - would generate actual barcode
    return `*${accessionNumber}*`;
  }

  /**
   * Track specimen location
   */
  async trackLocation(
    specimenId: string,
    location: {
      facility: string;
      department?: string;
      timestamp: Date;
    }
  ): Promise<void> {
    const specimen = await this.getSpecimen(specimenId);
    if (!specimen) {
      throw new Error("Specimen not found");
    }

    // Add location to tracking history
    const report = await prisma.report.findUnique({
      where: { id: specimen.reportId },
    });

    if (report && report.parsedData) {
      const parsedData = JSON.parse(report.parsedData);
      const trackingHistory = parsedData?.specimen?.trackingHistory || [];
      trackingHistory.push(location);

      await prisma.report.update({
        where: { id: specimen.reportId },
        data: {
          parsedData: JSON.stringify({
            ...parsedData,
            specimen: {
              ...parsedData?.specimen,
              currentLocation: location,
              trackingHistory,
            },
          }),
        },
      });
    }
  }

  /**
   * Track specimen throughout the lab workflow
   */
  async trackSpecimen(reportId: string): Promise<Stage2Result> {
    // Find report to get specimen data
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report || !report.parsedData) {
      throw new Error("Report not found or missing specimen data");
    }

    let specimen = null;
    try {
      const parsedData = JSON.parse(report.parsedData);
      specimen = parsedData.specimen;
    } catch (e) {
      throw new Error("Invalid specimen data format");
    }

    if (!specimen) {
      // Create a new specimen if one doesn't exist
      const accessionNumber = `AC${Date.now().toString().substring(6)}`;
      specimen = await this.createSpecimen({
        reportId,
        collectionDate: new Date(), // Use current date since reportDate doesn't exist
        accessionNumber
      });
    }

    // Return specimen tracking info
    return {
      specimenId: specimen.id,
      status: specimen.status || "collected",
      collectionDate: new Date(specimen.collectionDate),
      receivedDate: specimen.receivedDate ? new Date(specimen.receivedDate) : new Date(),
      processedDate: specimen.processedDate ? new Date(specimen.processedDate) : new Date()
    };
  }

  /**
   * Verify specimen integrity
   */
  async verifyIntegrity(specimenId: string): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const specimen = await this.getSpecimen(specimenId);
    if (!specimen) {
      return { isValid: false, issues: ["Specimen not found"] };
    }

    const issues: string[] = [];

    // Check collection date is not too old
    const daysSinceCollection = Math.floor(
      (Date.now() - new Date(specimen.collectionDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCollection > 30) {
      issues.push("Specimen collected more than 30 days ago");
    }

    // Check for required documentation
    if (!specimen.collectorNPI) {
      issues.push("Missing collector NPI");
    }
    if (!specimen.labCLIA) {
      issues.push("Missing lab CLIA number");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
