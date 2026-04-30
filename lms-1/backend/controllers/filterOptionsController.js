/**
 * filterOptionsController.js
 * Full CRUD for filter_options table via Supabase service_role client.
 * Multi-tenant: company users only see/modify their own filter options.
 */

const supabase = require('../config/db');
const { handleDbError } = require('../utils/errorHandler');

// GET /api/filters?category=xxx
exports.getFilterOptions = async (req, res) => {
  try {
    const { category } = req.query;

    // Build base query
    let query = supabase
      .from('filter_options')
      .select('*')
      .eq('status', 'active');

    // Multi-tenant: company users see their own filter options PLUS global options (company_id = null)
    // Use .or() properly with parentheses for correct grouping
    if (req.companyId) {
      query = query.or(`company_id.eq.${req.companyId},company_id.is.null`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Apply ordering after filters
    query = query.order('option_value', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('[FilterOptions GET]', error);
      return res.status(500).json(handleDbError(error));
    }

    let result = data || [];

    // Auto-seed the 3 default Owner Grouping options if any are missing
    if (category === 'Owner Grouping') {
      console.log(`[FilterOptions] Owner Grouping requested, companyId=${req.companyId}, existing=${result.length}`);
      const defaults = ['Developer Unit', 'Close Group', 'External Investors'];
      const existingValues = result.map(r => r.option_value);
      const missingDefaults = defaults.filter(d => !existingValues.includes(d));

      if (missingDefaults.length > 0) {
        console.log(`[FilterOptions] Seeding missing defaults: ${missingDefaults.join(', ')}`);
        const inserts = missingDefaults.map(v => ({
          category: 'Owner Grouping',
          option_value: v,
          status: 'active',
          company_id: req.companyId || null
        }));
        const { data: seeded, error: seedErr } = await supabase
          .from('filter_options')
          .insert(inserts)
          .select();
        
        if (seedErr) {
          console.error('[FilterOptions] Seed error:', seedErr);
        } else if (seeded) {
          console.log(`[FilterOptions] Seeded ${seeded.length} options`);
          result = [...result, ...seeded];
        }
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[FilterOptions GET catch]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/filters
exports.addFilterOption = async (req, res) => {
  try {
    const { category, option_value } = req.body;

    if (!category || !option_value) {
      return res.status(400).json({ success: false, error: 'Category and option_value are required' });
    }

    const trimmedCategory = category.trim();
    const trimmedValue = option_value.trim();

    // Pre-check: does this option already exist for this category + company?
    let checkQuery = supabase
      .from('filter_options')
      .select('id')
      .eq('category', trimmedCategory)
      .ilike('option_value', trimmedValue);
    if (req.companyId) checkQuery = checkQuery.eq('company_id', req.companyId);

    const { data: existing } = await checkQuery.limit(1);
    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `"${trimmedValue}" already exists in the "${trimmedCategory}" category.`
      });
    }

    const insertPayload = {
      category: trimmedCategory,
      option_value: trimmedValue,
      status: 'active'
    };
    // Multi-tenant: stamp company_id on new options
    if (req.companyId) insertPayload.company_id = req.companyId;

    const { data, error } = await supabase
      .from('filter_options')
      .insert(insertPayload)
      .select();

    if (error) {
      console.error('[FilterOptions POST]', error);
      if (error.code === '23505') {
        return res.status(400).json({ success: false, error: `"${trimmedValue}" already exists in the "${trimmedCategory}" category.` });
      }
      return res.status(500).json(handleDbError(error));
    }

    res.status(201).json({ success: true, id: data[0]?.id, message: 'Filter option added' });
  } catch (err) {
    console.error('[FilterOptions POST catch]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/filters/:id
exports.updateFilterOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { option_value } = req.body;

    if (!option_value) {
      return res.status(400).json({ success: false, error: 'option_value is required' });
    }

    let query = supabase
      .from('filter_options')
      .update({ option_value: option_value.trim() })
      .eq('id', id);

    // Safety: only update own company's options
    if (req.companyId) query = query.eq('company_id', req.companyId);

    const { error } = await query;

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

// DELETE /api/filters/:id
exports.deleteFilterOption = async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabase.from('filter_options').delete().eq('id', id);
    // Safety: only delete own company's options
    if (req.companyId) query = query.eq('company_id', req.companyId);

    const { error } = await query;

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
