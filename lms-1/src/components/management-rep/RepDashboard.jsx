import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './RepSidebar';
import { managementAPI } from '../../services/api';
// Using common dashboard css
import '../admin/dashboard.css';

const RepDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await managementAPI.getDashboardStats();
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Helper data
    // Map managementAPI response (metrics object) to flat structure if needed
    // managementRepController was updated, but still returns 'metrics' object for top stats
    // We need to map metrics.*.value to simple values

    const s = stats?.metrics || {};

    // const revenueValue = s.totalRevenue?.value ? parseFloat(s.totalRevenue.value.replace(/[^0-9.]/g, '')) * 1000000 : 0; // rough parsing if string "₹1.2M" or similar
    // Actually the controller returns formatted string.
    // Let's rely on the raw values if possible, but the controller returns formatted strings for "value".
    // Wait, I see "value: totalProjects" (number) in lines 200, but totalRevenue is formatted line 225.
    // "value: totalRevenue > 0 ? ... : ..."
    // This is tricky. I'll just display the string value directly for revenue.

    // const projectsVal = s.totalProjects?.value || 0;
    // const unitsVal = s.totalUnits?.value || 0;

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="main-content">
                {/* HEADER */}
                <header className="dashboard-header">
                    <div className="search-bar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" placeholder="Search properties, tenants..." />
                    </div>

                    <div className="header-actions">
                        <button className="icon-btn" onClick={() => navigate('/management/notifications')} title="Notifications">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </button>

                        <button className="primary-btn" onClick={() => navigate('/admin/leases')}>
                            + New Lease
                        </button>
                    </div>
                </header>

                {/* VISUAL STATS ROW (5 Cards) */}
                <section className="stats-grid-top">
                    {loading ? (
                        <div className="loading-state">Loading...</div>
                    ) : (
                        [
                            { title: "Total Projects", value: s.totalProjects?.value || 0, change: s.totalProjects?.change, cls: "positive", stroke: "#2ED573" },
                            { title: "Total Units", value: s.totalUnits?.value || 0, change: s.totalUnits?.change, cls: "negative", stroke: "#FF4757" },
                            { title: "Total Owners", value: s.totalOwners?.value || 0, change: s.totalOwners?.change, cls: "neutral", stroke: "#2E66FF" },
                            { title: "Total Tenants", value: s.totalTenants?.value || 0, change: s.totalTenants?.change, cls: "warning", stroke: "#FFA502" },
                            { title: "Total Leases", value: s.totalLeases?.value || 0, change: s.totalLeases?.change, cls: "info", stroke: "#5352ED" }
                        ].map((item, idx) => (
                            <div className="stat-card" key={idx}>
                                <h4>{item.title}</h4>
                                <div className="stat-value">{item.value}</div>
                                <div className={`stat-change ${item.cls}`}>
                                    {item.change}
                                </div>
                                <div className="mini-sparkline">
                                    <svg width="100%" height="35" viewBox="0 0 100 35" preserveAspectRatio="none">
                                        <path
                                            d="M0,25 C12,15 30,30 50,20 S88,15 100,22"
                                            fill="none"
                                            stroke={item.stroke}
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                        ))
                    )}
                </section>

                {/* SECONDARY ROW: Revenue & Area */}
                <section className="stats-grid-secondary">
                    {/* Revenue Card */}
                    <div className="stat-card revenue-card">
                        <div>
                            <h4>Total Revenue</h4>
                            <div className="stat-value">{s.totalRevenue?.value || "₹0.0M"}</div>
                            <div className="stat-change negative">
                                {s.totalRevenue?.change}
                            </div>
                        </div>
                        <div className="mini-chart-wave">
                            <svg width="120" height="40" viewBox="0 0 120 40">
                                <path d="M0,35 C30,35 30,10 60,10 C90,10 90,25 120,20" fill="none" stroke="#FF4757" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>

                    {/* Area Occupied */}
                    <div className="area-card">
                        <div className="area-info">
                            <h4>Area Occupied</h4>
                            <span className="sub-text">Average Rent Achieved: ₹{stats?.areaStats?.occupied?.avgRentPerSqft?.toFixed(2) || '0'} per sq ft</span>
                        </div>
                        <div className="area-metrics">
                            <span className="big-num">{stats?.areaStats?.occupied?.area?.toLocaleString() || '0'} sq ft</span>
                            <span className="label">Super / Leasable Area</span>
                        </div>
                    </div>

                    {/* Area Vacant */}
                    <div className="area-card">
                        <div className="area-info">
                            <h4>Area Vacant</h4>
                            <span className="sub-text">Average Expected Rent: ₹{stats?.areaStats?.vacant?.avgRentPerSqft?.toFixed(2) || '0'} per sq ft</span>
                        </div>
                        <div className="area-metrics">
                            <span className="big-num">{stats?.areaStats?.vacant?.area?.toLocaleString() || '0'} sq ft</span>
                            <span className="label">Super / Leasable Area</span>
                        </div>
                    </div>
                </section>

                {/* REVENUE CHART SECTION */}
                <section className="chart-section">
                    <div className="section-header">
                        <h2>
                            Revenue Trends <span className="text-muted">Gross revenue across all properties</span>
                        </h2>
                        <div className="chart-legend">
                            <span className="legend-item"><span className="dot current" /> This year</span>
                            <span className="legend-item"><span className="dot last" /> Last year</span>
                        </div>
                    </div>
                    <div className="chart-wrapper">
                        {/* Dynamic Chart */}
                        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="revenue-chart-svg" style={{ width: '100%', height: '250px', overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2E66FF" stopOpacity="0.18" />
                                    <stop offset="100%" stopColor="#2E66FF" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,250 L1000,250" stroke="#F0F2F5" />
                            <path d="M0,200 L1000,200" stroke="#F0F2F5" />
                            <path d="M0,150 L1000,150" stroke="#F0F2F5" />

                            {stats?.revenueTrends && (
                                <path
                                    d={(() => {
                                        const data = stats.revenueTrends;
                                        if (!data || data.length === 0) return "";

                                        const revenues = data.map(d => d.revenue);
                                        const maxRev = Math.max(...revenues) * 1.2 || 100;
                                        const width = 1000;
                                        const height = 250;
                                        const step = width / (data.length - 1);

                                        const points = data.map((d, i) => {
                                            const x = i * step;
                                            const y = height - (d.revenue / maxRev) * height;
                                            return `${x},${y}`;
                                        });

                                        let path = `M${points[0]}`;
                                        for (let i = 1; i < points.length; i++) {
                                            const [x, y] = points[i].split(',');
                                            path += ` L ${x},${y}`;
                                        }
                                        return path;
                                    })()}
                                    fill="url(#trendGradient)"
                                    stroke="#2E66FF"
                                    strokeWidth="3"
                                    strokeLinejoin="round"
                                />
                            )}
                        </svg>
                        <div className="chart-labels">
                            {stats?.revenueTrends?.map((d, i) => (
                                <span key={i}>{d.month}</span>
                            )) || <span>Loading...</span>}
                        </div>
                    </div>
                </section>

                {/* LISTS SECTIONS */}
                <section className="lists-grid">
                    {/* Renewals */}
                    <div className="list-card">
                        <div className="list-header">
                            <h3>Upcoming Renewals</h3>
                            <button className="link-btn" onClick={() => navigate('/admin/leases')}>View All</button>
                        </div>
                        <div className="list-content">
                            {stats?.upcomingRenewals?.length > 0 ? stats.upcomingRenewals.map((item, idx) => (
                                <div className="list-item" key={idx}>
                                    <div className="date-badge">
                                        <span className="month">{new Date(item.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="day">{new Date(item.date).getDate()}</span>
                                    </div>
                                    <div className="item-details">
                                        <div className="primary-text">{item.unit} • {new Date(item.date).toLocaleDateString()}</div>
                                        <div className="secondary-text">{item.tenant}</div>
                                    </div>
                                    <span className={`status-pill ${item.badgeType}`}>
                                        {item.badge}
                                    </span>
                                </div>
                            )) : <p className="empty-text">No upcoming renewals.</p>}
                        </div>
                    </div>

                    {/* Expiries */}
                    <div className="list-card">
                        <div className="list-header">
                            <h3>Upcoming Expiries</h3>
                            <button className="link-btn" onClick={() => navigate('/admin/leases')}>View All</button>
                        </div>
                        <div className="list-content">
                            {stats?.upcomingExpiries?.length > 0 ? stats.upcomingExpiries.map((item, idx) => (
                                <div className="list-item" key={idx}>
                                    <div className="date-badge">
                                        <span className="month">{new Date(item.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="day">{new Date(item.date).getDate()}</span>
                                    </div>
                                    <div className="item-details">
                                        <div className="primary-text">{item.unit} • {new Date(item.date).toLocaleDateString()}</div>
                                        <div className="secondary-text">{item.tenant}</div>
                                    </div>
                                    <span className={`status-pill ${item.badgeType}`}>
                                        {item.badge}
                                    </span>
                                </div>
                            )) : <p className="empty-text">No upcoming expiries.</p>}
                        </div>
                    </div>

                    {/* Rent Escalations */}
                    <div className="list-card">
                        <div className="list-header">
                            <h3>Rent Escalations</h3>
                            <button className="link-btn" onClick={() => navigate('/management/reports')}>View All</button>
                        </div>
                        <div className="list-content">
                            {stats?.rentEscalations?.length > 0 ? stats.rentEscalations.map((item, idx) => (
                                <div className="list-item" key={idx}>
                                    <div className="date-badge gray">
                                        <span className="month">{new Date(item.effective_from).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                                        <span className="day">{new Date(item.effective_from).getDate()}</span>
                                    </div>
                                    <div className="item-details">
                                        <div className="primary-text">{item.unit_number} • {new Date(item.effective_from).getFullYear()}</div>
                                        <div className="secondary-text">{item.increase_type}</div>
                                    </div>
                                    <span className="value-text success">
                                        {item.increase_type === 'Percentage' ? `+${item.value}%` : `+₹${item.value}`}
                                    </span>
                                </div>
                            )) : <p className="empty-text">No escalations.</p>}
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default RepDashboard;
