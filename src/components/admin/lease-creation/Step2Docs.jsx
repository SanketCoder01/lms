import React from 'react';

const Step2Docs = ({ formData, setFormData, handleFileChange }) => {
    return (
        <div className="form-section">
            <h3>Step 2: Docs Execution & Details</h3>
            <p className="helper-text">Please provide details and upload/attach execution documents.</p>

            {/* LOI Details */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Letter of Intent (LOI)</h4>
            <div className="form-row">
                <div className="form-group">
                    <label>LOI Date</label>
                    <input
                        type="date"
                        value={formData.loi_date || ''}
                        onChange={(e) => setFormData({ ...formData, loi_date: e.target.value })}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Upload LOI</label>
                    <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'loi_document')}
                        className="form-control"
                    />
                </div>
            </div>

            {/* Security Deposit Info (Record/Reference) */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Security Deposit</h4>
            <div className="form-row">
                <div className="form-group">
                    <label>Deposit Amount (INR)</label>
                    <input
                        type="number"
                        placeholder="e.g. 500000"
                        className="form-control"
                        value={formData.deposit_amount || ''}
                        onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                    />
                </div>
            </div>

            {/* Lease Agreement */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Lease Agreement</h4>
            <div className="form-row">
                <div className="form-group">
                    <label>Agreement Date</label>
                    <input
                        type="date"
                        value={formData.agreement_date || ''}
                        onChange={(e) => setFormData({ ...formData, agreement_date: e.target.value })}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Upload Agreement</label>
                    <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'agreement_document')}
                        className="form-control"
                    />
                </div>
            </div>



            {/* Lease Registration */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Lease Registration</h4>
            <div className="form-row">
                <div className="form-group">
                    <label>Registration Date</label>
                    <input
                        type="date"
                        value={formData.registration_date || ''}
                        onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Upload Approved Doc</label>
                    <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'registration_document')}
                        className="form-control"
                    />
                </div>
            </div>
        </div>
    );
};

export default Step2Docs;
