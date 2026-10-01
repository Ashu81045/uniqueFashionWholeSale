/** Lowercased query key + a Firestore-doc-id-safe slug for the same name. */
export function normalizeProductName(name: string): { docId: string; nameLower: string } {
  const nameLower = name.trim().toLowerCase()
  const docId = nameLower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item'
  return { docId, nameLower }
}
