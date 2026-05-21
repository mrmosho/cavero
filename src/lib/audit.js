import { supabase } from './supabase'

/**
 * Log an admin action to the audit log.
 * Call this after any significant admin action.
 *
 * @param {object} params
 * @param {string} params.userEmail   - email of the admin who did it
 * @param {string} params.action      - what they did e.g. 'Updated order status'
 * @param {string} params.targetType  - 'order' | 'product' | 'discount_code' | 'category' | 'blocked_email'
 * @param {string} params.targetId    - id or slug of the affected item
 * @param {string} params.targetName  - human readable name
 * @param {object} params.details     - any extra info (old value, new value, etc.)
 */
export async function logAction({ userEmail, action, targetType, targetId, targetName, details }) {
  try {
    await supabase.from('audit_log').insert({
      user_email:  userEmail,
      action,
      target_type: targetType  || null,
      target_id:   targetId    || null,
      target_name: targetName  || null,
      details:     details     || null,
    })
  } catch (err) {
    // Never block the main action if logging fails
    console.warn('Audit log failed:', err)
  }
}