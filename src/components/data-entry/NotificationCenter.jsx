import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
// import { managementAPI } from '../../services/api'; // Using managementAPI for notifications
import './DataEntryDashboard.css';

const NotificationCenter = () => {
    // const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All');
    const [notifications, setNotifications] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch notifications
        // In a real app, we would query the backend. For now, we might simulate or use a mock if the endpoint isn't fully ready with data.
        const fetchNotifications = async () => {
            try {
                // const res = await managementAPI.getNotifications();
                // setNotifications(res.data || []);

                // MOCK DATA for Visual Verification matching the image
                setNotifications([
                    {
                        id: 1,
                        type: 'project',
                        title: 'Project Approved',
                        message: '"Evergreen Terrace" has been approved by the planning committee. Status updated to Active.',
                        time: '2 min ago',
                        read: false,
                        date: 'Today'
                    },
                    {
                        id: 2,
                        type: 'comment',
                        title: 'New Comment',
                        message: 'Michael Scott commented on "Sunset Villas": "Please review the budget for Phase 2."',
                        time: '1 hour ago',
                        read: false,
                        date: 'Today'
                    },
                    {
                        id: 3,
                        type: 'system',
                        title: 'System Maintenance',
                        message: 'The dashboard will be unavailable on Sunday, Oct 29, between 02:00 and 04:00 AM UTC.',
                        time: '23h ago',
                        read: true,
                        date: 'Yesterday'
                    },
                    {
                        id: 4,
                        type: 'project',
                        title: 'Project Rejected',
                        message: 'Submission for "Maple Gardens" was rejected due to missing environmental clearance docs.',
                        time: 'Yesterday, 4:12 PM',
                        read: true,
                        date: 'Yesterday'
                    },
                    {
                        id: 5,
                        type: 'system',
                        title: 'Team Member Added',
                        message: 'Sarah Jenkins has been added to the project "Oakwood Heights".',
                        time: 'Oct 24, 2023',
                        read: true,
                        date: 'Older'
                    }
                ]);
            } catch (err) {
                console.error("Failed to load notifications", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Projects') return n.type === 'project';
        if (activeTab === 'Comments') return n.type === 'comment';
        if (activeTab === 'System') return n.type === 'system';
        return true;
    });

    // Group by Date for display (Today, Yesterday, Older)
    const groupedNotifications = {
        Today: filteredNotifications.filter(n => n.date === 'Today'),
        Yesterday: filteredNotifications.filter(n => n.date === 'Yesterday'),
        Older: filteredNotifications.filter(n => n.date === 'Older')
    };

    const getIcon = (type, title) => {
        if (title.includes('Approved')) return <div className="icon-circle success">✓</div>;
        if (title.includes('Rejected')) return <div className="icon-circle danger">✕</div>;
        if (type === 'comment') return <div className="icon-circle primary">💬</div>;
        if (type === 'system' && title.includes('Maintenance')) return <div className="icon-circle warning">⚠️</div>;
        if (type === 'system') return <div className="icon-circle neutral">👥</div>;
        return <div className="icon-circle neutral">ℹ️</div>;
    };

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h1>Notification Center</h1>
                    </div>
                    <div className="search-wrapper">
                        <input type="text" placeholder="Search notifications..." className="search-input" />
                        <button className="icon-btn">🔔<span className="dot"></span></button>
                    </div>
                </header>

                <div className="notification-tabs">
                    {['All', 'Projects', 'Comments', 'System'].map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                    <button className="text-btn ms-auto">✓ Mark all as read</button>
                </div>

                <div className="notifications-list">
                    {['Today', 'Yesterday', 'Older'].map(group => {
                        const items = groupedNotifications[group];
                        if (!items || items.length === 0) return null;

                        return (
                            <div key={group} className="notification-group">
                                <h3 className="group-title">{group}</h3>
                                {items.map(note => (
                                    <div key={note.id} className={`notification-item ${note.read ? 'read' : 'unread'}`}>
                                        <div className="note-icon-wrapper">
                                            {getIcon(note.type, note.title)}
                                        </div>
                                        <div className="note-content">
                                            <div className="note-header">
                                                <span className="note-title">{note.title}</span>
                                                <span className="note-time">{note.time}</span>
                                            </div>
                                            <p className="note-message">{note.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}

                    <div style={{ textAlign: 'center', marginTop: '32px' }}>
                        <button className="text-btn" style={{ fontSize: '0.9rem' }}>Load previous notifications</button>
                    </div>
                </div>

                <style jsx>{`
                    .notification-tabs {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 32px;
                        align-items: center;
                    }
                    .tab-btn {
                        padding: 8px 24px;
                        border-radius: 20px;
                        border: 1px solid #e2e8f0;
                        background: white;
                        color: #64748b;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .tab-btn.active {
                        background: #2563eb;
                        color: white;
                        border-color: #2563eb;
                    }
                    .ms-auto { margin-left: auto; }
                    .text-btn {
                        background: none;
                        border: none;
                        color: #2563eb;
                        font-weight: 600;
                        cursor: pointer;
                    }
                    
                    .group-title {
                        font-size: 0.85rem;
                        color: #94a3b8;
                        margin-bottom: 16px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .notification-item {
                        display: flex;
                        gap: 16px;
                        background: white;
                        padding: 20px;
                        border-radius: 12px;
                        margin-bottom: 16px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                        border: 1px solid #f1f5f9;
                        transition: transform 0.2s;
                    }
                    .notification-item:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 6px rgba(0,0,0,0.04);
                    }
                    .notification-item.unread {
                        border-left: 4px solid #2563eb;
                    }
                    .icon-circle {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.2rem;
                    }
                    .icon-circle.success { background: #dcfce7; color: #16a34a; }
                    .icon-circle.danger { background: #fee2e2; color: #dc2626; }
                    .icon-circle.primary { background: #dbeafe; color: #2563eb; }
                    .icon-circle.warning { background: #fef9c3; color: #ca8a04; }
                    .icon-circle.neutral { background: #f1f5f9; color: #64748b; }

                    .note-content { flex: 1; }
                    .note-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .note-title { font-weight: 600; color: #1e293b; font-size: 1rem; }
                    .note-time { font-size: 0.8rem; color: #94a3b8; }
                    .note-message { color: #64748b; font-size: 0.95rem; line-height: 1.5; }
                `}</style>
            </main>
        </div>
    );
};

export default NotificationCenter;
