import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/admin/dashboard";
import Projects from "./components/admin/Projects";
import ProjectDetails from "./components/admin/ProjectDetails";
import Settings from "./components/admin/Settings";
import RoleManagement from "./components/admin/RoleManagement";
import TenantList from "./components/admin/TenantList"; // Updated import
import AddTenant from "./components/admin/AddTenant";
import TenantDetails from "./components/admin/TenantDetails";
import OwnerList from "./components/admin/OwnerList";
import AddOwner from "./components/admin/AddOwner";
import OwnerDetails from "./components/admin/OwnerDetails";
import PartyMaster from "./components/admin/PartyMaster"; // New Party Master Component

import AddParty from "./components/admin/AddParty";
import EditParty from "./components/admin/EditParty";
import OwnershipMapping from "./components/admin/OwnershipMapping";
import ActivityLogs from "./components/admin/ActivityLogs";
import AddProject from "./components/admin/AddProject";
import EditProject from "./components/admin/EditProject";
import Units from "./components/admin/Units";
import AddUnit from "./components/admin/AddUnit";
import EditUnit from "./components/admin/EditUnit";
import UnitDetails from "./components/admin/UnitDetails";
import AdminNotifications from "./components/admin/AdminNotifications"; // Imported
import LeaseDashboard from "./components/lease-management/LeaseDashboard";
import LeaseReports from "./components/lease-management/LeaseReports";
import ReviewCenter from "./components/lease-management/ReviewCenter";
import LeaseTracker from "./components/lease-management/LeaseTracker";
import RepDashboard from "./components/management-rep/RepDashboard";
import Reports from "./components/management-rep/Reports";
import SearchFilters from "./components/management-rep/SearchFilters";
import Notifications from "./components/management-rep/Notifications";
import RepSettings from "./components/management-rep/RepSettings";
import Leases from "./components/admin/Leases";
import AddLease from "./components/admin/AddLease";
import EditLease from "./components/admin/EditLease";
import LeaseDetails from "./components/admin/LeaseDetails";
import LeaseValidation from "./components/lease-management/LeaseValidation";
import LeaseLifecycle from "./components/lease-management/LeaseLifecycle";
import LeaseReminders from "./components/lease-management/LeaseReminders";
import LeaseList from "./components/lease-management/LeaseList";
import LeaseDetailsManager from "./components/lease-management/LeaseDetailsManager";
import LeaseTrackingDetails from "./components/lease-management/LeaseTrackingDetails";
import LeaseReportDetails from "./components/lease-management/LeaseReportDetails";
import LeaseNotifications from "./components/lease-management/LeaseNotifications";

import DocRepo from "./components/management-rep/doc-repo";
import Login from "./components/Login/Login";
import Logout from "./components/Logout/Logout";
import './App.css';

// Force Rebuild
import CreateUser from './components/admin/CreateUser';
import EditTenant from './components/admin/EditTenant';
import EditOwner from './components/admin/EditOwner';
import DataEntryDashboard from "./components/data-entry/DataEntryDashboard";
import PendingProjects from "./components/data-entry/PendingProjects";
import PendingApprovals from "./components/data-entry/PendingApprovals";
import PastEntries from "./components/data-entry/PastEntries";
import DataEntrySelection from "./components/data-entry/DataEntrySelection";
import ProjectDataEntry from "./components/data-entry/ProjectDataEntry";
import UnitDataEntry from "./components/data-entry/UnitDataEntry";
import MasterDataEntry from "./components/data-entry/MasterDataEntry";
import AddMasterDataEntry from "./components/data-entry/AddMasterDataEntry";
import OwnershipDataEntry from "./components/data-entry/OwnershipDataEntry";
import SubmissionDetails from "./components/data-entry/SubmissionDetails";
import TenantDataEntry from "./components/data-entry/TenantDataEntry";
import LeaseDataEntry from "./components/data-entry/LeaseDataEntry";
import DocumentUploadCenter from "./components/data-entry/DocumentUploadCenter";
import SubmissionTracking from "./components/data-entry/SubmissionTracking";
import NotificationCenter from "./components/data-entry/NotificationCenter";
import ApprovalRequestDetail from "./components/data-entry/ApprovalRequestDetail";
import ApprovedSubmissions from "./components/data-entry/ApprovedSubmissions";
import RejectedSubmissions from "./components/data-entry/RejectedSubmissions";

