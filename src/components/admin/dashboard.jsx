import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getDashboardStats, getProjects, tenantAPI, unitAPI } from '../../services/api';
import './dashboard.css';

const initialStats = {
    topRow: {
        totalProjects: { value: 0, label: "Total Projects" },
        totalUnits: { value: 0, label: "Total Units" },
        totalProjectArea: { value: 0, label: "Total Project Area", unit: "sq ft" }
    },
    secondRow: {
        unitsSold: { value: 0, label: "Units Sold" },
        unitsUnsold: { value: 0, label: "Units Unsold" },
        areaSold: { value: 0, label: "Area Sold", unit: "sq ft" },
        areaUnsold: { value: 0, label: "Area Unsold", unit: "sq ft" },
        unitOwnership: { value: 0, label: "Unit Ownerships" }
    },
    thirdRow: {
        unitsLeased: { value: 0, label: "Units Leased" },
        unitsVacant: { value: 0, label: "Units Vacant" },
        areaLeased: { value: 0, label: "Area Leased", unit: "sq ft" },
        areaVacant: { value: 0, label: "Area Vacant", unit: "sq ft" },
        totalLessees: { value: 0, label: "Total Lessees" }
    },
    financials: {
        rentMonth: { value: 0, label: "Rent (Month)" },
        rentYear: { value: 0, label: "Rent (Year)" },
        opportunityLoss: { value: 0, label: "Opportunity Loss (Vacancy)" },
        avgActualRent: { value: "0.00", label: "Avg Actual Rent / Sqft" },
        avgProjectedRent: { value: "0.00", label: "Avg Projected Rent / Sqft" },
        deviation: { value: "0.00", percent: "0%", label: "Deviation" }
    },
    graphs: {
        revenueTrends: []
    }
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(true);

    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                setIsSearching(true);
                try {
                    const [projRes, tenantRes, unitRes] = await Promise.all([
                        getProjects({ search: searchTerm }),
                        tenantAPI.getTenants({ search: searchTerm }),
                        unitAPI.getUnits({ search: searchTerm })
                    ]);

                    const projects = (projRes.data.data || projRes.data || []).map(p => ({ ...p, type: 'Project', label: p.project_name, link: `/admin/projects/${p.id}` }));
                    const tenants = (tenantRes.data || []).map(t => ({ ...t, type: 'Tenant', label: t.company_name, link: `/admin/tenant/${t.id}` }));
                    const units = (unitRes.data.data || unitRes.data || []).map(u => ({ ...u, type: 'Unit', label: `${u.unit_number} (${u.building})`, link: `/admin/view-unit/${u.id}` }));

                    setSearchResults([...projects, ...tenants, ...units]);
                    setShowResults(true);
                } catch (err) {
                    console.error("Search failed", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSearchSelect = (link) => {
        navigate(link);
        setShowResults(false);
        setSearchTerm("");
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getDashboardStats();
                if (response.data) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                // Keep initialStats if error occurs
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Helper Card Component
    const StatCard = ({ title, value, unit, subtext, color = "blue", onClick }) => (
        <div className="stat-card clickable" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', borderColor: `var(--${color})`, borderTopWidth: '4px' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#6B7280', textTransform: 'none' }}>{title}</h4>
            <div className="stat-value" style={{ color: `var(--${color})` }}>
                {value !== undefined && value !== null ? (typeof value === 'number' ? value.toLocaleString() : value) : '0'}
                {unit && <span style={{ fontSize: '0.9rem', color: '#9CA3AF', marginLeft: '4px' }}>{unit}</span>}
            </div>
            {subtext && <div className="stat-change neutral">{subtext}</div>}
        </div>
    );

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="main-content">
                {/* HEADER */}
                <header className="dashboard-header">
                    <div className="search-bar-container">
                        <div className="search-bar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input
                                type="text"
                                placeholder="Search properties, tenants, units..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => searchTerm.length > 1 && setShowResults(true)}
                                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                            />
                        </div>
                        {showResults && (
                            <div className="search-results-dropdown">
                                {isSearching ? (
                                    <div className="no-results">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((item, idx) => (
                                        <div key={idx} className="search-result-item" onClick={() => handleSearchSelect(item.link)}>
                                            <div className="search-result-info">
                                                <span className="search-result-label">{item.label}</span>
                                                <span className="search-result-type">{item.type}</span>
                                            </div>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-results">No results found for "{searchTerm}"</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="header-actions">
                        <button className="icon-btn" onClick={() => navigate('/admin/notifications')} title="Notifications">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="loading-state">Loading Dashboard...</div>
                ) : (
                    <>
                        {/* ROW 1: Projects, Units, Total Area */}
                        <h4 className="section-title" style={{ marginTop: 0, marginBottom: '15px' }}>Overview</h4>
                        <section className="stats-grid-top stats-grid-3">
                            <StatCard title="Total Projects" value={stats?.topRow?.totalProjects?.value} subtext={stats?.topRow?.totalProjects?.change} color="blue" onClick={() => navigate('/admin/projects')} />
                            <StatCard title="Total Units" value={stats?.topRow?.totalUnits?.value} subtext={stats?.topRow?.totalUnits?.change} color="blue" onClick={() => navigate('/admin/units')} />
                            <StatCard title="Total Project Area" value={stats?.topRow?.totalProjectArea?.value} unit="sq ft" color="blue" onClick={() => navigate('/admin/units')} />
                        </section>

                        {/* ROW 2: Sales Status */}
                        <h4 className="section-title" style={{ marginBottom: '15px' }}>Sales Status</h4>
                        <section className="stats-grid-top stats-grid-5">
                            <StatCard title="Units Sold" value={stats?.secondRow?.unitsSold?.value} color="green" onClick={() => navigate('/admin/units')} />
                            <StatCard title="Units Unsold" value={stats?.secondRow?.unitsUnsold?.value} color="orange" onClick={() => navigate('/admin/units')} />
                            <StatCard title="Area Sold" value={stats?.secondRow?.areaSold?.value} unit="sq ft" color="green" onClick={() => navigate('/admin/units')} />
                            <StatCard title="Area Unsold" value={stats?.secondRow?.areaUnsold?.value} unit="sq ft" color="orange" onClick={() => navigate('/admin/units')} />
                            <StatCard title="Unit Ownerships" value={stats?.secondRow?.unitOwnership?.value} color="purple" onClick={() => navigate('/admin/ownership-mapping')} />
                        </section>

                        {/* ROW 3: Leasing Status */}
                        <h4 className="section-title" style={{ marginBottom: '15px' }}>Leasing Status</h4>
                        <section className="stats-grid-top stats-grid-5">
                            <StatCard title="Units Leased" value={stats?.thirdRow?.unitsLeased?.value} color="blue" onClick={() => navigate('/admin/leases')} />
                            <StatCard title="Units Vacant" value={stats?.thirdRow?.unitsVacant?.value} color="red" onClick={() => navigate('/admin/units')} />
                            <StatCard title="Area Leased" value={stats?.thirdRow?.areaLeased?.value} unit="sq ft" color="blue" onClick={() => navigate('/admin/leases')} />
                            <StatCard title="Area Vacant" value={stats?.thirdRow?.areaVacant?.value} unit="sq ft" color="red" onClick={() => navigate('/admin/units')} />
                            <StatCard title="Total Lessees" value={stats?.thirdRow?.totalLessees?.value} color="purple" onClick={() => navigate('/admin/parties')} />
                        </section>

                        {/* Financial Dashboard */}
                        <h4 className="section-title" style={{ marginBottom: '15px' }}>Financial Dashboard</h4>
                        <div className="financial-grid">

                            {/* Financial Metrics */}
                            <div className="financial-metrics" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4>Total Rent (Month)</h4>
                                        <div className="stat-value">₹{Number(stats?.financials?.rentMonth?.value || 0).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4>Total Rent (Year / Annualized)</h4>
                                        <div className="stat-value">₹{Number(stats?.financials?.rentYear?.value || 0).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="stat-card" style={{ borderLeft: '4px solid #DC2626' }}>
                                    <h4>Opportunity Loss (Vacancy)</h4>
                                    <div className="stat-value" style={{ color: '#DC2626' }}>₹{Number(stats?.financials?.opportunityLoss?.value || 0).toLocaleString()}</div>
                                </div>
                                <div className="stat-card">
                                    <h4>Avg Actual Rent / Sqft</h4>
                                    <div className="stat-value">₹{stats?.financials?.avgActualRent?.value}</div>
                                </div>
                                <div className="stat-card">
                                    <h4>Deviation (Actual vs Projected)</h4>
                                    <div className="stat-value" style={{ color: parseFloat(stats?.financials?.deviation?.value || 0) >= 0 ? 'green' : 'red' }}>
                                        {stats?.financials?.deviation?.value}
                                        <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>({stats?.financials?.deviation?.percent})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Graph */}
                            <div className="stat-card revenue-card" style={{ height: 'auto', minHeight: '300px' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <h4>Total Project Revenue (Trend)</h4>
                                    <div className="sub-text">Monthly revenue trend based on active leases</div>
                                </div>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <svg viewBox="0 0 1000 300" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                        <defs>
                                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#2E66FF" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#2E66FF" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <line x1="0" y1="250" x2="1000" y2="250" stroke="#F3F4F6" strokeWidth="2" />
                                        <line x1="0" y1="150" x2="1000" y2="150" stroke="#F3F4F6" strokeWidth="2" />
                                        <line x1="0" y1="50" x2="1000" y2="50" stroke="#F3F4F6" strokeWidth="2" />

                                        {stats?.graphs?.revenueTrends && stats.graphs.revenueTrends.length > 0 && (
                                            <>
                                                {/* Area Fill */}
                                                <path
                                                    d={(() => {
                                                        const data = stats.graphs.revenueTrends;
                                                        if (!data || data.length === 0) return "";
                                                        const revenues = data.map(d => d.revenue);
                                                        const maxRev = Math.max(...revenues) || 100;
                                                        const width = 1000;
                                                        const height = 250;
                                                        const step = width / (data.length - 1);

                                                        const points = data.map((d, i) => {
                                                            const x = i * step;
                                                            const y = height - (d.revenue / maxRev) * 200;
                                                            return `${x},${y}`;
                                                        });

                                                        let path = `M${points[0]}`;
                                                        for (let i = 1; i < points.length; i++) {
                                                            path += ` L ${points[i]}`;
                                                        }
                                                        // Close the path for fill
                                                        path += ` L ${width},${height} L 0,${height} Z`;
                                                        return path;
                                                    })()}
                                                    fill="url(#trendGradient)"
                                                    stroke="none"
                                                />
                                                {/* Stroke Line */}
                                                <path
                                                    d={(() => {
                                                        const data = stats.graphs.revenueTrends;
                                                        if (!data || data.length === 0) return "";
                                                        const revenues = data.map(d => d.revenue);
                                                        const maxRev = Math.max(...revenues) || 100;
                                                        const width = 1000;
                                                        const height = 250;
                                                        const step = width / (data.length - 1);

                                                        const points = data.map((d, i) => {
                                                            const x = i * step;
                                                            const y = height - (d.revenue / maxRev) * 200;
                                                            return `${x},${y}`;
                                                        });

                                                        let path = `M${points[0]}`;
                                                        for (let i = 1; i < points.length; i++) {
                                                            path += ` L ${points[i]}`;
                                                        }
                                                        return path;
                                                    })()}
                                                    fill="none"
                                                    stroke="#2E66FF"
                                                    strokeWidth="3"
                                                    strokeLinejoin="round"
                                                />
                                            </>
                                        )}
                                    </svg>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: '#9CA3AF' }}>
                                    {stats?.graphs?.revenueTrends?.map((d, i) => <span key={i}>{d.month}</span>)}
                                </div>
                            </div>
                        </div>

                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
