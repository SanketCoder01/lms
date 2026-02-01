import React from 'react';

const Step4Escalations = ({
    escalationSteps,
    setEscalationSteps,
    addEscalationStep,
    removeEscalationStep
}) => {
    return (
        <div className="form-section">
            <h3>Step 4: Rent Escalations</h3>
            <p className="helper-text">Define effective dates for rent increases. (Optional)</p>

            <div className="escalations-section" style={{ marginTop: '20px' }}>
                {escalationSteps.map((step, index) => (
                    <div className="escalation-row" key={index} style={{ display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'flex-end', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Effective Date</label>
                            <input type="date" className="form-control" value={step.effectiveDate} onChange={(e) => {
                                const newSteps = [...escalationSteps];
                                newSteps[index].effectiveDate = e.target.value;
                                setEscalationSteps(newSteps);
                            }} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Effective To (Optional)</label>
                            <input type="date" className="form-control" value={step.effectiveToDate} onChange={(e) => {
                                const newSteps = [...escalationSteps];
                                newSteps[index].effectiveToDate = e.target.value;
                                setEscalationSteps(newSteps);
                            }} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Type</label>
                            <select className="form-control" value={step.increaseType} onChange={(e) => {
                                const newSteps = [...escalationSteps];
                                newSteps[index].increaseType = e.target.value;
                                setEscalationSteps(newSteps);
                            }}>
                                <option>Percentage (%)</option>
                                <option>Fixed Amount</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Value</label>
                            <input type="number" className="form-control" value={step.value} onChange={(e) => {
                                const newSteps = [...escalationSteps];
                                newSteps[index].value = e.target.value;
                                setEscalationSteps(newSteps);
                            }} />
                        </div>
                        <button type="button" className="remove-btn" onClick={() => removeEscalationStep(index)} style={{ marginBottom: '5px', padding: '8px', background: '#ffe4e6', color: '#e11d48', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            X
                        </button>
                    </div>
                ))}

                <button type="button" className="add-btn" onClick={addEscalationStep} style={{ marginTop: '10px', padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>
                    + Add Escalation Step
                </button>
            </div>
        </div>
    );
};

export default Step4Escalations;
