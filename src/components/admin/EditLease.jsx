import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import Step1BasicDetails from './lease-creation/Step1BasicDetails';
import Step2TermsFinalization from './lease-creation/Step2TermsFinalization';
import Step3RentConfig from './lease-creation/Step3RentConfig';
import Step4Escalations from './lease-creation/Step4Escalations';
import Step5DocsExecute from './lease-creation/Step5DocsExecute';
import { leaseAPI, getProjects, unitAPI, partyAPI, ownershipAPI } from '../../services/api';
import './AddLease.css';
import './dashboard.css';

const EditLease = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [rentModel, setRentModel] = useState('Fixed'); // 'Fixed' | 'RevenueShare' | 'Hybrid'
    const [isSubLease, setIsSubLease] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    // Data States
    const [projects, setProjects] = useState([]);
    const [units, setUnits] = useState([]);
    const [parties, setParties] = useState([]);
    const [activeOwner, setActiveOwner] = useState(null);

    // Form State mapped to DB identical to AddLease
    const [formData, setFormData] = useState({
        project_id: '',
        unit_id: '',
        party_owner_id: '',  
        party_tenant_id: '', 
        sub_tenant_id: '',   
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
        lessee_lockin_period_months: '',
        lessor_lockin_period_months: '',
        lessee_notice_period_months: '',
        lessor_notice_period_months: '',
        unit_handover_date: '',
        rent_amount_option: 'Option B',
        mg_amount_sqft: '',
        mg_amount: '',
        monthly_rent: '',
        monthly_net_sales: '', 
        cam_charges: '',
        billing_frequency: 'Monthly',
        payment_due_day: '1st of Month',
        currency_code: 'INR',
        security_deposit: '',
        utility_deposit: '',
        deposit_type: 'Cash',
        revenue_share_percentage: '',
        revenue_share_applicable_on: 'Net Sales',
        
        fitout_period_start: '',
        notice_vacation_date: '',
        opening_date: '',
        rent_free_start_date: '',
        rent_free_end_date: '',
        loi_date: '',
        agreement_date: '',
        registration_date: '',
        status: 'active',
    });
    // eslint-disable-next-line no-unused-vars
    const [files, setFiles] = useState({});
    const [escalationSteps, setEscalationSteps] = useState([]);

    // Fetch Initial Dropdown Data
    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [projectsRes, partiesRes] = await Promise.all([
                    getProjects(),
                    partyAPI.getAllParties()
                ]);
                setProjects(projectsRes.data?.data || []);
                setParties(partiesRes.data || []);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            }
        };
        fetchDropdowns();
    }, []);

    // Fetch Lease Data
    useEffect(() => {
        if (!id) return;
        const fetchLease = async () => {
            try {
                const res = await leaseAPI.getLeaseById(id);
                const data = res.data;
                
                const isSub = data.lease_type === 'Subtenant lease';
                setIsSubLease(isSub);
                setRentModel(data.rent_model || 'Fixed');

                const formatDate = (dateStr) => dateStr ? dateStr.substring(0, 10) : '';

                setFormData(prev => ({
                    ...prev,
                    project_id: data.project_id || '',
                    unit_id: data.unit_id || '',
                    party_owner_id: data.party_owner_id || '',
                    party_tenant_id: data.party_tenant_id || '',
                    sub_tenant_id: data.sub_tenant_id || '',
                    lease_type: data.lease_type || 'Direct lease',
                    rent_model: data.rent_model || 'Fixed',
                    sub_lease_area_sqft: data.sub_lease_area_sqft || '',
                    lease_start: formatDate(data.lease_start),
                    lease_end: formatDate(data.lease_end),
                    rent_commencement_date: formatDate(data.rent_commencement_date),
                    fitout_period_end: formatDate(data.fitout_period_end),
                    tenure_months: data.tenure_months || '',
                    lockin_period_months: data.lockin_period_months || '',
                    notice_period_months: data.notice_period_months || '',
                    lessee_lockin_period_months: data.lessee_lockin_period_months || '',
                    lessor_lockin_period_months: data.lessor_lockin_period_months || '',
                    lessee_notice_period_months: data.lessee_notice_period_months || '',
                    lessor_notice_period_months: data.lessor_notice_period_months || '',
                    unit_handover_date: formatDate(data.unit_handover_date),
                    rent_amount_option: data.rent_amount_option || 'Option B',
                    mg_amount_sqft: data.mg_amount_sqft || '',
                    mg_amount: data.mg_amount || '',
                    monthly_rent: data.monthly_rent || '',
                    monthly_net_sales: data.monthly_net_sales || '',
                    cam_charges: data.cam_charges || '',
                    billing_frequency: data.billing_frequency || 'Monthly',
                    payment_due_day: data.payment_due_day || '1st of Month',
                    currency_code: data.currency_code || 'INR',
                    security_deposit: data.security_deposit || '',
                    utility_deposit: data.utility_deposit || '',
                    deposit_type: data.deposit_type || 'Cash',
                    revenue_share_percentage: data.revenue_share_percentage || '',
                    revenue_share_applicable_on: data.revenue_share_applicable_on || 'Net Sales',
                    
                    fitout_period_start: formatDate(data.fitout_period_start),
                    notice_vacation_date: formatDate(data.notice_vacation_date),
                    opening_date: formatDate(data.opening_date),
                    rent_free_start_date: formatDate(data.rent_free_start_date),
                    rent_free_end_date: formatDate(data.rent_free_end_date),
                    loi_date: formatDate(data.loi_date),
                    agreement_date: formatDate(data.agreement_date),
                    registration_date: formatDate(data.registration_date),
                    status: data.status || 'active',
                }));

                setEscalationSteps(
                    (data.escalations || []).map(esc => ({
                        effectiveDate: formatDate(esc.effective_from),
                        effectiveToDate: formatDate(esc.effective_to),
                        increaseType: esc.increase_type === 'Fixed Amount' ? 'Fixed Amount' : (esc.increase_type === 'Rate Per Sqft' ? 'Rate Per Sqft' : 'Percentage (%)'),
                        value: esc.value,
                        escalation_on: esc.escalation_on || 'mg'
                    }))
                );
                
                // Fetch Units for this project to populate dropdown immediately
                if (data.project_id) {
                    const uRes = await unitAPI.getUnitsByProject(data.project_id);
                    setUnits(Array.isArray(uRes.data) ? uRes.data : (uRes.data?.data || []));
                }

            } catch (err) {
                console.error(err);
                alert("Failed to load lease details");
            }
        };
        fetchLease();
    }, [id]);

    // Handle Unit Logic
    const handleUnitChange = async (val, currentIsSubLease = isSubLease) => {
        const unitId = parseInt(val);
        setFormData(prev => ({ ...prev, unit_id: val }));

        try {
            if (!currentIsSubLease) {
                const res = await ownershipAPI.getOwnersByUnit(unitId);
                const owners = res.data || [];
                const active = owners.find(o => o.ownership_status === 'Active');

                if (active) {
                    setActiveOwner(active);
                    setFormData(prev => ({ ...prev, party_owner_id: active.party_id }));
                } else {
                    setActiveOwner(null);
                    setFormData(prev => ({ ...prev, party_owner_id: '' }));
                }
            } else {
                // Sub Lease: Get main lessee for unit
                const res = await leaseAPI.getMainLesseeForUnit(unitId);
                if (res.data && res.data.party_tenant_id) {
                    setFormData(prev => ({ ...prev, party_tenant_id: res.data.party_tenant_id }));
                } else {
                    setFormData(prev => ({ ...prev, party_tenant_id: '' }));
                }
            }
        } catch (e) {
            console.error("Failed to fetch unit relations", e);
        }
    };

    // When lease type changes, we should re-trigger handleUnitChange or clear
    useEffect(() => {
        if (formData.unit_id) {
            handleUnitChange(formData.unit_id, isSubLease);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSubLease]);

    // Load units when project changes
    useEffect(() => {
        if (formData.project_id && units.length === 0) { // Keep if empty, otherwise we already fetched above
            const fetchUnits = async () => {
                try {
                    const res = await unitAPI.getUnitsByProject(formData.project_id);
                    setUnits(Array.isArray(res.data) ? res.data : (res.data?.data || []));
                } catch (e) { console.error(e); }
            };
            fetchUnits();
        }
    }, [formData.project_id, units.length]);

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [fieldName]: file }));
        }
    };

    // Validation & Navigation
    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.project_id || !formData.unit_id || (!isSubLease && !formData.party_tenant_id)) {
                alert("Please fill all required fields.");
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const addEscalationStep = () => {
        setEscalationSteps([...escalationSteps, { effectiveDate: '', effectiveToDate: '', increaseType: 'Percentage (%)', value: '', escalation_on: 'mg' }]);
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
                .filter(step => step.effectiveDate && step.value)
                .map(step => ({
                    effective_from: step.effectiveDate,
                    effective_to: step.effectiveToDate || null,
                    increase_type: step.increaseType === 'Percentage (%)' ? 'Percentage' : (step.increaseType === 'Fixed Amount' ? 'Fixed Amount' : 'Rate Per Sqft'),
                    value: parseFloat(step.value),
                    escalation_on: step.escalation_on || 'mg'
                }));

            // Tenure validation rule 25 states Editing duration is blocked, but backend uses dates. We keep existing structure.
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
                tenure_months: isNaN(tenureMonths) ? formData.tenure_months : tenureMonths,
                lockin_period_months: parseInt(formData.lockin_period_months) || 0,
                notice_period_months: parseInt(formData.notice_period_months) || 0,
                lessee_lockin_period_months: parseInt(formData.lessee_lockin_period_months) || 0,
                lessor_lockin_period_months: parseInt(formData.lessor_lockin_period_months) || 0,
                lessee_notice_period_months: parseInt(formData.lessee_notice_period_months) || 0,
                lessor_notice_period_months: parseInt(formData.lessor_notice_period_months) || 0,
                monthly_rent: parseFloat(formData.monthly_rent) || 0,
                cam_charges: parseFloat(formData.cam_charges) || 0,
                revenue_share_percentage: (rentModel === 'RevenueShare' || rentModel === 'Hybrid') ? (parseFloat(formData.revenue_share_percentage) || 0) : null,
                revenue_share_applicable_on: (rentModel === 'RevenueShare' || rentModel === 'Hybrid') ? formData.revenue_share_applicable_on : null,
                escalations: escalations,
            };

            const formDataPayload = new FormData();
            formDataPayload.append('leaseData', JSON.stringify(payload));
            if (files.loi_document) formDataPayload.append('loi_document', files.loi_document);
            if (files.agreement_document) formDataPayload.append('agreement_document', files.agreement_document);
            if (files.registration_document) formDataPayload.append('registration_document', files.registration_document);

            await leaseAPI.updateLease(id, formDataPayload);
            setSubmitMessage('Lease updated successfully!');
            setTimeout(() => navigate('/admin/leases'), 2000);

        } catch (error) {
            console.error(error);
            alert("Failed to update lease: " + (error.response?.data?.message || error.message));
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
                        <Link to="/admin/dashboard">HOME</Link> &gt; <Link to="/admin/leases">LEASES</Link> &gt; <span className="active">EDIT LEASE '{id}'</span>
                    </div>
                    <h1>Edit Lease ID: {id}</h1>
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
                                {isSubmitting ? 'Submitting...' : 'Update Lease'}
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

export default EditLease;
