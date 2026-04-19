const supabase = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const projectId = req.query.project_id || null;

    // Default response structure
    const response = {
      topRow: {
        totalProjects: { value: 0, label: "Total Projects" },
        totalUnits: { value: 0, label: "Total Units" },
        totalProjectArea: { value: 0, label: "Total Project Area", unit: "sq ft" }
      },
      secondRow: {
        unitsSold: { value: 0, label: "Units Sold" },
        unitsUnsold: { value: 0, label: "Units Unsold" },
        areaSold: { value: 0, label: "Area Sold", unit: "sq ft" },
        areaUnsold: { value: 0, label: "Area Unsold", unit: "sq ft" },
        unitOwnership: { value: 0, label: "Unit Ownerships" }
      },
      thirdRow: {
        unitsLeased: { value: 0, label: "Units Leased" },
        unitsVacant: { value: 0, label: "Units Vacant" },
        areaLeased: { value: 0, label: "Area Leased", unit: "sq ft" },
        areaVacant: { value: 0, label: "Area Vacant", unit: "sq ft" },
        totalLessees: { value: 0, label: "Total Lessees" }
      },
      financials: {
        rentMonth: { value: 0, label: "Rent (Month)" },
        rentYear: { value: 0, label: "Rent (Year)" },
        opportunityLoss: { value: 0, label: "Opportunity Loss (Vacancy)" },
        avgActualRent: { value: "0.00", label: "Avg Actual Rent / Sqft" },
        avgProjectedRent: { value: "0.00", label: "Avg Projected Rent / Sqft" },
        deviation: { value: "0.00", percent: "0%", label: "Deviation" }
      },
      graphs: {
        revenueTrends: []
      }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ==========================================
    // 1. Fetch Core Data (with multi-tenant isolation)
    // ==========================================
    let projectsQuery = supabase.from('projects').select('id, project_name');
    let unitsQuery = supabase.from('units').select('id, project_id, chargeable_area, projected_rent');
    let ownershipsQuery = supabase.from('unit_ownerships').select('unit_id, party_id, ownership_status');
    let leasesQuery = supabase.from('leases').select('id, project_id, unit_id, party_tenant_id, monthly_rent, status, lease_start, lease_end');

    // Company users only see their own company's data
    if (req.companyId) {
      projectsQuery = projectsQuery.eq('company_id', req.companyId);
      unitsQuery    = unitsQuery.eq('company_id', req.companyId);
      leasesQuery   = leasesQuery.eq('company_id', req.companyId);
    }

    // Apply Project Filter if selected (and not "All")
    if (projectId && projectId !== 'All') {
      projectsQuery = projectsQuery.eq('id', projectId);
      unitsQuery = unitsQuery.eq('project_id', projectId);
      // For ownerships, we must filter after fetch or use an inner join. We'll filter in JS.
      leasesQuery = leasesQuery.eq('project_id', projectId);
    }

    const [
      { data: projects = [], error: projError },
      { data: units = [], error: unitError },
      { data: ownerships = [], error: ownError },
      { data: leases = [], error: leaseError }
    ] = await Promise.all([projectsQuery, unitsQuery, ownershipsQuery, leasesQuery]);

    if (projError) console.error("Error fetching projects:", projError);
    if (unitError) console.error("Error fetching units:", unitError);
    if (ownError) console.error("Error fetching ownerships:", ownError);
    if (leaseError) console.error("Error fetching leases:", leaseError);

    // Filter Ownerships by selected project units
    const projectUnitIds = new Set(units.map(u => u.id));
    const relevantOwnerships = ownerships.filter(o => projectUnitIds.has(o.unit_id) && o.ownership_status === 'Active');

    // ==========================================
    // 2. Compute Top Row
    // ==========================================
    const totalProjects = projects.length;
    const totalUnits = units.length;
    const totalProjectArea = units.reduce((sum, u) => sum + parseFloat(u.chargeable_area || 0), 0);
    const globalProjectedRentTotal = units.reduce((sum, u) => sum + parseFloat(u.projected_rent || 0), 0);

    response.topRow.totalProjects.value = totalProjects;
    response.topRow.totalUnits.value = totalUnits;
    response.topRow.totalProjectArea.value = totalProjectArea;

    // ==========================================
    // 3. Compute Second Row (Sales & Ownership)
    // ==========================================
    const soldUnitIds = new Set(relevantOwnerships.map(o => o.unit_id));
    const unitsSold = soldUnitIds.size;

    // Distinct owners count
    const uniqueOwners = new Set(relevantOwnerships.map(o => o.party_id));
    response.secondRow.unitOwnership.value = uniqueOwners.size;

    const soldUnitsData = units.filter(u => soldUnitIds.has(u.id));
    const areaSold = soldUnitsData.reduce((sum, u) => sum + parseFloat(u.chargeable_area || 0), 0);

    response.secondRow.unitsSold.value = unitsSold;
    response.secondRow.areaSold.value = areaSold;
    response.secondRow.unitsUnsold.value = totalUnits - unitsSold;
    response.secondRow.areaUnsold.value = totalProjectArea - areaSold;

    // ==========================================
    // 4. Compute Third Row (Leasing Status)
    // ==========================================
    // Active Leases based on current date
    const activeLeases = leases.filter(l => {
      if (l.status !== 'active') return false;
      const start = new Date(l.lease_start);
      // If end date exists, ensure it hasn't passed
      if (l.lease_end) {
        const end = new Date(l.lease_end);
        return start <= today && end >= today;
      }
      return start <= today;
    });

    const leasedUnitIds = new Set(activeLeases.map(l => l.unit_id));
    const unitsLeased = leasedUnitIds.size;

    // Distinct lessees count
    const uniqueLessees = new Set(activeLeases.map(l => l.party_tenant_id));
    response.thirdRow.totalLessees.value = uniqueLessees.size;

    const leasedUnitsData = units.filter(u => leasedUnitIds.has(u.id));
    const areaLeased = leasedUnitsData.reduce((sum, u) => sum + parseFloat(u.chargeable_area || 0), 0);
    const totalActualRentMonthly = activeLeases.reduce((sum, l) => sum + parseFloat(l.monthly_rent || 0), 0);

    response.thirdRow.unitsLeased.value = unitsLeased;
    response.thirdRow.areaLeased.value = areaLeased;
    response.thirdRow.unitsVacant.value = totalUnits - unitsLeased;
    response.thirdRow.areaVacant.value = totalProjectArea - areaLeased;

    // ==========================================
    // 5. Compute Financials
    // ==========================================
    const rentForMonth = totalActualRentMonthly;
    const rentForYear = rentForMonth * 12;

    response.financials.rentMonth.value = rentForMonth;
    response.financials.rentYear.value = rentForYear;

    const vacantUnitsData = units.filter(u => !leasedUnitIds.has(u.id));
    const opportunityLoss = vacantUnitsData.reduce((sum, u) => sum + parseFloat(u.projected_rent || 0), 0);
    response.financials.opportunityLoss.value = opportunityLoss;

    const avgActualRentPerSqft = areaLeased > 0 ? (rentForMonth / areaLeased) : 0;
    const avgProjectedRentPerSqft = totalProjectArea > 0 ? (globalProjectedRentTotal / totalProjectArea) : 0;
    const deviation = avgActualRentPerSqft - avgProjectedRentPerSqft;
    const deviationPercent = avgProjectedRentPerSqft > 0 ? ((deviation / avgProjectedRentPerSqft) * 100) : 0;

    response.financials.avgActualRent.value = avgActualRentPerSqft.toFixed(2);
    response.financials.avgProjectedRent.value = avgProjectedRentPerSqft.toFixed(2);
    response.financials.deviation.value = deviation.toFixed(2);
    response.financials.deviation.percent = deviationPercent.toFixed(1) + '%';

    // ==========================================
    // 6. Graphs (Revenue Trends)
    // ==========================================
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueTrends = [];

    // Fetch leases that were active in the past 12 months
    for (let i = 11; i >= 0; i--) {
      // Calculate start and end bounds of this month "bucket"
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0); // Last day of month

      const monthName = months[d.getMonth()];

      // Accumulate rent for leases active during this specific month
      const monthRevenue = leases.reduce((sum, l) => {
        if (l.status !== 'active') return sum;
        const lStart = new Date(l.lease_start);
        const lEnd = l.lease_end ? new Date(l.lease_end) : new Date(today.getFullYear() + 100, 0, 1);

        // Lease overlaps with month if lease starts before or during month, and ends during or after month
        if (lStart <= monthEnd && lEnd >= monthStart) {
          return sum + parseFloat(l.monthly_rent || 0);
        }
        return sum;
      }, 0);

      revenueTrends.push({
        month: monthName,
        revenue: monthRevenue
      });
    }

    response.graphs.revenueTrends = revenueTrends;

    res.json(response);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardStats
};
