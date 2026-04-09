import React from 'react';
import { ChevronDown, AlertTriangle, Clock, TrendingUp } from "lucide-react";

const alerts = [
  { icon: "clock", text: "Lease expiring:", highlight: "GF-12 Zara", suffix: "in 12 days" },
  { icon: "alert", text: "Lease expiring:", highlight: "FF-07 CCD", suffix: "in 18 days" },
  { icon: "trending", text: "Escalation due:", highlight: "GF-08 H&M", suffix: "in 8 days" },
  { icon: "trending", text: "Escalation due:", highlight: "FC-03 McDonald's", suffix: "in 14 days" },
];

const getIcon = (type) => {
  switch (type) {
    case "clock":
      return <Clock className="echo-alert-icon red" />;
    case "alert":
      return <AlertTriangle className="echo-alert-icon warning" />;
    case "trending":
      return <TrendingUp className="echo-alert-icon muted" />;
    default:
      return null;
  }
};

const EchoNavbar = () => {
  return (
    <nav className="echo-navbar">
      <div className="echo-navbar-left">
        <span className="echo-logo">LeaseOS</span>
        <button className="echo-project-selector">
          Nexus Grand Mall â Phase 1
          <ChevronDown className="echo-chevron" />
        </button>
      </div>

      <div className="echo-navbar-center">
        <div className="echo-alerts-wrapper">
          <span className="echo-alerts-badge">Alerts</span>
          <span className="echo-pulse-dot" />
          <div className="echo-alerts-scroll">
            <div className="echo-alerts-inner">
              {[...alerts, ...alerts].map((alert, i) => (
                <span key={i} className="echo-alert-item">
                  {getIcon(alert.icon)}
                  <span className="echo-alert-text">{alert.text}</span>
                  <span className="echo-alert-highlight">{alert.highlight}</span>
                  <span className="echo-alert-suffix">{alert.suffix}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="echo-navbar-right">
        <div className="echo-avatar">RK</div>
      </div>
    </nav>
  );
};

export default EchoNavbar;