import TestKycModal from "./components/admin/TestKycModal";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/test-kyc-modal" element={<TestKycModal />} />
        {/* Default route redirects to Login or Dashboard */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/create-user" element={<CreateUser />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/projects" element={<Projects />} />
        <Route path="/admin/projects/:id" element={<ProjectDetails />} />
        <Route path="/admin/add-project" element={<AddProject />} />
        <Route path="/admin/edit-project/:id" element={<EditProject />} />

        {/* Unit Management */}
        <Route path="/admin/units" element={<Units />} />
        <Route path="/admin/add-unit" element={<AddUnit />} />
        <Route path="/admin/edit-unit/:id" element={<EditUnit />} />
        <Route path="/admin/view-unit/:id" element={<UnitDetails />} />
        <Route path="/admin/leases" element={<Leases />} />
        <Route path="/admin/add-lease" element={<AddLease />} />
        <Route path="/admin/edit-lease/:id" element={<EditLease />} />
        <Route path="/admin/view-lease/:id" element={<LeaseDetails />} />

        {/* Other Admin Modules */}
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/role-management" element={<RoleManagement />} />
        <Route path="/admin/create-user" element={<CreateUser />} />

        {/* Tenant Routes */}
        <Route path="/admin/tenants" element={<TenantList />} />
        <Route path="/admin/tenant" element={<Navigate to="/admin/tenants" replace />} />
        <Route path="/admin/tenant/add" element={<AddTenant />} />
        <Route path="/admin/add-tenant" element={<AddTenant />} />
        <Route path="/admin/tenant/edit/:id" element={<EditTenant />} />
        <Route path="/admin/tenant/:id" element={<TenantDetails />} />

        {/* Master Route - Deprecated
        <Route path="/admin/master" element={<Master />} /> 
        */}

        {/* Party Master Routes (Replaces Owner/Tenant) */}
        <Route path="/admin/parties" element={<PartyMaster />} />
        <Route path="/admin/parties/add" element={<AddParty />} />
        <Route path="/admin/parties/edit/:id" element={<EditParty />} />

        <Route path="/admin/ownership-mapping" element={<OwnershipMapping />} />

        {/* Legacy Owner Routes (Can be deprecated later) */}
        <Route path="/admin/owner" element={<OwnerList />} />
        <Route path="/admin/owners" element={<OwnerList />} />
        <Route path="/admin/owner/add" element={<AddOwner />} />
        <Route path="/admin/owners/add" element={<AddOwner />} />
        <Route path="/admin/owner/edit/:id" element={<EditOwner />} />
        <Route path="/admin/owner/:id" element={<OwnerDetails />} />

        <Route path="/admin/notifications" element={<AdminNotifications />} /> {/* New Route */}
        <Route path="/admin/activity-logs" element={<ActivityLogs />} />


        {/* Management Rep Routes */}
        <Route path="/doc-repo" element={<DocRepo />} />

        {/* Lease Management Suite */}
        <Route path="/lease/dashboard" element={<LeaseDashboard />} />
        <Route path="/lease-manager/dashboard" element={<LeaseDashboard />} />

        {/* Tracking */}
        <Route path="/lease/tracking" element={<LeaseTracker />} />
        <Route path="/lease/tracking/:id" element={<LeaseTrackingDetails />} />

        {/* Reports */}
        <Route path="/lease/reports" element={<LeaseReports />} />
        <Route path="/lease/reports/:reportType" element={<LeaseReportDetails />} />
        <Route path="/lease/notifications" element={<LeaseNotifications />} />

        {/* Reminders */}
        <Route path="/lease/reminders" element={<LeaseReminders />} />

        {/* Reviews/Approvals */}
        <Route path="/lease/reviews" element={<LeaseList />} />
        <Route path="/lease/review/:id" element={<LeaseDetailsManager />} />

        {/* Legacy/Other Routes */}
        <Route path="/lease/validation" element={<LeaseValidation />} />
        <Route path="/lease/lifecycle" element={<LeaseLifecycle />} />
        <Route path="/management/dashboard" element={<RepDashboard />} />
        <Route path="/management/reports" element={<Reports />} />
        <Route path="/management/search" element={<SearchFilters />} />
        <Route path="/management/notifications" element={<Notifications />} />
        <Route path="/management/review-center" element={<ReviewCenter />} />
        <Route path="/management/lease-tracker" element={<LeaseTracker />} />
        <Route path="/management/settings" element={<RepSettings />} />

        {/* Data Entry Routes */}
        <Route path="/data-entry/dashboard" element={<DataEntryDashboard />} />
        <Route path="/data-entry/add-data" element={<DataEntrySelection />} />
        <Route path="/data-entry/pending-projects" element={<PendingProjects />} />
        <Route path="/data-entry/pending-approvals" element={<PendingApprovals />} />
        <Route path="/data-entry/past-entries" element={<PastEntries />} />

        {/* Specific Data Entry Forms */}
        <Route path="/data-entry/add-project-data" element={<ProjectDataEntry />} />
        <Route path="/data-entry/project/:id" element={<ProjectDataEntry />} />
        <Route path="/data-entry/add-unit-data" element={<UnitDataEntry />} />
        <Route path="/data-entry/add-master-data" element={<MasterDataEntry />} />
        <Route path="/data-entry/add-master-data/add" element={<AddMasterDataEntry />} />
        <Route path="/data-entry/add-ownership-data" element={<OwnershipDataEntry />} />

        {/* Detail View */}
        <Route path="/data-entry/submission/:id" element={<SubmissionDetails />} />
        <Route path="/data-entry/add-tenant-data" element={<TenantDataEntry />} />
        <Route path="/data-entry/add-lease-data" element={<LeaseDataEntry />} />
        <Route path="/data-entry/bulk-upload" element={<DocumentUploadCenter />} />
        <Route path="/data-entry/submission-tracking" element={<SubmissionTracking />} />
        <Route path="/data-entry/notifications" element={<NotificationCenter />} />
        <Route path="/data-entry/approval-request/:id" element={<ApprovalRequestDetail />} />
        <Route path="/data-entry/approved-today" element={<ApprovedSubmissions />} />
        <Route path="/data-entry/rejected-submissions" element={<RejectedSubmissions />} />

      </Routes >
    </BrowserRouter >
  );
}

export default App;
