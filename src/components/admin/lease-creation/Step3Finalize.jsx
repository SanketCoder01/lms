import React from 'react';

const Step3Finalize = ({ formData, setFormData, selectedProject, selectedUnit }) => {

    const [securityDepositRate, setSecurityDepositRate] = React.useState('');
    const [utilityDepositRate, setUtilityDepositRate] = React.useState('');

    React.useEffect(() => {
        if (selectedProject && selectedUnit) {
            const calcType = selectedProject.calculation_type || 'Super Area';
            let area = 0;
            if (calcType === 'Covered Area') area = parseFloat(selectedUnit.covered_area) || 0;
            else if (calcType === 'Carpet Area') area = parseFloat(selectedUnit.carpet_area) || 0;
            else area = parseFloat(selectedUnit.super_area) || 0;



            // Security Deposit
            if (securityDepositRate) {
                const total = parseFloat(securityDepositRate) * area;
                setFormData(prev => ({ ...prev, security_deposit: total > 0 ? total.toString() : '' }));
            }

            // Utility Deposit
            if (utilityDepositRate) {
                const total = parseFloat(utilityDepositRate) * area;
                setFormData(prev => ({ ...prev, utility_deposit: total > 0 ? total.toString() : '' }));
            }
        }
    }, [securityDepositRate, utilityDepositRate, selectedProject, selectedUnit, setFormData]);

    return (
        <div className="form-section">
            <h3>Step 3: Terms & Finalization</h3>

            {/* Dates & Tenure */}
            <div className="form-row date-row">
                <div className="form-group">
                    <label>Lease Start Date *</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.lease_start}
                        onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Lease End Date *</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.lease_end}
                        onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Rent Commencement *</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.rent_commencement_date}
                        onChange={(e) => setFormData({ ...formData, rent_commencement_date: e.target.value })}
                    />
                    <small className="help-text">Fit-out period ends here</small>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Fit-out Start Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.fitout_period_start}
                        onChange={(e) => setFormData({ ...formData, fitout_period_start: e.target.value })}
                    />
                    {formData.fitout_period_start && formData.lease_start &&
                        new Date(formData.fitout_period_start) < new Date(formData.lease_start) && (
                            <small className="error-text" style={{ color: '#e53e3e' }}>
                                Start date cannot be before Lease Start Date.
                            </small>
                        )}
                </div>
                <div className="form-group">
                    <label>Fit-out End Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.fitout_period_end}
                        onChange={(e) => setFormData({ ...formData, fitout_period_end: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Store/Office Opening</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.opening_date}
                        onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Lockin Period (Months)</label>
                    <input
                        type="number"
                        placeholder="e.g. 12"
                        className="form-control"
                        value={formData.lockin_period_months}
                        onChange={(e) => setFormData({ ...formData, lockin_period_months: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Notice Period (Months)</label>
                    <input
                        type="number"
                        placeholder="e.g. 3"
                        className="form-control"
                        value={formData.notice_period_months}
                        onChange={(e) => setFormData({ ...formData, notice_period_months: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Notice for Vacation Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.notice_vacation_date}
                        onChange={(e) => setFormData({ ...formData, notice_vacation_date: e.target.value })}
                    />
                    {(() => {
                        if (formData.notice_vacation_date && formData.lease_start && formData.lockin_period_months) {
                            const leaseStart = new Date(formData.lease_start);
                            const lockinEndDate = new Date(leaseStart);
                            lockinEndDate.setMonth(leaseStart.getMonth() + parseInt(formData.lockin_period_months));

                            const noticeDate = new Date(formData.notice_vacation_date);

                            if (noticeDate <= lockinEndDate) {
                                return (
                                    <small className="error-text" style={{ color: '#e53e3e' }}>
                                        Notice cannot be given during the Lock-in Period (until {lockinEndDate.toLocaleDateString()}).
                                    </small>
                                );
                            }
                        }
                        return null;
                    })()}
                </div>
            </div>

            {/* Other Financials */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Additional Financials</h4>
            <div className="form-row">
                <div className="form-group">
                    <label>Payment Due Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.payment_due_day}
                        onChange={(e) => setFormData({ ...formData, payment_due_day: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Billing Frequency</label>
                    <select
                        value={formData.billing_frequency}
                        className="form-control"
                        onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
                    >
                        <option>Monthly</option>
                        <option>Quarterly</option>
                        <option>Annually</option>
                    </select>
                </div>
            </div>

            {/* Deposits */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Deposits</h4>
            <div className="form-row">
                <div className="form-group">
                    <label>Lease Deposit Rate (Per Sq. Ft)</label>
                    <div className="input-with-suffix" style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Rate"
                            value={securityDepositRate}
                            onChange={(e) => setSecurityDepositRate(e.target.value)}
                        />
                        <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#666' }}>
                            on {selectedProject?.calculation_type || 'Super Area'}
                        </span>
                    </div>
                </div>
                <div className="form-group">
                    <label>Lease Deposit (Total)</label>
                    <div className="currency-input">
                        <span className="currency-symbol">₹</span>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={formData.security_deposit}
                            readOnly
                            style={{ backgroundColor: '#f9fafb' }}
                        />
                        <span className="currency-code">INR</span>
                    </div>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Utility Deposit Rate (Per Sq. Ft)</label>
                    <div className="input-with-suffix" style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Rate"
                            value={utilityDepositRate}
                            onChange={(e) => setUtilityDepositRate(e.target.value)}
                        />
                        <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#666' }}>
                            on {selectedProject?.calculation_type || 'Super Area'}
                        </span>
                    </div>
                </div>
                <div className="form-group">
                    <label>Utility Deposit (Total)</label>
                    <div className="currency-input">
                        <span className="currency-symbol">₹</span>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={formData.utility_deposit}
                            readOnly
                            style={{ backgroundColor: '#f9fafb' }}
                        />
                        <span className="currency-code">INR</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step3Finalize;
