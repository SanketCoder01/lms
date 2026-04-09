import React, { useState, useEffect } from 'react';
import { Download, Plus, ChevronDown } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import KPICards from './KPICards';
import LeasingActivity from './LeasingActivity';
import RentComposition from './RentComposition';
import ZoningExecution from './ZoningExecution';
import { getProjects, getDashboardStats, unitAPI, leaseAPI } from '../../../services/api';
import './echo.css';

const EchoDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('All');
  const [dashboardData, setDashboardData] = useState(null);
  const [unitBreakdown, setUnitBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: '', initials: 'AD' });
  const [projectedRent, setProjectedRent] = useState(0);
  const [rentComposition, setRentComposition] = useState({ fixed: 0, mg: 0, revenueShare: 0, fixedUnits: 0, mgUnits: 0, revShareUnits: 0 });
  const [leasingStats, setLeasingStats] = useState({ newLeases: 0, areaLeased: 0, loisSigned: 0, chartData: [] });

  // Fetch projects for dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getProjects();
        const projectList = res.data?.data || res.data || [];
        setProjects(projectList);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
    
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && (user.first_name || user.last_name || user.name)) {
      const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const nameParts = fullName.split(' ');
      let initials = 'AD';
      if (nameParts.length >= 2) {
        initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
        initials = (nameParts[0][0] + nameParts[0][nameParts[0].length - 1]).toUpperCase();
      }
      setUserInfo({ name: fullName, initials });
    }
  }, []);

  // Fetch dashboard data based on selected project
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = selectedProject !== 'All' ? { project_id: selectedProject } : undefined;
        const unitParams = selectedProject !== 'All' ? { projectId: selectedProject } : {};
        const [statsRes, unitsRes] = await Promise.all([
          getDashboardStats(params),
          unitAPI.getUnits(unitParams)
        ]);
        
        setDashboardData(statsRes.data);
        
        // Calculate unit breakdown by actual unit names (unit_number)
        const units = unitsRes.data?.data || unitsRes.data || [];
        console.log('Fetched units:', units.length, units);
        const breakdown = {};
        units.forEach(unit => {
          // Use actual unit_number or unit name
          let unitName = unit.unit_number || unit.floor || unit.block_tower || 'Other';
          // Shorten to just first letter: "Block A-GF-211" -> "A", "GF-212" -> "G"
          const firstLetter = unitName.charAt(0).toUpperCase();
          breakdown[firstLetter] = (breakdown[firstLetter] || 0) + 1;
        });
        const breakdownArray = Object.entries(breakdown)
          .map(([name, count]) => ({ name, count }))
          .slice(0, 4); // Show top 4 units
        setUnitBreakdown(breakdownArray);

        // Fetch rent composition from leases
        try {
          console.log('Fetching leases with params:', params);
          const leasesRes = await leaseAPI.getAllLeases(params || {});
          console.log('Leases API response:', leasesRes);
          // Backend returns array directly, not wrapped in data
          const leases = Array.isArray(leasesRes.data) ? leasesRes.data : (leasesRes.data?.data || []);
          console.log('Fetched leases:', leases.length, leases);
          let fixedTotal = 0, mgTotal = 0, revShareTotal = 0;
          let fixedUnits = 0, mgUnits = 0, revShareUnits = 0;
          let totalProjectedRent = 0;
          
          leases.forEach(lease => {
            console.log('Lease:', lease.id, 'rent_model:', lease.rent_model, 'monthly_rent:', lease.monthly_rent, 'mg_amount:', lease.mg_amount, 'revenue_share_amount:', lease.revenue_share_amount, 'revenue_share_percentage:', lease.revenue_share_percentage);
            const rent = parseFloat(lease.monthly_rent) || 0;
            if (lease.rent_model === 'Fixed') {
              fixedTotal += rent;
              fixedUnits += 1;
              totalProjectedRent += rent; // Add to total project rent
            } else if (lease.rent_model === 'RevenueShare' || lease.rent_model === 'Revenue Share' || lease.rent_model === 'Hybrid') {
              const mgAmount = parseFloat(lease.mg_amount) || rent;
              mgTotal += mgAmount;
              totalProjectedRent += mgAmount; // Add MG to total project rent
              // Calculate revenue share from percentage if amount not available
              let revShareAmount = parseFloat(lease.revenue_share_amount) || 0;
              if (!revShareAmount && lease.revenue_share_percentage) {
                const netSales = parseFloat(lease.monthly_net_sales) || 0;
                revShareAmount = (netSales * parseFloat(lease.revenue_share_percentage)) / 100;
              }
              revShareTotal += revShareAmount;
              mgUnits += 1;
              revShareUnits += 1;
            }
          });
          console.log('Total projected rent from leases:', totalProjectedRent);
          console.log('Rent composition totals:', { fixedTotal, mgTotal, revShareTotal, fixedUnits, mgUnits, revShareUnits });
          setProjectedRent(totalProjectedRent);
          setRentComposition({ 
            fixed: fixedTotal, 
            mg: mgTotal, 
            revenueShare: revShareTotal,
            fixedUnits,
            mgUnits,
            revShareUnits
          });

          // Calculate leasing activity stats
          const now = new Date();
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          const recentLeases = leases.filter(l => {
            const leaseDate = new Date(l.lease_start || l.created_at);
            return leaseDate >= sixMonthsAgo;
          });

          // Group by month
          const monthData = {};
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString('en-US', { month: 'short' });
            monthData[key] = { month: key, units: 0, area: 0 };
          }

          recentLeases.forEach(lease => {
            const leaseDate = new Date(lease.lease_start || lease.created_at);
            const key = leaseDate.toLocaleDateString('en-US', { month: 'short' });
            if (monthData[key]) {
              monthData[key].units += 1;
              monthData[key].area += parseFloat(lease.area_leased) || 0;
            }
          });

          const chartDataArr = Object.values(monthData).map(d => ({
            ...d,
            area: Math.round(d.area / 1000) // Convert to '000 sqft
          }));

          setLeasingStats({
            newLeases: recentLeases.length,
            areaLeased: recentLeases.reduce((sum, l) => sum + (parseFloat(l.area_leased) || 0), 0),
            loisSigned: leases.filter(l => l.status === 'loi_signed' || l.status === 'draft').length,
            chartData: chartDataArr
          });
        } catch (err) {
          console.error('Error fetching lease composition:', err);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedProject]);

  const selectedProjectName = selectedProject === 'All' 
    ? 'All Projects' 
    : projects.find(p => p.id === selectedProject)?.project_name || 'Select Project';

  const totalUnits = dashboardData?.topRow?.totalUnits?.value || 0;
  const totalArea = dashboardData?.topRow?.totalProjectArea?.value || 0;
  const leasedUnits = dashboardData?.thirdRow?.unitsLeased?.value || 0;
  const leasedArea = dashboardData?.thirdRow?.areaLeased?.value || 0;
  const vacantUnits = dashboardData?.thirdRow?.unitsVacant?.value || 0;
  const vacantArea = dashboardData?.thirdRow?.areaVacant?.value || 0;
  const monthlyRent = dashboardData?.financials?.rentMonth?.value || 0;
  const opportunityLoss = dashboardData?.financials?.opportunityLoss?.value || 0;

  // Calculate percentages
  // Leased % = (area leased / total project area) * 100
  const leasedPercent = totalArea > 0 ? ((leasedArea / totalArea) * 100).toFixed(1) : 0;
  // Vacant % = (area vacant / total project area) * 100
  const vacantPercent = totalArea > 0 ? ((vacantArea / totalArea) * 100).toFixed(1) : 0;

  return (
    <div className="echo-dashboard-wrapper">
      {/* Navbar with Project Selector */}
      <nav className="echo-navbar">
        <div className="echo-navbar-left">
          <span className="echo-logo">LeaseOS</span>
          <div className="echo-project-dropdown">
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              className="echo-project-select"
            >
              <option value="All">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
            <ChevronDown className="echo-chevron" />
          </div>
        </div>
        <div className="echo-navbar-right">
          <div className="echo-avatar" onClick={() => navigate('/admin/settings')} title={userInfo.name || 'Admin'} style={{ cursor: 'pointer' }}>{userInfo.initials}</div>
        </div>
      </nav>

      <div className="echo-content">
        {/* Header */}
        <div className="echo-header">
          <div>
            <h1 className="echo-title">Leasing Dashboard</h1>
            <p className="echo-subtitle">{selectedProjectName} · As of {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="echo-actions">
            <button className="echo-btn-secondary">
              <Download className="echo-btn-icon" /> Export
            </button>
            <Link to="/admin/add-lease" className="echo-btn-primary">
              <Plus className="echo-btn-icon" /> New Lease
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards 
          totalUnits={totalUnits}
          totalArea={totalArea}
          leasedUnits={leasedUnits}
          leasedArea={leasedArea}
          leasedPercent={leasedPercent}
          vacantUnits={vacantUnits}
          vacantArea={vacantArea}
          vacantPercent={vacantPercent}
          monthlyRent={monthlyRent}
          opportunityLoss={opportunityLoss}
          unitBreakdown={unitBreakdown}
          loading={loading}
          projectedRent={projectedRent}
          onTotalUnitsClick={() => navigate('/admin/units')}
          onLeasedUnitsClick={() => navigate('/admin/leases')}
          onVacantUnitsClick={() => navigate('/admin/units')}
        />

        {/* Section Title */}
        <div className="echo-section-title">
          <div className="echo-section-bar"></div>
          <h2 className="echo-section-heading">Rent Composition, Leasing Activity & Zoning Execution</h2>
        </div>

        {/* Bottom Charts - 3 Column Grid */}
        <div className="echo-charts-grid">
          <RentComposition 
            fixed={rentComposition.fixed}
            mg={rentComposition.mg}
            revenueShare={rentComposition.revenueShare}
            fixedUnits={rentComposition.fixedUnits}
            mgUnits={rentComposition.mgUnits}
            revShareUnits={rentComposition.revShareUnits}
            totalProjectRent={projectedRent}
            loading={loading}
          />
          <LeasingActivity 
            chartData={leasingStats.chartData}
            newLeases={leasingStats.newLeases}
            areaLeased={leasingStats.areaLeased}
            loisSigned={leasingStats.loisSigned}
            loading={loading}
          />
          <ZoningExecution />
        </div>
      </div>
    </div>
  );
};

export default EchoDashboard;
