import React from 'react';

const Step3RentConfig = ({
    rentModel, // 'Fixed' | 'RevenueShare' | 'Hybrid'
    formData,
    setFormData,
    selectedProject,
    selectedUnit,
    isSubLease
}) => {

    // Determine usable area for rent calculation
    const getUsableArea = () => {
        if (isSubLease && formData.sub_lease_area_sqft) {
            return parseFloat(formData.sub_lease_area_sqft) || 0;
        }
        if (!selectedUnit) return 0;
        const calcType = selectedProject?.calculation_type || 'Chargeable Area';
        if (calcType === 'Covered Area') return parseFloat(selectedUnit.covered_area) || 0;
        if (calcType === 'Carpet Area') return parseFloat(selectedUnit.carpet_area) || 0;
        return parseFloat(selectedUnit.chargeable_area) || 0;
    };

    // Issue 61: Allow MG = 0. Only auto-calc if mg_amount_sqft is set (including 0)
    React.useEffect(() => {
        const rate = formData.mg_amount_sqft;
        // Only auto-calc if the value is explicitly provided (string "0" or positive number)
        if (rate === '' || rate === null || rate === undefined) return;
        const usableArea = getUsableArea();
        const totalMG = (parseFloat(rate) || 0) * usableArea;
        setFormData(prev => {
            const newMGAmount = totalMG.toFixed(2);
            if (prev.mg_amount === newMGAmount) return prev;
            return {
                ...prev,
                mg_amount: newMGAmount,
                monthly_rent: newMGAmount
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.mg_amount_sqft, formData.sub_lease_area_sqft, isSubLease]);

    // Issue 36/42/67: Revenue Share Amount calculation
    React.useEffect(() => {
        if (rentModel !== 'RevenueShare' && rentModel !== 'Hybrid') return;
        const pct = parseFloat(formData.revenue_share_percentage) || 0;
        const netSales = parseFloat(formData.monthly_net_sales) || 0;
        const revShareAmt = ((pct / 100) * netSales).toFixed(2);

        const mgAmt = parseFloat(formData.mg_amount) || 0;
        const optionA = (mgAmt + parseFloat(revShareAmt)).toFixed(2);
        const optionB = Math.max(mgAmt, parseFloat(revShareAmt)).toFixed(2);

        setFormData(prev => {
            if (prev.revenue_share_amount === revShareAmt && prev.rent_option_a === optionA && prev.rent_option_b === optionB) return prev;
            return { ...prev, revenue_share_amount: revShareAmt, rent_option_a: optionA, rent_option_b: optionB };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.revenue_share_percentage, formData.monthly_net_sales, formData.mg_amount, rentModel]);

    const daysOptions = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        let suffix = 'th';
        if (day % 10 === 1 && day !== 11) suffix = 'st';
        else if (day % 10 === 2 && day !== 12) suffix = 'nd';
        else if (day % 10 === 3 && day !== 13) suffix = 'rd';
        return `${day}${suffix} of every month`;
    });

    const areaLabel = isSubLease ? 'Sub-Leased Area' : (selectedProject?.calculation_type || 'Chargeable Area');
    const infoStyle = { background: '#f0f9ff', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', color: '#0369a1', border: '1px solid #bae6fd', marginBottom: '16px' };
    const outputStyle = { background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #6366f1' };

    return (
        <div className="form-section">
            <h3>Step 3: Rent Configuration — {rentModel} Model</h3>

            <div className="rent-block">
                {/* Issue 36/42: MG + Revenue Share inputs */}
                <h4>MG / Base Rent Details</h4>
                <div style={infoStyle}>
                    Area basis: <strong>{areaLabel}</strong>
                    {getUsableArea() > 0 && <> — <strong>{getUsableArea().toLocaleString('en-IN')} sq ft</strong></>}
                </div>

                <div className="form-row" style={{ gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>MG (Per Sqft)</label>
                        <div className="input-with-suffix" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="0.00"
                                // Issue 61: Auto-convert 0 to 1
                                min="0"
                                value={formData.mg_amount_sqft !== undefined ? formData.mg_amount_sqft : ''}
                                onChange={(e) => setFormData({ ...formData, mg_amount_sqft: e.target.value })}
                                onBlur={(e) => {
                                    if (e.target.value === '0' || e.target.value === 0) {
                                        setFormData({ ...formData, mg_amount_sqft: '1' });
                                    }
                                }}
                            />
                            <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>₹ / {areaLabel}</span>
                        </div>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>MG Amount (INR) — Auto-calculated</label>
                        <div className="currency-input">
                            <span className="currency-symbol">₹</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={formData.mg_amount || ''}
                                readOnly
                                style={{ backgroundColor: '#f3f4f6' }}
                            />
                            <span className="currency-code">INR</span>
                        </div>
                    </div>
                </div>

                {/* Issue 36/42: Revenue Share section — shown for RevenueShare and Hybrid */}
                {(rentModel === 'RevenueShare' || rentModel === 'Hybrid') && (
                    <>
                        <hr style={{ margin: '24px 0', border: '0', borderTop: '1px dashed #cbd5e1' }} />
                        <h4>Revenue Share Configuration</h4>

                        <div className="form-row" style={{ gap: '12px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Revenue Share (%)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="e.g. 10"
                                        min="0" max="100"
                                        value={formData.revenue_share_percentage || ''}
                                        onChange={(e) => setFormData({ ...formData, revenue_share_percentage: e.target.value })}
                                    />
                                    <span>%</span>
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Applicable On</label>
                                <select
                                    className="form-control"
                                    value={formData.revenue_share_applicable_on || 'Net Sales'}
                                    onChange={(e) => setFormData({ ...formData, revenue_share_applicable_on: e.target.value })}
                                >
                                    <option value="Net Sales">Net Sales</option>
                                    <option value="Gross Sales">Gross Sales</option>
                                    <option value="Adjusted Sales">Adjusted Sales</option>
                                </select>
                            </div>
                            {/* Issue 67: Net Sales input with Revenue Share Amount on right */}
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Net Sales / Total Sales (Monthly)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="currency-input" style={{ flex: 1 }}>
                                        <span className="currency-symbol">Rs</span>
                                        <input
                                            type="number"
                                            placeholder="Monthly sales figure"
                                            min="0"
                                            value={formData.monthly_net_sales || ''}
                                            onChange={(e) => setFormData({ ...formData, monthly_net_sales: e.target.value })}
                                        />
                                    </div>
                                    {/* Revenue Share Amount - moved to right side */}
                                    <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', minWidth: '140px' }}>
                                        <div style={{ fontSize: '10px', color: '#166534', marginBottom: '2px' }}>Rev Share Amt</div>
                                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#166534' }}>
                                            Rs{parseFloat(formData.revenue_share_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '24px', maxWidth: '300px' }}>
                            <label>Rent Calculation Method</label>
                            <select
                                className="form-control"
                                value={formData.rent_amount_option || 'Option B'}
                                onChange={(e) => setFormData({ ...formData, rent_amount_option: e.target.value })}
                            >
                                <option value="Option A">Option A (MG + Rev Share)</option>
                                <option value="Option B">Option B (Higher of MG or Rev Share)</option>
                            </select>
                        </div>

                        {/* Calculated outputs */}
                        <div className="form-row" style={{ gap: '12px', marginTop: '12px' }}>
                            <div style={{ ...outputStyle, flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Revenue Share Amount</div>
                                <div style={{ fontWeight: 700, fontSize: '16px', color: '#6366f1' }}>
                                    ₹{parseFloat(formData.revenue_share_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                <small style={{ color: '#64748b', fontSize: '11px' }}>{formData.revenue_share_percentage || 0}% of ₹{parseFloat(formData.monthly_net_sales || 0).toLocaleString('en-IN')}</small>
                            </div>

                            {(!formData.rent_amount_option || formData.rent_amount_option === 'Option A') ? (
                                <div style={{ ...outputStyle, flex: 1 }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Option A: MG + Rev Share</div>
                                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#059669' }}>
                                        ₹{parseFloat(formData.rent_option_a || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <small style={{ color: '#64748b', fontSize: '11px' }}>Total of both components</small>
                                </div>
                            ) : (
                                <div style={{ ...outputStyle, flex: 1, borderLeft: '4px solid #dc2626' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Option B: Higher of MG or Rev Share</div>
                                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#dc2626' }}>
                                        ₹{parseFloat(formData.rent_option_b || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                    <small style={{ color: '#64748b', fontSize: '11px' }}>Whichever is higher</small>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <hr style={{ margin: '24px 0', border: '0', borderTop: '1px dashed #cbd5e1' }} />
                <h4>Additional Charges &amp; Deposits</h4>

                <div className="form-row" style={{ gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>CAM Charges (Monthly)</label>
                        <div className="currency-input">
                            <span className="currency-symbol">₹</span>
                            <input type="number" placeholder="0.00" min="0"
                                value={formData.cam_charges || ''}
                                onChange={(e) => setFormData({ ...formData, cam_charges: e.target.value })}
                            />
                        </div>
                    </div>
                    {/* Issue 41: Keep deposit amounts — just not in docs section */}
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Security Deposit</label>
                        <div className="currency-input">
                            <span className="currency-symbol">₹</span>
                            <input type="number" placeholder="0.00" min="0"
                                value={formData.security_deposit || ''}
                                onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Utility Deposit</label>
                        <div className="currency-input">
                            <span className="currency-symbol">₹</span>
                            <input type="number" placeholder="0.00" min="0"
                                value={formData.utility_deposit || ''}
                                onChange={(e) => setFormData({ ...formData, utility_deposit: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
                {/* Deposit Details Removed per user request */}

                <hr style={{ margin: '24px 0', border: '0', borderTop: '1px dashed #cbd5e1' }} />
                <h4>Billing &amp; Payment Schedule</h4>
                <div className="form-row" style={{ gap: '12px' }}>
                    {/* Issue 35: Payment Due Day as day-of-month selector */}
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Payment Due Date (Day of Month) *</label>
                        <select
                            className="form-control"
                            value={formData.payment_due_day || '5th of every month'}
                            onChange={(e) => setFormData({ ...formData, payment_due_day: e.target.value })}
                        >
                            <option value="">Select Day</option>
                            {daysOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Billing Frequency</label>
                        <select className="form-control"
                            value={formData.billing_frequency || 'Monthly'}
                            onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
                        >
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annually">Annually</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Currency</label>
                        <select className="form-control"
                            value={formData.currency_code || 'INR'}
                            onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                        >
                            <option value="INR">INR — Indian Rupee</option>
                            <option value="USD">USD — US Dollar</option>
                        </select>
                    </div>
                </div>

                {/* Issue 62: Rent Free Period removed from here — now in Step 2 */}

            </div>
        </div>
    );
};

export default Step3RentConfig;
