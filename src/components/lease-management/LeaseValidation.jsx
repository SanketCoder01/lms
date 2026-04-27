import React, { useEffect, useState } from "react";
import RepSidebar from "../management-rep/RepSidebar";
import "./leaseManagement.css";
import { getExpiringLeases } from "../../services/api";

const LeaseValidation = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getExpiringLeases()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setRows(data);
      })
      .catch(() => alert("Failed to load lease validation data"));
  }, []);

  return (
    <div className="dashboard-layout">
      <RepSidebar />

      <div className="lease-dashboard-content">
        <h2>Lease Expiry Report</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Rent</th>
              <th>Expiry</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.company_name || row.tenant?.company_name || "N/A"}</td>
                <td>₹{row.monthly_rent}</td>
                <td>{row.lease_end}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && <p>No data found</p>}
      </div>
    </div>
  );
};

export default LeaseValidation;
