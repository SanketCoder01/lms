import React, { useState, useEffect } from 'react';
import { Download, Plus, ChevronDown } from "lucide-react";
import { useNavigate } from 'react-router-dom';
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

import FinancialValueMonthly from './FinancialValueMonthly';
import BrandPerformanceSection from './BrandPerformanceSection';
import FloorOccupancySection from './FloorOccupancySection';
import CriticalNotificationTicker from './CriticalNotificationTicker';
import { getProjects, leaseAPI, unitAPI, partyAPI } from '../../../services/api';
import { supabase } from '../../../lib/supabase';
import usePermissions from '../../../hooks/usePermissions';
import './echo.css';

const EchoDashboard = () => {
  const navigate = useNavigate();
  const { hasModuleAccess, getModulePermissions } = usePermissions();
  const [refreshKey, setRefreshKey] = useState(0); // incremented to force a re-fetch
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('All');
  const [unitBreakdown, setUnitBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: '', initials: 'AD' });
  const [projectedRent, setProjectedRent] = useState(0);
  const [rentComposition, setRentComposition] = useState({ fixed: 0, mg: 0, revenueShare: 0, fixedUnits: 0, mgUnits: 0, revShareUnits: 0 });
  const [leasingStats, setLeasingStats] = useState({ newLeases: 0, areaLeased: 0, chartData: [], loiCount: 0, executedCount: 0, registeredCount: 0 });
  const [trueUnitCount, setTrueUnitCount] = useState(0);
  const [zoningData, setZoningData] = useState([]);
  const [allLeases, setAllLeases] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [allParties, setAllParties] = useState([]);     // Company-type only → Brand Performance
  const [allPartiesMap, setAllPartiesMap] = useState({}); // All types → keyed by id → Expiry/LockIn/Escalations

  // Fetch projects for dropdown — filtered by assigned access for module_users
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getProjects();
        const projectList = res.data?.data || res.data || [];

        // Read user info from sessionStorage (set at login)
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const isModuleUser = sessionStorage.getItem('is_module_user') === '1';
        const isProjectUser = sessionStorage.getItem('is_project_user') === '1';

        // projects_access can be in sessionStorage standalone OR inside user object
        let projectsAccess = [];
        try {
          const raw = sessionStorage.getItem('projects_access');
          if (raw) projectsAccess = JSON.parse(raw);
          // fallback: check user object
          if (projectsAccess.length === 0 && Array.isArray(user.projects_access)) {
            projectsAccess = user.projects_access;
          }
        } catch { projectsAccess = []; }

        // module_user or project_user with specific project assignments → restrict dropdown
        if ((isModuleUser || isProjectUser) && projectsAccess.length > 0) {
          const allowedIds = new Set(projectsAccess.map(p => String(p.project_id)));
          const filtered = projectList.filter(p => allowedIds.has(String(p.id)));
          setProjects(filtered);
          // Auto-select if only 1 project; otherwise default to first
          if (filtered.length >= 1) setSelectedProject(filtered[0].id);
        } else if (isModuleUser && projectsAccess.length === 0) {
          // Dashboard-only module user: no project assignments → hide dropdown entirely
          setProjects([]);
          setSelectedProject('All');
        } else if (isProjectUser) {
          // pure project_user with single project from JWT
          const pid = sessionStorage.getItem('project_id');
          const filtered = pid ? projectList.filter(p => String(p.id) === String(pid)) : projectList;
          setProjects(filtered);
          if (filtered.length === 1) setSelectedProject(filtered[0].id);
        } else {
          setProjects(projectList);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();

    // Get user info from sessionStorage (per-tab isolation)
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
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

  // Derive whether user has restricted project access
  const _isModuleUser = sessionStorage.getItem('is_module_user') === '1';
  const _isProjectUser = sessionStorage.getItem('is_project_user') === '1';
  let _projectsAccess = [];
  try { const r = sessionStorage.getItem('projects_access'); if (r) _projectsAccess = JSON.parse(r); } catch { }
  const isRestrictedDashboard = (_isModuleUser || _isProjectUser) && _projectsAccess.length > 0;

  // Fetch dashboard data based on selected project
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const unitParams = selectedProject !== 'All' ? { projectId: selectedProject, limit: 5000 } : { limit: 5000 };
        const countParams = selectedProject !== 'All' ? { projectId: selectedProject } : {};

        // Fetch full unit data + a separate exact count (bypasses row limits)
        const [unitsRes, countRes] = await Promise.all([
          unitAPI.getUnits(unitParams),
          unitAPI.getUnitsCount(countParams).catch(() => ({ data: { count: 0 } })),
        ]);

        // Calculate unit breakdown by actual unit names (unit_number)
        const units = unitsRes.data?.data || unitsRes.data || [];
        const exactTotalUnits = countRes.data?.count ?? units.length;
        console.log('Fetched units (data):', units.length, '| Exact count:', exactTotalUnits);
        setAllUnits(units);
        // Store the true total for KPI display
        setTrueUnitCount(exactTotalUnits);

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

        // Fetch all company parties from Masters for Brand Performance
        try {
          // Company-type parties only → Brand Performance section
          const partiesRes = await partyAPI.getAllParties({ type: 'Company' });
          const partiesList = Array.isArray(partiesRes.data) ? partiesRes.data : (partiesRes.data?.data || []);
          setAllParties(partiesList);

          // ALL party types (Company + Individual) → lookup map for Expiry/LockIn/Escalations
          const allPartiesRes = await partyAPI.getAllParties();
          const allPartiesList = Array.isArray(allPartiesRes.data) ? allPartiesRes.data : (allPartiesRes.data?.data || []);
          const pMap = {};
          allPartiesList.forEach(p => { pMap[p.id] = p; });
          setAllPartiesMap(pMap);
        } catch (e) { console.error('Failed to fetch parties:', e); }

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
            return status === 'active' || status === 'approved' || status === 'executed' || status === 'registered';
          });

          activeLeases.forEach(lease => {
            const rent = parseFloat(lease.monthly_rent) || 0;
            const model = (lease.rent_model || 'Fixed').trim();

            if (model === 'Fixed' || model === '') {
              // Fixed rent: monthly_rent is the full fixed rent
              fixedTotal += rent;
              fixedUnits += 1;
            } else if (model === 'RevenueShare' || model === 'Revenue Share' || model === 'Hybrid') {
              const mgAmount = parseFloat(lease.mg_amount) || 0;
              const netSales = parseFloat(lease.monthly_net_sales) || 0;
              const revPct = parseFloat(lease.revenue_share_percentage) || 0;
              const revShareAmount = (netSales > 0 && revPct > 0) ? (netSales * revPct) / 100 : 0;
              const option = (lease.rent_amount_option || 'Option A');

              if (option === 'Option B') {
                // Option B: Higher of MG or Revenue Share — only add the winner
                if (mgAmount >= revShareAmount) {
                  // MG wins (or tie)
                  if (mgAmount > 0) { mgTotal += mgAmount; mgUnits += 1; }
                } else {
                  // Revenue share wins
                  revShareTotal += revShareAmount; revShareUnits += 1;
                }
              } else {
                // Option A: MG + Revenue Share (both components)
                if (mgAmount > 0) { mgTotal += mgAmount; mgUnits += 1; }
                if (revShareAmount > 0) { revShareTotal += revShareAmount; revShareUnits += 1; }
              }
            } else {
              // Fallback for any other model
              fixedTotal += rent;
              fixedUnits += 1;
            }
          });

          setRentComposition({
            fixed: fixedTotal,
            mg: mgTotal,
            revenueShare: revShareTotal,
            fixedUnits,
            mgUnits,
            revShareUnits
          });

          // (monthly activity is now handled by the milestoneMonthData path below)
          // Shared helper — checks date presence for each milestone level (document upload optional)
          const qualifiesForMilestone = (lease) => {
            const hasReg = !!(lease.registration_date && String(lease.registration_date).trim());
            const hasExe = !!(lease.agreement_date && String(lease.agreement_date).trim());
            const hasLoi = !!(lease.loi_date && String(lease.loi_date).trim());
            return hasReg || hasExe || hasLoi;
          };

          const getLeasingStatusCounts = (leaseList) => {
            const counts = { registered: 0, executed: 0, loi: 0 };
            leaseList.forEach(lease => {
              const hasReg = !!(lease.registration_date && String(lease.registration_date).trim());
              const hasExe = !!(lease.agreement_date && String(lease.agreement_date).trim());
              const hasLoi = !!(lease.loi_date && String(lease.loi_date).trim());
              if (hasReg) counts.registered += 1;
              else if (hasExe) counts.executed += 1;
              else if (hasLoi) counts.loi += 1;
            });
            console.log(`[LeasingActivity] Status counts: LOI=${counts.loi}, Executed=${counts.executed}, Registered=${counts.registered}`);
            return counts;
          };

          const statusCounts = getLeasingStatusCounts(leases);
          const loiCount = statusCounts.loi;
          const executedCount = statusCounts.executed;
          const registeredCount = statusCounts.registered;

          // Dynamic Bar chart: gather all qualified leases
          const qualifiedLeases = leases.filter(l => qualifiesForMilestone(l));

          // Locale-independent month key: "Jan 25", "Feb 26" etc.
          const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const fmtMon = (d) => `${MO[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
          
          // Robust date parser - handles various formats including malformed years
          const parseDate = (dateStr) => {
            if (!dateStr || !String(dateStr).trim() || dateStr === 'null') return null;
            let d = new Date(dateStr);
            if (isNaN(d.getTime())) {
              // Try ISO format parsing
              d = new Date(dateStr + 'T00:00:00');
            }
            if (isNaN(d.getTime())) {
              // Try DD-MM-YYYY or DD/MM/YYYY
              const parts = dateStr.split(/[-/]/);
              if (parts.length === 3) {
                const [day, month, year] = parts.length === 3 && parts[2].length === 4 
                  ? [parts[0], parts[1], parts[2]]
                  : [parts[2], parts[1], parts[0]];
                d = new Date(`${year}-${month}-${day}`);
              }
            }
            if (isNaN(d.getTime())) return null;
            
            // FIX: Handle malformed years like 0001, 0002 that should be 2025, 2026
            // Pattern: 0001 = 2025, 0002 = 2026 (offset from 2024)
            const year = d.getFullYear();
            if (year < 100) {
              // Map 0001 → 2025, 0002 → 2026, etc.
              const correctedYear = 2024 + year;
              d.setFullYear(correctedYear);
              console.log(`[parseDate] Fixed malformed year ${year} → ${correctedYear} for date ${dateStr}`);
            }
            
            return d;
          };

          // If no milestone chart bars exist, build a single-bar summary for current month
          const buildFallbackChartData = (loi, executed, registered) => {
            const now = new Date();
            const monthKey = fmtMon(now);
            return [{
              month: monthKey,
              sortKey: now.getFullYear() * 100 + now.getMonth(),
              units: loi + executed + registered,
              area: 0,
              loiUnits: loi, loiArea: 0,
              executedUnits: executed, executedArea: 0,
              registeredUnits: registered, registeredArea: 0
            }];
          };

          // ── Rolling 12-month window anchored to Jan 2026 minimum ──────────────
          // Logic:
          //   windowStart = max(Jan 2026, currentMonth - 11 months)
          //   windowEnd   = windowStart + 11 months
          //
          // In May 2026:  rollingBack = Jun 2025 → clamped to Jan 2026 → window = Jan 26 – Dec 26
          // In Jan 2027:  rollingBack = Feb 2026 → no clamp needed  → window = Feb 26 – Jan 27
          // In Feb 2027:  rollingBack = Mar 2026                     → window = Mar 26 – Feb 27
          // Always exactly 12 months, always rolling forward, never before Jan 2026.

          const now = new Date();
          const ANCHOR_START = new Date(2026, 0, 1); // Jan 1 2026 — hard minimum

          // 12 months back from today (inclusive of current month)
          const rollingBack = new Date(now.getFullYear(), now.getMonth() - 11, 1);
          const windowStart = rollingBack < ANCHOR_START ? new Date(ANCHOR_START) : rollingBack;
          // windowEnd = windowStart + 11 months
          const windowEnd = new Date(windowStart.getFullYear(), windowStart.getMonth() + 11, 1);

          const isWithinWindow = (d) => {
            if (!d) return false;
            const m = new Date(d.getFullYear(), d.getMonth(), 1);
            const ws = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1);
            const we = new Date(windowEnd.getFullYear(), windowEnd.getMonth(), 1);
            return m >= ws && m <= we;
          };

          // Pre-populate ALL months in the window so the X-axis is always continuous
          const milestoneMonthData = {};
          {
            let cur = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1);
            const weRef = new Date(windowEnd.getFullYear(), windowEnd.getMonth(), 1);
            while (cur <= weRef) {
              const key = fmtMon(cur);
              milestoneMonthData[key] = {
                month: key,
                sortKey: cur.getFullYear() * 100 + cur.getMonth(),
                units: 0, area: 0,
                loiUnits: 0, loiArea: 0,
                executedUnits: 0, executedArea: 0,
                registeredUnits: 0, registeredArea: 0
              };
              cur.setMonth(cur.getMonth() + 1);
            }
          }

          // ── Count EACH milestone independently in its OWN month ──────────
          // If LOI was in April and Registration in June → LOI bar in Apr, Registered bar in Jun
          // If all 3 happened in same month → all 3 bars show in that month
          qualifiedLeases.forEach(lease => {
            const area = parseFloat(lease.chargeable_area || lease.units?.chargeable_area || lease.area_leased || lease.sub_lease_area_sqft || 0);

            // LOI milestone → placed in loi_date month
            const loiDate = parseDate(lease.loi_date);
            if (loiDate && isWithinWindow(loiDate)) {
              const key = fmtMon(loiDate);
              milestoneMonthData[key].loiUnits += 1;
              milestoneMonthData[key].loiArea += area;
              milestoneMonthData[key].units += 1;
              milestoneMonthData[key].area += area;
            }

            // Executed (Agreement) milestone → placed in agreement_date month
            const agreementDate = parseDate(lease.agreement_date);
            if (agreementDate && isWithinWindow(agreementDate)) {
              const key = fmtMon(agreementDate);
              milestoneMonthData[key].executedUnits += 1;
              milestoneMonthData[key].executedArea += area;
              milestoneMonthData[key].units += 1;
              milestoneMonthData[key].area += area;
            }

            // Registered milestone → placed in registration_date month
            const registrationDate = parseDate(lease.registration_date);
            if (registrationDate && isWithinWindow(registrationDate)) {
              const key = fmtMon(registrationDate);
              if (!milestoneMonthData[key]) {
                milestoneMonthData[key] = {
                  month: key,
                  sortKey: registrationDate.getFullYear() * 100 + registrationDate.getMonth(),
                  units: 0, area: 0,
                  loiUnits: 0, loiArea: 0,
                  executedUnits: 0, executedArea: 0,
                  registeredUnits: 0, registeredArea: 0
                };
              }
              milestoneMonthData[key].registeredUnits += 1;
              milestoneMonthData[key].registeredArea += area;
              milestoneMonthData[key].units += 1;
              milestoneMonthData[key].area += area;
            }
          });

          // Build final chart data: use milestone data if available, else fallback from counts
          const milestoneChartArray = Object.values(milestoneMonthData);
          
          // CRITICAL: Sort by sortKey (year*100 + month) for proper timeline flow
          milestoneChartArray.sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));
          
          // Window already limits to current month → next 11 months; no further filtering needed.
          const chartHasVisibleBars = milestoneChartArray.some(d =>
            d.loiUnits > 0 || d.executedUnits > 0 || d.registeredUnits > 0
          );
          const finalChartData = chartHasVisibleBars
            ? milestoneChartArray
            : (loiCount + executedCount + registeredCount > 0)
              ? buildFallbackChartData(loiCount, executedCount, registeredCount)
              : milestoneChartArray;

          // DEBUG: Show months with combined activities
          console.log('[LeasingActivity] === MONTHLY BREAKDOWN (Current & Future) ===');
          finalChartData.filter(d => d.loiUnits > 0 || d.executedUnits > 0 || d.registeredUnits > 0).forEach(d => {
            console.log(`  ${d.month}: LOI=${d.loiUnits}, Executed=${d.executedUnits}, Registered=${d.registeredUnits}`);
          });
          console.log('[LeasingActivity] Total months with data:', finalChartData.filter(d => d.loiUnits > 0 || d.executedUnits > 0 || d.registeredUnits > 0).length);

          setLeasingStats({
            newLeases: leases.length,
            areaLeased: leases.reduce((sum, l) => sum + parseFloat(l.chargeable_area || l.units?.chargeable_area || l.area_leased || l.sub_lease_area_sqft || 0), 0),
            chartData: finalChartData,
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
  }, [selectedProject, refreshKey]);

  // ── Supabase Realtime: re-fetch whenever a lease is inserted or updated ──
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-leases-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leases' },
        (payload) => {
          console.log('[Realtime] lease change detected:', payload.eventType);
          setRefreshKey(k => k + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Refresh data when window gains focus (real-time after creating leases)
  useEffect(() => {
    const handleFocus = () => {
      const fetchData = async () => {
        try {
          const unitParams = selectedProject !== 'All' ? { projectId: selectedProject } : {};
          const unitsRes = await unitAPI.getUnits(unitParams);
          const units = unitsRes.data?.data || unitsRes.data || [];
          setAllUnits(units);
          setProjectedRent(units.reduce((s, u) => s + (parseFloat(u.projected_rent) || 0), 0));

          const leaseParams = selectedProject !== 'All' ? { project_id: selectedProject } : {};
          const leasesRes = await leaseAPI.getAllLeases(leaseParams);
          const leases = Array.isArray(leasesRes.data) ? leasesRes.data : (leasesRes.data?.data || []);
          setAllLeases(leases);

          // Recalculate rent composition
          let fixedTotal = 0, mgTotal = 0, revShareTotal = 0, fixedUnits = 0, mgUnits = 0, revShareUnits = 0;
          const active = leases.filter(l => { const s = (l.status || '').toLowerCase().trim(); return s === 'active' || s === 'approved' || s === 'executed' || s === 'registered'; });
          active.forEach(l => {
            const rent = parseFloat(l.monthly_rent) || 0;
            const model = (l.rent_model || 'Fixed').trim();
            if (model === 'Fixed' || model === '') {
              fixedTotal += rent; fixedUnits += 1;
            } else if (model === 'RevenueShare' || model === 'Revenue Share' || model === 'Hybrid') {
              const mgAmount = parseFloat(l.mg_amount) || 0;
              const netSales = parseFloat(l.monthly_net_sales) || 0;
              const revPct = parseFloat(l.revenue_share_percentage) || 0;
              const revShareAmount = (netSales > 0 && revPct > 0) ? (netSales * revPct) / 100 : 0;
              const option = (l.rent_amount_option || 'Option A');
              if (option === 'Option B') {
                // Option B: only the winner
                if (mgAmount >= revShareAmount) { if (mgAmount > 0) { mgTotal += mgAmount; mgUnits += 1; } }
                else { revShareTotal += revShareAmount; revShareUnits += 1; }
              } else {
                // Option A: both components
                if (mgAmount > 0) { mgTotal += mgAmount; mgUnits += 1; }
                if (revShareAmount > 0) { revShareTotal += revShareAmount; revShareUnits += 1; }
              }
            } else { fixedTotal += rent; fixedUnits += 1; }
          });
          setRentComposition({ fixed: fixedTotal, mg: mgTotal, revenueShare: revShareTotal, fixedUnits, mgUnits, revShareUnits });

          // Recalculate leasing milestone counts from ALL leases
          const focusCounts = { registered: 0, executed: 0, loi: 0 };
          leases.forEach(l => {
            const hasReg = !!(l.registration_date && String(l.registration_date).trim());
            const hasExe = !!(l.agreement_date && String(l.agreement_date).trim());
            const hasLoi = !!(l.loi_date && String(l.loi_date).trim());
            if (hasReg) focusCounts.registered += 1;
            else if (hasExe) focusCounts.executed += 1;
            else if (hasLoi) focusCounts.loi += 1;
          });
          setLeasingStats(prev => ({
            ...prev,
            newLeases: leases.length,
            areaLeased: leases.reduce((sum, l) => sum + parseFloat(l.chargeable_area || l.units?.chargeable_area || l.area_leased || 0), 0),
            executedCount: focusCounts.executed,
            registeredCount: focusCounts.registered,
            loiCount: focusCounts.loi
          }));

          // Recalculate zoning
          const zoningMap = {};
          units.forEach(unit => {
            const zt = unit.unit_zoning_type; const area = parseFloat(unit.chargeable_area || 0);
            if (zt && area > 0) {
              const k = zt.toLowerCase().trim().replace(/\s+/g, '_');
              if (!zoningMap[k]) zoningMap[k] = { name: zt, plan: 0, actual: 0, planArea: 0, actualArea: 0 };
              zoningMap[k].plan += 1; zoningMap[k].planArea += area;
              if (unit.status === 'leased' || unit.status === 'sold' || unit.status === 'occupied') { zoningMap[k].actual += 1; zoningMap[k].actualArea += area; }
            }
          });
          setZoningData(Object.values(zoningMap).filter(z => z.plan > 0));

          // Re-fetch parties so Brand Performance, Expiry, Lock-in, and Escalations update in real-time
          try {
            const partiesResF = await partyAPI.getAllParties({ type: 'Company' });
            const partiesListF = Array.isArray(partiesResF.data) ? partiesResF.data : (partiesResF.data?.data || []);
            setAllParties(partiesListF);
            const allPartiesResF = await partyAPI.getAllParties();
            const allPartiesListF = Array.isArray(allPartiesResF.data) ? allPartiesResF.data : (allPartiesResF.data?.data || []);
            const pMapF = {};
            allPartiesListF.forEach(p => { pMapF[p.id] = p; });
            setAllPartiesMap(pMapF);
          } catch (e) { console.error('Focus parties refresh error:', e); }
        } catch (err) { console.error('Focus refresh error:', err); }
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
  // totalUnits: use projects.total_units (computed by project_id, matches Property Stats)
  //   - "All Projects" → sum of all project total_units
  //   - Specific project → that project's total_units
  // Always use the exact count from DB (avoids stale project.total_units mismatch)
  const totalUnits = trueUnitCount > 0 ? trueUnitCount : (allUnits.length || 0);
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
          {/* Hide project dropdown for module users with no project access (dashboard-only) */}
          {!(_isModuleUser && projects.length === 0) && (
            <div className="echo-project-dropdown">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="echo-project-select"
              >
                {/* Show 'All Projects' only if user is not restricted to specific projects */}
                {!isRestrictedDashboard && <option value="All">All Projects</option>}
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
              <ChevronDown className="echo-chevron" />
            </div>
          )}
        </div>

        {/* Critical notification ticker — floats between logo and avatar */}
        <div style={{ flex: 1, minWidth: 0, margin: '0 16px' }}>
          <CriticalNotificationTicker leases={allLeases} />
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
            <button
              className="echo-btn-primary"
              onClick={() => {
                // Check if user has leases module access with edit permission
                const hasLeaseAccess = hasModuleAccess('leases');
                const leasePerms = getModulePermissions('leases');
                if (hasLeaseAccess && leasePerms?.edit) {
                  navigate('/admin/add-lease');
                } else {
                  alert('You do not have permission to create leases. Please contact your administrator.');
                }
              }}
            >
              <Plus className="echo-btn-icon" /> New Lease
            </button>
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
            const proj = selectedProject !== 'All' ? `&projectId=${selectedProject}` : '';
            navigate(`/admin/units?status=occupied${proj}`);
          }}
          onVacantUnitsClick={() => {
            const proj = selectedProject !== 'All' ? `&projectId=${selectedProject}` : '';
            navigate(`/admin/units?status=vacant${proj}`);
          }}
          onProjectedRentClick={() => {
            const params = selectedProject !== 'All' ? `?projectId=${selectedProject}` : '';
            navigate(`/admin/units${params}`);
          }}
          onActualRentClick={() => {
            const params = selectedProject !== 'All' ? `?projectId=${selectedProject}` : '';
            navigate(`/admin/leases${params}`);
          }}
        />

        {/* Section Title */}
        <div className="echo-section-title">
          <div className="echo-section-bar"></div>
          <h2 className="echo-section-heading">Rent Composition &amp; Leasing Activity</h2>
        </div>

        {/* 2-Column: Rent Composition + Leasing Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
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
        </div>

        {/* Section Title - Lease Expiry, Lock-in & Escalations */}
        <div className="echo-section-title">
          <div className="echo-section-bar"></div>
          <h2 className="echo-section-heading">Lease Expiry, Lock-In Status & Rent Escalations</h2>
        </div>

        {/* Lease Expiry, Lock-in & Upcoming Escalations - 3 Column Grid */}
        <div className="echo-charts-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <LeaseExpirySection leases={allLeases} partiesMap={allPartiesMap} loading={loading} />
          <LockInExpirySection leases={allLeases} partiesMap={allPartiesMap} loading={loading} />
          <UpcomingEscalations leases={allLeases} partiesMap={allPartiesMap} loading={loading} />
        </div>

        {/* Section Title - Rental Projection */}
        <div className="echo-section-title">
          <div className="echo-section-bar"></div>
          <h2 className="echo-section-heading">Comprehensive Rental Projection Matrix</h2>
        </div>

        {/* Financial Value Monthly - Full Width with internal scroll */}
        <FinancialValueMonthly leases={allLeases} loading={loading} />

        {/* Section Title - Brand Performance */}
        <div className="echo-section-title">
          <div className="echo-section-bar"></div>
          <h2 className="echo-section-heading">Brand Performance vs Target Sales</h2>
        </div>

        {/* Brand Performance & Floor Occupancy - 2 Column Grid */}
        <div className="echo-charts-row">
          <BrandPerformanceSection leases={allLeases} parties={allParties} partiesMap={allPartiesMap} loading={loading} />
          <FloorOccupancySection units={allUnits} leases={allLeases} loading={loading} />
        </div>

        {/* Section Title - Unit Sales & Ownership + Zoning Plan */}
        <div className="echo-section-title">
          <div className="echo-section-bar"></div>
          <h2 className="echo-section-heading">Unit Sales &amp; Ownership · Zoning Plan vs Actual</h2>
        </div>

        {/* Ownership (narrower, left) + Zoning Chart (wider, right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 2fr', gap: '24px', alignItems: 'start', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <OwnershipSection units={allUnits} leases={allLeases} loading={loading} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <ZoningExecution zoningData={zoningData} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EchoDashboard;
