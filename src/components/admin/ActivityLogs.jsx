import React, { useEffect, useState, useCallback, useRef } from 'react';
import Sidebar from './Sidebar';
import './ActivityLogs.css';
import { supabase } from '../../services/supabase';
import { getActivityLogs, exportActivityLogs, getProjectLocations } from '../../services/api';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liveConnected, setLiveConnected] = useState(false);
    const [newLogIds, setNewLogIds] = useState(new Set()); // IDs that just arrived live
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });

    // Filters
    const [search, setSearch] = useState('');
    const [selectedModule, setSelectedModule] = useState('All Modules');
    const [selectedLocation, setSelectedLocation] = useState('All Locations');
    const [availableLocations, setAvailableLocations] = useState(['All Locations']);

    const MODULES = ['All Modules', 'Lease', 'Unit', 'Project', 'Owner', 'Party', 'Filter', 'Auth', 'System'];

    // Ref to keep latest logs for real-time prepend without stale closure
    const logsRef = useRef(logs);
    useEffect(() => { logsRef.current = logs; }, [logs]);

    /* ═══════════════════ FETCH LOCATIONS ═══════════════════ */
    useEffect(() => {
        const fetchLocs = async () => {
            try {
                const res = await getProjectLocations();
                const apiLocations = res.data || [];
                setAvailableLocations(['All Locations', ...new Set(apiLocations)]);
            } catch {
                setAvailableLocations(['All Locations']);
            }
        };
        fetchLocs();
    }, []);

    /* ═══════════════════ FETCH LOGS FROM API ═══════════════════ */
    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const filters = {};
            if (search) filters.search = search;
            if (selectedLocation !== 'All Locations') filters.location = selectedLocation;
            if (selectedModule !== 'All Modules') filters.module = selectedModule;

            const res = await getActivityLogs(pagination.page, pagination.limit, filters);
            if (res.data && res.data.logs) {
                setLogs(res.data.logs);
                setPagination(prev => ({ ...prev, total: res.data.total }));
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, selectedLocation, selectedModule]);

    useEffect(() => {
        const timer = setTimeout(() => fetchLogs(), 400);
        return () => clearTimeout(timer);
    }, [fetchLogs]);

    /* ═══════════════════ SUPABASE REAL-TIME ═══════════════════ */
    useEffect(() => {
        const channel = supabase
            .channel('activity_logs_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'activity_logs' },
                (payload) => {
                    const newLog = payload.new;
                    if (!newLog) return;

                    // Only prepend on page 1 and if no active filter would exclude it
                    const isPage1 = pagination.page === 1;
                    const matchesModule = selectedModule === 'All Modules' ||
                        (newLog.module && newLog.module.toLowerCase().includes(selectedModule.toLowerCase()));

                    if (isPage1 && matchesModule) {
                        setLogs(prev => [newLog, ...prev.slice(0, 14)]); // keep page size
                        setPagination(prev => ({ ...prev, total: prev.total + 1 }));

                        // Flash animation for this log
                        setNewLogIds(prev => new Set([...prev, newLog.id]));
                        setTimeout(() => {
                            setNewLogIds(prev => {
                                const next = new Set(prev);
                                next.delete(newLog.id);
                                return next;
                            });
                        }, 3000);
                    }
                }
            )
            .subscribe((status) => {
                setLiveConnected(status === 'SUBSCRIBED');
            });

        return () => {
            supabase.removeChannel(channel);
            setLiveConnected(false);
        };
    }, [pagination.page, selectedModule]);

    /* ═══════════════════ HELPERS ═══════════════════ */
    const formatDateTime = (isoString) => {
        if (!isoString) return { date: '—', time: '—' };
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };
    };

    const getModuleColor = (module) => {
        const m = (module || '').toLowerCase();
        if (m.includes('lease')) return '#8b5cf6';
        if (m.includes('unit')) return '#0ea5e9';
        if (m.includes('project')) return '#10b981';
        if (m.includes('owner') || m.includes('party')) return '#f59e0b';
        if (m.includes('auth') || m.includes('login')) return '#ef4444';
        if (m.includes('filter')) return '#6366f1';
        return '#64748b';
    };

    const getActionIcon = (action) => {
        const a = (action || '').toLowerCase();
        if (a.includes('creat') || a.includes('add')) return '＋';
        if (a.includes('updat') || a.includes('edit')) return '✏️';
        if (a.includes('delet') || a.includes('remov')) return '🗑️';
        if (a.includes('login') || a.includes('auth')) return '🔐';
        if (a.includes('export')) return '📥';
        return '📋';
    };

    const handleExport = async () => {
        try {
            const filters = {};
            if (search) filters.search = search;
            if (selectedLocation !== 'All Locations') filters.location = selectedLocation;
            if (selectedModule !== 'All Modules') filters.module = selectedModule;
            const res = await exportActivityLogs(filters);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'activity_logs.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const handleClearFilters = () => {
        setSearch('');
        setSelectedLocation('All Locations');
        setSelectedModule('All Modules');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

    const getPageNumbers = () => {
        const range = [];
        const delta = 2;
        const current = pagination.page;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
                range.push(i);
            }
        }
        const result = [];
        let last;
        for (const i of range) {
            if (last && i - last > 1) result.push('...');
            result.push(i);
            last = i;
        }
        return result;
    };

    /* ═══════════════════ RENDER ═══════════════════ */
    return (
        <div className="activity-logs-container">
            <Sidebar />
            <main className="activity-logs-content">

                {/* ── Header ── */}
                <header className="activity-header">
                    <div className="activity-title">
                        <h2>Activity Logs</h2>
                        <p>Monitor all system changes and user actions in real-time.</p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Live indicator */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 14px', borderRadius: '20px',
                            background: liveConnected ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${liveConnected ? '#bbf7d0' : '#fecaca'}`,
                            fontSize: '12px', fontWeight: '600',
                            color: liveConnected ? '#16a34a' : '#dc2626',
                        }}>
                            <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: liveConnected ? '#16a34a' : '#dc2626',
                                animation: liveConnected ? 'pulse 1.5s infinite' : 'none',
                                display: 'inline-block',
                            }} />
                            {liveConnected ? 'Live' : 'Connecting...'}
                        </div>
                        <button className="btn-refresh" onClick={fetchLogs}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            Refresh
                        </button>
                        <button className="btn-export" onClick={handleExport}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </header>

                {/* ── Filters ── */}
                <div className="filters-container">
                    <div className="search-wrapper">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by user, action, module..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <select className="filter-dropdown-select" value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
                            {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select className="filter-dropdown-select" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                            {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                    <div className="filter-controls">
                        <span className="clear-filters" onClick={handleClearFilters}>Clear filters</span>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="activity-table-container">
                    <style>{`
                        @keyframes pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.3; }
                        }
                        @keyframes flashIn {
                            0% { background: #eff6ff; transform: translateX(-4px); }
                            60% { background: #dbeafe; }
                            100% { background: transparent; transform: translateX(0); }
                        }
                        .activity-row.new-live { animation: flashIn 0.6s ease forwards; }
                    `}</style>

                    <div className="activity-table-header">
                        <div>User</div>
                        <div>Action</div>
                        <div>Module</div>
                        <div>Details</div>
                        <div>Timestamp</div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                            <p style={{ marginTop: '10px' }}>Loading activity logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                            <p>No activity logs found.</p>
                        </div>
                    ) : (
                        logs.map((log, index) => {
                            const { date, time } = formatDateTime(log.created_at);
                            const userName = log.first_name
                                ? `${log.first_name} ${log.last_name || ''}`.trim()
                                : (log.user_id ? `User #${log.user_id}` : 'System');
                            let details = log.details || '';
                            try {
                                const p = JSON.parse(log.details);
                                if (typeof p === 'object') {
                                    details = Object.entries(p)
                                        .slice(0, 3)
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(' · ');
                                }
                            } catch (e) { /* string details — fine */ }

                            const isNew = newLogIds.has(log.id);
                            const moduleColor = getModuleColor(log.module);
                            const actionIcon = getActionIcon(log.action);
                            const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

                            return (
                                <div className={`activity-row${isNew ? ' new-live' : ''}`} key={log.id || index}>
                                    {/* User */}
                                    <div className="user-col" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: `hsl(${(userName.length * 37) % 360}, 60%, 55%)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: '700', fontSize: '13px', flexShrink: 0,
                                        }}>
                                            {initials}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>{userName}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{log.role_name || 'Admin'}</div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="action-col">
                                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>
                                            <span style={{ marginRight: '5px' }}>{actionIcon}</span>
                                            {log.action}
                                        </div>
                                    </div>

                                    {/* Module */}
                                    <div className="module-col">
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '12px', fontSize: '11px',
                                            fontWeight: '600', background: moduleColor + '18',
                                            color: moduleColor, border: `1px solid ${moduleColor}40`,
                                        }}>
                                            {log.module || 'General'}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="details-col" style={{ fontSize: '12px', color: '#64748b', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {details || '—'}
                                    </div>

                                    {/* Timestamp */}
                                    <div className="timestamp-col">
                                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>{date}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{time}</div>
                                        {isNew && (
                                            <span style={{
                                                fontSize: '10px', fontWeight: '700', color: '#2563eb',
                                                background: '#eff6ff', padding: '1px 6px', borderRadius: '8px',
                                                marginTop: '2px', display: 'inline-block',
                                            }}>● LIVE</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* ── Footer / Pagination ── */}
                    <div className="table-footer">
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                            Showing {logs.length === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                        </span>
                        <div className="pagination">
                            <span
                                className={`page-arrow ${pagination.page === 1 ? 'disabled' : ''}`}
                                onClick={() => pagination.page > 1 && setPagination(p => ({ ...p, page: p.page - 1 }))}
                            >&lt;</span>
                            {getPageNumbers().map((page, idx) => (
                                <span
                                    key={idx}
                                    className={`page-item ${pagination.page === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                                    onClick={() => typeof page === 'number' && setPagination(p => ({ ...p, page }))}
                                >{page}</span>
                            ))}
                            <span
                                className={`page-arrow ${pagination.page >= totalPages ? 'disabled' : ''}`}
                                onClick={() => pagination.page < totalPages && setPagination(p => ({ ...p, page: p.page + 1 }))}
                            >&gt;</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ActivityLogs;
