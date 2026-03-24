import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://klwpjiqnguvxmyrtklua.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsd3BqaXFuZ3V2eG15cnRrbHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjEwMjksImV4cCI6MjA4OTkzNzAyOX0.-MIHT72WCDPryyRs3ylQcFZYgN80gOJ66OCczhr3hi8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
