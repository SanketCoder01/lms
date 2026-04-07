import React from 'react';

// ─── Date Helpers ───────────────────────────────────────────────────────────

/** Add whole/fractional months to a date. Returns YYYY-MM-DD. */
const addMonths = (dateStr, months) => {
    if (!dateStr || !months || parseFloat(months) <= 0) return '';
    const d = new Date(dateStr);
    const m = parseFloat(months);
    const wholeMonths = Math.floor(m);
    const fractionDays = Math.round((m - wholeMonths) * 30);
    d.setMonth(d.getMonth() + wholeMonths);
    d.setDate(d.getDate() + fractionDays);
    // Subtract 1 day to get the last day of the period (inclusive end)
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
};

/** Subtract days from a date. Returns YYYY-MM-DD. */
const subDays = (dateStr, days) => {
    if (!dateStr || !days) return '';
    const d = new Date(dateStr);
    d.setDate(d.getDate() - parseInt(days, 10));
    return d.toISOString().slice(0, 10);
};

/** Add days to a date. Returns YYYY-MM-DD. */
const addDays = (dateStr, days) => {
    if (!dateStr || !days) return '';
    const d = new Date(dateStr);
    d.setDate(d.getDate() + parseInt(days, 10));
    return d.toISOString().slice(0, 10);
};

/** Format date for display. */
const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Calculate tenure months with +1 concept for inclusive counting.
 * e.g. Jan 1 to Jan 31 = 1 month (not 0)
 * Jan 1 to Feb 28 = 2 months
 * Uses proper month difference calculation.
 */
const calcTenureMonths = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    // Calculate total months difference
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let totalMonths = years * 12 + months;
    
    // Adjust based on day of month
    const startDay = start.getDate();
    const endDay = end.getDate();
    
    // If end day >= start day, we have completed the partial month, so +1
    // If end day < start day, we haven't completed the month yet
    if (endDay >= startDay) {
        // We've passed the start day in the end month, so count this month
        totalMonths += 1;
    }
    // If end day < start day, the month is not complete, don't add
    
    return Math.max(1, totalMonths); // Minimum 1 month if dates are valid
};

