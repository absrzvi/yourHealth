"use client";
import { useEffect, useState, useRef } from 'react';
import styles from './mandala.module.css';
import dynamic from 'next/dynamic';
import type { BiomarkerScores } from './SpinningBall';

const SpinningBall = dynamic(() => import('./SpinningBall'), {
  ssr: false,
  loading: () => <p>Loading 3D Visual...</p> // Optional loading component
});

export default function AiCoachPage() {
  // Placeholder for real biomarker data - this would come from your state management or API
  const [biomarkerData, setBiomarkerData] = useState<BiomarkerScores>({
    sleep: 80,
    nutrition: 75,
    exercise: 90,
    genetics: 85, // Example static or less frequently updated
    biome: 70,
  });

  // Example function to update scores (e.g., for testing)
  useEffect(() => {
    const interval = setInterval(() => {
      setBiomarkerData(prev => ({
        ...prev,
        sleep: Math.floor(Math.random() * 100),
        nutrition: Math.floor(Math.random() * 100),
      }));
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleJourneyClick = (journey: string) => {
    console.log(`Selected journey: ${journey}`);
    // Handle journey selection logic here
  };

  const handleChatOpen = () => {
    console.log('Opening chat');
    // Implement chat opening logic
  };

  const handleTimelineSelect = (period: string) => {
    console.log(`Selected period: ${period}`);
    // Handle timeline selection logic
  };

  return (
    <div className={styles.aiCoachContainer}>
      {/* Top Navigation */}
      <header className={`${styles.navBar} ${styles.fullWidth}`}>
        <div className={styles.navLogo}>For Your Health</div>
        <div className={styles.navProfile}>
          <span className={styles.userName}>Sarah Johnson</span>
          <div className={styles.userAvatar}>SJ</div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.fullWidth}>
        {/* Central Mandala */}
        <div className={styles.mandalaContainer}>
          <SpinningBall biomarkerData={biomarkerData} />
        </div>
        
        {/* Side Panel */}
        <aside className={styles.sidePanel}>
          {/* Recovery Score Box */}
          <div className={styles.statsCard}>
            <div className={styles.recoveryScore}>
              <div className={styles.recoveryPercentage}>94%</div>
              <div className={styles.recoveryInfo}>
                <p>Recovery score based on HRV, sleep quality, and temperature. You're ready for high-intensity activities today.</p>
              </div>
            </div>
          </div>

          {/* Health Metrics Box */}
          <div className={styles.statsCard}>
            <h3 className={styles.cardTitle}>Your Health Metrics</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metricItem}>
                <div className={styles.metricValue}>65 ms</div>
                <div className={styles.metricLabel}>HRV</div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricValue}>52 bpm</div>
                <div className={styles.metricLabel}>RHR</div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricValue}>94%</div>
                <div className={styles.metricLabel}>Sleep</div>
              </div>
              <div className={styles.metricItem}>
                <div className={styles.metricValue}>98.6°F</div>
                <div className={styles.metricLabel}>Temp</div>
              </div>
            </div>
            <div className={styles.trendItem}>
              <div className={styles.trendIndicator}>✓ Inflammation decreasing</div>
            </div>
          </div>
        </aside>
      </main>
      
      {/* Chat Button */}
      <button className={styles.chatButton} onClick={handleChatOpen}>
        <span className={styles.chatIcon}>💬</span>
        <span className={styles.chatText}>Chat with Dr. Anna</span>
      </button>
      
      {/* Sidebar Navigation */}
      <aside className={styles.timeline}>
        <div className={styles.timelineHeader}>
          <div className={styles.healthScore}>
            <div className={styles.scoreRing}>
              <div className={styles.scoreValue}>93</div>
            </div>
            <div className={styles.scoreLabel}>Health</div>
          </div>
        </div>
        <div className={styles.timelineTrack}>
          <a href="/" className={styles.timelineEvent}>
            <div className={styles.timelineMarker} data-event="blood-test">
              <span className={styles.markerIcon}>🩸</span>
            </div>
            <div className={styles.eventTooltip}>
              <h4>Dashboard</h4>
              <p>View health overview</p>
            </div>
          </a>
          <a href="/ai-coach" className={styles.timelineEvent}>
            <div className={styles.timelineMarker} data-event="doctor-visit">
              <span className={styles.markerIcon}>👨‍⚕️</span>
            </div>
            <div className={styles.eventTooltip}>
              <h4>AI Coach</h4>
              <p>Get personalized advice</p>
            </div>
          </a>
          <a href="/reports" className={styles.timelineEvent}>
            <div className={styles.timelineMarker} data-event="new-supplement">
              <span className={styles.markerIcon}>💊</span>
            </div>
            <div className={styles.eventTooltip}>
              <h4>Reports</h4>
              <p>View health reports</p>
            </div>
          </a>
          <a href="/settings" className={styles.timelineEvent}>
            <div className={styles.timelineMarker} data-event="fitness-milestone">
              <span className={styles.markerIcon}>⚙️</span>
            </div>
            <div className={styles.eventTooltip}>
              <h4>Settings</h4>
              <p>Manage your account</p>
            </div>
          </a>
        </div>
      </aside>
    </div>
  );
}
