import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          password_hash: string
          full_name: string
          role: 'super_admin' | 'checker' | 'maker'
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          password_hash: string
          full_name: string
          role: 'super_admin' | 'checker' | 'maker'
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password_hash?: string
          full_name?: string
          role?: 'super_admin' | 'checker' | 'maker'
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          job_number: string
          client_name: string
          move_date: string | null
          truck_vehicle_no: string | null
          status: 'draft' | 'pending_review' | 'approved' | 'in_progress' | 'completed'
          created_by: string
          approved_by: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
          submitted_at: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          job_number: string
          client_name: string
          move_date?: string | null
          truck_vehicle_no?: string | null
          status?: 'draft' | 'pending_review' | 'approved' | 'in_progress' | 'completed'
          created_by: string
          approved_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          job_number?: string
          client_name?: string
          move_date?: string | null
          truck_vehicle_no?: string | null
          status?: 'draft' | 'pending_review' | 'approved' | 'in_progress' | 'completed'
          created_by?: string
          approved_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
        }
      }
      rooms: {
        Row: {
          id: string
          job_id: string
          room_name: string
          room_type: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining_room' | 'office' | 'storage' | 'other'
          floor_level: number | null
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          room_name: string
          room_type: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining_room' | 'office' | 'storage' | 'other'
          floor_level?: number | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          room_name?: string
          room_type?: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining_room' | 'office' | 'storage' | 'other'
          floor_level?: number | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          job_id: string
          room_id: string | null
          item_name: string
          category: string
          quantity: number
          condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
          material: string | null
          dimensions: string | null
          weight_estimate: number | null
          handling_instructions: string | null
          fragile: boolean
          ai_confidence_score: number | null
          manual_verification: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          room_id?: string | null
          item_name: string
          category: string
          quantity?: number
          condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
          material?: string | null
          dimensions?: string | null
          weight_estimate?: number | null
          handling_instructions?: string | null
          fragile?: boolean
          ai_confidence_score?: number | null
          manual_verification?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          room_id?: string | null
          item_name?: string
          category?: string
          quantity?: number
          condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
          material?: string | null
          dimensions?: string | null
          weight_estimate?: number | null
          handling_instructions?: string | null
          fragile?: boolean
          ai_confidence_score?: number | null
          manual_verification?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      item_images: {
        Row: {
          id: string
          item_id: string
          image_url: string
          image_type: 'main' | 'detail' | 'damage'
          ai_analysis_data: any | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          item_id: string
          image_url: string
          image_type: 'main' | 'detail' | 'damage'
          ai_analysis_data?: any | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          image_url?: string
          image_type?: 'main' | 'detail' | 'damage'
          ai_analysis_data?: any | null
          uploaded_at?: string
        }
      }
      client_signatures: {
        Row: {
          id: string
          job_id: string
          signature_type: 'pickup' | 'delivery'
          signature_data: string
          client_name: string
          client_phone: string | null
          signed_at: string
          signed_by_user: string
        }
        Insert: {
          id?: string
          job_id: string
          signature_type: 'pickup' | 'delivery'
          signature_data: string
          client_name: string
          client_phone?: string | null
          signed_at?: string
          signed_by_user: string
        }
        Update: {
          id?: string
          job_id?: string
          signature_type?: 'pickup' | 'delivery'
          signature_data?: string
          client_name?: string
          client_phone?: string | null
          signed_at?: string
          signed_by_user?: string
        }
      }
    }
  }
}