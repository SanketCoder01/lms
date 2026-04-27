import React from 'react';

const Step4Escalations = ({
    escalationSteps,
    setEscalationSteps,
    addEscalationStep,
    removeEscalationStep,
    formData,
    setFormData,
    rentModel
}) => {
    // Issue 47: Show current rental info at top
    const currentMGBase = parseFloat(formData.mg_amount_sqft || 0).toFixed(2);
    const currentRevShare = rentModel !== 'Fixed' ? (parseFloat(formData.revenue_share_percentage || 0).toFixed(2) + '%') : 'N/A';
    const currentMGAmount = parseFloat(formData.mg_amount || 0).toFixed(2);
    const rentCommDate = formData.rent_commencement_date || 'Not Set';
    const leaseEndDate = formData.lease_end || 'Not Set';

    const handleStepChange = (index, field, value) => {
        setEscalationSteps(prev => {
            const newSteps = [...prev];
            newSteps[index] = { ...newSteps[index], [field]: value };
            return newSteps;
        });
    };

    const handleStepChangeMultiple = (index, updates) => {
        setEscalationSteps(prev => {
            const newSteps = [...prev];
            newSteps[index] = { ...newSteps[index], ...updates };
            return newSteps;
        });
    };

    // Issue 48: escalation type options based on rent model
    const getEscalationOnOptions = () => {
        if (rentModel === 'Fixed') {
            return [{ value: 'mg', label: 'MG / Base Rent' }];
        }
        return [
            { value: 'mg', label: 'Minimum Guarantee (MG)' },
            { value: 'revenue_share', label: 'Revenue Share %' },
            { value: 'both', label: 'Both (MG + Rev Share)' }
        ];
    };

    // Issue 48: Increase type options based on lease model and escalation_on
    const getIncreaseTypeOptions = (step) => {
        if (rentModel === 'Fixed') {
            return [
                { value: 'Percentage (%)', label: '% Increase on Base' },
                { value: 'Fixed Amount', label: '+ Fixed Amount Addition (INR/Month)' },
                { value: 'Rate Per Sqft', label: 'New Total Rental Rate (Per Sqft)' },
                { value: 'Add Rate Per Sqft', label: '+ Additional Rate (+ INR/Sqft)' },
            ];
        }

        // Issue 48: For revenue share leases
        if (step.escalation_on === 'revenue_share') {
            return [
                { value: 'Add Revenue Share', label: '+ Add to Revenue Share %' },
                { value: 'Remove Revenue Share', label: 'Remove Revenue Share' },
                { value: 'Set New Revenue Share %', label: 'Set New Total Revenue Share %' },
            ];
        }
        if (step.escalation_on === 'mg') {
            return [
                { value: 'Percentage (%)', label: '% Increase on Base MG' },
                { value: 'Fixed Amount', label: '+ Fixed Amount Addition (INR/Month)' },
                { value: 'Rate Per Sqft', label: 'New Total MG Rate (Per Sqft)' },
                { value: 'Add Rate Per Sqft', label: '+ Additional MG Rate (+ INR/Sqft)' },
                { value: 'Remove MG', label: 'Remove MG' },
            ];
        }
        if (step.escalation_on === 'both') {
            return [
                { value: 'Convert to Traditional', label: 'Convert to Fixed Lease' },
                { value: 'Percentage (%)', label: '% Increase on Both' },
            ];
        }
        return [{ value: 'Percentage (%)', label: '% Increase' }];
    };

    // Check if we need to show both MG and Rev Share inputs
    const showBothInputs = (step) => {
        return step.escalation_on === 'both' && step.increaseType === 'Percentage (%)';
    };

    // Check if Convert to Traditional - show both fixed rate and rev share
    const isConvertToTraditional = (step) => {
        return step.escalation_on === 'both' && step.increaseType === 'Convert to Traditional';
    };



    const getValueDescription = (step) => {
        switch (step.increaseType) {
            case 'Percentage (%)': return 'Adds explicit % increase on top of current rate/amount.';
            case 'Fixed Amount': return 'Adds flat INR amount iteratively on top of current rental.';
            case 'Rate Per Sqft': return 'Overrides rent with a brand new total INR amount per sqft.';
            case 'Add Rate Per Sqft': return 'Adds this exact INR per sqft amount to the existing rate.';
            case 'Add MG': return 'Adds this exact INR per sqft amount to the existing rate.';
            case 'Remove MG': return 'No value needed — permanently removes MG for this term.';
            case 'Add Revenue Share': return 'Adds this explicit % increment on top of the current Revenue Share %.';
            case 'Remove Revenue Share': return 'No value needed — systematically removes revenue share logic for this term.';
            case 'Set New Revenue Share %': return 'Overrides the Revenue Share % to this new absolute total value.';
            case 'Convert to Traditional': return 'Overrides model completely: New fixed MG rate per sqft.';
            default: return '';
        }
    };

    const needsNoValue = (step) => ['Remove MG', 'Remove Revenue Share'].includes(step.increaseType);

    return (
        <div className="form-section">
            <h3>Step 4: Rent Escalations</h3>

            {/* Issue 47: Current rental info at top */}
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '14px' }}>📊 Current Rental Terms (Base)</h4>
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: '#475569' }}>
                            <div><strong>Rent Commencement:</strong> {rentCommDate}</div>
                            <div><strong>Lease End Date:</strong> {leaseEndDate}</div>
                            <div><strong>MG Rate / Sqft:</strong> ₹{currentMGBase}</div>
                            <div><strong>MG Amount (Monthly):</strong> ₹{parseFloat(currentMGAmount).toLocaleString('en-IN')}</div>
                            {rentModel !== 'Fixed' && <div><strong>Revenue Share:</strong> {currentRevShare}</div>}
                        </div>
                    </div>
                    {/* NEW: Base Rent Effective Till Date */}
                    <div style={{ background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                            Base Rent Effective Till Date <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData?.base_rent_effective_to || ''}
                            onChange={(e) => {
                                if (setFormData) {
                                    setFormData({ ...formData, base_rent_effective_to: e.target.value });
                                }
                            }}
                            min={formData?.rent_commencement_date || undefined}
                            max={formData?.lease_end || undefined}
                            style={{ fontSize: '13px', borderColor: !formData?.base_rent_effective_to ? '#fca5a5' : '#cbd5e1' }}
                        />
                        {!formData?.base_rent_effective_to && <small style={{ color: '#dc2626', fontSize: '11px', display: 'block', marginTop: '4px' }}>Required to start escalations</small>}
                    </div>
                </div>
            </div>

            {/* Issue 46: Effective To is mandatory */}
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', padding: '8px 12px', background: '#fffbeb', borderRadius: '4px', border: '1px solid #fbbf24' }}>
                💡 Escalation #1 auto-starts safely after the <strong>Base Rent Effective Till Date</strong>. <strong>Effective To (end date) is mandatory</strong> for every escalation.
            </p>

            <div className="escalations-section">
                {escalationSteps.map((step, index) => {
                    const isFirst = index === 0;
                    const increaseTypeOptions = getIncreaseTypeOptions(step);
                    const isBothInputs = showBothInputs(step);
                    const isConvertTrad = isConvertToTraditional(step);

                    return (
                        <div key={index} style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <h5 style={{ margin: 0, color: '#334155', fontSize: '14px' }}>Escalation #{index + 1}</h5>
                                <button type="button" onClick={() => removeEscalationStep(index)}
                                    style={{ padding: '4px 10px', background: '#ffe4e6', color: '#e11d48', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                    Remove
                                </button>
                            </div>

                            {/* Issue 58: Aligned, compact row layout */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                                {/* Effective From: Issue 45 — auto from rent commencement for first row */}
                                <div className="form-group">
                                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Effective From</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={step.effectiveDate || (isFirst && formData?.base_rent_effective_to ? new Date(new Date(formData.base_rent_effective_to).getTime() + 86400000).toISOString().split('T')[0] : '')}
                                        onChange={(e) => handleStepChange(index, 'effectiveDate', e.target.value)}
                                        style={isFirst && !step.effectiveDate ? { backgroundColor: '#f1f5f9', fontSize: '13px' } : { fontSize: '13px' }}
                                    />
                                    {isFirst && !step.effectiveDate && (
                                        <small style={{ color: '#64748b', fontSize: '11px' }}>Auto: Day after Base Rent End</small>
                                    )}
                                </div>

                                {/* Issue 46: Effective To — mandatory */}
                                <div className="form-group">
                                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Effective To <span style={{ color: '#dc2626' }}>*</span></label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={step.effectiveToDate || ''}
                                        onChange={(e) => handleStepChange(index, 'effectiveToDate', e.target.value)}
                                        required
                                        style={{ fontSize: '13px', borderColor: !step.effectiveToDate ? '#fca5a5' : undefined }}
                                    />
                                    {!step.effectiveToDate && <small style={{ color: '#dc2626', fontSize: '11px' }}>Required</small>}
                                </div>

                                {/* Issue 48: Escalation applies to */}
                                <div className="form-group">
                                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Escalation Applies To</label>
                                    <select
                                        className="form-control"
                                        value={step.escalation_on || 'mg'}
                                        onChange={(e) => {
                                            // Reset increase type when changing target
                                            handleStepChangeMultiple(index, {
                                                escalation_on: e.target.value,
                                                increaseType: getIncreaseTypeOptions({ escalation_on: e.target.value })[0]?.value || 'Percentage (%)'
                                            });
                                        }}
                                        style={{ fontSize: '13px' }}
                                    >
                                        {getEscalationOnOptions().map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Issue 51: Increase type dropdown */}
                                <div className="form-group">
                                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Change Type</label>
                                    <select
                                        className="form-control"
                                        value={step.increaseType || 'Percentage (%)'}
                                        onChange={(e) => handleStepChange(index, 'increaseType', e.target.value)}
                                        style={{ fontSize: '13px' }}
                                    >
                                        {increaseTypeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Value input(s) -- Issue 59: Both mode shows MG + RevShare fields, Convert to Traditional shows fixed rate + rev share */}
                            {!needsNoValue(step) && (
                                <div style={{ display: 'grid', gridTemplateColumns: (isBothInputs || isConvertTrad) ? '1fr 1fr' : '1fr', gap: '12px', marginTop: '10px' }}>
                                    {isBothInputs ? (
                                        <>
                                            <div className="form-group">
                                                <label style={{ fontSize: '12px', fontWeight: 600 }}>MG Change Value (%)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="MG % increase"
                                                    value={step.value || ''}
                                                    onChange={(e) => handleStepChange(index, 'value', e.target.value)}
                                                    style={{ fontSize: '13px' }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Rev Share Change Value (%)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="Rev share % increase"
                                                    value={step.rev_share_value || ''}
                                                    onChange={(e) => handleStepChange(index, 'rev_share_value', e.target.value)}
                                                    style={{ fontSize: '13px' }}
                                                />
                                            </div>
                                        </>
                                    ) : isConvertTrad ? (
                                        <>
                                            <div className="form-group">
                                                <label style={{ fontSize: '12px', fontWeight: 600 }}>New Fixed Rate (Per Sqft)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="e.g. 150"
                                                    value={step.value || ''}
                                                    onChange={(e) => handleStepChange(index, 'value', e.target.value)}
                                                    style={{ fontSize: '13px' }}
                                                />
                                                <small style={{ color: '#64748b', fontSize: '11px' }}>New fixed rental rate per sqft</small>
                                            </div>
                                            <div className="form-group">
                                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Revenue Share (%)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="e.g. 5"
                                                    value={step.rev_share_value || ''}
                                                    onChange={(e) => handleStepChange(index, 'rev_share_value', e.target.value)}
                                                    style={{ fontSize: '13px' }}
                                                />
                                                <small style={{ color: '#64748b', fontSize: '11px' }}>Revenue share percentage to apply</small>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="form-group">
                                            <label style={{ fontSize: '12px', fontWeight: 600 }}>Value</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="e.g. 5"
                                                value={step.value || ''}
                                                onChange={(e) => handleStepChange(index, 'value', e.target.value)}
                                                style={{ fontSize: '13px' }}
                                            />
                                            <small style={{ color: '#64748b', fontSize: '11px' }}>{getValueDescription(step)}</small>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                <button
                    type="button"
                    onClick={addEscalationStep}
                    style={{ padding: '10px 16px', background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#334155', borderRadius: '6px', cursor: 'pointer', width: '100%', fontSize: '14px' }}>
                    + Add New Escalation Period
                </button>
            </div>
        </div>
    );
};

export default Step4Escalations;
