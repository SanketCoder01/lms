import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getDashboardStats, getProjects, tenantAPI, unitAPI, leaseAPI } from '../../services/api';
import { supabase } from '../../services/supabase';
import LeaseReport from './LeaseReport';
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

// Utility: format date as "Saturday, 5 April 2026"
const formatDate = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Utility: format time as "09:26 AM"
const formatTime = (date) => {
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(true);
    const [projectsList, setProjectsList] = useState([]);
    const [selectedProject, setSelectedProject] = useState('All');
    const [recentLeases, setRecentLeases] = useState([]);

    // Live Clock State — auto-picks current system date/time
    const [now, setNow] = useState(new Date());

    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Tick every 60 seconds to keep date/time current
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

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
        const fetchProjects = async () => {
            try {
                const res = await getProjects();
                setProjectsList(res.data?.data || res.data || []);
            } catch (err) {
                console.error("Error fetching projects for filter:", err);
            }
        };
        fetchProjects();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const params = selectedProject !== 'All' ? { project_id: selectedProject } : undefined;
            const response = await getDashboardStats(params);
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

    useEffect(() => {
        fetchStats();
        fetchRecentLeases();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProject]);

    // Fetch Recent Leases for Quick Report Access
    const fetchRecentLeases = async () => {
        try {
            const res = await leaseAPI.getAllLeases({ limit: 5 });
            const leases = res.data?.data || res.data || [];
            setRecentLeases(leases.slice(0, 5));
        } catch (err) {
            console.error("Error fetching recent leases:", err);
        }
    };

    // Realtime Subscriptions
    useEffect(() => {
        const channels = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                (payload) => {
                    console.log('Realtime update (projects)', payload);
                    fetchStats();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'units' },
                (payload) => {
                    console.log('Realtime update (units)', payload);
                    fetchStats();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leases' },
                (payload) => {
                    console.log('Realtime update (leases)', payload);
                    fetchStats();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'unit_ownerships' },
                (payload) => {
                    console.log('Realtime update (unit_ownerships)', payload);
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProject]);

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
                <header className="dashboard-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
                    {/* Top Row: Title + Live Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#111827' }}>
                                Admin Dashboard
                            </h2>
                            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
                                Overview of your portfolio performance
                            </p>
                        </div>
                        {/* Live Date Badge — automatically shows current system date */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: '#EBF2FF', borderRadius: '12px',
                            padding: '10px 18px', border: '1px solid #C7D9FF'
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E66FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#2E66FF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Today
                                </div>
                                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e40af', lineHeight: 1.2 }}>
                                    {formatDate(now)}
                                </div>
                            </div>
                            <div style={{ borderLeft: '1px solid #C7D9FF', paddingLeft: '12px', marginLeft: '4px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280', textAlign: 'center' }}>Time</div>
                                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
                                    {formatTime(now)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Search + Project Filter + Notification */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'space-between' }}>
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

                        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <select
                                className="form-select"
                                style={{ minWidth: '220px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', fontSize: '14px', color: '#374151' }}
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                <option value="All">All Projects</option>
                                {projectsList.map((p) => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                            <button className="icon-btn" onClick={() => navigate('/admin/notifications')} title="Notifications">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            </button>
                        </div>
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
                                    <h4>Avg Projected Rent / Sqft</h4>
                                    <div className="stat-value">₹{stats?.financials?.avgProjectedRent?.value}</div>
                                </div>
                                <div className="stat-card">
                                    <h4>Avg Actual Rent / Sqft</h4>
                                    <div className="stat-value">₹{stats?.financials?.avgActualRent?.value}</div>
                                </div>
                                <div className="stat-card">
                                    <h4>Deviation (Actual / Sqft)</h4>
                                    <div className="stat-value" style={{ color: parseFloat(stats?.financials?.deviation?.value || 0) >= 0 ? 'green' : 'red' }}>
                                        {stats?.financials?.deviation?.value}
                                        <span style={{ fontSize: '0.8rem', marginLeft: '5px' }}>({stats?.financials?.deviation?.percent})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Graph */}
                            <div className="stat-card revenue-card" style={{ height: 'auto', minHeight: '350px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Revenue Trend</h4>
                                        <div className="sub-text" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Monthly revenue from active leases</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}></div>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Revenue</span>
                                    </div>
                                </div>
                                <div style={{ flex: 1, position: 'relative', background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <svg viewBox="0 0 1000 280" preserveAspectRatio="none" style={{ width: '100%', height: '280px', overflow: 'visible' }}>
                                        <defs>
                                            <linearGradient id="trendGradientNew" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                                                <stop offset="50%" stopColor="#22c55e" stopOpacity="0.1" />
                                                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                                            </linearGradient>
                                            <filter id="glow">
                                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur"/>
                                                    <feMergeNode in="SourceGraphic"/>
                                                </feMerge>
                                            </filter>
                                            <filter id="shadow">
                                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.3"/>
                                            </filter>
                                        </defs>
                                        
                                        {/* Grid lines with labels */}
                                        <line x1="0" y1="230" x2="1000" y2="230" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5,5" />
                                        <line x1="0" y1="160" x2="1000" y2="160" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5,5" />
                                        <line x1="0" y1="90" x2="1000" y2="90" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5,5" />
                                        <line x1="0" y1="20" x2="1000" y2="20" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5,5" />

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
                                                        const height = 230;
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
                                                        path += ` L ${width},${height} L 0,${height} Z`;
                                                        return path;
                                                    })()}
                                                    fill="url(#trendGradientNew)"
                                                    stroke="none"
                                                />
                                                
                                                {/* Smooth Stroke Line */}
                                                <path
                                                    d={(() => {
                                                        const data = stats.graphs.revenueTrends;
                                                        if (!data || data.length === 0) return "";
                                                        const revenues = data.map(d => d.revenue);
                                                        const maxRev = Math.max(...revenues) || 100;
                                                        const width = 1000;
                                                        const height = 230;
                                                        const step = width / (data.length - 1);

                                                        const points = data.map((d, i) => {
                                                            const x = i * step;
                                                            const y = height - (d.revenue / maxRev) * 200;
                                                            return `${x},${y}`;
                                                        });

                                                        let path = `M${points[0]}`;
                                                        for (let i = 1; i < points.length; i++) {
                                                            const x0 = i > 1 ? (i - 1) * step : 0;
                                                            const x1 = i * step;
                                                            const y0 = i > 1 ? height - (data[i-1].revenue / maxRev) * 200 : points[0].split(',')[1];
                                                            const y1 = height - (data[i].revenue / maxRev) * 200;
                                                            const cpx = (x0 + x1) / 2;
                                                            path += ` C ${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
                                                        }
                                                        return path;
                                                    })()}
                                                    fill="none"
                                                    stroke="#22c55e"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    filter="url(#glow)"
                                                />
                                                
                                                {/* Data Points */}
                                                {(() => {
                                                    const data = stats.graphs.revenueTrends;
                                                    if (!data || data.length === 0) return null;
                                                    const revenues = data.map(d => d.revenue);
                                                    const maxRev = Math.max(...revenues) || 100;
                                                    const width = 1000;
                                                    const height = 230;
                                                    const step = width / (data.length - 1);

                                                    return data.map((d, i) => {
                                                        const x = i * step;
                                                        const y = height - (d.revenue / maxRev) * 200;
                                                        return (
                                                            <g key={i}>
                                                                <circle cx={x} cy={y} r="6" fill="#fff" stroke="#22c55e" strokeWidth="3" filter="url(#shadow)" />
                                                                <circle cx={x} cy={y} r="3" fill="#22c55e" />
                                                            </g>
                                                        );
                                                    });
                                                })()}
                                            </>
                                        )}
                                        
                                        {/* Empty state */}
                                        {(!stats?.graphs?.revenueTrends || stats.graphs.revenueTrends.length === 0) && (
                                            <text x="500" y="140" textAnchor="middle" fill="#94a3b8" fontSize="14">
                                                No revenue data available
                                            </text>
                                        )}
                                    </svg>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '0 10px' }}>
                                    {stats?.graphs?.revenueTrends?.map((d, i) => (
                                        <div key={i} style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{d.month}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: '600' }}>¥{(d.revenue/1000).toFixed(0)}K</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Leases - Quick Report Access */}
                        <h4 className="section-title" style={{ marginBottom: '15px', marginTop: '30px' }}>Recent Leases - Quick Report</h4>
                        <div className="stat-card" style={{ padding: '20px' }}>
                            {recentLeases.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                                    No recent leases found. <Link to="/admin/add-lease" style={{ color: '#2e66ff' }}>Create a new lease</Link>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {recentLeases.map((lease) => (
                                        <div key={lease.id} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                                    Lease #{lease.id} - {lease.tenant_name || lease.sub_tenant_name || 'Unknown Tenant'}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                                    {lease.project_name || 'N/A'} | Unit: {lease.unit_number || 'N/A'} | Status: {lease.status || 'Draft'}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <Link 
                                                    to={`/admin/leases/${lease.id}`}
                                                    style={{ 
                                                        padding: '6px 12px',
                                                        background: '#e0f2fe',
                                                        color: '#0369a1',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem',
                                                        textDecoration: 'none',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    View
                                                </Link>
                                                <LeaseReport lease={lease} />
                                            </div>
                                        </div>
                                    ))}
                                    <Link 
                                        to="/admin/leases" 
                                        style={{ 
                                            textAlign: 'center', 
                                            color: '#2e66ff', 
                                            fontWeight: '500',
                                            padding: '10px',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        View All Leases
                                    </Link>
                                </div>
                            )}
                        </div>

                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
