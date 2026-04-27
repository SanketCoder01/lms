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

    let query = supabase
      .from('filter_options')
      .select('*')
      .eq('status', 'active')
      .order('option_value', { ascending: true });

    // Multi-tenant: company users only see their own filter options
    if (req.companyId) query = query.eq('company_id', req.companyId);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[FilterOptions GET]', error);
      return res.status(500).json(handleDbError(error));
    }

    res.json({ success: true, data: data || [] });
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

    const insertPayload = {
      category: category.trim(),
      option_value: option_value.trim(),
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
      return res.status(error.code === '23505' ? 400 : 500).json(handleDbError(error));
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
