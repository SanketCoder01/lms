import React from 'react';

const Step2RentConfig = ({
    rentModel,
    formData,
    setFormData,
    escalationSteps,
    setEscalationSteps,
    selectedProject,
    selectedUnit
}) => {

    const [rentRate, setRentRate] = React.useState('');
    const [mgRate, setMgRate] = React.useState('');

    React.useEffect(() => {
        if (rentRate && selectedProject && selectedUnit) {
            const calcType = selectedProject.calculation_type || 'Super Area';
            let area = 0;
            // Note: Assuming unit object has these fields. If not, might need to ensure they are fetched.
            // Based on AddUnit, they should be there.
            if (calcType === 'Covered Area') area = parseFloat(selectedUnit.covered_area) || 0;
            else if (calcType === 'Carpet Area') area = parseFloat(selectedUnit.carpet_area) || 0;
            else area = parseFloat(selectedUnit.super_area) || 0;

            const total = parseFloat(rentRate) * area;
            setFormData(prev => ({ ...prev, monthly_rent: total > 0 ? total.toString() : '' }));
        }
    }, [rentRate, selectedProject, selectedUnit, setFormData]);

    React.useEffect(() => {
        if (mgRate && selectedProject && selectedUnit) {
            const calcType = selectedProject.calculation_type || 'Super Area';
            let area = 0;
            if (calcType === 'Covered Area') area = parseFloat(selectedUnit.covered_area) || 0;
            else if (calcType === 'Carpet Area') area = parseFloat(selectedUnit.carpet_area) || 0;
            else area = parseFloat(selectedUnit.super_area) || 0;

            const total = parseFloat(mgRate) * area;
            // For Hybrid, it sets minimum_guarantee. For RevenueShare, it sets monthly_rent (which acts as MG/Base).
            if (rentModel === 'Hybrid') {
                setFormData(prev => ({ ...prev, minimum_guarantee: total > 0 ? total.toString() : '' }));
            } else {
                setFormData(prev => ({ ...prev, monthly_rent: total > 0 ? total.toString() : '' }));
            }
        }
    }, [mgRate, selectedProject, selectedUnit, setFormData, rentModel]);

    return (
        <div className="form-section">
            <h3>Step 2: Rent Configuration - {rentModel} Model</h3>

            {/* FIXED RENT CONFIGURATION */}
            {(rentModel === 'Fixed' || rentModel === 'Hybrid') && (
                <div className="rent-block">
                    <h4>Fixed Rent Details</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Rent Rate (Per Sqft)</label>
                            <div className="input-with-suffix" style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Rate"
                                    value={rentRate}
                                    onChange={(e) => setRentRate(e.target.value)}
                                />
                                <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#666' }}>
                                    on {selectedProject?.calculation_type || 'Super Area'}
                                </span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Total Monthly Rent (Calculated)</label>
                            <div className="currency-input">
                                <span className="currency-symbol">₹</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.monthly_rent}
                                    readOnly
                                    style={{ backgroundColor: '#f3f4f6' }}
                                />
                                <span className="currency-code">INR</span>
                            </div>
                        </div>
                    </div>

                    {/* Rent Free Period */}
                    <div className="form-row" style={{ marginTop: '15px' }}>
                        <div className="form-group">
                            <label>Rent Free Period Start</label>
                            <input
                                type="date"
                                className="form-control"
                                value={formData.rent_free_start_date || ''}
                                onChange={(e) => setFormData({ ...formData, rent_free_start_date: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Rent Free Period End</label>
                            <input
                                type="date"
                                className="form-control"
                                value={formData.rent_free_end_date || ''}
                                onChange={(e) => setFormData({ ...formData, rent_free_end_date: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* SEPARATOR FOR HYBRID */}
            {rentModel === 'Hybrid' && <hr style={{ margin: '30px 0', border: '0', borderTop: '1px dashed #cbd5e1' }} />}

            {/* REVENUE SHARE CONFIGURATION */}
            {(rentModel === 'RevenueShare' || rentModel === 'Hybrid') && (
                <div className="rent-block">
                    <h4>Revenue Share Details</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>MG Rate (Per Sqft)</label>
                            <div className="input-with-suffix" style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Rate"
                                    value={mgRate}
                                    onChange={(e) => setMgRate(e.target.value)}
                                />
                                <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#666' }}>
                                    on {selectedProject?.calculation_type || 'Super Area'}
                                </span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Min Guarantee Amount (Calc)</label>
                            <div className="currency-input">
                                <span className="currency-symbol">₹</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    readOnly
                                    style={{ backgroundColor: '#f3f4f6' }}
                                    value={rentModel === 'Hybrid' ? (formData.minimum_guarantee || '') : formData.monthly_rent}
                                />
                                <span className="currency-code">INR</span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Revenue Share Percentage (%)</label>
                            <div className="input-with-suffix" style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    placeholder="e.g. 10"
                                    className="form-control"
                                    value={formData.revenue_share_percentage}
                                    onChange={(e) => setFormData({ ...formData, revenue_share_percentage: e.target.value })}
                                />
                                <span style={{ marginLeft: '10px' }}>%</span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Projected Share Amount (Calc)</label>
                            <div className="currency-input">
                                <span className="currency-symbol">₹</span>
                                <input
                                    type="number"
                                    placeholder="Calculating..."
                                    readOnly
                                    style={{ backgroundColor: '#f3f4f6' }}
                                    value={
                                        (formData.revenue_share_percentage && (rentModel === 'Hybrid' ? formData.minimum_guarantee : formData.monthly_rent))
                                            ? ((parseFloat(rentModel === 'Hybrid' ? formData.minimum_guarantee : formData.monthly_rent) / parseFloat(formData.revenue_share_percentage)) * 100).toFixed(2)
                                            : '0.00'
                                    }
                                />
                                <span className="currency-code">Sales</span>
                            </div>
                            <small style={{ color: '#666', fontSize: '0.8em' }}>Sales required to match MGR</small>
                        </div>
                    </div>
                    <div className="form-row" style={{ marginTop: '15px' }}>
                        <div className="form-group">
                            <label>Applicable On</label>
                            <select
                                className="form-control"
                                value={formData.revenue_share_applicable_on}
                                onChange={(e) => setFormData({ ...formData, revenue_share_applicable_on: e.target.value })}
                            >
                                <option>Net Sales</option>
                                <option>Gross Sales</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Step2RentConfig;
