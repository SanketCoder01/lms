import React from 'react';

const Step5DocsExecute = ({ formData, setFormData, handleFileChange, files }) => {

    const fmtDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const FileBadge = ({ file }) => file ? (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', background: '#dcfce7', color: '#166534',
            borderRadius: 4, fontSize: 12, fontWeight: 500, marginTop: 6
        }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </svg>
            {file.name}
        </div>
    ) : null;

    return (
        <div className="form-section">
            <h3>Step 5: Docs Execution &amp; Details</h3>

            {/* ── Letter of Intent (LOI) ── */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: 5 }}>
                Letter of Intent (LOI)
            </h4>
            <div className="form-row" style={{ gap: 12 }}>
                <div className="form-group" style={{ flex: '0 0 200px' }}>
                    <label>LOI Date</label>
                    <input
                        type="date"
                        value={formData.loi_date || ''}
                        onChange={(e) => setFormData({ ...formData, loi_date: e.target.value })}
                        className="form-control"
                        style={{ fontSize: 13 }}
                    />
                    {formData.loi_date && (
                        <small style={{ color: '#059669', fontSize: 11, marginTop: 4, display: 'block' }}>
                            {fmtDate(formData.loi_date)}
                        </small>
                    )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Upload LOI Document</label>
                    <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'loi_document')}
                        className="form-control"
                        accept=".pdf,.doc,.docx"
                    />
                    <FileBadge file={files?.loi_document} />
                </div>
            </div>

            {/* ── Lease Agreement → counts as Leasing Executed ── */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: 5 }}>
                Lease Agreement
            </h4>
            <div className="form-row" style={{ gap: 12 }}>
                <div className="form-group" style={{ flex: '0 0 200px' }}>
                    <label>Agreement Date</label>
                    <input
                        type="date"
                        value={formData.agreement_date || ''}
                        onChange={(e) => setFormData({ ...formData, agreement_date: e.target.value })}
                        className="form-control"
                        style={{ fontSize: 13 }}
                    />
                    {formData.agreement_date && (
                        <small style={{ color: '#059669', fontSize: 11, marginTop: 4, display: 'block' }}>
                            {fmtDate(formData.agreement_date)}
                        </small>
                    )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Upload Agreement</label>
                    <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'agreement_document')}
                        className="form-control"
                        accept=".pdf,.doc,.docx"
                    />
                    <FileBadge file={files?.agreement_document} />
                </div>
            </div>

            {/* ── Lease Registration → counts as Leased Registered ── */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: 5 }}>
                Lease Registration
            </h4>
            <div className="form-row" style={{ gap: 12 }}>
                <div className="form-group" style={{ flex: '0 0 200px' }}>
                    <label>Registration Date</label>
                    <input
                        type="date"
                        value={formData.registration_date || ''}
                        onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                        className="form-control"
                        style={{ fontSize: 13 }}
                    />
                    {formData.registration_date && (
                        <small style={{ color: '#059669', fontSize: 11, marginTop: 4, display: 'block' }}>
                            {fmtDate(formData.registration_date)}
                        </small>
                    )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Upload Registered Agreement</label>
                    <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'registration_document')}
                        className="form-control"
                        accept=".pdf,.doc,.docx"
                    />
                    <FileBadge file={files?.registration_document} />
                </div>
            </div>
        </div>
    );
};

export default Step5DocsExecute;
