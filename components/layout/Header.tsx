"use client";
import { usePathname } from "next/navigation";
import UserMenu from "../auth/UserMenu";

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
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
}
