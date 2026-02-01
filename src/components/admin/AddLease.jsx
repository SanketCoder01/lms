import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Step1BasicDetails from './lease-creation/Step1BasicDetails';
import Step2Docs from './lease-creation/Step2Docs';
import Step2RentConfig from './lease-creation/Step2RentConfig';
import Step3Finalize from './lease-creation/Step3Finalize';
import Step4Escalations from './lease-creation/Step4Escalations';
import { leaseAPI, getProjects, unitAPI, partyAPI, ownershipAPI } from '../../services/api';
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
        party_owner_id: '',
        party_tenant_id: '',
        sub_tenant_id: '',
        sub_lease_area_sqft: '',
        lease_start: '',
        lease_end: '',
        rent_commencement_date: '',
        fitout_period_end: '',
        lockin_period_months: 12,
        notice_period_months: 3,
        monthly_rent: '',
        minimum_guarantee: '', // For Hybrid
        cam_charges: '',
        billing_frequency: 'Monthly',
        payment_due_day: '1st of Month',
        currency_code: 'INR',
        security_deposit: '',
        utility_deposit: '',
        deposit_type: 'Cash',
        revenue_share_percentage: '',
        revenue_share_applicable_on: 'Net Sales',

        // New Docs Fields
        loi_date: '',
        agreement_date: '',
        deposit_payment_date: '',
        registration_date: '',

        // Rent Free Period
        rent_free_start_date: '',
        rent_free_end_date: '',

        // Additional Dates & Validations
        fitout_period_start: '',
        notice_vacation_date: '',
        opening_date: ''
    });



    const [files, setFiles] = useState({}); // Store files

    const [escalationSteps, setEscalationSteps] = useState([
        { effectiveDate: '', effectiveToDate: '', increaseType: 'Percentage (%)', value: '' }
    ]);

    const [submitMessage, setSubmitMessage] = useState('');

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
    const handleUnitChange = async (val) => {
        const unitId = parseInt(val);
        setFormData(prev => ({ ...prev, unit_id: val }));

        try {
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
        } catch (e) {
            console.error("Failed to fetch unit owner", e);
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

    // Validation & Navigation
    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.project_id || !formData.unit_id || (!isSubLease && !formData.party_tenant_id)) {
                alert("Please fill all required fields.");
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
        // Step 2 is Docs - Optional or Basic Validation (dates) - skipping strict for now

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
        try {
            // Transform Data
            const escalations = escalationSteps
                .filter(step => step.effectiveDate && step.value)
                .map(step => ({
                    effective_from: step.effectiveDate,
                    effective_to: step.effectiveToDate || null,
                    increase_type: step.increaseType === 'Percentage (%)' ? 'Percentage' : 'Fixed Amount',
                    value: parseFloat(step.value)
                }));

            // Calculate tenure
            const startDate = new Date(formData.lease_start);
            const endDate = new Date(formData.lease_end);
            const tenureMonths = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));

            const payload = {
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

            // TODO: Append files to FormData if backend supports multipart/form-data for files + JSON
            // For now sending JSON payload. If files need upload, use FormData and append payload as string.

            console.log("Submitting Lease Payload:", payload);
            console.log("Files to upload:", files);
            await leaseAPI.createLease(payload);
            setSubmitMessage('Lease created successfully!');
            setTimeout(() => navigate('/admin/leases'), 2000);

        } catch (error) {
            console.error(error);
            alert("Failed to create lease: " + (error.response?.data?.message || error.message));
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
                    <p>Step {currentStep} of 4: {
                        currentStep === 1 ? 'Basic Details' :
                            currentStep === 2 ? 'Docs Execution' :
                                currentStep === 3 ? 'Terms & Rent' : 'Escalations'
                    }</p>
                </header>

                <div className="form-layout wizard-container">
                    {/* Stepper UI */}
                    <div className="stepper">
                        <div className={`step ${currentStep >= 1 ? 'completed' : ''}`}>1. Basics</div>
                        <div className="line"></div>
                        <div className={`step ${currentStep >= 2 ? 'completed' : ''}`}>2. Docs</div>
                        <div className="line"></div>
                        <div className={`step ${currentStep >= 3 ? 'completed' : ''}`}>3. Terms</div>
                        <div className="line"></div>
                        <div className={`step ${currentStep >= 4 ? 'completed' : ''}`}>4. Escalation</div>
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
                        <Step2Docs
                            formData={formData}
                            setFormData={setFormData}
                            handleFileChange={handleFileChange}
                        />
                    )}


                    {currentStep === 3 && (
                        <>
                            <Step2RentConfig // Renamed conceptually to Terms/Rent
                                rentModel={rentModel}
                                formData={formData}
                                setFormData={setFormData}
                                escalationSteps={[]} // Not used here anymore
                                setEscalationSteps={null}
                                selectedProject={projects.find(p => p.id === parseInt(formData.project_id))}
                                selectedUnit={units.find(u => u.id === parseInt(formData.unit_id))}
                            />
                            <Step3Finalize // Merging Terms here or keeping separate? 
                                // Ideally Step3Finalize should be part of this step or renamed
                                formData={formData}
                                setFormData={setFormData}
                                selectedProject={projects.find(p => p.id === parseInt(formData.project_id))}
                                selectedUnit={units.find(u => u.id === parseInt(formData.unit_id))}
                            />
                        </>
                    )}

                    {currentStep === 4 && (
                        <Step4Escalations
                            escalationSteps={escalationSteps}
                            setEscalationSteps={setEscalationSteps}
                            addEscalationStep={addEscalationStep}
                            removeEscalationStep={removeEscalationStep}
                        />
                    )}

                    {/* Navigation Actions */}
                    <div className="form-actions" style={{ marginTop: '30px', justifyContent: 'space-between' }}>
                        {currentStep > 1 ? (
                            <button className="secondary-btn" onClick={prevStep}>Back</button>
                        ) : (
                            <button className="secondary-btn" onClick={() => navigate('/admin/leases')}>Cancel</button>
                        )}

                        {currentStep < 4 ? (
                            <button className="primary-btn" onClick={nextStep}>Next Step</button>
                        ) : (
                            <button className="primary-btn submit-btn" onClick={handleSubmit}>Create Lease</button>
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
