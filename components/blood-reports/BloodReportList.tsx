"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, AlertCircle, FileText, BarChart } from "lucide-react";
import { BloodTestReport, BloodBiomarker } from "@prisma/client";

interface PaginatedBloodReportData {
  data: (BloodTestReport & {
    biomarkers?: Pick<BloodBiomarker, "id" | "name" | "value" | "unit" | "isAbnormal" | "category">[];
  })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface BloodReportListProps {
  initialData?: PaginatedBloodReportData;
  onPageChange?: (page: number) => void;
  onStatusChange?: (status: string) => void;
  onViewReport?: (reportId: string) => void;
  onViewTrends?: (reportId: string) => void;
  isLoading?: boolean;
}

export function BloodReportList({
  initialData,
  onPageChange,
  onStatusChange,
  onViewReport,
  onViewTrends,
  isLoading = false,
}: BloodReportListProps) {
  const [data, setData] = useState<PaginatedBloodReportData | undefined>(initialData);
  
  // If status changes, fetch new data via the callback
  const handleStatusChange = (status: string) => {
    onStatusChange?.(status);
  };

  // If page changes, fetch new data via the callback
  const handlePageChange = (page: number) => {
    onPageChange?.(page);
  };

  // Count abnormal biomarkers in a report
  const countAbnormalBiomarkers = (report: BloodTestReport & { biomarkers?: any[] }) => {
    return report.biomarkers?.filter(b => b.isAbnormal).length || 0;
  };
  
  // Renders pagination controls
  const renderPagination = () => {
    if (!data?.pagination) return null;
    
    const { page, pages } = data.pagination;
    
    return (
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= pages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Blood Test Reports</h2>
        <div className="flex items-center space-x-2">
          <Select
            defaultValue="ACTIVE"
            onValueChange={handleStatusChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="AMENDED">Amended</SelectItem>
              <SelectItem value="DELETED">Deleted</SelectItem>
              <SelectItem value="ALL">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        // Loading state
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[250px]" />
                <Skeleton className="h-4 w-[150px] mt-2" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-[100px]" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        // Empty state
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Reports Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You don't have any blood test reports yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        // Report list
        <div className="space-y-4">
          {data?.data.map((report) => {
            const abnormalCount = countAbnormalBiomarkers(report);
            const topBiomarkers = report.biomarkers
              ?.slice(0, 5)
              .sort((a, b) => (b.isAbnormal ? 1 : 0) - (a.isAbnormal ? 1 : 0));
              
            return (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">
                      Blood Test
                      {report.reportIdentifier && (
                        <span className="text-sm text-muted-foreground ml-2">
                          #{report.reportIdentifier}
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Badge
                        variant={
                          report.status === "ACTIVE"
                            ? "default"
                            : report.status === "AMENDED"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {report.status}
                      </Badge>
                      {report.reportVersion && report.reportVersion > 1 && (
                        <Badge variant="outline">v{report.reportVersion}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {report.reportDate
                        ? format(new Date(report.reportDate), "PPP")
                        : "No date"}
                    </span>
                    {report.labName && (
                      <span className="text-sm text-muted-foreground">
                        • {report.labName}
                      </span>
                    )}
                    {abnormalCount > 0 && (
                      <div className="flex items-center text-destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span className="text-sm">{abnormalCount} abnormal</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {topBiomarkers && topBiomarkers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {topBiomarkers.map((biomarker) => (
                        <div
                          key={biomarker.id}
                          className="flex justify-between items-center p-2 bg-accent rounded"
                        >
                          <div className="flex items-center">
                            <span className="font-medium">{biomarker.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className={biomarker.isAbnormal ? "font-bold text-destructive" : ""}>
                              {biomarker.value} {biomarker.unit}
                            </span>
                            {biomarker.isAbnormal && (
                              <AlertCircle className="h-3 w-3 ml-1 text-destructive" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No biomarkers available</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewReport?.(report.id)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {onViewTrends && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewTrends(report.id)}
                    >
                      <BarChart className="h-4 w-4 mr-2" />
                      View Trends
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
          
          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="mt-4">{renderPagination()}</div>
          )}
        </div>
      )}
    </div>
  );
}
