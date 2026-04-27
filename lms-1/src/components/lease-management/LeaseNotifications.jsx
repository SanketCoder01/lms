import React, { useEffect, useState } from "react";
import LeaseManagerLayout from "./LeaseManagerLayout";
import { leaseAPI } from "../../services/api";
import "./leaseManagerNew.css";

const LeaseNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    // eslint-disable-next-line
    const [loading, setLoading] = useState(true);

    // Mock initial data to match the screenshot
    const mockNotifications = [
        {
            id: 1,
            type: 'urgent',
            title: 'Urgent: Action Required on Lease L-2024-8811',
            message: 'Financial documentation for TechFlow Systems • Unit 402 is missing a signature. Please re-upload before the lease expires in 48 hours.',
            time: '12 minutes ago',
            action: 'View Document',
            dismiss: true
        },
        {
            id: 2,
            type: 'info',
            title: 'Scheduled Maintenance: Sunday, Oct 27',
            message: 'The Lease Management portal will be offline for routine maintenance from 02:00 AM to 04:00 AM EST. Reports generation may be delayed.',
            time: '2 hours ago'
        },
        {
            id: 3,
            type: 'success',
            title: 'Lease Approved: L-2024-8791',
            message: 'Tenant: Heritage Antiques • Suite 128 has been successfully approved by Marcus Reed.',
            time: '4 hours ago'
        },
        {
            id: 4,
            type: 'review',
            title: 'New Review Request',
            message: 'Sarah Chen has submitted a new lease application for Urban Studio • Unit 105. Estimated review time: 4.2 hours.',
            time: 'Yesterday, 4:45 PM'
        },
        {
            id: 5,
            type: 'error',
            title: 'Lease Rejected: L-2024-8792',
            message: 'Reason: Incomplete tenant disclosure. Please notify the property manager for Heritage Antiques.',
            time: 'Oct 24, 2:30 PM'
        }
    ];

    useEffect(() => {
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await leaseAPI.getLeaseNotifications();
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                setNotifications(res.data);
            } else {
                setNotifications(mockNotifications);
            }
        } catch (error) {
            console.error("Failed to load notifications", error);
            setNotifications(mockNotifications);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await leaseAPI.markAllNotificationsRead();
            // Optimistically update or re-fetch
            const updated = notifications.map(n => ({ ...n, read: true }));
            setNotifications(updated);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm("Are you sure you want to delete all notifications?")) {
            try {
                await leaseAPI.deleteAllNotifications();
                setNotifications([]);
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleDismiss = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Removed unused getIcon function to fix lint error if not used in JSX


    return (
        <LeaseManagerLayout>
            <div className="lease-dashboard-content" style={{ maxWidth: '1000px', paddingBottom: '60px' }}>
                <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Notifications Center</h1>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>Manage your lease lifecycle alerts and system updates.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#64748b' }}>✓</span> Mark all as read
                        </button>
                        <button onClick={handleDeleteAll} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#ef4444' }}>🗑</span> Delete all
                        </button>
                    </div>
                </div>

                <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {notifications.map((n) => (
                        <div key={n.id} className="notification-card" style={{
                            background: 'white',
                            padding: '24px',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'flex-start',
                            position: 'relative'
                        }}>
                            {/* Icon */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                flexShrink: 0,
                                background: n.type === 'urgent' ? '#fee2e2' : n.type === 'success' ? '#dcfce7' : n.type === 'info' ? '#dbeafe' : n.type === 'error' ? '#fee2e2' : '#f1f5f9',
                                color: n.type === 'urgent' ? '#ef4444' : n.type === 'success' ? '#16a34a' : n.type === 'info' ? '#2563eb' : n.type === 'error' ? '#ef4444' : '#64748b'
                            }}>
                                {n.type === 'urgent' ? '!' : n.type === 'success' ? '✓' : n.type === 'error' ? '×' : n.type === 'info' ? 'i' : '📄'}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{n.title}</h3>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{n.time}</span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: 0, paddingRight: '40px' }}>
                                    {n.message}
                                </p>

                                {(n.action || n.dismiss) && (
                                    <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        {n.action && (
                                            <button style={{
                                                background: '#2563eb',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                fontWeight: '600',
                                                fontSize: '13px',
                                                cursor: 'pointer'
                                            }}>
                                                {n.action}
                                            </button>
                                        )}
                                        {n.dismiss && (
                                            <button
                                                onClick={() => handleDismiss(n.id)}
                                                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Dismiss
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {notifications.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                            <p>No new notifications.</p>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        Load older notifications ▾
                    </button>
                </div>

            </div>
        </LeaseManagerLayout>
    );
};

export default LeaseNotifications;
