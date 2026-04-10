import React from 'react';

const EscalationsSection = ({ escalations = [], loading }) => {
  // Default static data if no real data
  const defaultEscalations = [
    { id: "GF-08", tenant: "H&M India · Retail", detail: "15% · 3.60L to 4.14L/mo", days: 8, status: "Critical" },
    { id: "FC-03", tenant: "McDonald's · Food court", detail: "12/sqft · MG 1.80L to 1.92L", days: 14, status: "Critical" },
    { id: "SF-09", tenant: "Reliance Digital", detail: "10% · 2.40L to 2.64L/mo", days: 38, status: "Pending" },
    { id: "GF-06", tenant: "Lifestyle Stores", detail: "8/sqft · Rev-share MG revised", days: 52, status: "Pending" },
  ];

  const displayEscalations = escalations.length > 0 ? escalations : defaultEscalations;

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'critical': return { bg: '#fee2e2', text: '#991b1b' };
      case 'pending': return { bg: '#ffedd5', text: '#9a3412' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Upcoming escalations</h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Rent revision events in next 60 days</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {displayEscalations.map((e, i) => {
              const statusColor = getStatusColor(e.status);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', minWidth: '50px' }}>{e.id}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: '#0f172a', margin: 0 }}>{e.tenant}</p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{e.detail}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{e.days} days</span>
                    <span style={{ 
                      fontSize: '12px', 
                      padding: '2px 8px', 
                      borderRadius: '9999px', 
                      fontWeight: 500,
                      backgroundColor: statusColor.bg,
                      color: statusColor.text
                    }}>{e.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Escalation impact callout */}
          <div style={{ 
            marginTop: '16px', 
            backgroundColor: '#f0fdf4', 
            border: '1px solid #bbf7d0', 
            borderRadius: '6px', 
            padding: '12px' 
          }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#166534', margin: 0 }}>Escalation impact</p>
            <p style={{ fontSize: '12px', color: '#15803d', margin: '4px 0 0' }}>
              Confirmed escalations will add ~<strong>5.1L/mo</strong> to actual rent post confirmation
            </p>
          </div>

          <div style={{ marginTop: '16px' }}>
            <a href="/admin/leases" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>
              Manage escalations
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default EscalationsSection;
