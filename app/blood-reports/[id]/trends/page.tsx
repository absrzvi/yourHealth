"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { BloodTestReport, BloodBiomarker } from "@prisma/client";

interface TrendData {
  id: string;
  name: string;
  value: string;
  numericValue: number;
  unit: string;
  referenceRangeLow: number | null;
  referenceRangeHigh: number | null;
  isAbnormal: boolean;
  date: Date;
  labName: string | null;
}

interface BloodReportTrendsPageProps {
  params: {
    id: string;
  };
}

export default function BloodReportTrendsPage({ params }: BloodReportTrendsPageProps) {
  const router = useRouter();
  const [report, setReport] = useState<BloodTestReport & { biomarkers: BloodBiomarker[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [selectedBiomarker, setSelectedBiomarker] = useState<string | null>(null);
  const [biomarkerOptions, setBiomarkerOptions] = useState<{ label: string; value: string }[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [activeTab, setActiveTab] = useState<string>("graph");

  // Fetch initial report data
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/blood-reports/${params.id}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Blood report not found");
          } else if (res.status === 401) {
            throw new Error("Unauthorized access");
          } else {
            throw new Error("Failed to fetch blood report");
          }
        }

        const data = await res.json();
        setReport(data.data);
        
        // Generate biomarker options from the report
        if (data.data.biomarkers && data.data.biomarkers.length > 0) {
          const options = data.data.biomarkers
            .sort((a: BloodBiomarker, b: BloodBiomarker) => a.name.localeCompare(b.name))
            .map((biomarker: BloodBiomarker) => ({
              label: biomarker.name,
              value: biomarker.name,
            }));
          
          setBiomarkerOptions(options);
          // Select the first biomarker by default
          setSelectedBiomarker(options[0].value);
        }
      } catch (err) {
        console.error("Error fetching blood report:", err);
        setError(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  // Fetch trend data when selected biomarker changes
  useEffect(() => {
    const fetchTrendData = async () => {
      if (!selectedBiomarker) return;
      
      setTrendLoading(true);
      setTrendError(null);

      try {
        const res = await fetch(`/api/blood-reports/biomarkers/trends?name=${encodeURIComponent(selectedBiomarker)}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch biomarker trend data");
        }

        const data = await res.json();
        setTrendData(data.data);
      } catch (err) {
        console.error("Error fetching biomarker trend data:", err);
        setTrendError(`Failed to load trend data: ${err instanceof Error ? err.message : String(err)}`);
        setTrendData([]);
      } finally {
        setTrendLoading(false);
      }
    };

    if (selectedBiomarker) {
      fetchTrendData();
    }
  }, [selectedBiomarker]);

  // Format data for charts
  const getChartData = () => {
    return trendData.map(item => ({
      date: format(new Date(item.date), 'MMM d, yyyy'),
      value: item.numericValue,
      unit: item.unit,
      isAbnormal: item.isAbnormal,
      referenceRangeLow: item.referenceRangeLow,
      referenceRangeHigh: item.referenceRangeHigh,
      lab: item.labName || 'Unknown',
    }));
  };

  // Get reference range for selected biomarker
  const getReferenceRange = () => {
    if (!trendData || trendData.length === 0) return null;
    
    const latest = trendData[trendData.length - 1];
    return {
      low: latest.referenceRangeLow,
      high: latest.referenceRangeHigh,
      unit: latest.unit,
    };
  };

  // Get current biomarker value from report
  const getCurrentBiomarkerValue = () => {
    if (!report || !selectedBiomarker) return null;
    
    const biomarker = report.biomarkers.find(b => b.name === selectedBiomarker);
    return biomarker ? {
      value: biomarker.numericValue,
      unit: biomarker.unit,
      isAbnormal: biomarker.isAbnormal,
      abnormalityType: biomarker.abnormalityType,
    } : null;
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded p-3 shadow-md">
          <p className="font-medium">{label}</p>
          <p className={`text-sm ${data.isAbnormal ? 'text-destructive font-bold' : ''}`}>
            Value: {data.value} {data.unit}
          </p>
          {data.referenceRangeLow !== null && data.referenceRangeHigh !== null && (
            <p className="text-sm text-muted-foreground">
              Reference: {data.referenceRangeLow} - {data.referenceRangeHigh} {data.unit}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Lab: {data.lab}</p>
        </div>
      );
    }
    return null;
  };

  // Determine the min and max values for Y axis with padding
  const getYAxisDomain = () => {
    if (!trendData || trendData.length === 0) return [0, 0];
    
    const values = trendData.map(d => d.numericValue);
    const refLows = trendData.filter(d => d.referenceRangeLow !== null).map(d => d.referenceRangeLow as number);
    const refHighs = trendData.filter(d => d.referenceRangeHigh !== null).map(d => d.referenceRangeHigh as number);
    
    const allValues = [...values, ...refLows, ...refHighs];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    // Add 10% padding
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/blood-reports/${params.id}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Report
          </Button>
          <h1 className="text-3xl font-bold">Biomarker Trends</h1>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {report.labName ? `${report.labName} Report` : 'Blood Test Report'} 
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {report.reportDate
                    ? format(new Date(report.reportDate), "PPP")
                    : "No date"}
                </span>
              </CardTitle>
              <CardDescription>
                Select a biomarker to view its trend over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center mb-6">
                <div className="w-full sm:w-1/3">
                  <Select
                    value={selectedBiomarker || undefined}
                    onValueChange={setSelectedBiomarker}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a biomarker" />
                    </SelectTrigger>
                    <SelectContent>
                      {biomarkerOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {getCurrentBiomarkerValue() && (
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Current value</span>
                    <span className={`font-medium ${getCurrentBiomarkerValue()?.isAbnormal ? 'text-destructive' : ''}`}>
                      {getCurrentBiomarkerValue()?.value} {getCurrentBiomarkerValue()?.unit}
                      {getCurrentBiomarkerValue()?.isAbnormal && (
                        <span className="ml-2 text-xs">
                          ({getCurrentBiomarkerValue()?.abnormalityType})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {getReferenceRange() && (
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Reference range</span>
                    <span className="font-medium">
                      {getReferenceRange()?.low !== null && getReferenceRange()?.high !== null
                        ? `${getReferenceRange()?.low} - ${getReferenceRange()?.high}`
                        : getReferenceRange()?.low !== null
                          ? `> ${getReferenceRange()?.low}`
                          : getReferenceRange()?.high !== null
                            ? `< ${getReferenceRange()?.high}`
                            : "Not available"}
                      {" "}
                      {getReferenceRange()?.unit}
                    </span>
                  </div>
                )}
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="graph">Graph</TabsTrigger>
                  <TabsTrigger value="table">Table</TabsTrigger>
                </TabsList>
                
                <TabsContent value="graph" className="pt-4">
                  {trendError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{trendError}</AlertDescription>
                    </Alert>
                  ) : trendLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : trendData.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No historical data available for this biomarker.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={getChartData()}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 50,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#44444420" />
                          <XAxis 
                            dataKey="date" 
                            angle={-45} 
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            domain={getYAxisDomain()}
                            label={{ 
                              value: trendData[0]?.unit || '', 
                              angle: -90, 
                              position: 'insideLeft' 
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="top" height={36} />
                          
                          {/* Reference range lines */}
                          {getReferenceRange()?.low !== null && (
                            <ReferenceLine
                              y={getReferenceRange()?.low}
                              stroke="#888"
                              strokeDasharray="3 3"
                              label={{ 
                                value: 'Min', 
                                position: 'insideBottomLeft',
                                fill: '#888',
                                fontSize: 12
                              }}
                            />
                          )}
                          {getReferenceRange()?.high !== null && (
                            <ReferenceLine
                              y={getReferenceRange()?.high}
                              stroke="#888"
                              strokeDasharray="3 3"
                              label={{ 
                                value: 'Max', 
                                position: 'insideTopLeft',
                                fill: '#888',
                                fontSize: 12
                              }}
                            />
                          )}
                          
                          <Line
                            type="monotone"
                            dataKey="value"
                            name={selectedBiomarker || "Value"}
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ 
                              r: 6, 
                              stroke: "hsl(var(--primary))", 
                              fill: "white" 
                            }}
                            activeDot={{ r: 8, strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="table" className="pt-4">
                  {trendError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{trendError}</AlertDescription>
                    </Alert>
                  ) : trendLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : trendData.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No historical data available for this biomarker.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="border rounded-md">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="p-3 text-left font-medium">Date</th>
                            <th className="p-3 text-left font-medium">Value</th>
                            <th className="p-3 text-left font-medium">Reference Range</th>
                            <th className="p-3 text-left font-medium">Status</th>
                            <th className="p-3 text-left font-medium">Lab</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendData
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((item) => (
                              <tr key={item.id} className="border-b">
                                <td className="p-3">
                                  {format(new Date(item.date), "MMM d, yyyy")}
                                </td>
                                <td className={`p-3 ${item.isAbnormal ? "font-bold text-destructive" : ""}`}>
                                  {item.numericValue} {item.unit}
                                </td>
                                <td className="p-3">
                                  {item.referenceRangeLow !== null && item.referenceRangeHigh !== null
                                    ? `${item.referenceRangeLow} - ${item.referenceRangeHigh}`
                                    : item.referenceRangeLow !== null
                                      ? `> ${item.referenceRangeLow}`
                                      : item.referenceRangeHigh !== null
                                        ? `< ${item.referenceRangeHigh}`
                                        : "Not available"}
                                  {" "}
                                  {item.unit}
                                </td>
                                <td className="p-3">
                                  {item.isAbnormal ? (
                                    <span className="text-destructive font-medium">Abnormal</span>
                                  ) : (
                                    <span className="text-muted-foreground">Normal</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {item.labName || "Unknown"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
