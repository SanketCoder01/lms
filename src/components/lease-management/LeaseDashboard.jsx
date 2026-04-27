import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LeaseManagerLayout from './LeaseManagerLayout';
import { leaseAPI } from '../../services/api';
import './leaseManagerNew.css';

const LeaseDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending_entries: 0,
    leases_expiring: { days_30: 0, days_60: 0, days_90: 0 },
    renewals_due: 0,
    escalations_due: 0,
    recent_activity: []
  });
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await leaseAPI.getLeaseManagerStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <LeaseManagerLayout>
      <div className="lease-dashboard-content">
        <header className="dashboard-header-simple">
          <h1>Lease Management Overview</h1>
          <p>Welcome back, Here is a summary of your lease lifecycle activities.</p>
        </header>

        {/* Top Cards Row */}
        <div className="dashboard-cards-grid">
          {/* Card 1: Pending Entries */}
          <div className="dashboard-card card-yellow cursor-pointer" onClick={() => navigate('/lease/reviews')}>
            <div className="card-top">
              <span className="card-title">Pending Entries</span>
              <span className="card-icon">📂</span>
            </div>
            <div className="card-main">
              <span className="card-value">{stats.pending_entries}</span>
              <span className="card-sub text-warning">Awaiting Review</span>
            </div>
          </div>

          {/* Card 2: Leases Expiring */}
          <div className="dashboard-card card-red">
            <div className="card-top">
              <span className="card-title">Leases Expiring</span>
              <span className="card-icon">📅</span>
            </div>
            <div className="card-main-row">
              <div className="sub-stat">
                <span className="val">{stats.leases_expiring?.days_30 || 0}</span>
                <span className="lbl">30 Days</span>
              </div>
              <div className="sub-stat">
                <span className="val">{stats.leases_expiring?.days_60 || 0}</span>
                <span className="lbl">60 Days</span>
              </div>
              <div className="sub-stat">
                <span className="val">{stats.leases_expiring?.days_90 || 0}</span>
                <span className="lbl">90 Days</span>
              </div>
            </div>
          </div>

          {/* Card 3: Renewals Due */}
          <div className="dashboard-card card-blue">
            <div className="card-top">
              <span className="card-title">Renewals Due</span>
              <span className="card-icon">↻</span>
            </div>
            <div className="card-main">
              <span className="card-value">{stats.renewals_due}</span>
              <span className="card-sub">Current Quarter</span>
            </div>
          </div>

          {/* Card 4: Escalations Due */}
          <div className="dashboard-card card-green">
            <div className="card-top">
              <span className="card-title">Escalations Due</span>
              <span className="card-icon">📈</span>
            </div>
            <div className="card-main">
              <span className="card-value">{stats.escalations_due < 10 ? `0${stats.escalations_due}` : stats.escalations_due}</span>
              <span className="card-sub">Next 30 Days</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <section className="recent-activity-section">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <button className="link-btn">View Full Audit Log</button>
          </div>
          <div className="activity-list">
            {stats.recent_activity && stats.recent_activity.map((activity, idx) => (
              <div className="activity-item" key={idx}>
                <div className={`status-icon ${activity.type === 'Approved' ? 'success' : 'failure'}`}>
                  {activity.type === 'Approved' ? '✓' : '✗'}
                </div>
                <div className="activity-details">
                  <div className="act-title">
                    <strong>Lease {activity.type}:</strong> {activity.lease}
                  </div>
                  <div className="act-desc">
                    {activity.reason ? `Reason: ${activity.reason}` : `Tenant: ${activity.tenant}`}
                  </div>
                </div>
                <div className="activity-meta">
                  <div className="user-name">Marcus Reed</div>
                  <div className="time-ago">{activity.time}</div>
                </div>
              </div>
            ))}
            {(!stats.recent_activity || stats.recent_activity.length === 0) && (
              <div className="no-data">No recent activity</div>
            )}
          </div>
        </section>

        {/* Bottom Widgets */}
        <div className="bottom-widgets-grid">
          <div className="widget-card">
            <div className="widget-header">
              <span className="icon">📊</span> Active Portfolio Health
            </div>
            <div className="widget-body">
              <div className="progress-label">
                <span>Occupancy Rate</span>
                <strong>94.2%</strong>
              </div>
              <div className="progress-bg">
                <div className="progress-fill" style={{ width: '94.2%' }}></div>
              </div>
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-header">
              <span className="icon">☁</span> System Performance
            </div>
            <div className="widget-body flex-row">
              <div className="perf-item">
                <div className="label">Avg. Review Time</div>
                <div className="val">4.2 Hours</div>
              </div>
              <div className="perf-item right">
                <div className="label-sm">Target SLA: 24 Hours</div>
              </div>
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-header">
              <span className="icon">❓</span> Support Desk
            </div>
            <div className="widget-body">
              <p className="support-text">Need help with complex lease structures? Contact the internal specialist team.</p>
              <button className="text-btn">Open Ticket</button>
            </div>
          </div>
        </div>

        <footer className="dashboard-footer">
          <span>© 2024 LeasePortal Professional</span>
          <div className="footer-links">
            <span>Security Protocol</span>
            <span>Compliance Logs</span>
          </div>
          <span className="status-indicator">● System Status: Operational</span>
        </footer>

      </div>
    </LeaseManagerLayout>
  );
};

export default LeaseDashboard;
