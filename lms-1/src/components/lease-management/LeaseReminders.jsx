import React, { useState } from "react";
import LeaseManagerLayout from './LeaseManagerLayout';
import "./leaseManagerNew.css";
import { leaseAPI } from "../../services/api";

const LeaseReminders = () => {
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [recipientGroup, setRecipientGroup] = useState('Tenant');
  const [channel, setChannel] = useState('Email');
  const [templateId, setTemplateId] = useState('');
  const [messageContent, setMessageContent] = useState('Action Required: Your Lease for {{property_name}} is Expiring Soon\n\nDear {{tenant_name}},\n\nThis is a formal reminder that your lease agreement for the property at {{property_address}} is set to expire on {{lease_end_date}}.\n\nIf you wish to renew your lease, please log into your portal and submit a renewal request by {{deadline}}. Failure to do so may result in the property being listed for rent.');
  const [uiMessage, setUiMessage] = useState({ text: '', type: '' });

  // Mocks
  const reminders = [
    { id: 1, type: 'Lease Expiry', recipient: 'John Doe', due: 'Oct 24, 2023', status: 'Urgent', action: 'Review' },
    { id: 2, type: 'Renewal Notice', recipient: 'Sarah Smith', due: 'Oct 28, 2023', status: 'Scheduled', action: 'Edit' },
    { id: 3, type: 'Escalation', recipient: 'Building Mgt', due: 'Nov 01, 2023', status: 'Pending', action: 'Dismiss' },
  ];

  const handleSendReminder = async () => {
    try {
      await leaseAPI.sendLeaseReminder({
        recipient_group: recipientGroup,
        channel,
        message: messageContent,
        lease_id: null // mocking generic
      });
      setShowModal(false);
      setUiMessage({ text: 'Reminder sent successfully!', type: 'success' });
      setTimeout(() => setUiMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error(error);
      setUiMessage({ text: 'Failed to send reminder.', type: 'error' });
      setShowModal(false);
    }
  };

  return (
    <LeaseManagerLayout>
      <div className="lease-dashboard-content">

        {/* Header */}
        <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Reminders</h1>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
          >
            + Send Manual Reminder
          </button>

        </div>

        {uiMessage.text && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: uiMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${uiMessage.type === 'success' ? '#166534' : '#991b1b'}`,
            color: uiMessage.type === 'success' ? '#166534' : '#991b1b',
            fontWeight: '500'
          }}>
            {uiMessage.text}
          </div>
        )}

        {/* Stats Row */}
        <div className="reminder-stats-row">
          <div className="reminder-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Pending Reminders</span>
              <span style={{ color: '#10b981' }}>✉</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>14</div>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>+2% from last week</div>
          </div>
          {/* ... other stats ... */}
          <div className="reminder-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Expiring Leases (30d)</span>
              <span style={{ color: '#f97316' }}>📅</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>8</div>
            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>↘ -1% from last month</div>
          </div>
          <div className="reminder-stat">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Unread Replies</span>
              <span style={{ color: '#3b82f6' }}>⚑</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>5</div>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>+3 new today</div>
          </div>
        </div>

        <div className="reminders-layout">

          {/* Left Column */}
          <div>
            {/* Automated Reminders Queue */}
            <div className="reminder-queue">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Automated Reminders Queue</h3>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</button>
              </div>

              <div className="queue-list">
                <div className="q-item" style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                  <span></span>
                  <span>Event Type</span>
                  <span>Recipient</span>
                  <span>Due Date</span>
                  <span>Status</span>
                </div>
                {reminders.map(r => (
                  <div className="q-item" key={r.id}>
                    <span style={{ fontSize: '16px' }}>{r.type === 'Lease Expiry' ? '⚠️' : r.type === 'Renewal Notice' ? '🔄' : '↑'}</span>
                    <div style={{ fontWeight: '600', color: '#334155' }}>{r.type}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>{r.recipient}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tenant • Unit 402</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>{r.due}</div>
                    <div><span className={`q-pill ${r.status === 'Urgent' ? 'q-urgent' : r.status === 'Scheduled' ? 'q-sched' : 'q-pending'}`}>{r.status}</span></div>
                    <div className="q-action">{r.action}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Communication Log - kept from previous but collapsed/simplified if needed */}
            <div className="reminder-queue">
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0' }}>Recent Communication Log</h3>
              <div className="log-item">
                <div className="log-icon email">✉</div>
                <div>
                  <div className="log-title">Email: Rental Increase Notice</div>
                  <div className="log-meta">Sent to Michael Chen (Tenant) • 2 hours ago</div>
                </div>
              </div>
              <div className="log-item">
                <div className="log-icon sms">💬</div>
                <div>
                  <div className="log-title">SMS: Maintenance Access Reminder</div>
                  <div className="log-meta">Sent to Unit 205 Tenants • Yesterday</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Calendar & Quick Compose (Mini) */}
          <div>
            <div className="compose-card">
              <h3 style={{ fontSize: '16px', margin: '0 0 16px 0', color: '#fff' }}>Quick Compose</h3>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', display: 'block' }}>Message Body</label>
              <textarea className="compose-input" style={{ height: '80px', resize: 'none' }} placeholder="Type your message here..."></textarea>
              <button className="send-btn-sm">Send Now</button>
            </div>

            <div className="calendar-widget">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontWeight: '700' }}>October 2023</span>
                <div><span style={{ fontSize: '12px', color: '#94a3b8' }}>‹ ›</span></div>
              </div>
              {/* Simplified Calendar Placeholder */}
              <div className="mini-calendar-grid">
                {Array.from({ length: 30 }, (_, i) => (
                  <div key={i} className={`cal-day ${i === 23 ? 'active' : ''}`}>{i + 1}</div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* SEND MANUAL REMINDER MODAL */}
      {
        showModal && (
          <div className="modal-overlay">
            <div className="modal-content large">
              <div className="modal-header">
                <h2>Send Manual Reminder</h2>
                <button onClick={() => setShowModal(false)} className="close-btn">×</button>
              </div>
              <p className="modal-subtitle">Communicate directly with lease stakeholders using professional templates.</p>

              <div className="form-group">
                <label>1. Select Recipient Group</label>
                <div className="toggle-group">
                  {['Tenant', 'Owner', 'Management'].map(g => (
                    <button
                      key={g}
                      className={`toggle-btn ${recipientGroup === g ? 'active' : ''}`}
                      onClick={() => setRecipientGroup(g)}
                    >
                      {g === 'Tenant' ? '👤' : g === 'Owner' ? '🏠' : '🏢'} {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>2. Message Template</label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select a template...</option>
                    <option value="expiry">Lease Expiry Warning</option>
                    <option value="renewal">Renewal Offer</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>Delivery Channel</label>
                  <div className="toggle-group small">
                    <button className={`toggle-btn ${channel === 'Email' ? 'active' : ''}`} onClick={() => setChannel('Email')}>✉ Email</button>
                    <button className={`toggle-btn ${channel === 'SMS' ? 'active' : ''}`} onClick={() => setChannel('SMS')}>💬 SMS</button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>3. Edit Message Content</label>
                <div className="rich-editor">
                  <input type="text" className="editor-subject" defaultValue="Action Required: Your Lease for {{property_name}} is Expiring Soon" />
                  <div className="editor-toolbar">
                    <span>B</span> <span>I</span> <span>Link</span> <span className="right">Markdown Enabled</span>
                  </div>
                  <textarea
                    className="editor-body"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                  ></textarea>
                  <div className="editor-footer">
                    <div className="tags">
                      <span>{`{{ tenant_name }}`}</span>
                      <span>{`{{ property_address }}`}</span>
                    </div>
                    <span className="credits">432 Characters • 1 Credit</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <span className="log-info">🕒 Logs to: Communication History</span>
                <div className="modal-actions">
                  <button onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
                  <button onClick={handleSendReminder} className="confirm-btn primary">Send Message ➤</button>
                </div>
              </div>
            </div>
          </div>

        )
      }
    </LeaseManagerLayout >
  );
};

export default LeaseReminders;
