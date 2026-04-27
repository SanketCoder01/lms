import React from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import './DataEntryDashboard.css';

const DataEntrySelection = () => {
    const navigate = useNavigate();

    const categories = [
        {
            id: 'project',
            title: 'Project Data',
            description: 'Manage property details, physical addresses, and site-level technical specifications.',
            count: '124 Properties',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            ),
            path: '/data-entry/add-project-data'
        },
        {
            id: 'unit',
            title: 'Unit Data',
            description: 'Configure individual units, square footage, and residential or commercial floor plans.',
            count: '2,850 Units',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            ),
            path: '/data-entry/add-unit-data'
        },
        {
            id: 'master',
            title: 'Master Data',
            description: 'Manage comprehensive records for individuals and companies (Owners & Tenants) in one place.',
            count: 'All Parties',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            ),
            path: '/data-entry/add-master-data'
        },
        {
            id: 'ownership',
            title: 'Ownership Mapping',
            description: 'Link Owners to their Units and manage ownership history and assignments.',
            count: 'Ownership Records',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
            ),
            path: '/data-entry/add-ownership-data'
        },
        {
            id: 'lease',
            title: 'Lease Data',
            description: 'Input lease terms, rent escalation clauses, renewal options, and critical compliance dates.',
            count: '12 Pending Reviews',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            ),
            path: '/data-entry/add-lease-data'
        },
        {
            id: 'uploads',
            title: 'Upload Documents',
            description: 'Bulk upload architectural blueprints, signed lease PDFs, and operational Excel sheets for processing.',
            count: 'Supports PDF, XLSX, CAD',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            ),
            path: '/data-entry/bulk-upload'
        }
    ];

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header" style={{ marginBottom: '40px' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                            Admin Portal / <span style={{ color: '#1e293b', fontWeight: '500' }}>Data Entry</span>
                        </div>
                        <h1>Data Entry Categories</h1>
                        <p style={{ color: '#64748b' }}>Select a functional module to manage and update system records for your portfolio.</p>
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn notification-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </button>
                    </div>
                </header>

                <div className="search-bar" style={{ marginBottom: '32px' }}>
                    <input
                        type="text"
                        placeholder="Quick filter categories..."
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#fff'
                        }}
                    />
                </div>

                <div className="cards-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {categories.map(cat => (
                        <div
                            key={cat.id}
                            onClick={() => navigate(cat.path)}
                            style={{
                                background: 'white',
                                padding: '24px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}
                            onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '8px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px'
                            }}>
                                {cat.icon}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>{cat.title}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', flex: 1, marginBottom: '24px' }}>
                                {cat.description}
                            </p>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>
                                {cat.count}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default DataEntrySelection;
