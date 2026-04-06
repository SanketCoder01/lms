import React, { useEffect } from 'react';

const Step5DocsExecute = ({ formData, setFormData, handleFileChange, files }) => {

    // Issue 60: Auto-fill docs dates from previous step data
    useEffect(() => {
        setFormData(prev => {
            const updates = {};
            // If LOI date is blank but lease_start is set, default to lease_start
            if (!prev.loi_date && prev.lease_start) updates.loi_date = prev.lease_start;
            // If agreement_date is blank but loi_date is set, default to loi_date
            if (!prev.agreement_date && prev.loi_date) updates.agreement_date = prev.loi_date;
            if (Object.keys(updates).length === 0) return prev;
            return { ...prev, ...updates };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="form-section">
            <h3>Step 5: Docs Execution &amp; Details</h3>
            <p className="helper-text" style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                Attach execution documents. Dates are pre-filled from earlier steps where available — you can edit them.
            </p>

            {/* LOI Details */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Letter of Intent (LOI)</h4>
            <div className="form-row" style={{ gap: '12px' }}>
                <div className="form-group" style={{ flex: '0 0 200px' }}>
                    <label>LOI Date</label>
                    <input
                        type="date"
                        value={formData.loi_date || ''}
                        onChange={(e) => setFormData({ ...formData, loi_date: e.target.value })}
                        className="form-control"
                        style={{ fontSize: '13px' }}
                    />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Upload LOI Document</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                            type="file"
                            onChange={(e) => handleFileChange(e, 'loi_document')}
                            className="form-control"
                            accept=".pdf,.doc,.docx"
                        />
                        {files?.loi_document && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '12px', fontWeight: 500, alignSelf: 'flex-start' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                {files.loi_document.name}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lease Agreement */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Lease Agreement</h4>
            <div className="form-row" style={{ gap: '12px' }}>
                <div className="form-group" style={{ flex: '0 0 200px' }}>
                    <label>Agreement Date</label>
                    <input
                        type="date"
                        value={formData.agreement_date || ''}
                        onChange={(e) => setFormData({ ...formData, agreement_date: e.target.value })}
                        className="form-control"
                        style={{ fontSize: '13px' }}
                    />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Upload Agreement</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                            type="file"
                            onChange={(e) => handleFileChange(e, 'agreement_document')}
                            className="form-control"
                            accept=".pdf,.doc,.docx"
                        />
                        {files?.agreement_document && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '12px', fontWeight: 500, alignSelf: 'flex-start' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                {files.agreement_document.name}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Issue 41: Deposit payment REMOVED from docs — it's in Step 3 (financial section) */}

            {/* Lease Registration */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Lease Registration</h4>
            <div className="form-row" style={{ gap: '12px' }}>
                <div className="form-group" style={{ flex: '0 0 200px' }}>
                    <label>Registration Date</label>
                    <input
                        type="date"
                        value={formData.registration_date || ''}
                        onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                        className="form-control"
                        style={{ fontSize: '13px' }}
                    />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Upload Registered Agreement</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                            type="file"
                            onChange={(e) => handleFileChange(e, 'registration_document')}
                            className="form-control"
                            accept=".pdf,.doc,.docx"
                        />
                        {files?.registration_document && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '12px', fontWeight: 500, alignSelf: 'flex-start' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                {files.registration_document.name}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary of key dates from previous steps */}
            {(formData.lease_start || formData.rent_commencement_date) && (
                <div style={{ marginTop: '24px', background: '#f8fafc', padding: '14px 18px', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}>
                    <h5 style={{ margin: '0 0 10px', color: '#334155', fontSize: '13px' }}>Key Dates Summary (from earlier steps)</h5>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#475569' }}>
                        {formData.lease_start && <div><strong>Lease Start:</strong> {formData.lease_start}</div>}
                        {formData.lease_end && <div><strong>Lease End:</strong> {formData.lease_end}</div>}
                        {formData.unit_handover_date && <div><strong>Handover:</strong> {formData.unit_handover_date}</div>}
                        {formData.rent_commencement_date && <div><strong>Rent Commencement:</strong> {formData.rent_commencement_date}</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Step5DocsExecute;
