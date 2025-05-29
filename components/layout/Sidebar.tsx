"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/ai-coach", icon: "💬", label: "AI Health Coach" },
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/correlations", icon: "🔗", label: "Correlations" },
  { href: "/trends", icon: "📈", label: "Trends" },
  { href: "/data-sources", icon: "📁", label: "Data Sources" },
  { href: "/reports", icon: "📋", label: "Reports" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

import React from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="sidebar">
      <div className="logo">
        <div className="logo-icon">🏥</div>
        <div className="logo-text">For Your Health</div>
      </div>
      <div>
        {navItems.map((item) => (
          <Link href={item.href} key={item.href} legacyBehavior>
            <a className={`nav-item${pathname === item.href ? " active" : ""}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
      <div className="health-score">
        <div className="score-circle">
          <div className="score-inner">68</div>
        </div>
        <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Health Score</div>
        <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "0.25rem" }}>↓ 12 pts this week</div>
      </div>
    </nav>
  );
}
