import React from 'react';

// Helper: add months to a date, returns ISO date string (YYYY-MM-DD). Handles fractional months (e.g. 0.5 = 15 days)
const addMonths = (dateStr, months) => {
    if (!dateStr || !months || parseFloat(months) <= 0) return '';
    const d = new Date(dateStr);
    const m = parseFloat(months);
    const wholeMonths = Math.floor(m);
    const fractionDays = Math.round((m - wholeMonths) * 30);
    d.setMonth(d.getMonth() + wholeMonths);
    d.setDate(d.getDate() + fractionDays);
    return d.toISOString().slice(0, 10);
};

// Helper: format date for display
const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Issue 68: Correct inclusive month tenure calculation
const calcTenureMonths = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    // If end day is exactly start day minus 1, it's a full month (inclusive end)
    if (end.getDate() + 1 === start.getDate() || (start.getDate() === 1 && end.getDate() >= 28)) {
        // End date is last day of month that corresponds to full period
    } else if (end.getDate() < start.getDate()) {
        months--;
    }
    return Math.max(0, months);
};

const Step2TermsFinalization = ({
    formData,
    setFormData,
    selectedProject,
    selectedUnit
}) => {

    // Issue 68: Auto-recalculate tenure on date change
    React.useEffect(() => {
        if (formData.lease_start && formData.lease_end) {
            const months = calcTenureMonths(formData.lease_start, formData.lease_end);
            setFormData(prev => {
                if (prev.tenure_months === months) return prev;
                return { ...prev, tenure_months: months };
            });
        }
    }, [formData.lease_start, formData.lease_end, setFormData]);

    // Issue 56: Validate dates only on blur, not onChange
    const handleDateBlur = (field, value, rules = {}) => {
        if (!value) return;
        if (rules.minField && formData[rules.minField] && value < formData[rules.minField]) {
            alert(`"${rules.label}" cannot be before "${rules.minLabel}".`);
            setFormData(prev => ({ ...prev, [field]: '' }));
            return;
        }
        if (rules.maxField && formData[rules.maxField] && value > formData[rules.maxField]) {
            alert(`"${rules.label}" cannot be after "${rules.maxLabel}".`);
            setFormData(prev => ({ ...prev, [field]: '' }));
            return;
        }
        if (rules.minDate && value < rules.minDate) {
            alert(`"${rules.label}" cannot be before "${rules.minLabel}".`);
            setFormData(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="form-section">
            <h3>Step 2: Term Finalization</h3>

            {/* Row 1: Lease Start, End, Duration */}
            {/* Issue 65: Compact row layout */}
            <div className="form-row" style={{ gap: '12px' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    <label>Lease Start Date *</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.lease_start}
                        onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
                        onBlur={(e) => handleDateBlur('lease_start', e.target.value, { maxField: 'lease_end', label: 'Lease Start', maxLabel: 'Lease End' })}
                    />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    <label>Lease End Date *</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.lease_end}
                        min={formData.lease_start || undefined}
                        onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
                        onBlur={(e) => handleDateBlur('lease_end', e.target.value, { minField: 'lease_start', label: 'Lease End', minLabel: 'Lease Start' })}
                    />
                </div>
                {/* Issue 54: Duration editable in edit mode */}
                <div className="form-group" style={{ flex: '0 0 140px' }}>
                    <label>Duration (Months)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={formData.tenure_months === undefined ? '' : formData.tenure_months}
                        onChange={(e) => {
                            const newMonths = parseInt(e.target.value);
                            if (isNaN(newMonths) || newMonths < 0) {
                                setFormData({ ...formData, tenure_months: '' });
                                return;
                            }
                            setFormData((prev) => {
                                const updates = { tenure_months: newMonths };
                                if (prev.lease_start) {
                                    // Issue 68: Set end = start + n months - 1 day = inclusive
                                    const newEnd = new Date(prev.lease_start);
                                    newEnd.setMonth(newEnd.getMonth() + newMonths);
                                    newEnd.setDate(newEnd.getDate() - 1);
                                    updates.lease_end = newEnd.toISOString().slice(0, 10);
                                }
                                return { ...prev, ...updates };
                            });
                        }}
                    />
                </div>
            </div>

            {/* Row 2: Handover, Fitout Start, Fitout End */}
            <div className="form-row" style={{ gap: '12px', marginTop: '14px' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    {/* Issue 34: Unit Handover Date required */}
                    <label>Unit Handover Date *</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.unit_handover_date || ''}
                        onChange={(e) => setFormData({ 
                            ...formData, 
                            unit_handover_date: e.target.value,
                            registration_date: formData.registration_date ? formData.registration_date : e.target.value 
                        })}
                        required
                    />
                </div>
                {/* Issue 63: Fitout dates only here — not duplicated */}
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    <label>Fitout Period Start</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.fitout_period_start || ''}
                        min={formData.unit_handover_date || undefined}
                        onChange={(e) => setFormData({ ...formData, fitout_period_start: e.target.value })}
                        onBlur={(e) => handleDateBlur('fitout_period_start', e.target.value, {
                            minField: 'unit_handover_date', label: 'Fitout Start', minLabel: 'Handover Date'
                        })}
                    />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    <label>Fitout Period End</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.fitout_period_end || ''}
                        min={formData.fitout_period_start || undefined}
                        onChange={(e) => setFormData({ ...formData, fitout_period_end: e.target.value })}
                        onBlur={(e) => handleDateBlur('fitout_period_end', e.target.value, {
                            minField: 'fitout_period_start', label: 'Fitout End', minLabel: 'Fitout Start'
                        })}
                    />
                </div>
            </div>

            {/* Row 3: Store Open, Rent Commencement */}
            <div className="form-row" style={{ gap: '12px', marginTop: '14px' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    {/* Issue 50: Store Open date validation */}
                    <label>Store Open Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.opening_date || ''}
                        min={formData.fitout_period_end || formData.lease_start || undefined}
                        max={formData.lease_end || undefined}
                        onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                        onBlur={(e) => {
                            const val = e.target.value;
                            if (formData.fitout_period_end && val < formData.fitout_period_end) {
                                alert('Store Open Date cannot be before Fitout Period End.');
                                setFormData(prev => ({ ...prev, opening_date: '' }));
                                return;
                            }
                            if (formData.lease_end && val > formData.lease_end) {
                                alert('Store Open Date must be within lease period.');
                                setFormData(prev => ({ ...prev, opening_date: '' }));
                            }
                        }}
                    />
                    <small style={{ color: '#dc2626', fontSize: '11px', fontWeight: 'bold' }}>Strictly ≥ Fitout End, within lease bounds</small>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    <label>Rent Commencement Date *</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.rent_commencement_date || ''}
                        onChange={(e) => setFormData({ ...formData, rent_commencement_date: e.target.value })}
                    />
                    <small style={{ color: '#2563eb', fontSize: '11px' }}>Escalations auto-start from this date</small>
                </div>
            </div>

            {/* Issue 62: Rent Free Period moved to Step 2 */}
            <h4 style={{ margin: '24px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Rent Free Period</h4>
            {/* Issue 57: Optional - toggle-gated */}
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={!!formData.has_rent_free_period}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                                ...prev,
                                has_rent_free_period: checked,
                                rent_free_start_date: checked ? prev.rent_free_start_date : '',
                                rent_free_end_date: checked ? prev.rent_free_end_date : ''
                            }));
                        }}
                        style={{ width: '16px', height: '16px' }}
                    />
                    There is a Rent Free Period for this lease
                </label>
            </div>
            {formData.has_rent_free_period && (
                <div className="form-row" style={{ gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                        <label>Rent Free Start</label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData.rent_free_start_date || ''}
                            onChange={(e) => setFormData({ ...formData, rent_free_start_date: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                        <label>Rent Free End</label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData.rent_free_end_date || ''}
                            min={formData.rent_free_start_date || undefined}
                            onChange={(e) => setFormData({ ...formData, rent_free_end_date: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {/* Issue 32/33: Separate Lock-in & Notice for Lessee and Lessor */}
            <h4 style={{ margin: '24px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Lock-in &amp; Notice Periods</h4>

            <div className="form-row" style={{ gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Lessee Lock-in Period (Months)</label>
                    <input type="number" step="0.1" className="form-control" placeholder="e.g. 12 or 0.5"
                        value={formData.lessee_lockin_period_months || ''}
                        onChange={(e) => setFormData({ ...formData, lessee_lockin_period_months: e.target.value })}
                    />
                    {/* Issue 64: Show computed lock-in end date */}
                    {formData.lessee_lockin_period_months > 0 && formData.lease_start && (
                        <small style={{ color: '#2563eb', fontSize: '11px' }}>
                            Lessee Lock-in End: <strong>{fmtDate(addMonths(formData.rent_commencement_date || formData.lease_start, formData.lessee_lockin_period_months))}</strong>
                        </small>
                    )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Lessor Lock-in Period (Months)</label>
                    <input type="number" step="0.1" className="form-control" placeholder="e.g. 12 or 0.5"
                        value={formData.lessor_lockin_period_months || ''}
                        onChange={(e) => setFormData({ ...formData, lessor_lockin_period_months: e.target.value })}
                    />
                    {formData.lessor_lockin_period_months > 0 && formData.lease_start && (
                        <small style={{ color: '#2563eb', fontSize: '11px' }}>
                            Lessor Lock-in End: <strong>{fmtDate(addMonths(formData.rent_commencement_date || formData.lease_start, formData.lessor_lockin_period_months))}</strong>
                        </small>
                    )}
                </div>
            </div>

            <div className="form-row" style={{ gap: '12px', marginTop: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Lessee Notice Period (Months)</label>
                    <input type="number" step="0.1" className="form-control" placeholder="e.g. 3 or 0.5"
                        value={formData.lessee_notice_period_months || ''}
                        onChange={(e) => setFormData({ ...formData, lessee_notice_period_months: e.target.value })}
                    />
                    {formData.lessee_notice_period_months > 0 && formData.lease_end && (
                        <small style={{ color: '#7c3aed', fontSize: '11px' }}>
                            Lessee Can Exit After: <strong>{fmtDate(addMonths(formData.rent_commencement_date || formData.lease_start, formData.lessee_lockin_period_months || 0))}</strong>
                            {' '} | Notice by: <strong>{fmtDate(addMonths(formData.lease_end, -(parseFloat(formData.lessee_notice_period_months) || 0)))}</strong>
                        </small>
                    )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Lessor Notice Period (Months)</label>
                    <input type="number" step="0.1" className="form-control" placeholder="e.g. 3 or 0.5"
                        value={formData.lessor_notice_period_months || ''}
                        onChange={(e) => setFormData({ ...formData, lessor_notice_period_months: e.target.value })}
                    />
                    {formData.lessor_notice_period_months > 0 && formData.lease_end && (
                        <small style={{ color: '#7c3aed', fontSize: '11px' }}>
                            Lessor Can Exit After: <strong>{fmtDate(addMonths(formData.rent_commencement_date || formData.lease_start, formData.lessor_lockin_period_months || 0))}</strong>
                            {' '} | Notice by: <strong>{fmtDate(addMonths(formData.lease_end, -(parseFloat(formData.lessor_notice_period_months) || 0)))}</strong>
                        </small>
                    )}
                </div>
            </div>

            {/* Issue 44: Notice for Vacation — REMOVED from this flow per business rules */}

        </div>
    );
};

export default Step2TermsFinalization;
