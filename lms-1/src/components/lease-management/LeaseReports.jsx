import React from "react";
import { useNavigate } from 'react-router-dom';
import LeaseManagerLayout from './LeaseManagerLayout';
import "./leaseManagerNew.css";

const LeaseReports = () => {
  const navigate = useNavigate();
  // Mocks for summary Cards
  const stats = {
    active_leases: 1240,
    occupancy: '94.2%',
    portfolio_value: '$4.2M',
    renewal_rate: '88%'
  };

  return (
    <LeaseManagerLayout>
      <div className="lease-dashboard-content">

        {/* Top Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <div className="stat-card-clean">
            <div className="stat-card-title">Total Active Leases <span className="badge-trend trend-up">+2.1%</span></div>
            <div className="stat-card-value">{stats.active_leases}</div>
          </div>
          <div className="stat-card-clean">
            <div className="stat-card-title">Avg Occupancy <span className="badge-trend trend-up">+0.5%</span></div>
            <div className="stat-card-value">{stats.occupancy}</div>
          </div>
          <div className="stat-card-clean">
            <div className="stat-card-title">Portfolio Value <span className="badge-trend trend-down">-1.2%</span></div>
            <div className="stat-card-value">{stats.portfolio_value}</div>
          </div>
          <div className="stat-card-clean">
            <div className="stat-card-title">Renewal Rate <span className="badge-trend trend-up">+4.0%</span></div>
            <div className="stat-card-value">{stats.renewal_rate}</div>
          </div>
        </div>

        {/* Global Filters & Actions */}
        <div className="filters-bar" style={{ background: 'transparent', borderBottom: 'none', padding: 0, marginBottom: '32px' }}>
          <div className="filter-left">
            <button className="btn-filter" style={{ background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '8px 12px' }}>📅 Last Quarter ▾</button>
            <button className="btn-filter" style={{ background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '8px 12px' }}>🏢 All Properties ▾</button>
            <button className="btn-filter" style={{ background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '8px 12px' }}>Y More Filters</button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', cursor: 'pointer' }}>⊞</button>
            <button style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>≣</button>
          </div>
        </div>

        {/* --- REPORTS GRID --- */}
        <div className="reports-grid">

          {/* 1. Active Leases Summary */}
          <div className="report-summary-card">
            <div className="report-card-header">
              <div className="icon-square bg-blue-light">🛡</div>
              <div className="report-actions">
                <button>💾</button> <button>📊</button>
              </div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0' }}>Active Leases Summary</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>A deep dive into currently occupied units, revenue streams per property, and lease durations. Updated 2 hours ago.</p>
            <div className="report-main-stat">
              <div className="bar-chart-mock">
                <div className="bar" style={{ height: '30%' }}></div>
                <div className="bar" style={{ height: '45%' }}></div>
                <div className="bar" style={{ height: '25%' }}></div>
                <div className="bar" style={{ height: '60%' }}></div>
                <div className="bar active" style={{ height: '50%' }}></div>
                <div className="bar" style={{ height: '40%' }}></div>
                <div className="bar active" style={{ height: '75%' }}></div>
              </div>
            </div>
            <button className="btn-view-report" onClick={() => navigate('/lease/reports/active-summary')}>View Report →</button>
          </div>

          {/* 2. Expired Leases */}
          <div className="report-summary-card">
            <div className="report-card-header">
              <div className="icon-square bg-red-light">📅</div>
              <div className="report-actions">
                <button>💾</button> <button>📊</button>
              </div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0' }}>
              Expired Leases <span className="badge-trend badge-critical" style={{ background: '#fee2e2', color: '#dc2626' }}>Action Required</span>
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>List of past-due agreements needing turnover, move-out inspections, or immediate renewal negotiations.</p>

            <div className="report-main-stat">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                <span>Total Expired (MTD)</span>
                <span style={{ color: '#dc2626' }}>24 Units</span>
              </div>
              <div className="progress-thin-bg">
                <div className="progress-fill-blue" style={{ width: '45%', background: '#ef4444' }}></div>
              </div>
            </div>
            <button className="btn-view-report" onClick={() => navigate('/lease/reports/expired')}>View Report →</button>
          </div>

          {/* 3. Upcoming Renewals */}
          <div className="report-summary-card">
            <div className="report-card-header">
              <div className="icon-square bg-orange-light">📝</div>
              <div className="report-actions">
                <button>💾</button> <button>📊</button>
              </div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0' }}>Upcoming Renewals</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>30/60/90-day outlook for expiring contracts. Includes tenant satisfaction scores and renewal probability.</p>

            <div className="report-main-stat" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', border: '2px solid #fff' }}></div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#cbd5e1', border: '2px solid #fff', marginLeft: '-10px' }}></div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#94a3b8', border: '2px solid #fff', marginLeft: '-10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff' }}>+12</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>15 renewals pending for next month</div>
            </div>
            <button className="btn-view-report" onClick={() => navigate('/lease/reports/renewals')}>View Report →</button>
          </div>

          {/* 4. Escalation Summary */}
          <div className="report-summary-card">
            <div className="report-card-header">
              <div className="icon-square bg-purple-light">📈</div>
              <div className="report-actions">
                <button>💾</button> <button>📊</button>
              </div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0' }}>Escalation Summary</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>Tracking rent increases, scheduled annual adjustments, and CPI-linked lease escalations across the portfolio.</p>

            <div className="report-main-stat" style={{ display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Projected Increase</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>+$45,200</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Avg. Adjustment</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>3.2%</div>
              </div>
            </div>
            <button className="btn-view-report" onClick={() => navigate('/lease/reports/escalations')}>View Report →</button>
          </div>

          {/* 5. Project-wise Summary */}
          <div className="report-summary-card">
            <div className="report-card-header">
              <div className="icon-square" style={{ background: '#ecfdf5', color: '#10b981' }}>📍</div>
              <div className="report-actions">
                <button>💾</button> <button>📊</button>
              </div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0' }}>Project-wise Summary</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>Comparative data analysis between different real estate projects, identifying top-performing assets and liabilities.</p>

            <div className="report-main-stat">
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Skyline Towers</span>
                  <span style={{ color: '#10b981' }}>98% Occupied</span>
                </div>
                <div className="progress-thin-bg"><div className="progress-fill-blue" style={{ width: '98%' }}></div></div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Meadow Gardens</span>
                  <span style={{ color: '#3b82f6' }}>82% Occupied</span>
                </div>
                <div className="progress-thin-bg"><div className="progress-fill-blue" style={{ width: '82%' }}></div></div>
              </div>
            </div>
            <button className="btn-view-report" onClick={() => navigate('/lease/reports/projects')}>View Report →</button>
          </div>

          {/* 6. Bulk Export */}
          <div className="report-summary-card" style={{ background: '#2563eb', color: '#fff', border: 'none' }}>
            <div className="report-card-header">
              <div className="icon-square" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>📤</div>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0', color: '#fff' }}>Bulk Portfolio Export</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5', marginBottom: '40px' }}>Generate and download all monthly reports for your entire portfolio in one click. Includes all 15 active properties.</p>

            <button className="btn-view-report" style={{ background: '#fff', color: '#2563eb', border: 'none' }}>Download Everything (ZIP) ⬇</button>
          </div>

        </div>

      </div>
    </LeaseManagerLayout>
  );
};

export default LeaseReports;
