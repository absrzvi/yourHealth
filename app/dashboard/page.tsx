"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, HeartPulse, Moon, Upload } from "lucide-react";

interface Report {
  id: string;
  fileName: string;
  filePath: string;
  type: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dashboard: Session status:', status);
    console.log('Dashboard: Session data:', session);
    
    if (status === 'unauthenticated') {
      console.log('Dashboard: User not authenticated, redirecting to login');
      router.push('/auth/login?callbackUrl=' + encodeURIComponent('/dashboard'));
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      console.log('Dashboard: Fetching reports for user:', session.user.id);
      setLoading(true);
      fetch(`/api/reports?userId=${session.user.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch reports');
          return res.json();
        })
        .then(data => {
          console.log('Dashboard: Reports data:', data);
          setReports(data.reports || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Dashboard: Error fetching reports:', err);
          setError('Failed to load dashboard data');
          setLoading(false);
        });
    }
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">You must be logged in to view your dashboard.</p>
        <button
          onClick={() => signIn()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  const handleDelete = async (id: string) => {
    if (!session?.user?.id) return;
    if (!window.confirm("Are you sure you want to delete this report? This cannot be undone.")) return;
    setDeletingId(id);
    setFeedback("");
    try {
      const res = await fetch(`/api/reports?userId=${session.user.id}&id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setReports(r => r.filter(rep => rep.id !== id));
        setFeedback("Report deleted successfully.");
      } else {
        setFeedback(data.error || "Failed to delete report.");
      }
    } catch (e) {
      setFeedback("Failed to delete report.");
    }
    setDeletingId(null);
  };

  return (
    <div className="flex h-screen min-h-screen bg-bg-primary overflow-hidden">
      <div className="dashboard-layout flex flex-col flex-1 h-full gap-4 p-6 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
          {/* Quick Metrics Widget */}
          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Activity className="text-[#b45309] bg-[#fef3c7] p-1 rounded-full w-8 h-8" />
              <CardTitle className="text-lg">Quick Metrics</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 flex-1 justify-center">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Energy</span><span className="font-semibold">68</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Inflammation</span><span className="font-semibold">Low</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Sleep</span><span className="font-semibold">7.2h</span></div>
            </CardContent>
          </Card>
          {/* Chart Placeholder */}
          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Activity className="text-[#0ea5e9] bg-[#e0f2fe] p-1 rounded-full w-8 h-8" />
              <CardTitle className="text-lg">Charts</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-gray-400 text-center">[Chart Placeholder]</div>
            </CardContent>
          </Card>
          {/* Insights Placeholder */}
          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Moon className="text-[#16a34a] bg-[#f0fdf4] p-1 rounded-full w-8 h-8" />
              <CardTitle className="text-lg">Insights</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 flex-1 justify-center">
              <div className="flex items-center gap-2">
                <Activity className="text-[#0ea5e9] bg-[#e0f2fe] p-1 rounded-full w-6 h-6" />
                <span className="text-gray-700">Placeholder for personalized health insights.</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartPulse className="text-[#b45309] bg-[#fef3c7] p-1 rounded-full w-6 h-6" />
                <span className="text-gray-700">Another insight placeholder.</span>
              </div>
            </CardContent>
          </Card>
          {/* Uploaded Reports List */}
          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Upload className="text-[#3730a3] bg-[#e0e7ff] p-1 rounded-full w-8 h-8" />
              <CardTitle className="text-lg">Uploaded Reports</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-auto">
              {feedback && <div className="text-green-700 text-sm mb-2">{feedback}</div>}
              {reports.length === 0 ? (
                <div className="text-gray-500">No reports uploaded yet.</div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2">File Name</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Uploaded</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(report => (
                        <tr key={report.id} className="border-b">
                          <td className="px-3 py-2">{report.fileName}</td>
                          <td className="px-3 py-2">{report.type}</td>
                          <td className="px-3 py-2">{new Date(report.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 py-2 flex gap-2 items-center">
                            <a href={report.filePath} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="px-2 py-1 h-7">Download</Button>
                            </a>
                            <Button
                              size="sm"
                              variant="destructive"
                              className={`px-2 py-1 h-7 ${deletingId === report.id ? 'opacity-50 pointer-events-none' : ''}`}
                              onClick={() => handleDelete(report.id)}
                              disabled={deletingId === report.id}
                            >
                              {deletingId === report.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
