import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Step1BasicDetails from './lease-creation/Step1BasicDetails';
import Step2TermsFinalization from './lease-creation/Step2TermsFinalization';
import Step3RentConfig from './lease-creation/Step3RentConfig';
import Step4Escalations from './lease-creation/Step4Escalations';
import Step5DocsExecute from './lease-creation/Step5DocsExecute';
import { leaseAPI, getProjects, unitAPI, partyAPI, ownershipAPI, handleApiError } from '../../services/api';
import './AddLease.css';
import './dashboard.css';

const AddLease = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [rentModel, setRentModel] = useState('Fixed'); // 'Fixed' | 'RevenueShare' | 'Hybrid'
    const [isSubLease, setIsSubLease] = useState(false);

    // Data States
    const [projects, setProjects] = useState([]);
    const [units, setUnits] = useState([]);
    const [parties, setParties] = useState([]);
    const [activeOwner, setActiveOwner] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        project_id: '',
        unit_id: '',
        party_owner_id: '',  // For direct lease
        party_tenant_id: '', // For direct lease / Subtenant
        sub_tenant_id: '',   // For Subtenant lease
        lease_type: '',
        rent_model: 'Fixed',
        sub_lease_area_sqft: '',
        lease_start: '',
        lease_end: '',
        rent_commencement_date: '',
        fitout_period_end: '',
        tenure_months: '',
        lockin_period_months: '',
        notice_period_months: '',
        monthly_rent: '',
        monthly_net_sales: '', // ADDED THIS
        cam_charges: '',
        billing_frequency: 'Monthly',
        payment_due_day: '1st of Month',
        currency_code: 'INR',
        security_deposit: '',
        utility_deposit: '',
        deposit_type: 'Cash',
        revenue_share_percentage: '',
        revenue_share_applicable_on: 'Net Sales',

        // New Dates
        fitout_period_start: '',
        notice_vacation_date: '',
        opening_date: '',
        rent_free_start_date: '',
        rent_free_end_date: '',
        loi_date: '',
        agreement_date: '',
        registration_date: '',
        status: 'draft',
    });



    const [files, setFiles] = useState({}); // Store files

    const [escalationSteps, setEscalationSteps] = useState([
        { effectiveDate: '', effectiveToDate: '', increaseType: 'Percentage (%)', value: '', escalation_on: 'mg' }
    ]);

    const [submitMessage, setSubmitMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, partiesRes] = await Promise.all([
                    getProjects(),
                    partyAPI.getAllParties()
                ]);
                setProjects(projectsRes.data?.data || []);
                setParties(partiesRes.data || []);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                alert('Error loading form data');
            }
        };
        fetchData();
    }, []);

    // Handle Unit Logic
    const handleUnitChange = async (val, currentIsSubLease = isSubLease) => {
        const unitId = parseInt(val);
        setFormData(prev => ({ ...prev, unit_id: val }));

        try {
            if (!currentIsSubLease) {
                // Main Lease: Fetch active owner
                const res = await ownershipAPI.getOwnersByUnit(unitId);
                const owners = res.data || [];
                const active = owners.find(o => o.ownership_status === 'Active');

                if (active) {
                    setActiveOwner(active);
                    setFormData(prev => ({ ...prev, unit_id: val, party_owner_id: active.party_id }));
                } else {
                    setActiveOwner(null);
                    setFormData(prev => ({ ...prev, unit_id: val, party_owner_id: '' }));
                }
            } else {
                // Sub Lease: Get main lessee for unit
                const res = await leaseAPI.getMainLesseeForUnit(unitId);
                if (res.data && res.data.party_tenant_id) {
                    setFormData(prev => ({ ...prev, unit_id: val, party_tenant_id: res.data.party_tenant_id }));
                } else {
                    setFormData(prev => ({ ...prev, unit_id: val, party_tenant_id: '' }));
                }
            }
        } catch (e) {
            console.error("Failed to fetch unit relations", e);
        }
    };

    // Load units when project changes
    useEffect(() => {
        if (formData.project_id) {
            const fetchUnits = async () => {
                try {
                    const res = await unitAPI.getUnitsByProject(formData.project_id);
                    setUnits(Array.isArray(res.data) ? res.data : (res.data?.data || []));
                } catch (e) { console.error(e); }
            };
            fetchUnits();
        } else {
            setUnits([]);
        }
    }, [formData.project_id]);

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [fieldName]: file }));
        }
    };

    // When lease type changes, we should re-trigger handleUnitChange or clear
    useEffect(() => {
        if (formData.unit_id) {
            handleUnitChange(formData.unit_id, isSubLease);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSubLease]);

    // Validation & Navigation
    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.project_id || !formData.unit_id || (!isSubLease && !formData.party_tenant_id)) {
                alert("Please fill all required Basic Details (Project, Unit, Tenant).");
                return;
            }
            if (!isSubLease && !formData.party_owner_id) {
                alert("Selected Unit has no active Owner. Cannot proceed.");
                return;
            }
            if (isSubLease && (!formData.sub_tenant_id || !formData.sub_lease_area_sqft)) {
                alert("Sub-tenant and Area are required.");
                return;
            }
            if (parseInt(formData.party_owner_id) === parseInt(formData.party_tenant_id)) {
                alert("Owner and Tenant cannot be the same.");
                return;
            }
            if (isSubLease && parseInt(formData.sub_tenant_id) === parseInt(formData.party_tenant_id)) {
                alert("Sub Tenant and Main Tenant cannot be the same.");
                return;
            }
        }
        if (currentStep === 2) {
            if (!formData.lease_start || !formData.lease_end || !formData.unit_handover_date || !formData.rent_commencement_date) {
                alert("Please fill all mandatory Term fields: Lease Start, Lease End, Rent Commencement, and Unit Handover Date.");
                return;
            }
            if (formData.has_rent_free_period && (!formData.rent_free_start_date || !formData.rent_free_end_date)) {
                alert("Please fill Rent Free Start and End Dates, or disable the Rent Free Period.");
                return;
            }
        }
        if (currentStep === 3) {
            // Rent config validation
            if (!formData.billing_frequency || !formData.payment_due_day || !formData.currency_code) {
                alert("Please fill essential billing details: Frequency, Due Day, and Currency.");
                return;
            }
            if (rentModel === 'RevenueShare' || rentModel === 'Hybrid') {
                if (!formData.revenue_share_percentage) {
                    alert("Please provide the Revenue Share Percentage.");
                    return;
                }
            }
        }
        if (currentStep === 4) {
            // Escalations validation
            if (!formData.base_rent_effective_to) {
                alert("Please provide the Base Rent Effective Till Date for escalations calculation.");
                return;
            }
            for (let i = 0; i < escalationSteps.length; i++) {
                const step = escalationSteps[i];
                const resolvedEffectiveDate = step.effectiveDate || (i === 0 && formData.base_rent_effective_to ? 'auto' : '');

                let missing = [];
                if (!resolvedEffectiveDate) missing.push("Effective From Date");
                if (!step.effectiveToDate) missing.push("Effective To Date");
                if (!step.increaseType) missing.push("Change Type");

                const needsNoValue = ['Remove MG', 'Remove Revenue Share'].includes(step.increaseType);
                if (!needsNoValue && !step.value) missing.push("Change Value");

                if (missing.length > 0) {
                    alert(`Escalation #${i + 1} is missing: ${missing.join(", ")}. Please fill them or remove the escalation.`);
                    return;
                }
            }
        }

        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    // Helpers for Escalations
    const addEscalationStep = () => {
        setEscalationSteps([...escalationSteps, { effectiveDate: '', effectiveToDate: '', increaseType: 'Percentage (%)', value: '' }]);
    };

    const removeEscalationStep = (index) => {
        setEscalationSteps(escalationSteps.filter((_, i) => i !== index));
    };

    // Final Submit
    const handleSubmit = async () => {
        if (isSubmitting) return; // Prevent double clicking
        setIsSubmitting(true);
        try {
            // Transform Data
            const escalations = escalationSteps
                .map((step, index) => {
                    const resolvedEffectiveDate = step.effectiveDate || (index === 0 && formData.base_rent_effective_to ? new Date(new Date(formData.base_rent_effective_to).getTime() + 86400000).toISOString().split('T')[0] : '');
                    return {
                        ...step,
                        resolvedEffectiveDate
                    };
                })
                .filter(step => step.resolvedEffectiveDate && step.value)
                .map((step) => ({
                    effective_from: step.resolvedEffectiveDate,
                    effective_to: step.effectiveToDate || null,
                    increase_type: step.increaseType === 'Percentage (%)' ? 'Percentage' : step.increaseType,
                    value: parseFloat(step.value),
                    escalation_on: step.escalation_on || null
                }));

            // Calculate tenure
            const startDate = new Date(formData.lease_start);
            const endDate = new Date(formData.lease_end);
            const tenureMonths = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));

            const payload = {
                ...formData,
                project_id: parseInt(formData.project_id),
                unit_id: parseInt(formData.unit_id),
                party_owner_id: isSubLease ? null : parseInt(formData.party_owner_id),
                party_tenant_id: parseInt(formData.party_tenant_id),
                sub_tenant_id: isSubLease ? parseInt(formData.sub_tenant_id) : null,
                lease_type: isSubLease ? 'Subtenant lease' : 'Direct lease',
                rent_model: rentModel,
                sub_lease_area_sqft: isSubLease ? (parseFloat(formData.sub_lease_area_sqft) || 0) : null,
                lease_start: formData.lease_start,
                lease_end: formData.lease_end,
                rent_commencement_date: formData.rent_commencement_date,
                fitout_period_end: formData.fitout_period_end || null,
                tenure_months: tenureMonths,
                lockin_period_months: parseInt(formData.lockin_period_months) || 12,
                notice_period_months: parseInt(formData.notice_period_months) || 3,
                monthly_rent: parseFloat(formData.monthly_rent) || 0,
                monthly_net_sales: parseFloat(formData.monthly_net_sales) || 0,
                cam_charges: parseFloat(formData.cam_charges) || 0,
                billing_frequency: formData.billing_frequency,
                payment_due_day: formData.payment_due_day,
                currency_code: formData.currency_code,
                security_deposit: parseFloat(formData.security_deposit) || 0,
                utility_deposit: parseFloat(formData.utility_deposit) || 0,
                deposit_type: formData.deposit_type,
                // Hybrid Logic: Pass both logic if needed, or adjust backend to accept minimum_guarantee
                vehicle_parking_slots: 0, // Default placeholders

                // Revenue Share Logic
                revenue_share_percentage: (rentModel === 'RevenueShare' || rentModel === 'Hybrid') ? (parseFloat(formData.revenue_share_percentage) || 0) : null,
                revenue_share_applicable_on: (rentModel === 'RevenueShare' || rentModel === 'Hybrid') ? formData.revenue_share_applicable_on : null,

                // Rent Free Period
                rent_free_start_date: formData.rent_free_start_date || null,
                rent_free_end_date: formData.rent_free_end_date || null,

                escalations: escalations,

                // Docs Data (Dates) - Backend might need schema update for these fields or store in metadata/JSON
                loi_date: formData.loi_date,
                agreement_date: formData.agreement_date,
                deposit_payment_date: formData.deposit_payment_date,
                registration_date: formData.registration_date,

                // New Date Fields
                fitout_period_start: formData.fitout_period_start || null,
                notice_vacation_date: formData.notice_vacation_date || null,
                opening_date: formData.opening_date || null
            };

            // Send via FormData to handle files
            const formDataPayload = new FormData();
            formDataPayload.append('leaseData', JSON.stringify(payload));
            if (files.loi_document) formDataPayload.append('loi_document', files.loi_document);
            if (files.agreement_document) formDataPayload.append('agreement_document', files.agreement_document);
            if (files.registration_document) formDataPayload.append('registration_document', files.registration_document);

            console.log("Submitting Lease Payload:", payload);
            await leaseAPI.createLease(formDataPayload);
            setSubmitMessage('Lease created successfully!');
            setTimeout(() => navigate('/admin/leases'), 2000);

        } catch (error) {
            console.error(error);
            alert("Failed to create lease: " + handleApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="breadcrumb">
                        <Link to="/admin/dashboard">HOME</Link> &gt; <Link to="/admin/leases">LEASES</Link> &gt; <span className="active">ADD NEW</span>
                    </div>
                    <h1>Add New Lease</h1>
                    <p>Step {currentStep} of 5: {
                        currentStep === 1 ? 'Basic Details' :
                            currentStep === 2 ? 'Term Finalization' :
                                currentStep === 3 ? 'Rent Config' :
                                    currentStep === 4 ? 'Escalations' : 'Docs Execution'
                    }</p>
                </header>

                <div className="form-layout wizard-container">
                    {/* Stepper UI */}
                    <div className="stepper">
                        <div className={`step ${currentStep >= 1 ? 'completed' : ''}`}>1. Basics</div>
                        <div className="line"></div>
                        <div className={`step ${currentStep >= 2 ? 'completed' : ''}`}>2. Terms</div>
                        <div className="line"></div>
                        <div className={`step ${currentStep >= 3 ? 'completed' : ''}`}>3. Rent</div>
                        <div className="line"></div>
                        <div className={`step ${currentStep >= 4 ? 'completed' : ''}`}>4. Escalations</div>
                        <div className="line"></div>
                        <div className={`step ${currentStep >= 5 ? 'completed' : ''}`}>5. Docs</div>
                    </div>

                    {/* Steps Rendering */}
                    {currentStep === 1 && (
                        <Step1BasicDetails
                            formData={formData}
                            setFormData={setFormData}
                            projects={projects}
                            units={units}
                            parties={parties}
                            handleUnitChange={handleUnitChange}
                            activeOwner={activeOwner}
                            rentModel={rentModel}
                            setRentModel={setRentModel}
                            isSubLease={isSubLease}
                            setIsSubLease={setIsSubLease}
                        />
                    )}

                    {currentStep === 2 && (
                        <Step2TermsFinalization
                            formData={formData}
                            setFormData={setFormData}
                            selectedProject={projects.find(p => p.id === parseInt(formData.project_id))}
                            selectedUnit={units.find(u => u.id === parseInt(formData.unit_id))}
                        />
                    )}

                    {currentStep === 3 && (
                        <Step3RentConfig
                            rentModel={rentModel}
                            formData={formData}
                            setFormData={setFormData}
                            selectedProject={projects.find(p => p.id === parseInt(formData.project_id))}
                            selectedUnit={units.find(u => u.id === parseInt(formData.unit_id))}
                            isSubLease={isSubLease}
                        />
                    )}

                    {currentStep === 4 && (
                        <Step4Escalations
                            escalationSteps={escalationSteps}
                            setEscalationSteps={setEscalationSteps}
                            addEscalationStep={addEscalationStep}
                            removeEscalationStep={removeEscalationStep}
                            formData={formData}
                            setFormData={setFormData}
                            rentModel={rentModel}
                        />
                    )}

                    {currentStep === 5 && (
                        <Step5DocsExecute
                            formData={formData}
                            setFormData={setFormData}
                            handleFileChange={handleFileChange}
                            files={files}
                        />
                    )}

                    {/* Navigation Actions */}
                    <div className="form-actions" style={{ marginTop: '30px', justifyContent: 'space-between' }}>
                        {currentStep > 1 ? (
                            <button className="secondary-btn" onClick={prevStep}>Back</button>
                        ) : (
                            <button className="secondary-btn" onClick={() => navigate('/admin/leases')}>Cancel</button>
                        )}

                        {currentStep < 5 ? (
                            <button className="primary-btn" onClick={nextStep} disabled={isSubmitting}>Next Step</button>
                        ) : (
                            <button className="primary-btn submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Create Lease'}
                            </button>
                        )}
                    </div>

                    {submitMessage && (
                        <div style={{ marginTop: '20px', padding: '15px', background: '#dcfce7', color: '#166534', borderRadius: '6px', textAlign: 'center' }}>
                            {submitMessage}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default AddLease;
