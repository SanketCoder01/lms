/**
 * config/db.js - Custom Supabase REST API Client
 * Replaces @supabase/supabase-js to prevent WebAssembly OOM errors.
 */

const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log status for debugging (but don't crash in production)
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(' Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
} else {
  console.log(' Supabase REST client configured successfully');
}

class SupabaseQueryBuilder {
  constructor(url, key, table) {
    this.url = url;
    this.key = key;
    this.table = table;
    this.method = 'GET';
    this.queryParams = new URLSearchParams();
    this.headers = {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation' // Default to returning data
    };
    this.bodyData = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
  }

  select(columns = '*', options = {}) {
    // Keep POST/PATCH/DELETE if already set by insert/update/delete
    if (this.method !== 'POST' && this.method !== 'PATCH' && this.method !== 'DELETE') {
      this.method = options.head ? 'HEAD' : 'GET';
    }
    if (options.count) {
      this.headers['Prefer'] = `count=${options.count}`;
      this.countRequested = true;
    }
    this.queryParams.set('select', columns);
    return this;
  }

  insert(data) {
    this.method = 'POST';
    this.bodyData = data;
    this.headers['Prefer'] = 'return=representation';
    return this;
  }

  update(data) {
    this.method = 'PATCH';
    this.bodyData = data;
    this.headers['Prefer'] = 'return=representation';
    return this;
  }

  delete() {
    this.method = 'DELETE';
    this.headers['Prefer'] = 'return=representation';
    return this;
  }

  // Filters
  eq(col, val) { this.queryParams.append(col, `eq.${val}`); return this; }
  neq(col, val) { this.queryParams.append(col, `neq.${val}`); return this; }
  gt(col, val) { this.queryParams.append(col, `gt.${val}`); return this; }
  gte(col, val) { this.queryParams.append(col, `gte.${val}`); return this; }
  lt(col, val) { this.queryParams.append(col, `lt.${val}`); return this; }
  lte(col, val) { this.queryParams.append(col, `lte.${val}`); return this; }
  ilike(col, val) { this.queryParams.append(col, `ilike.${val}`); return this; }

  in(col, vals) {
    const joined = Array.isArray(vals) ? vals.join(',') : vals;
    this.queryParams.append(col, `in.(${joined})`);
    return this;
  }

  or(condition) {
    this.queryParams.append('or', `(${condition})`);
    return this;
  }

  // Modifiers
  order(col, options = { ascending: true }) {
    const asc = options.ascending === false ? 'desc' : 'asc';
    let existing = this.queryParams.get('order');
    if (existing) {
      this.queryParams.set('order', `${existing},${col}.${asc}`);
    } else {
      this.queryParams.set('order', `${col}.${asc}`);
    }
    return this;
  }

  limit(n) {
    this.queryParams.set('limit', n);
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  // Thenable to support await directly
  async then(resolve, reject) {
    try {
      if (!this.url || !this.key) {
        return resolve({
          data: null,
          error: { message: "Database not configured. Missing credentials." }
        });
      }

      const qs = this.queryParams.toString();
      const reqUrl = `${this.url}/rest/v1/${this.table}${qs ? '?' + qs : ''}`;

      const options = {
        method: this.method,
        headers: this.headers,
      };

      if (this.bodyData && this.method !== 'GET' && this.method !== 'HEAD') {
        options.body = JSON.stringify(this.bodyData);
      }

      const res = await fetch(reqUrl, options);
      const isJson = res.headers.get('content-type')?.includes('application/json');
      let data = null;

      if (isJson && this.method !== 'HEAD') {
        data = await res.json();
      }

      if (!res.ok) {
        return resolve({ data: null, error: data || { message: res.statusText } });
      }

      // Extract first item for single/maybeSingle
      if (this.isSingle || this.isMaybeSingle) {
        if (Array.isArray(data)) {
          data = data.length > 0 ? data[0] : null;
        }
      }

      if (this.isSingle && !data) {
        return resolve({ data: null, error: { message: "JSON object requested, but no rows returned" } });
      }

      if (this.method === 'DELETE' && !data) {
        data = [];
      }

      let count = null;
      if (this.countRequested) {
        const range = res.headers.get('content-range');
        if (range && range.includes('/')) {
          count = parseInt(range.split('/')[1], 10);
        }
      }

      return resolve({ data, count, error: null });
    } catch (error) {
      return resolve({ data: null, error: { message: error.message } });
    }
  }
}

class SupabaseREST {
  constructor(url, key) {
    this.url = url;
    this.key = key;

    // Minimal storage wrapper using raw REST calls
    this.storage = {
      from: (bucket) => ({
        upload: async (path, fileBuffer, options = {}) => {
          try {
            const uploadUrl = `${this.url}/storage/v1/object/${bucket}/${path}`;
            const headers = {
              'Authorization': `Bearer ${this.key}`,
              'Content-Type': options.contentType || 'application/octet-stream',
            };
            if (options.upsert) headers['x-upsert'] = 'true';

            const res = await fetch(uploadUrl, { method: 'POST', headers, body: fileBuffer });
            if (!res.ok) {
              let errData;
              try { errData = await res.json(); } catch (e) { errData = { message: res.statusText }; }
              return { data: null, error: errData };
            }
            return { data: { path }, error: null };
          } catch (err) {
            return { data: null, error: err };
          }
        },
        getPublicUrl: (path) => {
          return { data: { publicUrl: `${this.url}/storage/v1/object/public/${bucket}/${path}` } };
        }
      })
    };
  }
  from(table) {
    return new SupabaseQueryBuilder(this.url, this.key, table);
  }
}

const supabase = new SupabaseREST(SUPABASE_URL, SERVICE_KEY);

module.exports = supabase;