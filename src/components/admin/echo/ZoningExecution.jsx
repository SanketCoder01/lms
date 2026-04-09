import React from 'react';
import { Info } from "lucide-react";

const categories = [
  { name: "Anchor", color: "#22c55e", plan: 8, actual: 8, match: 100 },
  { name: "Luxury", color: "#0ea5e9", plan: 22, actual: 13, match: 59 },
  { name: "Food court", color: "#f97316", plan: 18, actual: 17, match: 94 },
  { name: "Retail shops", color: "#64748b", plan: 96, actual: 82, match: 85 },
  { name: "Café", color: "#eab308", plan: 16, actual: 10, match: 63 },
  { name: "Display", color: "#ef4444", plan: 26, actual: 12, match: 46 },
];

const getMatchColor = (match) => {
  if (match >= 90) return { bg: "#dcfce7", text: "#16a34a" };
  if (match >= 80) return { bg: "#e0f2fe", text: "#0ea5e9" };
  if (match >= 60) return { bg: "#fef9c3", text: "#ca8a04" };
  return { bg: "#fee2e2", text: "#dc2626" };
};

const ZoningExecution = () => {
  return (
    <div className="echo-card">
      <div className="echo-card-title-row">
        <h3 className="echo-card-title">Zoning plan vs actual leasing</h3>
        <Info className="echo-info-icon" />
      </div>
      <p className="echo-card-subtitle">Planned category allocation vs executed leases</p>

      <table className="echo-zoning-table">
        <thead>
          <tr className="echo-zoning-header">
            <th>CATEGORY</th>
            <th>PLAN</th>
            <th>ACTUAL</th>
            <th>MATCH</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, i) => (
            <tr key={i} className="echo-zoning-row">
              <td>
                <span className="echo-zoning-badge" style={{ backgroundColor: cat.color }}>{cat.name}</span>
              </td>
              <td className="echo-zoning-value">{cat.plan}</td>
              <td className="echo-zoning-value">{cat.actual}</td>
              <td>
                <span 
                  className="echo-zoning-match" 
                  style={{ backgroundColor: getMatchColor(cat.match).bg, color: getMatchColor(cat.match).text }}
                >
                  {cat.match}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="echo-zoning-alert">
        Luxury, café and display zones are significantly under-leased vs master plan. Priority for leasing team.
      </div>
    </div>
  );
};

export default ZoningExecution;
