/**
 * filterOptionsController.js
 * Full CRUD for filter_options table via Supabase service_role client.
 * Multi-tenant: strict per-company isolation — company users ONLY see their own options.
 *
 * ROOT CAUSE FIXES:
 *  1. Cross-company leak: When req.companyId was missing, the OR condition was skipped
 *     entirely and ALL companies' options were returned. Fixed with strict auth guard.
 *  2. Options "disappearing": OR with company_id.is.null included global rows that could
 *     vanish (super-admin cleanup) causing perceived data loss. Fixed with strict isolation
 *     + graceful per-category fallback only when company has zero own options.
 */

const supabase = require('../config/db');
const { handleDbError } = require('../utils/errorHandler');

// ─── GET /api/filters?category=xxx ────────────────────────────────────────────
exports.getFilterOptions = async (req, res) => {
  try {
    const { category } = req.query;

    // PRIVACY: Never serve data without a valid company session
    if (req.isUnauthenticated || !req.companyId) {
      return res.json({ success: true, data: [] });
    }

    // ── Step 1: Fetch ONLY this company's own options (strict isolation) ───────
    let query = supabase
      .from('filter_options')
      .select('*')
      .eq('status', 'active')
      .eq('company_id', req.companyId);

    if (category) query = query.eq('category', category);

    query = query.order('option_value', { ascending: true });

    const { data, error } = await query;
    if (error) {
      console.error('[FilterOptions GET]', error);
      return res.status(500).json(handleDbError(error));
    }

    let result = data || [];

    // ── Step 2: Backwards-compatibility fallback ───────────────────────────────
    // If this company has ZERO options for the requested category, fall back to
    // global options (company_id IS NULL) so existing deployments don't break.
    // Once the company creates at least one option for the category, the fallback
    // stops and they only see their own — preventing cross-company bleed.
    if (result.length === 0 && category) {
      const { data: globalData } = await supabase
        .from('filter_options')
        .select('*')
        .eq('status', 'active')
        .is('company_id', null)
        .eq('category', category)
        .order('option_value', { ascending: true });
      result = globalData || [];
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[FilterOptions GET catch]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /api/filters ─────────────────────────────────────────────────────────
exports.addFilterOption = async (req, res) => {
  try {
    // PRIVACY: Require valid company session to create options
    if (req.isUnauthenticated || !req.companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: company session required' });
    }

    const { category, option_value } = req.body;
    if (!category || !option_value) {
      return res.status(400).json({ success: false, error: 'Category and option_value are required' });
    }

    const trimmedCategory = category.trim();
    const trimmedValue    = option_value.trim();

    // Pre-check: does this option already exist for this category + company?
    const { data: existing } = await supabase
      .from('filter_options')
      .select('id')
      .eq('category', trimmedCategory)
      .ilike('option_value', trimmedValue)
      .eq('company_id', req.companyId)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `"${trimmedValue}" already exists in the "${trimmedCategory}" category.`
      });
    }

    // Always stamp company_id — never allow null company_id from this endpoint
    const { data, error } = await supabase
      .from('filter_options')
      .insert({
        category:     trimmedCategory,
        option_value: trimmedValue,
        status:       'active',
        company_id:   req.companyId   // enforced — no null leak
      })
      .select();

    if (error) {
      console.error('[FilterOptions POST]', error);
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: `"${trimmedValue}" already exists in the "${trimmedCategory}" category.`
        });
      }
      return res.status(500).json(handleDbError(error));
    }

    res.status(201).json({ success: true, id: data[0]?.id, message: 'Filter option added' });
  } catch (err) {
    console.error('[FilterOptions POST catch]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── PUT /api/filters/:id ──────────────────────────────────────────────────────
exports.updateFilterOption = async (req, res) => {
  try {
    if (req.isUnauthenticated || !req.companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { option_value } = req.body;
    if (!option_value) {
      return res.status(400).json({ success: false, error: 'option_value is required' });
    }

    // Safety: WHERE id = :id AND company_id = :companyId — can't touch other companies' rows
    const { error } = await supabase
      .from('filter_options')
      .update({ option_value: option_value.trim() })
      .eq('id', id)
      .eq('company_id', req.companyId);

    if (error) {
      console.error('[FilterOptions PUT]', error);
      if (error.code === '23505') {
        return res.status(400).json({ success: false, error: 'Option value already exists in this category' });
      }
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Filter option updated' });
  } catch (err) {
    console.error('[FilterOptions PUT catch]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE /api/filters/:id ───────────────────────────────────────────────────
exports.deleteFilterOption = async (req, res) => {
  try {
    if (req.isUnauthenticated || !req.companyId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Safety: WHERE id = :id AND company_id = :companyId — can't delete other companies' rows
    const { error } = await supabase
      .from('filter_options')
      .delete()
      .eq('id', id)
      .eq('company_id', req.companyId);

    if (error) {
      console.error('[FilterOptions DELETE]', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Filter option deleted' });
  } catch (err) {
    console.error('[FilterOptions DELETE catch]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
