import { getGuests } from '@/api/accommodation/guests'
import { getClients } from '@/api/clients'
import { useAccommodationAuthStore } from '@/stores/accommodationAuth'
import { useAuthStore } from '@/stores/auth'
import type { AccGuest } from '@/types/accommodation'
import type { Client } from '@/types'

/** looking into the other system must never toast, log out or redirect */
const quiet = { silent: true, noAuthRedirect: true }
const LIMIT = 10

export const normEmail = (s?: string | null) => (s ?? '').trim().toLowerCase()
/** digits only, last 9, so "+421 905 123 456" and "0905123456" match */
export const normPhone = (s?: string | null) => (s ?? '').replace(/\D/g, '').slice(-9)

type Contact = { email?: string | null; phone?: string | null }

/** drops rows of the other system that are already present here (same email or phone) */
export function withoutDuplicates<T extends Contact>(foreign: T[], native: Contact[]): T[] {
  const emails = new Set(native.map((n) => normEmail(n.email)).filter(Boolean))
  const phones = new Set(native.map((n) => normPhone(n.phone)).filter((p) => p.length >= 6))
  return foreign.filter((f) => {
    const e = normEmail(f.email)
    const p = normPhone(f.phone)
    return !(e && emails.has(e)) && !(p.length >= 6 && phones.has(p))
  })
}

/** ski school clients, or [] when not signed in there / on any error */
export async function searchSkiClients(q: string): Promise<Client[]> {
  if (!q || !useAuthStore().isLoggedIn) return []
  try {
    return (await getClients({ query: q, limit: LIMIT }, quiet)).clients ?? []
  } catch {
    return []
  }
}

/** accommodation guests, or [] when not signed in there / on any error */
export async function searchAccGuests(q: string): Promise<AccGuest[]> {
  if (!q || !useAccommodationAuthStore().isLoggedIn) return []
  try {
    return (await getGuests({ q, per_page: LIMIT }, quiet)).data ?? []
  } catch {
    return []
  }
}
