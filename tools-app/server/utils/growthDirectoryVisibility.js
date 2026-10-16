/**
 * SQL predicate excluding directories the workspace has removed (stored as a 'hidden' submission).
 * Expects the workspace id to be bound as $1 in the surrounding query.
 */
export const NOT_HIDDEN_DIRECTORY_SQL = (dirAlias) => `NOT EXISTS (
  SELECT 1 FROM growth_directory_submissions hidden_sub
  WHERE hidden_sub.directory_id = ${dirAlias}.id
    AND hidden_sub.workspace_id = $1
    AND hidden_sub.status = 'hidden'
)`;
