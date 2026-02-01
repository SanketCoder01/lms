import React from 'react';

const Step1BasicDetails = ({
    formData,
    setFormData,
    projects,
    units,
    parties,
    handleUnitChange,
    activeOwner,
    rentModel,
    setRentModel,
    isSubLease,
    setIsSubLease
}) => {

    const handleLeaseTypeChange = (e) => {
        const isSub = e.target.value === 'sub_lease';
        setIsSubLease(isSub);
        if (isSub) {
            setRentModel('Fixed');
        }
    };

    return (
        <div className="form-section">
            <h3>Step 1: Basic Details & Configuration</h3>

            {/* Lease Type & Rent Model */}
            <div className="form-row">
                <div className="form-group">
                    <label>Lease Type</label>
                    <div className="radio-group">
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="leaseType"
                                value="direct"
                                checked={!isSubLease}
                                onChange={handleLeaseTypeChange}
                            />
                            Direct Lease
                        </label>
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="leaseType"
                                value="sub_lease"
                                checked={isSubLease}
                                onChange={handleLeaseTypeChange}
                            />
                            Sub Lease
                        </label>
                    </div>
                </div>

                <div className="form-group" style={{ opacity: isSubLease ? 0.5 : 1, pointerEvents: isSubLease ? 'none' : 'auto' }}>
                    <label>Rent Model</label>
                    <div className="radio-group">
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="rentModel"
                                value="Fixed"
                                checked={rentModel === 'Fixed'}
                                onChange={(e) => setRentModel(e.target.value)}
                            />
                            Fixed Rent
                        </label>
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="rentModel"
                                value="RevenueShare"
                                checked={rentModel === 'RevenueShare'}
                                onChange={(e) => setRentModel(e.target.value)}
                            />
                            Revenue Share
                        </label>

                    </div>
                    {isSubLease && <small style={{ color: '#e53e3e' }}>Sublease supports Fixed Rent only.</small>}
                </div>
            </div>

            {/* Property Selection */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Property</h4>
            <div className="form-row">
                <div className="form-group">
                    <label>Project *</label>
                    <select
                        value={formData.project_id}
                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                        className="form-control"
                    >
                        <option value="">Select Project</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.project_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Unit *</label>
                    <select
                        value={formData.unit_id}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        disabled={!formData.project_id}
                        className="form-control"
                    >
                        <option value="">Select Unit</option>
                        {units.map(unit => (
                            <option key={unit.id} value={unit.id}>
                                {unit.unit_number} - {unit.super_area} sqft {unit.status !== 'vacant' ? `(${unit.status})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Parties */}
            <h4 style={{ margin: '20px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Parties</h4>
            <div className="form-row">
                <div className="form-group">
                    <label>{isSubLease ? 'Sub Tenant *' : 'Master *'}</label>
                    <select
                        value={formData.party_tenant_id}
                        onChange={(e) => setFormData({ ...formData, party_tenant_id: e.target.value })}
                        className="form-control"
                    >
                        <option value="">Select Master</option>
                        {parties.map(party => (
                            <option key={party.id} value={party.id}>
                                {party.company_name || `${party.first_name} ${party.last_name}`} ({party.type})
                            </option>
                        ))}
                    </select>
                    {!isSubLease && formData.party_tenant_id && formData.party_owner_id && formData.party_tenant_id === formData.party_owner_id && (
                        <small className="error-text" style={{ color: 'red' }}>Owner and Tenant cannot be the same party.</small>
                    )}
                    {isSubLease && formData.party_tenant_id && formData.sub_tenant_id && formData.party_tenant_id === formData.sub_tenant_id && (
                        <small className="error-text" style={{ color: 'red' }}>Sub Tenant and Main Tenant cannot be the same party.</small>
                    )}
                </div>
                <div className="form-group">
                    <label>{isSubLease ? 'Main Tenant (Lessor) *' : 'Owner (Landlord) *'}</label>
                    {isSubLease ? (
                        <select
                            value={formData.sub_tenant_id} // Mapping sub_tenant logic correctly
                            onChange={(e) => setFormData({ ...formData, sub_tenant_id: e.target.value })}
                            className="form-control"
                        >
                            <option value="">Select Main Tenant</option>
                            {parties.map(party => (
                                <option key={party.id} value={party.id}>
                                    {party.company_name || `${party.first_name} ${party.last_name}`}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={activeOwner ? (activeOwner.company_name || `${activeOwner.first_name} ${activeOwner.last_name}`) : 'No Owner Assigned'}
                            readOnly
                            className="form-control"
                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                        />
                    )}
                    {!isSubLease && !activeOwner && formData.unit_id && (
                        <small className="error-text">Unit has no active owner. Please assign one in Ownership Mapping.</small>
                    )}
                </div>
            </div>

            {isSubLease && (
                <div className="form-row">
                    <div className="form-group">
                        <label>Sub Lease Area (sq ft) *</label>
                        <input
                            type="number"
                            placeholder="e.g. 500"
                            value={formData.sub_lease_area_sqft}
                            onChange={(e) => setFormData({ ...formData, sub_lease_area_sqft: e.target.value })}
                            className="form-control"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Step1BasicDetails;
