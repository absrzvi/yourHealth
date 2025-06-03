"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BloodTestReport, BloodBiomarker, BloodReportSection } from "@prisma/client";

// Define the component props with full type safety
interface BloodReportDetailProps {
  report: BloodTestReport & {
    biomarkers: BloodBiomarker[];
    sections: BloodReportSection[];
    amendedVersions?: {
      id: string;
      reportVersion: number;
      createdAt: Date;
    }[];
  };
  onEdit?: (reportId: string) => void;
  onDelete?: (reportId: string) => void;
  onViewVersion?: (versionId: string) => void;
}

export function BloodReportDetail({
  report,
  onEdit,
  onDelete,
  onViewVersion,
}: BloodReportDetailProps) {
  const [activeTab, setActiveTab] = useState("biomarkers");

  // Group biomarkers by category
  const biomarkersByCategory = report.biomarkers.reduce<Record<string, BloodBiomarker[]>>(
    (acc, biomarker) => {
      const category = biomarker.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(biomarker);
      return acc;
    },
    {}
  );

  // Sort categories to ensure consistent order
  const sortedCategories = Object.keys(biomarkersByCategory).sort((a, b) => {
    // Ensure "Complete Blood Count" comes first, then "Lipid Panel", then alphabetical
    if (a === "Complete Blood Count") return -1;
    if (b === "Complete Blood Count") return 1;
    if (a === "Lipid Panel") return -1;
    if (b === "Lipid Panel") return 1;
    return a.localeCompare(b);
  });

  const abnormalCount = report.biomarkers.filter(b => b.isAbnormal).length;
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">
            Blood Test Report
            {report.reportIdentifier && <span className="ml-2 text-sm text-muted-foreground">#{report.reportIdentifier}</span>}
          </CardTitle>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-muted-foreground">
              {report.reportDate ? format(new Date(report.reportDate), "PPP") : "No date"}
            </span>
            {report.labName && (
              <Badge variant="outline" className="text-xs">
                {report.labName}
              </Badge>
            )}
            <Badge 
              variant={report.status === "ACTIVE" ? "default" : 
                     report.status === "AMENDED" ? "secondary" : "destructive"}
              className="text-xs"
            >
              {report.status}
            </Badge>
            {abnormalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {abnormalCount} Abnormal
              </Badge>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(report.id)}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(report.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="biomarkers">Biomarkers</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            {report.amendedVersions && report.amendedVersions.length > 0 && (
              <TabsTrigger value="versions">Versions</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="biomarkers" className="mt-4">
            {sortedCategories.length === 0 ? (
              <Alert>
                <AlertDescription>No biomarkers found in this report.</AlertDescription>
              </Alert>
            ) : (
              <Accordion type="multiple" className="w-full">
                {sortedCategories.map((category) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-md font-medium">
                      {category}{" "}
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({biomarkersByCategory[category].length})
                      </span>
                      {biomarkersByCategory[category].some((b) => b.isAbnormal) && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Abnormal
                        </Badge>
                      )}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-[300px] rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Biomarker</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Reference Range</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {biomarkersByCategory[category]
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((biomarker) => (
                                <TableRow key={biomarker.id}>
                                  <TableCell className="font-medium">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>{biomarker.name}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="text-xs max-w-[300px]">
                                            {biomarker.clinicalSignificance || "No description available"}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                  <TableCell>
                                    <span className={biomarker.isAbnormal ? "font-bold text-destructive" : ""}>
                                      {biomarker.value} {biomarker.unit}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {biomarker.referenceRangeText || (
                                      biomarker.referenceRangeLow !== null && biomarker.referenceRangeHigh !== null
                                        ? `${biomarker.referenceRangeLow} - ${biomarker.referenceRangeHigh}`
                                        : biomarker.referenceRangeLow !== null
                                          ? `> ${biomarker.referenceRangeLow}`
                                          : biomarker.referenceRangeHigh !== null
                                            ? `< ${biomarker.referenceRangeHigh}`
                                            : "No range"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {biomarker.isAbnormal ? (
                                      <Badge variant="destructive" className="text-xs">
                                        {biomarker.abnormalityType || "Abnormal"}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        Normal
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="metadata" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Report Info</h3>
                  <dl className="mt-2 divide-y divide-gray-100 border rounded-md p-4">
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Date</dt>
                      <dd className="text-sm">
                        {report.reportDate
                          ? format(new Date(report.reportDate), "PPP")
                          : "No date"}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Lab</dt>
                      <dd className="text-sm">{report.labName || "Unknown"}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Doctor</dt>
                      <dd className="text-sm">{report.doctorName || "Unknown"}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Status</dt>
                      <dd className="text-sm">
                        <Badge
                          variant={
                            report.status === "ACTIVE"
                              ? "default"
                              : report.status === "AMENDED"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {report.status}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Version</dt>
                      <dd className="text-sm">{report.reportVersion || 1}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Created</dt>
                      <dd className="text-sm">
                        {format(new Date(report.createdAt), "PPP")}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Patient Info</h3>
                  <dl className="mt-2 divide-y divide-gray-100 border rounded-md p-4">
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Name</dt>
                      <dd className="text-sm">{report.patientName || "Unknown"}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">ID</dt>
                      <dd className="text-sm">{report.patientId || "Unknown"}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Date of Birth</dt>
                      <dd className="text-sm">
                        {report.patientDOB
                          ? format(new Date(report.patientDOB), "PPP")
                          : "Unknown"}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Gender</dt>
                      <dd className="text-sm">{report.patientGender || "Unknown"}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Technical Info</h3>
                  <dl className="mt-2 divide-y divide-gray-100 border rounded-md p-4">
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Parsing Method</dt>
                      <dd className="text-sm">{report.parsingMethod || "Unknown"}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">OCR Confidence</dt>
                      <dd className="text-sm">
                        {report.ocrConfidence !== null
                          ? `${Math.round(report.ocrConfidence * 100)}%`
                          : "Unknown"}
                      </dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Biomarker Count</dt>
                      <dd className="text-sm">{report.biomarkers.length}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-sm font-medium">Sections</dt>
                      <dd className="text-sm">{report.sections.length}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {report.notes && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                <div className="mt-2 border rounded-md p-4">
                  <p className="text-sm whitespace-pre-line">{report.notes}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {report.amendedVersions && report.amendedVersions.length > 0 && (
            <TabsContent value="versions" className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Version History</h3>
              <ScrollArea className="h-[300px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      // Add current version at the top
                      {
                        id: report.id,
                        reportVersion: report.reportVersion || 1,
                        createdAt: report.createdAt,
                        isCurrent: true,
                      },
                      // Add amended versions
                      ...report.amendedVersions.map((v) => ({
                        ...v,
                        isCurrent: false,
                      })),
                    ]
                      .sort((a, b) => b.reportVersion - a.reportVersion)
                      .map((version) => (
                        <TableRow key={version.id}>
                          <TableCell>
                            Version {version.reportVersion}
                            {version.isCurrent && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Current
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(version.createdAt), "PPP p")}
                          </TableCell>
                          <TableCell>
                            {!version.isCurrent && onViewVersion && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewVersion(version.id)}
                              >
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
