import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseClient = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const hasSupabase = Boolean(supabaseClient)

export async function getSessionUser() {
  if (!supabaseClient) return null
  const { data } = await supabaseClient.auth.getSession()
  return data?.session?.user ?? null
}

export async function signInWithEmail(email, password) {
  if (!supabaseClient) throw new Error('Supabase chưa được cấu hình')
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data.user
}

export async function signUpWithEmail(email, password, inviteCode) {
  if (!supabaseClient) throw new Error('Supabase chưa được cấu hình')
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { invite_code: inviteCode || '' } },
  })
  if (error) throw new Error(error.message)
  return data.user
}

export async function signOut() {
  if (!supabaseClient) return
  await supabaseClient.auth.signOut()
}

export async function onAuthStateChange(handler) {
  if (!supabaseClient) return () => {}
  const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
    handler(event, session?.user ?? null)
  })
  return () => data.subscription.unsubscribe()
}
