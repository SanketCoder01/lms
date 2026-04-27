import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { managementAPI, leaseAPI } from '../../services/api';
import './dashboard.css';

const AdminNotifications = () => {
    // const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const [notifRes, alertRes] = await Promise.all([
                managementAPI.getNotifications({ type: filter === 'All' ? null : filter }),
                leaseAPI.getNeedAttentionLeases()
            ]);

            const dbNotifications = notifRes.data.data || notifRes.data || [];

            // Map alerts to notification structure
            const alerts = (alertRes.data || []).map(alert => ({
                id: `alert-${alert.id}`,
                title: `${alert.type}: ${alert.tenant_name}`,
                text: `Lease update required for ${alert.tenant_name}. Due on ${new Date(alert.date).toLocaleDateString()}. Status: ${alert.status}`,
                type: 'urgent',
                createdAt: new Date().toISOString(),
                read: false,
                isSystemAlert: true
            }));

            // Combine and sort
            const all = [...alerts, ...dbNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setNotifications(all);

        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await leaseAPI.markAllNotificationsRead();
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark read");
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm("Are you sure you want to clear all notifications?")) {
            try {
                await leaseAPI.deleteAllNotifications();
                setNotifications([]);
            } catch (error) {
                console.error("Failed to delete notifications");
            }
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'urgent': return <span style={{ color: '#ef4444' }}>●</span>; // Red
            case 'success': return <span style={{ color: '#22c55e' }}>✓</span>; // Green
            case 'info': return <span style={{ color: '#3b82f6' }}>i</span>; // Blue
            default: return <span style={{ color: '#64748b' }}>•</span>; // Gray
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-left">
                        <div className="breadcrumb">
                            <Link to="/admin/dashboard">HOME</Link> &gt; <span className="active">NOTIFICATIONS</span>
                        </div>
                        <h1>System Notifications</h1>
                        <p>Updates on frontend, backend, and system integration status.</p>
                    </div>
                    <div className="header-actions">
                        <button className="white-btn" onClick={handleMarkAllRead}>Mark all read</button>
                        <button className="white-btn text-red" onClick={handleDeleteAll} style={{ color: '#ef4444' }}>Clear All</button>
                    </div>
                </header>

                <div className="content-card">
                    {/* Filters */}
                    <div className="tabs-container" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
                        {['All', 'Urgent', 'Info', 'Success', 'Error'].map(tab => (
                            <button
                                key={tab}
                                className={`tab-btn ${filter === tab ? 'active' : ''}`}
                                onClick={() => setFilter(tab)}
                                style={{
                                    padding: '12px 20px',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: filter === tab ? '2px solid #2e66ff' : '2px solid transparent',
                                    fontWeight: filter === tab ? 600 : 400,
                                    color: filter === tab ? '#2e66ff' : '#64748b',
                                    cursor: 'pointer'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="notifications-list">
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading notifications...</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                <div style={{ marginBottom: '16px', fontSize: '2rem' }}>bell_slash</div>
                                <p>No notifications found.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {notifications.map(notif => (
                                    <div key={notif.id} className="notification-card" style={{
                                        padding: '16px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '16px',
                                        backgroundColor: notif.read ? '#f8fafc' : '#fff',
                                        transition: 'all 0.2s',
                                        cursor: 'default'
                                    }}>
                                        <div style={{
                                            width: '40px', height: '40px',
                                            borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: '#f1f5f9',
                                            fontSize: '1.2rem'
                                        }}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <h4 style={{ margin: 0, color: '#1e293b', fontWeight: 600 }}>{notif.title || notif.text}</h4>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>
                                                {notif.text && notif.title ? notif.text : (notif.message || notif.text)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminNotifications;
