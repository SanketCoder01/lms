/**
 * errorHandler.js
 * Centralizes the mapping of Supabase/PostgreSQL error codes to human-readable strings.
 */

const handleDbError = (error) => {
  if (!error) return null;

  // PostgreSQL Error Codes
  const pgErrors = {
    '23505': 'A record with this information already exists.',
    '23503': 'This action cannot be completed because this record is being used elsewhere.',
    '42P01': 'The requested table was not found in the database. Please run the SQL setup script.',
    '42703': 'A column is missing in the database. Please check the schema.',
    '23502': 'A required field is missing data.',
  };

  const message = pgErrors[error.code] || error.message || 'An unexpected database error occurred.';
  const details = error.details || error.hint || null;

  return {
    success: false,
    message,
    details,
    code: error.code
  };
};

module.exports = { handleDbError };
