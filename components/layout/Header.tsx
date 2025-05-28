"use client";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/ai-coach": { title: "AI Health Coach", subtitle: "Your compassionate and supportive health companion" },
  "/dashboard": { title: "Dashboard", subtitle: "Your health metrics and insights" },
  "/correlations": { title: "Correlations", subtitle: "Discover patterns in your health data" },
  "/trends": { title: "Trends", subtitle: "Track your health over time" },
  "/data-sources": { title: "Data Sources", subtitle: "Manage your health data sources" },
  "/reports": { title: "Reports", subtitle: "View and download your reports" },
  "/settings": { title: "Settings", subtitle: "Manage your account and preferences" },
};

export default function Header() {
  const pathname = usePathname();
  const { title, subtitle } = pageTitles[pathname] || pageTitles["/ai-coach"];
  return (
    <header className="header">
      <div className="header-left">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-right">
        <button className="quick-action">📤 Export Data</button>
        <button className="quick-action">🩺 Contact Doctor</button>
      </div>
    </header>
  );
}