const Step2TermsFinalization = ({
    formData,
    setFormData,
    selectedProject,
    selectedUnit
}) => {

    // Auto-recalculate tenure when lease dates change
    React.useEffect(() => {
        if (formData.lease_start && formData.lease_end) {
            const months = calcTenureMonths(formData.lease_start, formData.lease_end);
            setFormData(prev => {
                if (prev.tenure_months === months) return prev;
                return { ...prev, tenure_months: months };
            });
        }
    }, [formData.lease_start, formData.lease_end, setFormData]);

    // Validate dates on blur only
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
    };

    // ── Derived computed dates ──────────────────────────────────────────────
    const rentFreeEnd = formData.has_rent_free_period ? formData.rent_free_end_date : '';
    const rentCommBase = formData.rent_commencement_date || formData.lease_start || '';
    const lesseeLockDays  = parseInt(formData.lessee_lockin_period_days || 0, 10);
    const lessorLockDays  = parseInt(formData.lessor_lockin_period_days || 0, 10);
    const lesseeLockEnd  = lesseeLockDays ? addDays(rentCommBase, lesseeLockDays) : '';
    const lessorLockEnd  = lessorLockDays ? addDays(rentCommBase, lessorLockDays) : '';

    // Notice periods in DAYS → computed deadline date
    const lesseeNoticeDays   = parseInt(formData.lessee_notice_period_days || 0, 10);
    const lessorNoticeDays   = parseInt(formData.lessor_notice_period_days || 0, 10);
    const lesseeNoticeDeadline = formData.lease_end && lesseeNoticeDays
        ? subDays(formData.lease_end, lesseeNoticeDays) : '';
    const lessorNoticeDeadline = formData.lease_end && lessorNoticeDays
        ? subDays(formData.lease_end, lessorNoticeDays) : '';

    return (
        <div className="form-section">
            <h3>Step 2: Term Finalization</h3>

            {/* ── Row 1: Lease Start / End / Duration ── */}
            <div className="form-row" style={{ gap: '12px' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    <label>Lease Start Date *</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.lease_start || ''}
                        onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
                        onBlur={(e) => handleDateBlur('lease_start', e.target.value, {
                            maxField: 'lease_end', label: 'Lease Start', maxLabel: 'Lease End'
                        })}
                    />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    <label>Lease End Date *</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.lease_end || ''}
                        min={formData.lease_start || undefined}
                        onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
                        onBlur={(e) => handleDateBlur('lease_end', e.target.value, {
                            minField: 'lease_start', label: 'Lease End', minLabel: 'Lease Start'
                        })}
                    />
                </div>
                <div className="form-group" style={{ flex: '0 0 150px' }}>
                    <label>Duration (Months)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={formData.tenure_months === undefined ? '' : formData.tenure_months}
                        onChange={(e) => {
                            const newMonths = parseInt(e.target.value, 10);
                            if (isNaN(newMonths) || newMonths < 1) {
                                setFormData({ ...formData, tenure_months: '' });
                                return;
                            }
                            setFormData((prev) => {
                                const updates = { tenure_months: newMonths };
                                if (prev.lease_start) {
                                    // end = start + n months - 1 day (inclusive, +1 concept)
                                    const newEnd = new Date(prev.lease_start);
                                    newEnd.setMonth(newEnd.getMonth() + newMonths);
                                    newEnd.setDate(newEnd.getDate() - 1);
                                    updates.lease_end = newEnd.toISOString().slice(0, 10);
                                }
                                return { ...prev, ...updates };
                            });
                        }}
                        placeholder="Auto-calculated"
                        min="1"
                    />
                    {formData.lease_start && formData.lease_end && (
                        <small style={{ color: '#16a34a', fontSize: '11px', fontWeight: '500' }}>
                            {calcTenureMonths(formData.lease_start, formData.lease_end)} months
                            <br/><span style={{ color: '#64748b', fontWeight: '400' }}>({fmtDate(formData.lease_start)} → {fmtDate(formData.lease_end)})</span>
                        </small>
                    )}
                </div>
            </div>

            {/* ── Row 2: Handover / Fitout Start / Fitout End ── */}
            <div className="form-row" style={{ gap: '12px', marginTop: '14px' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
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
                        min={formData.unit_handover_date || formData.fitout_period_start || undefined}
                        onChange={(e) => setFormData({ ...formData, fitout_period_end: e.target.value })}
                        onBlur={(e) => {
                            const val = e.target.value;
                            // Must not be before unit handover date
                            if (formData.unit_handover_date && val < formData.unit_handover_date) {
                                alert('Fitout Period End cannot be before Unit Handover Date.');
                                setFormData(prev => ({ ...prev, fitout_period_end: '' }));
                                return;
                            }
                            if (formData.fitout_period_start && val < formData.fitout_period_start) {
                                alert('Fitout Period End cannot be before Fitout Start.');
                                setFormData(prev => ({ ...prev, fitout_period_end: '' }));
                                return;
                            }
                            // Fitout end must not be after store open date (if store open exists)
                            if (formData.opening_date && val > formData.opening_date) {
                                alert('Fitout Period End cannot be after Store Open Date. Store opens on ' + fmtDate(formData.opening_date));
                                setFormData(prev => ({ ...prev, fitout_period_end: '' }));
                            }
                        }}
                    />
                    {formData.unit_handover_date && (
                        <small style={{ color: '#64748b', fontSize: '11px' }}>
                            Must be ≥ Handover ({fmtDate(formData.unit_handover_date)})
                        </small>
                    )}
                </div>
            </div>

            {/* ── Rent Free Period ── */}
            <h4 style={{ margin: '24px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Rent Free Period</h4>
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
                            onBlur={(e) => handleDateBlur('rent_free_end_date', e.target.value, {
                                minField: 'rent_free_start_date', label: 'Rent Free End', minLabel: 'Rent Free Start'
                            })}
                        />
                    </div>
                </div>
            )}

            {/* ── Store Open Date & Rent Commencement (BELOW Rent Free) ── */}
            <div className="form-row" style={{ gap: '12px', marginTop: '14px' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    <label>Store Open Date</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.opening_date || ''}
                        min={formData.fitout_period_end || formData.unit_handover_date || formData.lease_start || undefined}
                        max={formData.lease_end || undefined}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, opening_date: val });
                        }}
                        onBlur={(e) => {
                            const val = e.target.value;
                            // Store open must be after fitout end
                            if (formData.fitout_period_end && val < formData.fitout_period_end) {
                                alert('Store Open Date cannot be before Fitout Period End (' + fmtDate(formData.fitout_period_end) + ').');
                                setFormData(prev => ({ ...prev, opening_date: '' }));
                                return;
                            }
                            // Store open must be after handover
                            if (formData.unit_handover_date && val < formData.unit_handover_date) {
                                alert('Store Open Date cannot be before Unit Handover Date.');
                                setFormData(prev => ({ ...prev, opening_date: '' }));
                                return;
                            }
                            if (formData.lease_end && val > formData.lease_end) {
                                alert('Store Open Date must be within lease period.');
                                setFormData(prev => ({ ...prev, opening_date: '' }));
                            }
                        }}
                    />
                    {formData.fitout_period_end && (
                        <small style={{ color: '#64748b', fontSize: '11px' }}>
                            Must be ≥ Fitout End ({fmtDate(formData.fitout_period_end)})
                        </small>
                    )}
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    <label>Rent Commencement Date *</label>
                    <input
                        type="date"
                        className="form-control"
                        value={formData.rent_commencement_date || ''}
                        min={rentFreeEnd || formData.opening_date || undefined}
                        onChange={(e) => setFormData({ ...formData, rent_commencement_date: e.target.value })}
                        onBlur={(e) => {
                            const val = e.target.value;
                            // Rent commencement cannot be before rent free end (if rent free exists)
                            if (rentFreeEnd && val < rentFreeEnd) {
                                alert('Rent Commencement Date cannot be before Rent Free End Date (' + fmtDate(rentFreeEnd) + ').');
                                setFormData(prev => ({ ...prev, rent_commencement_date: '' }));
                                return;
                            }
                            // Rent commencement should not be before store open date
                            if (formData.opening_date && val < formData.opening_date) {
                                alert('Rent Commencement Date cannot be before Store Open Date (' + fmtDate(formData.opening_date) + ').');
                                setFormData(prev => ({ ...prev, rent_commencement_date: '' }));
                                return;
                            }
                            // Rent commencement cannot be before lease start
                            if (formData.lease_start && val < formData.lease_start) {
                                alert('Rent Commencement Date cannot be before Lease Start Date.');
                                setFormData(prev => ({ ...prev, rent_commencement_date: '' }));
                            }
                        }}
                    />
                    {rentFreeEnd && (
                        <small style={{ color: '#dc2626', fontSize: '11px' }}>
                            Must be ≥ Rent Free End ({fmtDate(rentFreeEnd)})
                        </small>
                    )}
                    {!rentFreeEnd && formData.opening_date && (
                        <small style={{ color: '#64748b', fontSize: '11px' }}>
                            Must be ≥ Store Open ({fmtDate(formData.opening_date)})
                        </small>
                    )}
                </div>
            </div>

            {/* ── Lock-in & Notice Periods ── */}
            <h4 style={{ margin: '24px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Lock-in &amp; Notice Periods</h4>

            {/* Lock-in Periods (in Days) */}
            <div className="form-row" style={{ gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Lessee Lock-in Period (Days)</label>
                    <input type="number" step="1" className="form-control" placeholder="e.g. 365" min="0"
                        value={formData.lessee_lockin_period_days || ''}
                        onChange={(e) => setFormData({ ...formData, lessee_lockin_period_days: e.target.value })}
                    />
                    {formData.lessee_lockin_period_days > 0 && rentCommBase && (
                        <div style={{ marginTop: '6px', padding: '8px 10px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                            <span style={{ color: '#1e40af', fontSize: '12px', fontWeight: '600' }}>Lock-in Ends:</span>
                            <span style={{ color: '#1e40af', fontSize: '12px', marginLeft: '6px' }}>{fmtDate(lesseeLockEnd)}</span>
                        </div>
                    )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Lessor Lock-in Period (Days)</label>
                    <input type="number" step="1" className="form-control" placeholder="e.g. 365" min="0"
                        value={formData.lessor_lockin_period_days || ''}
                        onChange={(e) => setFormData({ ...formData, lessor_lockin_period_days: e.target.value })}
                    />
                    {formData.lessor_lockin_period_days > 0 && rentCommBase && (
                        <div style={{ marginTop: '6px', padding: '8px 10px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                            <span style={{ color: '#1e40af', fontSize: '12px', fontWeight: '600' }}>Lock-in Ends:</span>
                            <span style={{ color: '#1e40af', fontSize: '12px', marginLeft: '6px' }}>{fmtDate(lessorLockEnd)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Notice Periods (in DAYS) */}
            <div className="form-row" style={{ gap: '12px', marginTop: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Lessee Notice Period (Days)</label>
                    <input type="number" step="1" className="form-control" placeholder="e.g. 90" min="0"
                        value={formData.lessee_notice_period_days || ''}
                        onChange={(e) => setFormData({ ...formData, lessee_notice_period_days: e.target.value })}
                    />
                    {lesseeNoticeDays > 0 && formData.lease_end && (
                        <div style={{ marginTop: '6px', padding: '8px 10px', background: '#f5f3ff', borderRadius: '6px', border: '1px solid #ddd6fe' }}>
                            <span style={{ color: '#6d28d9', fontSize: '12px', fontWeight: '600' }}>Notice Deadline:</span>
                            <span style={{ color: '#6d28d9', fontSize: '12px', marginLeft: '6px' }}>{fmtDate(lesseeNoticeDeadline)}</span>
                            {lesseeLockEnd && (
                                <span style={{ color: '#6d28d9', fontSize: '11px', marginLeft: '8px' }}>| Exit after: {fmtDate(lesseeLockEnd)}</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Lessor Notice Period (Days)</label>
                    <input type="number" step="1" className="form-control" placeholder="e.g. 90" min="0"
                        value={formData.lessor_notice_period_days || ''}
                        onChange={(e) => setFormData({ ...formData, lessor_notice_period_days: e.target.value })}
                    />
                    {lessorNoticeDays > 0 && formData.lease_end && (
                        <div style={{ marginTop: '6px', padding: '8px 10px', background: '#f5f3ff', borderRadius: '6px', border: '1px solid #ddd6fe' }}>
                            <span style={{ color: '#6d28d9', fontSize: '12px', fontWeight: '600' }}>Notice Deadline:</span>
                            <span style={{ color: '#6d28d9', fontSize: '12px', marginLeft: '6px' }}>{fmtDate(lessorNoticeDeadline)}</span>
                            {lessorLockEnd && (
                                <span style={{ color: '#6d28d9', fontSize: '11px', marginLeft: '8px' }}>| Exit after: {fmtDate(lessorLockEnd)}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Step2TermsFinalization;
