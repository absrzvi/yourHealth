"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./dashboard.module.css";

interface Report {
  id: string;
  fileName: string;
  filePath: string;
  type: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [activeLens, setActiveLens] = useState("biomarkers");
  const [activeTimeRange, setActiveTimeRange] = useState("month");
  const [activeMetric, setActiveMetric] = useState("all");

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/reports?userId=${session.user.id}`)
      .then(res => res.json())
      .then(data => {
        setReports(data.reports || []);
        setLoading(false);
      });
  }, [session]);

  if (status === "loading" || loading) return <div className="text-center py-12">Loading dashboard...</div>;
  if (!session || !session.user) return <div className="text-center py-12 text-red-600">You must be logged in to view your dashboard.</div>;

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
  
  const handleLensChange = (lens: string) => {
    setActiveLens(lens);
  };
  
  const handleTimeRangeChange = (range: string) => {
    setActiveTimeRange(range);
  };
  
  const handleMetricChange = (metric: string) => {
    setActiveMetric(metric);
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Header with Breadcrumbs */}
      <header className={styles.header}>
        <div className={styles.breadcrumbs}>
          <span>Dashboard</span>
          <span className={styles.separator}>/</span>
          <span className={styles.breadcrumbActive}>Health Explorer</span>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.dataExplorer}>
          {/* Lens Selector */}
          <div className={styles.lensSelector}>
            <button 
              className={`${styles.lensButton} ${activeLens === 'biomarkers' ? styles.active : ''}`}
              onClick={() => handleLensChange('biomarkers')}
            >
              <span className={styles.lensIcon}>🧬</span>
              <span>Biomarkers</span>
            </button>
            <button 
              className={`${styles.lensButton} ${activeLens === 'sleep' ? styles.active : ''}`}
              onClick={() => handleLensChange('sleep')}
            >
              <span className={styles.lensIcon}>😴</span>
              <span>Sleep</span>
            </button>
            <button 
              className={`${styles.lensButton} ${activeLens === 'nutrition' ? styles.active : ''}`}
              onClick={() => handleLensChange('nutrition')}
            >
              <span className={styles.lensIcon}>🥗</span>
              <span>Nutrition</span>
            </button>
            <button 
              className={`${styles.lensButton} ${activeLens === 'activity' ? styles.active : ''}`}
              onClick={() => handleLensChange('activity')}
            >
              <span className={styles.lensIcon}>🏃‍♂️</span>
              <span>Activity</span>
            </button>
            <button 
              className={`${styles.lensButton} ${activeLens === 'mental' ? styles.active : ''}`}
              onClick={() => handleLensChange('mental')}
            >
              <span className={styles.lensIcon}>🧠</span>
              <span>Mental Health</span>
            </button>
          </div>

          {/* Chart Area */}
          <div className={styles.chartArea}>
            <div className={styles.chartTitle}>
              <h2>{activeLens === 'biomarkers' ? 'Biomarker Trends' : 
                  activeLens === 'sleep' ? 'Sleep Metrics' : 
                  activeLens === 'nutrition' ? 'Nutrition Analysis' : 
                  activeLens === 'activity' ? 'Activity Patterns' : 'Mental Wellness'}</h2>
              <div className={styles.chartControls}>
                <button className={styles.controlButton} title="Download Data">📥</button>
                <button className={styles.controlButton} title="View Full Screen">⛶</button>
                <button className={styles.controlButton} title="More Options">⋮</button>
              </div>
            </div>
            
            <div className={styles.chartContainer}>
              <svg className={styles.chartSvg} viewBox="0 0 800 400">
                {/* Chart Grid */}
                <g className={styles.chartGrid}>
                  <line x1="50" y1="350" x2="750" y2="350" className={styles.chartAxis} />
                  <line x1="50" y1="50" x2="50" y2="350" className={styles.chartAxis} />
                  
                  {/* Horizontal Grid Lines */}
                  <line x1="50" y1="125" x2="750" y2="125" className={styles.chartGrid} />
                  <line x1="50" y1="200" x2="750" y2="200" className={styles.chartGrid} />
                  <line x1="50" y1="275" x2="750" y2="275" className={styles.chartGrid} />
                  
                  {/* Vertical Grid Lines */}
                  <line x1="190" y1="50" x2="190" y2="350" className={styles.chartGrid} />
                  <line x1="330" y1="50" x2="330" y2="350" className={styles.chartGrid} />
                  <line x1="470" y1="50" x2="470" y2="350" className={styles.chartGrid} />
                  <line x1="610" y1="50" x2="610" y2="350" className={styles.chartGrid} />
                </g>
                
                {/* X-Axis Labels */}
                <text x="120" y="380" textAnchor="middle">Jan</text>
                <text x="260" y="380" textAnchor="middle">Mar</text>
                <text x="400" y="380" textAnchor="middle">May</text>
                <text x="540" y="380" textAnchor="middle">Jul</text>
                <text x="680" y="380" textAnchor="middle">Sep</text>
                
                {/* Y-Axis Labels */}
                <text x="30" y="350" textAnchor="end">0</text>
                <text x="30" y="275" textAnchor="end">25</text>
                <text x="30" y="200" textAnchor="end">50</text>
                <text x="30" y="125" textAnchor="end">75</text>
                <text x="30" y="50" textAnchor="end">100</text>
                
                {/* Data Lines - Simplified Example */}
                {activeLens === 'biomarkers' && (
                  <>
                    <path 
                      d="M50,250 L190,200 L330,180 L470,150 L610,120 L750,100" 
                      className={`${styles.chartLine} ${styles.primaryLine}`} 
                    />
                    
                    <path 
                      d="M50,300 L190,280 L330,290 L470,270 L610,250 L750,260" 
                      className={`${styles.chartLine} ${styles.secondaryLine}`} 
                    />
                    
                    {/* Data Points */}
                    <circle cx="50" cy="250" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    <circle cx="190" cy="200" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    <circle cx="330" cy="180" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    <circle cx="470" cy="150" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    <circle cx="610" cy="120" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    <circle cx="750" cy="100" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    
                    <circle cx="50" cy="300" r="4" className={`${styles.dataPoint} ${styles.secondaryLine}`} />
                    <circle cx="190" cy="280" r="4" className={`${styles.dataPoint} ${styles.secondaryLine}`} />
                    <circle cx="330" cy="290" r="4" className={`${styles.dataPoint} ${styles.secondaryLine}`} />
                    <circle cx="470" cy="270" r="4" className={`${styles.dataPoint} ${styles.secondaryLine}`} />
                    <circle cx="610" cy="250" r="4" className={`${styles.dataPoint} ${styles.secondaryLine}`} />
                    <circle cx="750" cy="260" r="4" className={`${styles.dataPoint} ${styles.secondaryLine}`} />
                  </>
                )}
                
                {/* Sleep Data - Simplified */}
                {activeLens === 'sleep' && (
                  <>
                    <path 
                      d="M50,150 L190,180 L330,120 L470,200 L610,150 L750,140" 
                      className={`${styles.chartLine} ${styles.primaryLine}`} 
                    />
                    
                    {/* Data Points */}
                    <circle cx="50" cy="150" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    <circle cx="190" cy="180" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    <circle cx="330" cy="120" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    <circle cx="470" cy="200" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    <circle cx="610" cy="150" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                    <circle cx="750" cy="140" r="4" className={`${styles.dataPoint} ${styles.primaryLine}`} />
                  </>
                )}
                
                {/* Overlay Elements */}
                <g className={styles.overlayContainer}>
                  {/* Reference Range Zone */}
                  {activeLens === 'biomarkers' && (
                    <rect x="50" y="160" width="700" height="60" className={styles.referenceZone} />
                  )}
                  
                  {/* Trend Line */}
                  {activeLens === 'biomarkers' && (
                    <line x1="50" y1="240" x2="750" y2="110" className={styles.trendLine} />
                  )}
                  
                  {/* Outlier Markers */}
                  {activeLens === 'sleep' && (
                    <circle cx="330" cy="120" r="6" className={styles.outlierMarker} />
                  )}
                  
                  {/* Annotation Markers */}
                  {activeLens === 'biomarkers' && (
                    <circle cx="470" cy="150" r="6" className={styles.annotationMarker} />
                  )}
                </g>
              </svg>
              
              {/* Tooltip (would be positioned dynamically in a real implementation) */}
              <div className={styles.tooltipContainer} style={{top: '120px', left: '470px'}}>
                <h4 className={styles.tooltipTitle}>May 15, 2023</h4>
                <div className={styles.tooltipValue}>
                  <span className={styles.tooltipLabel}>Vitamin D:</span>
                  <span className={styles.tooltipData}>65 ng/mL</span>
                </div>
                <div className={styles.tooltipValue}>
                  <span className={styles.tooltipLabel}>Change:</span>
                  <span className={styles.tooltipData}>+12% from Apr</span>
                </div>
                <div className={styles.tooltipValue}>
                  <span className={styles.tooltipLabel}>Status:</span>
                  <span className={styles.tooltipData}>Optimal</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Insights Panel */}
          <div className={styles.insightsPanel}>
            {/* Biomarkers Insight Card */}
            {activeLens === 'biomarkers' && (
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <div className={`${styles.insightIcon} ${styles.biomarkersIcon}`}>🧬</div>
                  <h3 className={styles.insightTitle}>Biomarker Insights</h3>
                </div>
                <div className={styles.insightContent}>
                  <div className={styles.insightItem}>
                    <div className={styles.insightBullet}>1</div>
                    <div className={styles.insightText}>
                      Your <span className={styles.insightHighlight}>Vitamin D</span> levels have improved by 25% since January, likely due to increased sun exposure and supplementation.
                    </div>
                  </div>
                  <div className={styles.insightItem}>
                    <div className={styles.insightBullet}>2</div>
                    <div className={styles.insightText}>
                      <span className={styles.insightHighlight}>Inflammatory markers</span> show a downward trend, suggesting your anti-inflammatory diet changes are working.
                    </div>
                  </div>
                  <div className={styles.insightItem}>
                    <div className={styles.insightBullet}>3</div>
                    <div className={styles.insightText}>
                      Consider testing <span className={styles.insightHighlight}>Omega-3 levels</span> next time as they correlate with your current biomarker trends.
                    </div>
                  </div>
                </div>
                <div className={styles.insightFooter}>
                  <button className={styles.insightAction}>View detailed analysis →</button>
                </div>
              </div>
            )}
            
            {/* Sleep Insight Card */}
            {activeLens === 'sleep' && (
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <div className={`${styles.insightIcon} ${styles.sleepIcon}`}>😴</div>
                  <h3 className={styles.insightTitle}>Sleep Insights</h3>
                </div>
                <div className={styles.insightContent}>
                  <div className={styles.insightItem}>
                    <div className={styles.insightBullet}>1</div>
                    <div className={styles.insightText}>
                      Your sleep efficiency has improved to <span className={styles.insightHighlight}>92%</span>, which is 15% higher than your baseline from three months ago.
                    </div>
                  </div>
                  <div className={styles.insightItem}>
                    <div className={styles.insightBullet}>2</div>
                    <div className={styles.insightText}>
                      You consistently get more <span className={styles.insightHighlight}>REM sleep</span> when you go to bed before 10:30 PM.
                    </div>
                  </div>
                  <div className={styles.insightItem}>
                    <div className={styles.insightBullet}>3</div>
                    <div className={styles.insightText}>
                      There's an <span className={styles.insightHighlight}>outlier</span> on March 15 where your sleep quality dropped significantly. This correlates with reported higher stress.
                    </div>
                  </div>
                </div>
                <div className={styles.insightFooter}>
                  <button className={styles.insightAction}>View sleep recommendations →</button>
                </div>
              </div>
            )}
            
            {/* Nutrition Insight Card */}
            {activeLens === 'nutrition' && (
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <div className={`${styles.insightIcon} ${styles.nutritionIcon}`}>🥗</div>
                  <h3 className={styles.insightTitle}>Nutrition Insights</h3>
                </div>
                <div className={styles.insightContent}>
                  <div className={styles.insightItem}>
                    <div className={styles.insightBullet}>1</div>
                    <div className={styles.insightText}>
                      Your <span className={styles.insightHighlight}>protein intake</span> has been consistent with your goals, averaging 0.8g per pound of body weight.
                    </div>
                  </div>
                  <div className={styles.insightItem}>
                    <div className={styles.insightBullet}>2</div>
                    <div className={styles.insightText}>
                      Days with higher <span className={styles.insightHighlight}>plant diversity</span> (10+ different plants) correlate with better energy levels the following day.
                    </div>
                  </div>
                  <div className={styles.insightItem}>
                    <div className={styles.insightBullet}>3</div>
                    <div className={styles.insightText}>
                      Consider increasing your <span className={styles.insightHighlight}>fiber intake</span>, which is currently below the recommended 25g daily target.
                    </div>
                  </div>
                </div>
                <div className={styles.insightFooter}>
                  <button className={styles.insightAction}>View nutrition plan →</button>
                </div>
              </div>
            )}
          </div>
          
          {/* Control Panel */}
          <div className={styles.controlPanel}>
            <div className={styles.metricSelector}>
              <h4 className={styles.metricTitle}>Metrics</h4>
              <div className={styles.metricOptions}>
                <button 
                  className={`${styles.metricOption} ${activeMetric === 'all' ? styles.active : ''}`}
                  onClick={() => handleMetricChange('all')}
                >
                  All Metrics
                </button>
                <button 
                  className={`${styles.metricOption} ${activeMetric === 'primary' ? styles.active : ''}`}
                  onClick={() => handleMetricChange('primary')}
                >
                  Primary
                </button>
                <button 
                  className={`${styles.metricOption} ${activeMetric === 'trends' ? styles.active : ''}`}
                  onClick={() => handleMetricChange('trends')}
                >
                  Trends Only
                </button>
              </div>
            </div>
            
            <div className={styles.timeRange}>
              <h4 className={styles.metricTitle}>Time Range</h4>
              <div className={styles.timeOptions}>
                <button 
                  className={`${styles.metricOption} ${activeTimeRange === 'week' ? styles.active : ''}`}
                  onClick={() => handleTimeRangeChange('week')}
                >
                  Week
                </button>
                <button 
                  className={`${styles.metricOption} ${activeTimeRange === 'month' ? styles.active : ''}`}
                  onClick={() => handleTimeRangeChange('month')}
                >
                  Month
                </button>
                <button 
                  className={`${styles.metricOption} ${activeTimeRange === 'quarter' ? styles.active : ''}`}
                  onClick={() => handleTimeRangeChange('quarter')}
                >
                  Quarter
                </button>
                <button 
                  className={`${styles.metricOption} ${activeTimeRange === 'year' ? styles.active : ''}`}
                  onClick={() => handleTimeRangeChange('year')}
                >
                  Year
                </button>
              </div>
            </div>
            
            <div className={styles.exportOptions}>
              <h4 className={styles.metricTitle}>Export & Share</h4>
              <button className={styles.exportButton}>
                <span>📥</span> Export Data
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
