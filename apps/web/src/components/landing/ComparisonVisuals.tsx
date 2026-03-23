import React from "react";
import { useTranslation } from "react-i18next";

export const CustomerAdvantageVisual = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full relative overflow-hidden rounded-2xl border border-border shadow-inner mb-8 group" style={{ background: "linear-gradient(135deg, hsl(var(--muted) / 0.3), hsl(var(--background)))" }}>
      {/* Background split — fills container via CSS */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 bg-muted/10" />
        <div className="w-1/2 bg-primary/5" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-border" />
      </div>
      <svg viewBox="0 0 800 350" className="relative z-10 w-full h-auto" style={{ minHeight: 300 }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <style>{`
            @keyframes drift-up { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
            @keyframes drift-down { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
            @keyframes wobble { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(2deg); } 75% { transform: rotate(-2deg); } }
            @keyframes flash-slow { 0%,100% { opacity: 0.5; } 50% { opacity: 0.15; } }
            @keyframes draw-in { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
            @keyframes fade-up-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes verified-pulse { 0%,100% { r: 6; opacity: 1; } 50% { r: 9; opacity: 0.7; } }
            .chaos-1 { animation: drift-up 4s ease-in-out infinite; }
            .chaos-2 { animation: drift-down 5s ease-in-out infinite; }
            .chaos-3 { animation: wobble 3s ease-in-out infinite; }
            .chaos-flash { animation: flash-slow 2.5s ease-in-out infinite; }
            .tasky-draw { stroke-dasharray: 200; animation: draw-in 1.5s ease-out forwards; }
            .tasky-fade-1 { animation: fade-up-in 0.6s ease-out 0.2s both; }
            .tasky-fade-2 { animation: fade-up-in 0.6s ease-out 0.5s both; }
            .tasky-fade-3 { animation: fade-up-in 0.6s ease-out 0.8s both; }
            .tasky-fade-4 { animation: fade-up-in 0.6s ease-out 1.1s both; }
            .verified-dot { animation: verified-pulse 2s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* LEFT SIDE: LEGACY — The Noise */}
        <g transform="translate(50, 40)" className="opacity-80">
          <text x="150" y="-15" textAnchor="middle" className="text-sm font-bold uppercase tracking-wider fill-red-800/60">{t("landing.vizChaos", "Social Media Noise")}</text>

          {/* Wireframe Phone */}
          <rect x="50" y="10" width="200" height="300" rx="20" fill="white" stroke="currentColor" strokeWidth="4" className="text-muted/50" />

          {/* Clutter spilling out */}
          <g opacity="0.4" fill="currentColor" className="text-muted-foreground">
            <g transform="rotate(-15)"><g className="chaos-1"><rect x="20" y="50" width="80" height="8" /></g></g>
            <g transform="rotate(20)"><g className="chaos-2"><rect x="190" y="40" width="100" height="6" /></g></g>
            <g transform="rotate(45)"><g className="chaos-3"><rect x="30" y="120" width="60" height="12" /></g></g>
            <g transform="rotate(-30)"><g className="chaos-1"><rect x="220" y="180" width="70" height="10" /></g></g>
            <g className="chaos-2"><circle cx="20" cy="200" r="20" stroke="currentColor" fill="none" strokeDasharray="2 4" /></g>
            <g className="chaos-3"><circle cx="260" cy="100" r="15" stroke="currentColor" fill="none" strokeWidth="3" /></g>
          </g>

          {/* Messy chat bubbles */}
          <g transform="rotate(-5 100 80)">
            <g className="chaos-1">
              <rect x="60" y="60" width="140" height="45" rx="10" fill="currentColor" className="text-muted/30" />
              <path d="M 60 80 L 45 90 L 65 95 Z" fill="currentColor" className="text-muted/30" />
              <rect x="75" y="70" width="110" height="6" rx="3" fill="currentColor" className="text-muted-foreground/30" />
              <rect x="75" y="82" width="60" height="6" rx="3" fill="currentColor" className="text-muted-foreground/30" />
              <circle cx="180" cy="85" r="8" fill="#ef4444" opacity="0.6" />
              <text x="180" y="88" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">!</text>
            </g>
          </g>

          <g transform="rotate(8 150 120)">
            <g className="chaos-2">
              <rect x="110" y="95" width="130" height="55" rx="10" fill="currentColor" className="text-muted/40" />
              <path d="M 240 120 L 255 130 L 235 135 Z" fill="currentColor" className="text-muted/40" />
              <rect x="120" y="105" width="100" height="6" rx="3" fill="currentColor" className="text-muted-foreground/50" />
              <rect x="120" y="118" width="80" height="6" rx="3" fill="currentColor" className="text-muted-foreground/50" />
              <rect x="120" y="131" width="90" height="6" rx="3" fill="currentColor" className="text-muted-foreground/50" />
            </g>
          </g>

          {/* Unverified profile */}
          <circle cx="80" cy="160" r="15" fill="currentColor" className="text-muted-foreground/40" />
          <path d="M 70 150 L 90 170 M 90 150 L 70 170" stroke="white" strokeWidth="2" opacity="0.8" />
          <rect x="105" y="152" width="90" height="8" rx="4" fill="currentColor" className="text-muted/80" transform="skewX(-10)" />

          <g transform="rotate(-12 120 190)">
            <g className="chaos-3">
              <rect x="55" y="180" width="150" height="40" rx="10" fill="currentColor" className="text-muted/20 stroke-red-500/30 stroke-2" />
              <text x="130" y="200" fontSize="14" fill="#ef4444" opacity="0.7" textAnchor="middle" fontWeight="bold">???</text>
              <rect x="70" y="190" width="40" height="8" rx="4" fill="#ef4444" opacity="0.3" />
              <rect x="150" y="190" width="40" height="8" rx="4" fill="#ef4444" opacity="0.3" />
            </g>
          </g>

          {/* Chaos scribbles */}
          <path d="M 180 220 C 150 230, 200 250, 160 260 S 210 280, 180 290" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" className="chaos-flash" />
          <path d="M 160 210 L 195 240 M 195 210 L 160 240" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" opacity="0.8" />

          {/* Scroll indicator */}
          <g className="chaos-2"><rect x="65" y="250" width="80" height="20" rx="4" fill="currentColor" className="text-muted/20" /></g>
          <g className="chaos-1"><rect x="150" y="240" width="80" height="30" rx="4" fill="currentColor" className="text-muted/20" /></g>
          <rect x="65" y="280" width="160" height="15" rx="4" fill="currentColor" className="text-muted/30" />
          <text x="145" y="291" fontSize="12" fill="currentColor" className="text-muted-foreground/80" textAnchor="middle" letterSpacing="4">. . . . .</text>
        </g>

        {/* RIGHT SIDE: TASKY — Structured & Proven */}
        <g transform="translate(450, 40)">
          <text x="150" y="-15" textAnchor="middle" className="text-sm font-bold fill-primary uppercase tracking-wider">{t("landing.vizTasky", "The Tasky Way")}</text>

          {/* Wireframe Phone */}
          <rect x="50" y="10" width="200" height="300" rx="20" fill="white" stroke="currentColor" strokeWidth="4" className="text-primary/40" />

          {/* Verified Header */}
          <g className="tasky-fade-1">
            <circle cx="80" cy="40" r="15" fill="currentColor" className="text-primary/20" />
            <circle cx="90" cy="50" r="6" fill="#469178" className="verified-dot" />
            <rect x="105" y="32" width="80" height="8" rx="4" fill="currentColor" className="text-primary/80" />
            <g transform="translate(105, 45) scale(0.6)">
              {[0, 1, 2, 3, 4].map((i) => (
                <polygon key={i} points="10,1 12,7 19,7 13,11 15,18 10,14 5,18 7,11 1,7 8,7" fill="#C49A3C" transform={`translate(${i * 20}, 0)`} />
              ))}
            </g>
          </g>

          {/* Form block */}
          <g className="tasky-fade-2">
            <rect x="65" y="80" width="170" height="70" rx="8" fill="currentColor" className="text-primary/5 stroke-primary/20 stroke-1" />
            <rect x="75" y="92" width="60" height="8" rx="4" fill="currentColor" className="text-primary/40" />
            <rect x="75" y="110" width="100" height="6" rx="3" fill="currentColor" className="text-muted-foreground/60" />
            <rect x="75" y="125" width="40" height="15" rx="4" fill="currentColor" className="text-primary/20" />
          </g>

          {/* Matching Confirmation */}
          <g className="tasky-fade-3">
            <rect x="65" y="165" width="170" height="40" rx="8" fill="currentColor" className="text-card stroke-border stroke-1" />
            <path d="M 85 175 L 80 180 L 85 195 L 95 185 L 90 175 Z" fill="#469178" opacity="0.8" />
            <rect x="105" y="180" width="110" height="6" rx="3" fill="currentColor" className="text-muted-foreground" />
          </g>

          {/* CTA Button */}
          <g className="tasky-fade-4">
            <rect x="65" y="220" width="170" height="35" rx="8" fill="currentColor" className="text-primary" />
            <rect x="125" y="234" width="50" height="6" rx="3" fill="white" opacity="0.9" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export const TaskerAdvantageVisual = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full relative overflow-hidden rounded-2xl border border-border shadow-inner mb-8 group" style={{ background: "linear-gradient(135deg, hsl(var(--muted) / 0.3), hsl(var(--background)))" }}>
      {/* Background split — fills container via CSS */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 bg-muted/10" />
        <div className="w-1/2 bg-accent/5" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-border" />
      </div>
      <svg viewBox="0 0 800 350" className="relative z-10 w-full h-auto" style={{ minHeight: 300 }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <style>{`
            @keyframes drift-up-t { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            @keyframes drift-down-t { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
            @keyframes wobble-t { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(1.5deg); } 75% { transform: rotate(-1.5deg); } }
            @keyframes flash-no-match { 0%,100% { opacity: 0.5; } 50% { opacity: 0.2; } }
            @keyframes radar-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes radar-ring-pulse { 0%,100% { opacity: 0.2; r: 100; } 50% { opacity: 0.35; r: 102; } }
            @keyframes node-pop-1 { 0% { r: 0; opacity: 0; } 100% { r: 6; opacity: 1; } }
            @keyframes node-pop-2 { 0% { r: 0; opacity: 0; } 100% { r: 6; opacity: 1; } }
            @keyframes match-card-slide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes line-draw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
            .chaos-t-1 { animation: drift-up-t 4.5s ease-in-out infinite; }
            .chaos-t-2 { animation: drift-down-t 3.8s ease-in-out infinite; }
            .chaos-t-3 { animation: wobble-t 3.2s ease-in-out infinite; }
            .no-match-flash { animation: flash-no-match 2s ease-in-out infinite; }
            .radar-outer { animation: radar-ring-pulse 3s ease-in-out infinite; }
            .radar-sweep-line { transform-origin: 150px 150px; animation: radar-sweep 4s linear infinite; }
            .node-1 { animation: node-pop-1 0.4s ease-out 0.8s both; }
            .node-2 { animation: node-pop-2 0.4s ease-out 1.2s both; }
            .node-3 { animation: node-pop-2 0.4s ease-out 1.6s both; }
            .line-1 { stroke-dasharray: 100; animation: line-draw 0.8s ease-out 0.6s both; }
            .line-2 { stroke-dasharray: 100; animation: line-draw 0.8s ease-out 1.0s both; }
            .line-3 { stroke-dasharray: 100; animation: line-draw 0.8s ease-out 1.4s both; }
            .match-card { animation: match-card-slide 0.6s ease-out 2s both; }
          `}</style>
        </defs>

        {/* LEFT SIDE: LEGACY — Endless Scrolling & Dead Ends */}
        <g transform="translate(50, 40)" className="opacity-80">
          <text x="150" y="-15" textAnchor="middle" className="text-sm font-bold uppercase tracking-wider fill-red-800/60">{t("landing.vizLeadless", "Leadless Searching")}</text>

          <rect x="50" y="10" width="200" height="300" rx="20" fill="white" stroke="currentColor" strokeWidth="4" className="text-muted/50" />

          {/* Scroll fade */}
          <rect x="55" y="15" width="190" height="40" fill="url(#fade-top-tasker)" opacity="0.8" />
          <defs>
            <linearGradient id="fade-top-tasker" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Block 1 — Too far */}
          <g transform="translate(60, 40)">
            <g className="chaos-t-1">
              <rect x="0" y="0" width="180" height="50" rx="8" fill="currentColor" className="text-muted/20 stroke-red-500/30 stroke-2" />
              <rect x="10" y="15" width="30" height="20" rx="4" fill="currentColor" className="text-muted/40" />
              <rect x="50" y="15" width="100" height="6" rx="3" fill="currentColor" className="text-muted/60" />
              <rect x="50" y="30" width="60" height="5" rx="2.5" fill="currentColor" className="text-muted/40" />
              <text x="170" y="25" fontSize="10" fill="#ef4444" opacity="0.8" textAnchor="end" fontWeight="bold">{t("landing.vizTooFar", "90km!")}</text>
              <line x1="10" y1="10" x2="170" y2="40" stroke="#ef4444" strokeWidth="2" opacity="0.4" />
            </g>
          </g>

          {/* Block 2 — Fake/low quality */}
          <g transform="translate(55, 100) rotate(-3)">
            <g className="chaos-t-2">
              <rect x="0" y="0" width="170" height="40" rx="8" fill="currentColor" className="text-muted/30" />
              <circle cx="25" cy="20" r="10" fill="currentColor" className="text-muted/50" />
              <rect x="45" y="12" width="80" height="6" rx="3" fill="currentColor" className="text-muted/40" />
              <text x="155" y="25" fontSize="14" fill="#ef4444" opacity="0.7" textAnchor="end" fontWeight="bold">???</text>
            </g>
          </g>

          {/* Block 3 — Wasted time */}
          <g transform="translate(70, 150) rotate(2)">
            <g className="chaos-t-3">
              <rect x="0" y="0" width="160" height="60" rx="8" fill="currentColor" className="text-muted/20" />
              <rect x="15" y="15" width="130" height="6" rx="3" fill="currentColor" className="text-muted-foreground/30" />
              <rect x="15" y="28" width="100" height="6" rx="3" fill="currentColor" className="text-muted-foreground/30" />
              <rect x="15" y="41" width="110" height="6" rx="3" fill="currentColor" className="text-muted-foreground/30" />
              <path d="M 10 10 L 150 50 M 150 10 L 10 50" stroke="#ef4444" strokeWidth="1" opacity="0.3" />
            </g>
          </g>

          {/* Dead End overlays */}
          <g transform="translate(100, 220)">
            <g className="no-match-flash">
              <rect x="0" y="0" width="110" height="30" rx="6" fill="#ef4444" opacity="0.1" />
              <rect x="0" y="0" width="110" height="30" rx="6" fill="transparent" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
              <text x="55" y="20" fontSize="11" fill="#ef4444" textAnchor="middle" fontWeight="bold">{t("landing.vizNoMatch", "NO MATCHES")}</text>
            </g>
          </g>

          <g transform="translate(60, 260) rotate(-5)">
            <g className="no-match-flash" style={{ animationDelay: "0.5s" }}>
              <rect x="0" y="0" width="90" height="25" rx="6" fill="#ef4444" opacity="0.1" />
              <rect x="0" y="0" width="90" height="25" rx="6" fill="transparent" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" opacity="0.5" />
              <text x="45" y="17" fontSize="10" fill="#ef4444" textAnchor="middle" fontWeight="bold">{t("landing.vizRetrying", "RETRYING...")}</text>
            </g>
          </g>

          {/* Broken magnifying glass */}
          <g transform="translate(150, 160)">
            <g className="chaos-t-1">
              <circle cx="0" cy="0" r="25" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted-foreground/40" />
              <line x1="18" y1="18" x2="35" y2="35" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-muted-foreground/40" />
              <path d="M -15 -10 L 0 5 L -5 20 M 0 5 L 15 -5" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/60" />
              <text x="-35" y="-15" fontSize="16" fill="#ef4444" opacity="0.6" fontWeight="bold" transform="rotate(-20)">?</text>
              <text x="25" y="-20" fontSize="14" fill="#ef4444" opacity="0.5" fontWeight="bold" transform="rotate(15)">?</text>
            </g>
          </g>

          <path d="M 50 300 C 90 280, 70 240, 100 260 S 120 280, 160 250 S 180 300, 220 280" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-muted-foreground/40" />
        </g>

        {/* RIGHT SIDE: TASKY — Precision Radar Matching */}
        <g transform="translate(450, 40)">
          <text x="150" y="-15" textAnchor="middle" className="text-sm font-bold fill-accent uppercase tracking-wider">{t("landing.vizMatching", "Precision Matching")}</text>

          <rect x="50" y="10" width="200" height="300" rx="20" fill="white" stroke="currentColor" strokeWidth="4" className="text-accent/30" />

          {/* Radar Circles */}
          <circle cx="150" cy="150" r="100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-accent/20 radar-outer" />
          <circle cx="150" cy="150" r="65" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-accent/40" />
          <circle cx="150" cy="150" r="30" fill="currentColor" className="text-accent/10" />

          {/* Radar sweep line */}
          <line x1="150" y1="150" x2="150" y2="50" stroke="currentColor" strokeWidth="2" opacity="0.3" className="text-accent radar-sweep-line" />

          {/* Central Tasker Node */}
          <circle cx="150" cy="150" r="8" fill="currentColor" className="text-accent" />
          <circle cx="150" cy="150" r="20" fill="currentColor" className="text-accent/30 animate-ping" />

          {/* Matched Job Nodes — draw in sequentially */}
          <line x1="150" y1="150" x2="100" y2="90" stroke="currentColor" strokeWidth="2" className="text-accent/60 line-1" />
          <circle cx="100" cy="90" r="6" fill="#469178" className="node-1" />
          <rect x="110" y="80" width="50" height="15" rx="4" fill="currentColor" className="text-accent/10" />
          <rect x="115" y="85" width="20" height="5" rx="2.5" fill="currentColor" className="text-accent/80" />

          <line x1="150" y1="150" x2="210" y2="110" stroke="currentColor" strokeWidth="2" className="text-accent/60 line-2" />
          <circle cx="210" cy="110" r="6" fill="#469178" className="node-2" />

          <line x1="150" y1="150" x2="170" y2="230" stroke="currentColor" strokeWidth="2" className="text-accent/60 line-3" />
          <circle cx="170" cy="230" r="6" fill="#469178" className="node-3" />

          {/* Pop-up Match Card — slides in last */}
          <g className="match-card">
            <rect x="70" y="240" width="160" height="50" rx="10" fill="white" className="shadow-lg border border-accent/20" />
            <circle cx="90" cy="265" r="10" fill="currentColor" className="text-accent/20" />
            <rect x="110" y="255" width="80" height="6" rx="3" fill="currentColor" className="text-accent" />
            <rect x="110" y="270" width="100" height="4" rx="2" fill="currentColor" className="text-muted-foreground/50" />
          </g>
        </g>
      </svg>
    </div>
  );
};
