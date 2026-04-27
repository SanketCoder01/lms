import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RepSidebar from "./RepSidebar";
import { managementAPI } from "../../services/api";
import "./Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await managementAPI.getNotifications();
      const list = res.data.data || res.data || [];
      const mappedList = Array.isArray(list) ? list.map(n => ({ ...n, read: n.read || false })) : [];
      setNotifications(mappedList);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      // Fallback empty
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    // Check if API endpoint exists for single read, otherwise this is optimistic
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    return n.type === activeTab || n.category === activeTab;
  });

  const getRelativeTime = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="dashboard-container">
      <RepSidebar />
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <div className="breadcrumb">
              <Link to="/management/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>HOME</Link> &gt; <span className="active">NOTIFICATIONS</span>
            </div>
            <h1>Notifications</h1>
            <p>Stay updated with property alerts and system messages.</p>
          </div>
          <button className="white-btn" onClick={markAllAsRead}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Mark all as read
          </button>
        </header>

        <div className="content-card">
          <div className="notifications-tabs">
            <div
              className={`tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All
            </div>
            <div
              className={`tab ${activeTab === "lease_alert" ? "active" : ""}`}
              onClick={() => setActiveTab("lease_alert")}
            >
              Lease alerts
            </div>
            <div
              className={`tab ${activeTab === "escalation" ? "active" : ""}`}
              onClick={() => setActiveTab("escalation")}
            >
              Escalations
            </div>
            <div
              className={`tab ${activeTab === "expiry" ? "active" : ""}`}
              onClick={() => setActiveTab("expiry")}
            >
              Expiries
            </div>
            <div
              className={`tab ${activeTab === "system" ? "active" : ""}`}
              onClick={() => setActiveTab("system")}
            >
              System alerts
            </div>
          </div>

          <div className="notifications-list">
            {loading && (
              <div className="empty-state">Loading notifications...</div>
            )}
            {!loading && filteredNotifications.length === 0 && (
              <div className="empty-state">
                <div className="icon-circle-large">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </div>
                <h3>No notifications</h3>
                <p>You're all caught up! Check back later for updates.</p>
              </div>
            )}
            {!loading && filteredNotifications.map((item) => (
              <div className={`notification-item ${!item.read ? 'unread' : ''}`} key={item.id}>
                <div className="notification-status-indicator"></div>
                <div className="notification-content">
                  <div className="notification-header">
                    <span className="notification-text">{item.title || item.text || item.message}</span>
                    <span className="notification-time">{getRelativeTime(item.date || item.createdAt)}</span>
                  </div>
                  <div className="notification-body">
                    {item.description || item.body || (item.title ? item.message : '')}
                  </div>
                </div>
                <div className="notification-actions">
                  {!item.read && (
                    <button className="action-link" onClick={() => markAsRead(item.id)}>
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
