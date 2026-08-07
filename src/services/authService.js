import { supabaseClient } from './supabaseClient'

export async function fetchMyProfile(userId) {
  if (!supabaseClient) return null
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export async function listProfiles() {
  if (!supabaseClient) return []
  const { data, error } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function updateProfileRole(userId, role) {
  if (!supabaseClient) throw new Error('Supabase chưa được cấu hình')
  const { error } = await supabaseClient.from('profiles').update({ role }).eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function listInviteCodes() {
  if (!supabaseClient) return []
  const { data, error } = await supabaseClient.from('invite_codes').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createInviteCode({ code, maxUses = 1 }) {
  if (!supabaseClient) throw new Error('Supabase chưa được cấu hình')
  const normalized = String(code || '').trim().toUpperCase()
  if (!normalized) throw new Error('Mã mời không được để trống')
  const { data, error } = await supabaseClient
    .from('invite_codes')
    .insert({ code: normalized, max_uses: Number(maxUses) || 1 })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function toggleInviteCode(id, active) {
  if (!supabaseClient) throw new Error('Supabase chưa được cấu hình')
  const { error } = await supabaseClient.from('invite_codes').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteInviteCode(id) {
  if (!supabaseClient) throw new Error('Supabase chưa được cấu hình')
  const { error } = await supabaseClient.from('invite_codes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
