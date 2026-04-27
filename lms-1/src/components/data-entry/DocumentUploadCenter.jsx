import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
// import { getProjects, unitAPI } from '../../services/api';
import './DataEntryDashboard.css';

const DocumentUploadCenter = () => {
    const navigate = useNavigate();
    const [entityType, setEntityType] = useState('Unit');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedContext, setSelectedContext] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [files, setFiles] = useState([
        { name: 'Lease_Agreement_U402.pdf', size: '2.4 MB', status: 'Ready', type: 'pdf' },
        { name: 'Unit_402_Kitchen_View.jpg', size: '850 KB', status: 'Uploading', progress: 65, type: 'img' },
        { name: 'Maintenance_Record_Q3.docx', size: '1.2 MB', status: 'Ready', type: 'doc' }
    ]);

    // Mock Search
    useEffect(() => {
        if (searchQuery.length > 2) {
            // Simulate API search
            setSearchResults([
                { id: 'u402', title: 'Unit 402', subtitle: 'Azure Bay Heights' },
                { id: 'u405', title: 'Unit 405', subtitle: 'Azure Bay Heights' }
            ]);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleSelectResult = (result) => {
        setSelectedContext(result);
        setSearchQuery(result.title + ' - ' + result.subtitle);
        setSearchResults([]);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        // Handle file drop logic here (simplified)
        alert("Files dropped! (Simulation)");
    };

    const handleUpload = () => {
        alert("Processing upload queue...");
        // API integration would go here
        navigate('/data-entry/dashboard');
    };

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <button onClick={() => navigate('/data-entry/dashboard')} className="back-link">
                        ← Back to Dashboard
                    </button>
                    <div style={{ color: '#64748b' }}>Data Entry / <strong>Document Upload Center</strong></div>
                    <div className="search-wrapper" style={{ opacity: 0 }}>
                        <input type="text" />
                    </div>
                </header>

                <div>
                    <h1>Upload Documents Center</h1>
                    <p style={{ color: '#64748b', marginBottom: '32px' }}>Manage and ingest administrative and operational documents for your property portfolio.</p>
                </div>

                {/* Step 1: Select Context */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 className="step-header"><span className="step-num">1</span> Select Target Context</h3>
                    <div className="form-section-card" style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
                        <div style={{ width: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Entity Type</label>
                            <select
                                className="form-select"
                                value={entityType}
                                onChange={(e) => setEntityType(e.target.value)}
                            >
                                <option>Unit</option>
                                <option>Project</option>
                                <option>Tenant</option>
                            </select>
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Search Specific Record</label>
                            <div className="search-input-group" style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', background: 'white' }}>
                                <span style={{ color: '#94a3b8', marginRight: '8px' }}>🔍</span>
                                <input
                                    type="text"
                                    placeholder={`Search ${entityType} ID or Name...`}
                                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {selectedContext && <span className="badge-active">ACTIVE CONTEXT</span>}
                            </div>
                            {searchResults.length > 0 && (
                                <div className="search-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                    {searchResults.map(res => (
                                        <div
                                            key={res.id}
                                            style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                            onClick={() => handleSelectResult(res)}
                                            onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseOut={e => e.currentTarget.style.background = 'white'}
                                        >
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{res.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{res.subtitle}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step 2: Drop Documents */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 className="step-header"><span className="step-num">2</span> Drop Documents</h3>
                    <div
                        className="upload-dropzone"
                        style={{ background: 'white', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '48px', textAlign: 'center' }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                    >
                        <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '50%', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>☁️</div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Drag and drop documents here</h4>
                        <p style={{ color: '#64748b', marginBottom: '0' }}>or <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>browse files</span> from your computer</p>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>Accepted: PDF, JPG, PNG, DOCX (Max 20MB)</div>
                </div>

                {/* Step 3: Upload Queue */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 className="step-header"><span className="step-num">3</span> Upload Queue ({files.length} files)</h3>
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Document</th>
                                    <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Size</th>
                                    <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Status</th>
                                    <th style={{ padding: '16px', textAlign: 'right', color: '#64748b', fontSize: '0.85rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map((file, idx) => (
                                    <tr key={idx} style={{ borderBottom: idx < files.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    background: file.type === 'pdf' ? '#fee2e2' : file.type === 'img' ? '#e0f2fe' : '#dcfce7',
                                                    color: file.type === 'pdf' ? '#dc2626' : file.type === 'img' ? '#0284c7' : '#166534',
                                                    padding: '8px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', width: '36px', textAlign: 'center'
                                                }}>
                                                    {file.type.toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: '500', color: '#334155' }}>{file.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', color: '#64748b' }}>{file.size}</td>
                                        <td style={{ padding: '16px' }}>
                                            {file.status === 'Uploading' ? (
                                                <div style={{ width: '120px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: '#0284c7', fontWeight: '600' }}>
                                                        <span>Uploading</span>
                                                        <span>{file.progress}%</span>
                                                    </div>
                                                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px' }}>
                                                        <div style={{ width: `${file.progress}%`, height: '100%', background: '#0ea5e9', borderRadius: '2px' }}></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '0.9rem', fontWeight: '500' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>•</span> Ready
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '600' }}>×</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="footer-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Queue Total: <strong>4.45 MB</strong> &nbsp; Destination: <span style={{ color: '#2563eb', fontWeight: '500' }}>{selectedContext ? selectedContext.title : 'None Selected'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-secondary" onClick={() => navigate('/data-entry/dashboard')}>Discard Changes</button>
                        <button className="btn-primary" onClick={handleUpload}>Confirm & Process Upload</button>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default DocumentUploadCenter;
