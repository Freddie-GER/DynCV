import { createClient } from '@supabase/supabase-js'
import { CVData } from '@/data/base-cv'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

// Create authenticated client using service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create public client with anonymous key
export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getLatestCV() {
  console.log('Fetching latest CV...')
  const { data, error } = await supabaseAdmin
    .from('cvs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching CV:', error)
    return null
  }

  return data
}

export async function saveCV(cv: CVData) {
  console.log('Saving CV with admin client...')
  const { data, error } = await supabaseAdmin
    .from('cvs')
    .insert([
      {
        title: `CV - ${cv.name}`,
        content: cv,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select()

  if (error) {
    console.error('Error saving CV:', error)
    throw error
  }

  console.log('CV saved successfully:', data)
  return data
}

// Database types
export type User = {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

export type CV = {
  id: string
  title: string
  content: CVData
  created_at: string
  updated_at: string
}

export type JobPosting = {
  id: string
  title: string
  company: string
  description: string
  url?: string
  pdf_content?: string
  created_at: string
  updated_at: string
} 