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
import ViewParty from "./components/admin/ViewParty";
import FilterOptionsMaster from "./components/admin/masters/FilterOptionsMaster";
import OwnershipMapping from "./components/admin/OwnershipMapping";
import ActivityLogs from "./components/admin/ActivityLogs";
import AddProject from "./components/admin/AddProject";
import EditProject from "./components/admin/EditProject";
import Units from "./components/admin/Units";
import AddUnit from "./components/admin/AddUnit";
import EditUnit from "./components/admin/EditUnit";
import UnitDetails from "./components/admin/UnitDetails";
import AdminNotifications from "./components/admin/AdminNotifications"; // Imported
import UnitStructure from "./components/admin/UnitStructure";
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

// ── Super Admin Panel ──
import SuperAdminLogin from "./components/super-admin/SuperAdminLogin";
import SADashboard from "./components/super-admin/SADashboard";
import UserManagement from "./components/super-admin/UserManagement";
import RegistrationApprovals from "./components/super-admin/RegistrationApprovals";
import LiveActivity from "./components/super-admin/LiveActivity";
import Announcements from "./components/super-admin/Announcements";
import ModuleAssignment from "./components/super-admin/ModuleAssignment";

import GlobalHeartbeat from './components/GlobalHeartbeat';
import TopBanner from './components/TopBanner';
import ProtectedRoute from './components/ProtectedRoute';
import SessionKilledAlert from './components/admin/SessionKilledAlert';
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
      <GlobalHeartbeat />
      <TopBanner />
      <SessionKilledAlert />
      <Routes>
        <Route path="/test-kyc-modal" element={<TestKycModal />} />
        {/* Default route redirects to Login or Dashboard */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/create-user" element={<CreateUser />} />

        {/* ── Super Admin Panel ── */}
        {/* Login page at /admin (static: sanketg367@gmail.com / sanket@99) */}
        <Route path="/admin" element={<SuperAdminLogin />} />
        <Route path="/super-admin/dashboard" element={<SADashboard />} />
        <Route path="/super-admin/users" element={<UserManagement />} />
        <Route path="/super-admin/approvals" element={<RegistrationApprovals />} />
        <Route path="/super-admin/live-activity" element={<LiveActivity />} />
        <Route path="/super-admin/announcements" element={<Announcements />} />
        <Route path="/super-admin/module-users" element={<ModuleAssignment />} />

        {/* Admin Routes (Company Users) - Protected with sessionStorage */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/admin/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
        <Route path="/admin/add-project" element={<ProtectedRoute><AddProject /></ProtectedRoute>} />
        <Route path="/admin/edit-project/:id" element={<ProtectedRoute><EditProject /></ProtectedRoute>} />

        {/* Unit Management */}
        <Route path="/admin/units" element={<ProtectedRoute><Units /></ProtectedRoute>} />
        <Route path="/admin/add-unit" element={<ProtectedRoute><AddUnit /></ProtectedRoute>} />
        <Route path="/admin/edit-unit/:id" element={<ProtectedRoute><EditUnit /></ProtectedRoute>} />
        <Route path="/admin/view-unit/:id" element={<ProtectedRoute><UnitDetails /></ProtectedRoute>} />
        <Route path="/admin/unit-structure" element={<ProtectedRoute><UnitStructure /></ProtectedRoute>} />
        <Route path="/admin/leases" element={<ProtectedRoute><Leases /></ProtectedRoute>} />
        <Route path="/admin/add-lease" element={<ProtectedRoute><AddLease /></ProtectedRoute>} />
        <Route path="/admin/edit-lease/:id" element={<ProtectedRoute><EditLease /></ProtectedRoute>} />
        <Route path="/admin/view-lease/:id" element={<ProtectedRoute><LeaseDetails /></ProtectedRoute>} />

        {/* Other Admin Modules */}
        <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin/role-management" element={<ProtectedRoute><RoleManagement /></ProtectedRoute>} />
                <Route path="/admin/create-user" element={<ProtectedRoute><CreateUser /></ProtectedRoute>} />

        {/* Tenant Routes */}
        <Route path="/admin/tenants" element={<ProtectedRoute><TenantList /></ProtectedRoute>} />
        <Route path="/admin/tenant" element={<Navigate to="/admin/tenants" replace />} />
        <Route path="/admin/tenant/add" element={<ProtectedRoute><AddTenant /></ProtectedRoute>} />
        <Route path="/admin/add-tenant" element={<ProtectedRoute><AddTenant /></ProtectedRoute>} />
        <Route path="/admin/tenant/edit/:id" element={<ProtectedRoute><EditTenant /></ProtectedRoute>} />
        <Route path="/admin/tenant/:id" element={<ProtectedRoute><TenantDetails /></ProtectedRoute>} />

        {/* Master Route - Deprecated
        <Route path="/admin/master" element={<Master />} /> 
        */}

        {/* Party Master Routes (Replaces Owner/Tenant) */}
        <Route path="/admin/parties" element={<ProtectedRoute><PartyMaster /></ProtectedRoute>} />
        <Route path="/admin/parties/add" element={<ProtectedRoute><AddParty /></ProtectedRoute>} />
        <Route path="/admin/parties/view/:id" element={<ProtectedRoute><ViewParty /></ProtectedRoute>} />
        <Route path="/admin/parties/edit/:id" element={<ProtectedRoute><EditParty /></ProtectedRoute>} />
        
        <Route path="/admin/filter-options" element={<ProtectedRoute><FilterOptionsMaster /></ProtectedRoute>} />

        <Route path="/admin/ownership-mapping" element={<ProtectedRoute><OwnershipMapping /></ProtectedRoute>} />

        {/* Legacy Owner Routes (Can be deprecated later) */}
        <Route path="/admin/owner" element={<ProtectedRoute><OwnerList /></ProtectedRoute>} />
        <Route path="/admin/owners" element={<ProtectedRoute><OwnerList /></ProtectedRoute>} />
        <Route path="/admin/owner/add" element={<ProtectedRoute><AddOwner /></ProtectedRoute>} />
        <Route path="/admin/owners/add" element={<ProtectedRoute><AddOwner /></ProtectedRoute>} />
        <Route path="/admin/owner/edit/:id" element={<ProtectedRoute><EditOwner /></ProtectedRoute>} />
        <Route path="/admin/owner/:id" element={<ProtectedRoute><OwnerDetails /></ProtectedRoute>} />

        <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />


        {/* Management Rep Routes */}
        <Route path="/doc-repo" element={<ProtectedRoute><DocRepo /></ProtectedRoute>} />

        {/* Lease Management Suite */}
        <Route path="/lease/dashboard" element={<ProtectedRoute><LeaseDashboard /></ProtectedRoute>} />
        <Route path="/lease-manager/dashboard" element={<ProtectedRoute><LeaseDashboard /></ProtectedRoute>} />

        {/* Tracking */}
        <Route path="/lease/tracking" element={<ProtectedRoute><LeaseTracker /></ProtectedRoute>} />
        <Route path="/lease/tracking/:id" element={<ProtectedRoute><LeaseTrackingDetails /></ProtectedRoute>} />

        {/* Reports */}
        <Route path="/lease/reports" element={<ProtectedRoute><LeaseReports /></ProtectedRoute>} />
        <Route path="/lease/reports/:reportType" element={<ProtectedRoute><LeaseReportDetails /></ProtectedRoute>} />
        <Route path="/lease/notifications" element={<ProtectedRoute><LeaseNotifications /></ProtectedRoute>} />

        {/* Reminders */}
        <Route path="/lease/reminders" element={<ProtectedRoute><LeaseReminders /></ProtectedRoute>} />

        {/* Reviews/Approvals */}
        <Route path="/lease/reviews" element={<ProtectedRoute><LeaseList /></ProtectedRoute>} />
        <Route path="/lease/review/:id" element={<ProtectedRoute><LeaseDetailsManager /></ProtectedRoute>} />

        {/* Legacy/Other Routes */}
        <Route path="/lease/validation" element={<ProtectedRoute><LeaseValidation /></ProtectedRoute>} />
        <Route path="/lease/lifecycle" element={<ProtectedRoute><LeaseLifecycle /></ProtectedRoute>} />
        <Route path="/management/dashboard" element={<ProtectedRoute><RepDashboard /></ProtectedRoute>} />
        <Route path="/management/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/management/search" element={<ProtectedRoute><SearchFilters /></ProtectedRoute>} />
        <Route path="/management/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/management/review-center" element={<ProtectedRoute><ReviewCenter /></ProtectedRoute>} />
        <Route path="/management/lease-tracker" element={<ProtectedRoute><LeaseTracker /></ProtectedRoute>} />
        <Route path="/management/settings" element={<ProtectedRoute><RepSettings /></ProtectedRoute>} />

        {/* Data Entry Routes */}
        <Route path="/data-entry/dashboard" element={<ProtectedRoute><DataEntryDashboard /></ProtectedRoute>} />
        <Route path="/data-entry/add-data" element={<ProtectedRoute><DataEntrySelection /></ProtectedRoute>} />
        <Route path="/data-entry/pending-projects" element={<ProtectedRoute><PendingProjects /></ProtectedRoute>} />
        <Route path="/data-entry/pending-approvals" element={<ProtectedRoute><PendingApprovals /></ProtectedRoute>} />
        <Route path="/data-entry/past-entries" element={<ProtectedRoute><PastEntries /></ProtectedRoute>} />

        {/* Specific Data Entry Forms */}
        <Route path="/data-entry/add-project-data" element={<ProtectedRoute><ProjectDataEntry /></ProtectedRoute>} />
        <Route path="/data-entry/project/:id" element={<ProtectedRoute><ProjectDataEntry /></ProtectedRoute>} />
        <Route path="/data-entry/add-unit-data" element={<ProtectedRoute><UnitDataEntry /></ProtectedRoute>} />
        <Route path="/data-entry/add-master-data" element={<ProtectedRoute><MasterDataEntry /></ProtectedRoute>} />
        <Route path="/data-entry/add-master-data/add" element={<ProtectedRoute><AddMasterDataEntry /></ProtectedRoute>} />
        <Route path="/data-entry/add-ownership-data" element={<ProtectedRoute><OwnershipDataEntry /></ProtectedRoute>} />

        {/* Detail View */}
        <Route path="/data-entry/submission/:id" element={<ProtectedRoute><SubmissionDetails /></ProtectedRoute>} />
        <Route path="/data-entry/add-tenant-data" element={<ProtectedRoute><TenantDataEntry /></ProtectedRoute>} />
        <Route path="/data-entry/add-lease-data" element={<ProtectedRoute><LeaseDataEntry /></ProtectedRoute>} />
        <Route path="/data-entry/bulk-upload" element={<ProtectedRoute><DocumentUploadCenter /></ProtectedRoute>} />
        <Route path="/data-entry/submission-tracking" element={<ProtectedRoute><SubmissionTracking /></ProtectedRoute>} />
        <Route path="/data-entry/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
        <Route path="/data-entry/approval-request/:id" element={<ProtectedRoute><ApprovalRequestDetail /></ProtectedRoute>} />
        <Route path="/data-entry/approved-today" element={<ProtectedRoute><ApprovedSubmissions /></ProtectedRoute>} />
        <Route path="/data-entry/rejected-submissions" element={<ProtectedRoute><RejectedSubmissions /></ProtectedRoute>} />

      </Routes >
    </BrowserRouter >
  );
}

export default App;
