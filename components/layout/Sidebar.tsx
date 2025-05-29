"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MessageCircle, BarChart2, Link2, TrendingUp, Folder, FileText, Settings, HeartPulse } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from 'react';

const navItems = [
  { href: "/ai-coach", icon: <MessageCircle className="w-5 h-5" />, label: "AI Health Coach" },
  { href: "/dashboard", icon: <BarChart2 className="w-5 h-5" />, label: "Dashboard" },
  { href: "/correlations", icon: <Link2 className="w-5 h-5" />, label: "Correlations" },
  { href: "/trends", icon: <TrendingUp className="w-5 h-5" />, label: "Trends" },
  { href: "/data-sources", icon: <Folder className="w-5 h-5" />, label: "Data Sources" },
  { href: "/reports", icon: <FileText className="w-5 h-5" />, label: "Reports" },
  { href: "/settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col h-full min-h-screen w-[220px] bg-white border-r px-4 py-6 gap-6 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-2">
        <HeartPulse className="w-8 h-8 text-primary-600" />
        <span className="font-bold text-lg text-primary-700">For Your Health</span>
      </div>
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href} legacyBehavior>
            <a
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-base font-semibold
                ${pathname === item.href
                  ? "bg-blue-600 text-white shadow-md font-bold text-opacity-100"
                  : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
      {/* Health Score Card */}
      <Card className="mt-auto flex flex-col items-center justify-center py-4">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-primary-500" />
          <span className="font-bold text-2xl">68</span>
        </div>
        <div className="text-xs text-gray-500">Health Score</div>
        <div className="text-xs text-gray-400 mt-1">↓ 12 pts this week</div>
      </Card>
    </aside>
  );
}
