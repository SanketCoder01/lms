import React, { useState, useEffect } from 'react';
import { Download, Plus, ChevronDown } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import KPICards from './KPICards';
import LeasingActivity from './LeasingActivity';
import RentComposition from './RentComposition';
import ZoningExecution from './ZoningExecution';
import LeaseExpirySection from './LeaseExpirySection';
import LockInExpirySection from './LockInExpirySection';
import OwnershipSection from './OwnershipSection';
import UpcomingEscalations from './UpcomingEscalations';
import RentalProjectionTable from './RentalProjectionTable';
import FinancialValueMonthly from './FinancialValueMonthly';
import BrandPerformanceSection from './BrandPerformanceSection';
import FloorOccupancySection from './FloorOccupancySection';
import { getProjects, leaseAPI, unitAPI } from '../../../services/api';
import './echo.css';

const EchoDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('All');
  const [unitBreakdown, setUnitBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: '', initials: 'AD' });
  const [projectedRent, setProjectedRent] = useState(0);
  const [rentComposition, setRentComposition] = useState({ fixed: 0, mg: 0, revenueShare: 0, fixedUnits: 0, mgUnits: 0, revShareUnits: 0 });
  const [leasingStats, setLeasingStats] = useState({ newLeases: 0, areaLeased: 0, chartData: [], loiCount: 0, executedCount: 0, registeredCount: 0 });
  const [zoningData, setZoningData] = useState([]);
  const [allLeases, setAllLeases] = useState([]);
  const [allUnits, setAllUnits] = useState([]);

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
        const unitParams = selectedProject !== 'All' ? { projectId: selectedProject } : {};
        const unitsRes = await unitAPI.getUnits(unitParams);
        
        // Calculate unit breakdown by actual unit names (unit_number)
        const units = unitsRes.data?.data || unitsRes.data || [];
        console.log('Fetched units:', units.length, units);
        setAllUnits(units); // Store all units for other components
        
        // Calculate total projected rent from ALL units (sum of projected_rent field)
        let totalProjRent = 0;
        units.forEach(unit => {
          const rent = parseFloat(unit.projected_rent) || 0;
          totalProjRent += rent;
          console.log(`Unit ${unit.unit_number}: projected_rent=${unit.projected_rent}, running total=${totalProjRent}`);
        });
        console.log('Total projected rent from all units:', totalProjRent);
        setProjectedRent(totalProjRent);
        
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

        // Calculate zoning data from unit_zoning_type
        const zoningMap = {};
        console.log('Calculating zoning from unit_zoning_type');

        // Build zoning map from units (plan = total units/area per zoning type)
        units.forEach(unit => {
          const zoningType = unit.unit_zoning_type || unit.zoning_type || unit.zoningType;
          const area = parseFloat(unit.chargeable_area || unit.area || 0);

          if (zoningType && area > 0) {
            const zoningKey = zoningType.toLowerCase().trim().replace(/\s+/g, '_');

            if (!zoningMap[zoningKey]) {
              zoningMap[zoningKey] = {
                name: zoningType,
                plan: 0,
                actual: 0,
                planArea: 0,
                actualArea: 0
              };
            }

            zoningMap[zoningKey].plan += 1;
            zoningMap[zoningKey].planArea += area;

            // If unit is leased, add to actual
            if (unit.status === 'leased' || unit.status === 'sold' || unit.status === 'occupied') {
              zoningMap[zoningKey].actual += 1;
              zoningMap[zoningKey].actualArea += area;
            }
          }
        });

        // Fetch rent composition from leases
        try {
          const leaseParams = selectedProject !== 'All' ? { project_id: selectedProject } : {};
          console.log('Fetching leases with params:', leaseParams);
          const leasesRes = await leaseAPI.getAllLeases(leaseParams);
          console.log('Leases API raw response:', leasesRes);
          console.log('Leases API response data type:', typeof leasesRes.data, Array.isArray(leasesRes.data));
          // Backend returns array directly in res.data
          let leases = [];
          if (Array.isArray(leasesRes.data)) {
            leases = leasesRes.data;
          } else if (leasesRes.data?.data && Array.isArray(leasesRes.data.data)) {
            leases = leasesRes.data.data;
          } else if (leasesRes.data?.leases && Array.isArray(leasesRes.data.leases)) {
            leases = leasesRes.data.leases;
          } else if (leasesRes.data?.result && Array.isArray(leasesRes.data.result)) {
            leases = leasesRes.data.result;
          }
          console.log('Fetched leases count:', leases.length);
          console.log('Fetched leases data:', leases);
          setAllLeases(leases); // Store for expiry sections

          // Set zoning data from unit_zoning_type (already calculated above)
          const updatedZoning = Object.values(zoningMap).filter(z => z.plan > 0);
          console.log('Zoning data from unit_zoning_type:', updatedZoning);
          setZoningData(updatedZoning);

          let fixedTotal = 0, mgTotal = 0, revShareTotal = 0;
          let fixedUnits = 0, mgUnits = 0, revShareUnits = 0;

          // Only count ACTIVE leases for actual rent calculation
          const activeLeases = leases.filter(lease => {
            const status = (lease.status || '').toLowerCase().trim();
            return status === 'active' || status === 'approved' || status === 'leased' || status === 'executed' || status === 'registered';
          });
          console.log('Active leases for rent calculation:', activeLeases.length, 'out of', leases.length);

          activeLeases.forEach(lease => {
            console.log('Lease:', lease.id, 'rent_model:', lease.rent_model, 'monthly_rent:', lease.monthly_rent, 'mg_amount:', lease.mg_amount, 'revenue_share_amount:', lease.revenue_share_amount, 'revenue_share_percentage:', lease.revenue_share_percentage);
            const rent = parseFloat(lease.monthly_rent) || 0;
            if (lease.rent_model === 'Fixed') {
              fixedTotal += rent;
              fixedUnits += 1;
            } else if (lease.rent_model === 'RevenueShare' || lease.rent_model === 'Revenue Share' || lease.rent_model === 'Hybrid') {
              const mgAmount = parseFloat(lease.mg_amount) || rent;
              mgTotal += mgAmount;
              // Calculate revenue share from percentage if amount not available
              let revShareAmount = parseFloat(lease.revenue_share_amount) || 0;
              if (!revShareAmount && lease.revenue_share_percentage) {
                const netSales = parseFloat(lease.monthly_net_sales) || 0;
                revShareAmount = (netSales * parseFloat(lease.revenue_share_percentage)) / 100;
              }
              revShareTotal += revShareAmount;
              mgUnits += 1;
              revShareUnits += 1;
            } else {
              // Default: if no rent_model specified, count as fixed rent
              fixedTotal += rent;
              fixedUnits += 1;
            }
          });
          console.log('Rent composition totals:', { fixedTotal, mgTotal, revShareTotal, fixedUnits, mgUnits, revShareUnits });
          setRentComposition({ 
            fixed: fixedTotal, 
            mg: mgTotal, 
            revenueShare: revShareTotal,
            fixedUnits,
            mgUnits,
            revShareUnits
          });

          // Calculate leasing activity stats - leases created in last 6 months
          const now = new Date();
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          console.log('Leases for activity calculation:', leases.length, leases);
          const recentLeases = leases.filter(l => {
            const leaseDate = new Date(l.created_at || l.lease_start);
            const isActive = l.status === 'active' || l.status === 'Active' || l.status === 'approved';
            console.log(`Lease ${l.id}: created=${l.created_at}, lease_start=${l.lease_start}, status=${l.status}, inRange=${leaseDate >= sixMonthsAgo}`);
            return leaseDate >= sixMonthsAgo && isActive;
          });
          console.log('Recent leases in 6 months:', recentLeases.length);

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
            area: d.area // Keep actual area in sqft, no rounding
          }));

          // Calculate LOI, Executed, Registered counts - MUTUALLY EXCLUSIVE
          // Priority: Registered > Executed > LOI
          // Each unit is counted in ONLY ONE category based on highest stage reached
          const getLeasingStatusCounts = (leases) => {
            const counts = { registered: 0, executed: 0, loi: 0 };
            const processedUnits = new Set();

            leases.forEach(lease => {
              const unitId = lease.unit_id || lease.unitId;
              // Skip if we've already counted this unit
              if (unitId && processedUnits.has(unitId)) return;
              if (unitId) processedUnits.add(unitId);

              const s = (lease.status || '').toLowerCase().trim();

              // Priority order: Registered > Executed > LOI
              if (s === 'registered' || s === 'completed') {
                counts.registered += 1;
              } else if (s === 'executed' || s === 'signed' || s === 'active' || s === 'approved' || s === 'leased') {
                counts.executed += 1;
              } else if (s === 'loi' || s === 'draft' || s === 'pending' || s === 'loi_signed') {
                counts.loi += 1;
              }
            });

            return counts;
          };

          const statusCounts = getLeasingStatusCounts(leases);
          const loiCount = statusCounts.loi;
          const executedCount = statusCounts.executed;
          const registeredCount = statusCounts.registered;
          
          setLeasingStats({
            newLeases: recentLeases.length,
            areaLeased: recentLeases.reduce((sum, l) => sum + (parseFloat(l.area_leased) || 0), 0),
            chartData: chartDataArr,
            loiCount,
            executedCount,
            registeredCount
          });
        } catch (err) {
          console.error('Error fetching lease composition:', err);
          setAllLeases([]); // Ensure allLeases is set even on error
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedProject]);

  // Refresh data when window gains focus (for real-time updates)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused - refreshing data');
      // Trigger refetch by calling fetchData again
      const fetchData = async () => {
        try {
          const unitParams = selectedProject !== 'All' ? { projectId: selectedProject } : {};
          const unitsRes = await unitAPI.getUnits(unitParams);

          const units = unitsRes.data?.data || unitsRes.data || [];
          setAllUnits(units);

          // Refetch leases
          const leaseParams = selectedProject !== 'All' ? { project_id: selectedProject } : {};
          const leasesRes = await leaseAPI.getAllLeases(leaseParams);
          let leases = Array.isArray(leasesRes.data) ? leasesRes.data : (leasesRes.data?.data || []);
          setAllLeases(leases);

          // Calculate zoning from unit_zoning_type
          const zoningMap = {};
          units.forEach(unit => {
            const zoningType = unit.unit_zoning_type || unit.zoning_type || unit.zoningType;
            const area = parseFloat(unit.chargeable_area || unit.area || 0);

            if (zoningType && area > 0) {
              const zoningKey = zoningType.toLowerCase().trim().replace(/\s+/g, '_');

              if (!zoningMap[zoningKey]) {
                zoningMap[zoningKey] = { name: zoningType, plan: 0, actual: 0, planArea: 0, actualArea: 0 };
              }
              zoningMap[zoningKey].plan += 1;
              zoningMap[zoningKey].planArea += area;

              if (unit.status === 'leased' || unit.status === 'sold' || unit.status === 'occupied') {
                zoningMap[zoningKey].actual += 1;
                zoningMap[zoningKey].actualArea += area;
              }
            }
          });

          setZoningData(Object.values(zoningMap).filter(z => z.plan > 0));
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      };
      fetchData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedProject]);

  const selectedProjectName = selectedProject === 'All' 
    ? 'All Projects' 
    : projects.find(p => p.id === selectedProject)?.project_name || 'Select Project';

  // PDF Export function
  const exportToPDF = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Leasing Dashboard Report', pageWidth / 2, 20, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${selectedProjectName} - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, pageWidth / 2, 28, { align: 'center' });
      
      // Line separator
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 32, pageWidth - 15, 32);
      
      let yPos = 42;
      
      // KPI Summary Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Performance Indicators', 15, yPos);
      yPos += 8;
      
      const kpiData = [
        ['Total Units', totalUnits.toString()],
        ['Total Area', `${totalArea.toLocaleString('en-IN')} sqft`],
        ['Leased Units', leasedUnits.toString()],
        ['Leased Area', `${leasedArea.toLocaleString('en-IN')} sqft`],
        ['Leased Percentage', `${leasedPercent}%`],
        ['Vacant Units', vacantUnits.toString()],
        ['Vacant Area', `${vacantArea.toLocaleString('en-IN')} sqft`],
        ['Vacant Percentage', `${vacantPercent}%`],
        ['Actual Rent', `₹${actualRent.toLocaleString('en-IN')}`],
        ['Opportunity Loss', `₹${opportunityLoss.toLocaleString('en-IN')}`],
      ];
      
      doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Value']],
        body: kpiData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 95] },
        margin: { left: 15, right: 15 },
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
      
      // Rent Composition Section
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Rent Composition', 15, yPos);
      yPos += 8;
      
      const rentData = [
        ['Fixed Rent', `₹${rentComposition.fixed.toLocaleString('en-IN')}`, rentComposition.fixedUnits.toString()],
        ['MG Rent', `₹${rentComposition.mg.toLocaleString('en-IN')}`, rentComposition.mgUnits.toString()],
        ['Revenue Share', `₹${rentComposition.revenueShare.toLocaleString('en-IN')}`, rentComposition.revShareUnits.toString()],
        ['Total Actual Rent', `₹${(rentComposition.fixed + rentComposition.mg + rentComposition.revenueShare).toLocaleString('en-IN')}`, ''],
      ];
      
      doc.autoTable({
        startY: yPos,
        head: [['Type', 'Amount', 'Units']],
        body: rentData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 95] },
        margin: { left: 15, right: 15 },
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
      
      // Leasing Activity Section
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Leasing Activity (Last 6 Months)', 15, yPos);
      yPos += 8;
      
      const leasingData = [
        ['New Leases', leasingStats.newLeases.toString()],
        ['Area Leased', `${leasingStats.areaLeased.toLocaleString('en-IN')} sqft`],
      ];
      
      doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Value']],
        body: leasingData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 95] },
        margin: { left: 15, right: 15 },
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
      
      // Lease Expiry Section
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Leases Nearing Expiry', 15, yPos);
      yPos += 8;
      
      const expiryData = allLeases
        .filter(lease => {
          const expiryDate = new Date(lease.lease_expiry);
          const diffDays = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
          return diffDays > 0;
        })
        .slice(0, 10)
        .map(lease => [
          lease.units?.unit_number || lease.unit_number || 'N/A',
          lease.tenant?.company_name || lease.tenant_name || 'Unknown',
          new Date(lease.lease_expiry).toLocaleDateString(),
          `₹${parseFloat(lease.monthly_rent || 0).toLocaleString('en-IN')}`
        ]);
      
      if (expiryData.length > 0) {
        doc.autoTable({
          startY: yPos,
          head: [['Unit', 'Tenant', 'Expiry Date', 'Monthly Rent']],
          body: expiryData,
          theme: 'striped',
          headStyles: { fillColor: [30, 58, 95] },
          margin: { left: 15, right: 15 },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.text('No leases nearing expiry', 15, yPos);
        yPos += 10;
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Generated on ${new Date().toLocaleString()} by LeaseOS`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      
      // Save the PDF
      const fileName = `Leasing_Dashboard_${selectedProjectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  // Calculate ALL metrics locally from filtered units and leases
  // This ensures correct project-specific filtering
  const totalUnits = allUnits.length || 0;
  const totalArea = allUnits.reduce((sum, u) => sum + (parseFloat(u.chargeable_area) || parseFloat(u.area) || 0), 0);

  const leasedUnitsArr = allUnits.filter(u => {
    const s = (u.status || '').toLowerCase();
    return s === 'leased' || s === 'occupied' || s === 'sold';
  });
  const leasedUnits = leasedUnitsArr.length;
  const leasedArea = leasedUnitsArr.reduce((sum, u) => sum + (parseFloat(u.chargeable_area) || parseFloat(u.area) || 0), 0);

  const vacantUnitsArr = allUnits.filter(u => {
    const s = (u.status || '').toLowerCase();
    return s === 'vacant' || s === 'available';
  });
  const vacantUnits = vacantUnitsArr.length;
  const vacantArea = vacantUnitsArr.reduce((sum, u) => sum + (parseFloat(u.chargeable_area) || parseFloat(u.area) || 0), 0);

  // Calculate opportunity loss from vacant units
  const opportunityLoss = vacantUnitsArr.reduce((sum, u) => {
    const rent = parseFloat(u.projected_rent) || 0;
    return sum + rent;
  }, 0);

  // Calculate percentages
  // Leased % = (area leased / total project area) * 100
  const leasedPercent = totalArea > 0 ? ((leasedArea / totalArea) * 100).toFixed(1) : 0;
  // Vacant % = (area vacant / total project area) * 100
  const vacantPercent = totalArea > 0 ? ((vacantArea / totalArea) * 100).toFixed(1) : 0;

  // Calculate average rate per sqft
  const avgRatePerSqft = totalArea > 0 ? parseFloat((projectedRent / totalArea).toFixed(2)) : 0;

  // Calculate actual rent from rent composition
  const actualRent = (rentComposition.fixed || 0) + (rentComposition.mg || 0) + (rentComposition.revenueShare || 0);

  // Calculate rate variance for KPICards (actual rent - projected rent for leased units)
  const targetRentForLeased = leasedUnitsArr.reduce((sum, u) => sum + (parseFloat(u.projected_rent) || 0), 0);
  const rateVariance = actualRent - targetRentForLeased;

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
            <button className="echo-btn-secondary" onClick={exportToPDF}>
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
          opportunityLoss={opportunityLoss}
          unitBreakdown={unitBreakdown}
          loading={loading}
          projectedRent={projectedRent}
          actualRent={actualRent}
          avgRatePerSqft={avgRatePerSqft}
          profitLoss={rateVariance}
          onTotalUnitsClick={() => {
            const params = selectedProject !== 'All' ? `?projectId=${selectedProject}` : '';
            navigate(`/admin/units${params}`);
          }}
          onLeasedUnitsClick={() => {
            const projectParam = selectedProject !== 'All' ? `&project_id=${selectedProject}` : '';
            navigate(`/admin/leases?status=active${projectParam}`);
          }}
          onVacantUnitsClick={() => {
            const projectParam = selectedProject !== 'All' ? `&projectId=${selectedProject}` : '';
            navigate(`/admin/units?status=vacant${projectParam}`);
          }}
          onProjectedRentClick={() => {
            const params = selectedProject !== 'All' ? `?projectId=${selectedProject}` : '';
            navigate(`/admin/units${params}`);
          }}
          onActualRentClick={() => {
            const params = selectedProject !== 'All' ? `?project_id=${selectedProject}` : '';
            navigate(`/admin/leases${params}`);
          }}
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
            loading={loading}
          />
          <LeasingActivity 
            chartData={leasingStats.chartData}
            newLeases={leasingStats.newLeases}
            areaLeased={leasingStats.areaLeased}
            loiCount={leasingStats.loiCount}
            executedCount={leasingStats.executedCount}
            registeredCount={leasingStats.registeredCount}
            loading={loading}
          />
          <ZoningExecution zoningData={zoningData} loading={loading} />
        </div>

        {/* Section Title - Lease Expiry, Lock-in & Escalations */}
        <div className="echo-section-title">
          <div className="echo-section-bar"></div>
          <h2 className="echo-section-heading">Lease Expiry, Lock-In Status & Rent Escalations</h2>
        </div>

        {/* Lease Expiry, Lock-in & Upcoming Escalations - 3 Column Grid */}
        <div className="echo-charts-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <LeaseExpirySection leases={allLeases} loading={loading} />
          <LockInExpirySection leases={allLeases} loading={loading} />
          <UpcomingEscalations leases={allLeases} loading={loading} />
        </div>

        {/* Section Title - Rental Projection */}
        <div className="echo-section-title">
          <div className="echo-section-bar"></div>
          <h2 className="echo-section-heading">Comprehensive Rental Projection Matrix</h2>
        </div>

        {/* Rental Projection Table & Financial Value - 2 Column Grid */}
        <div className="echo-charts-row">
          <RentalProjectionTable leases={allLeases} loading={loading} />
          <FinancialValueMonthly leases={allLeases} loading={loading} />
        </div>

        {/* Section Title - Brand Performance */}
        <div className="echo-section-title">
          <div className="echo-section-bar"></div>
          <h2 className="echo-section-heading">Brand Performance vs Target Sales</h2>
        </div>

        {/* Brand Performance & Floor Occupancy - 2 Column Grid */}
        <div className="echo-charts-row">
          <BrandPerformanceSection leases={allLeases} loading={loading} />
          <FloorOccupancySection units={allUnits} loading={loading} />
        </div>

        {/* Section Title - Unit Sales & Ownership */}
        <div className="echo-section-title">
          <div className="echo-section-bar"></div>
          <h2 className="echo-section-heading">Unit Sales & Ownership</h2>
        </div>

        {/* Ownership Section */}
        <div className="echo-charts-row">
          <OwnershipSection units={allUnits} leases={allLeases} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default EchoDashboard;
