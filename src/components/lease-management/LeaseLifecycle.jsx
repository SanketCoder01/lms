import React, { useEffect, useState } from "react";
import RepSidebar from "../management-rep/RepSidebar";
import "./leaseManagement.css";
import {
  getPendingLeases,
  approveLease,
} from "../../services/api";

const LeaseLifecycle = () => {
  const [leases, setLeases] = useState([]);

  const [message, setMessage] = useState({ text: '', type: '' });

  const loadLeases = () => {
    getPendingLeases()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setLeases(data);
      })
      .catch(() => setMessage({ text: "Failed to load pending leases", type: 'error' }));
  };

  useEffect(() => {
    loadLeases();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveLease(id);
      setMessage({ text: 'Lease approved successfully!', type: 'success' });
      loadLeases();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: "Failed to approve lease", type: 'error' });
    }
  };

  return (
    <div className="dashboard-layout">
      <RepSidebar />

      <div className="lease-dashboard-content">
        <h2>Pending Lease Approvals</h2>

        {message.text && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#166534' : '#991b1b'}`,
            color: message.type === 'success' ? '#166534' : '#991b1b',
            fontWeight: '500'
          }}>
            {message.text}
          </div>
        )}

        {leases.map((lease) => (
          <div className="approval-card" key={lease.id}>
            <h4>{lease.company_name || lease.tenant?.company_name || "Unknown Tenant"}</h4>
            <p>Rent: ₹{lease.monthly_rent}</p>
            <p>
              Duration: {lease.lease_start} → {lease.lease_end}
            </p>

            <button
              className="btn-approve"
              onClick={() => handleApprove(lease.id)}
            >
              Approve
            </button>
          </div>
        ))}

        {leases.length === 0 && <p>No pending leases</p>}
      </div>
    </div>
  );
};

export default LeaseLifecycle;
