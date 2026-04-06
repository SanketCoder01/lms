/**
 * filterOptionsController.js
 * Full CRUD for filter_options table via Supabase service_role client.
 */

const supabase = require('../config/db');

// GET /api/filters?category=xxx
exports.getFilterOptions = async (req, res) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('filter_options')
      .select('*')
      .eq('status', 'active')
      .order('option_value', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[FilterOptions GET]', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('[FilterOptions GET catch]', err.message);
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

    const { data, error } = await supabase
      .from('filter_options')
      .insert({ category: category.trim(), option_value: option_value.trim(), status: 'active' })
      .select()
      .single();

    if (error) {
      console.error('[FilterOptions POST]', error);
      // Unique constraint violation
      if (error.code === '23505') {
        return res.status(400).json({ success: false, error: 'This option already exists in this category' });
      }
      // Table doesn't exist yet
      if (error.code === '42P01') {
        return res.status(500).json({ success: false, error: 'Table "filter_options" not found. Please run supabase_schema.sql in your Supabase SQL Editor first.' });
      }
      return res.status(500).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, id: data.id, message: 'Filter option added' });
  } catch (err) {
    console.error('[FilterOptions POST catch]', err.message);
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

    const { error } = await supabase
      .from('filter_options')
      .update({ option_value: option_value.trim() })
      .eq('id', id);

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

    const { error } = await supabase
      .from('filter_options')
      .delete()
      .eq('id', id);

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
