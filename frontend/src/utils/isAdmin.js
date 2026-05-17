// utils/isAdmin.js
// Checks if the signed-in Clerk user should be treated as an admin.
// Two mechanisms work together:
//   1. Clerk publicMetadata.role === 'admin'
//      Set this in Clerk Dashboard → Users → click user → Metadata → Public:
//      { "role": "admin" }
//   2. VITE_ADMIN_EMAILS fallback (comma-separated list in .env)
//      Useful during development before Clerk metadata is configured.

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export function isAdmin(user) {
  if (!user) return false

  // Check Clerk publicMetadata first (production approach)
  if (user.publicMetadata?.role === 'admin') return true

  // Fallback to email list (development / demo)
  const email = (user.primaryEmailAddress?.emailAddress || '').toLowerCase()
  return ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(email)
}
