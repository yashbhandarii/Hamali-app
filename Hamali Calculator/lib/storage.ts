import type { Category, DailyRecord } from "@/types/labor"
import { supabase } from "@/lib/supabase"

const CATEGORIES_KEY = "labor-categories"
const RECORDS_KEY = "labor-records"

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "def-1", name: "शेतकरी भुसार आवक", chargePerBag: 11.88, isDefault: true },
  { id: "def-2", name: "व्यापारी भुसार आवक", chargePerBag: 2.66112, isDefault: true },
  { id: "def-3", name: "शेतकरी वाराई", chargePerBag: 1.5, isDefault: true },
  { id: "def-4", name: "पाला फोडणे व काटा करून शिवणे व थप्पी लावणे", chargePerBag: 10.51776, isDefault: true },
  { id: "def-5", name: "पाला फोडणे, टप करणे व काटा कस्न थप्पी लावणे", chargePerBag: 14.41, isDefault: true },
  { id: "def-6", name: "मोटार भराई, उत्तराई किंवा थप्पी लावणे पूर्ण गोडाऊनमध्ये कोठेही", chargePerBag: 2.5344, isDefault: true },
  { id: "def-7", name: "गठ लावणे किंवा थप्पी लावणे पूर्ण गोडाऊनमध्ये कोठेही", chargePerBag: 2.5344, isDefault: true },
  { id: "def-8", name: "स्टेज काटा करून शिवणे व थप्पी लावणे पूर्ण (प्रति नग)", chargePerBag: 5.54, isDefault: true },
  { id: "def-9", name: "रोकड विक्री काटा करून", chargePerBag: 10.29, isDefault: true },
  { id: "def-10", name: "रोकड विक्री काटा न करता", chargePerBag: 4.8, isDefault: true },
  { id: "def-11", name: "मालाची फिरवाई", chargePerBag: 2.66, isDefault: true },
  { id: "def-12", name: "वाहतूक पूर्ण गोडाऊन करिता", chargePerBag: 2.66, isDefault: true },
  { id: "def-13", name: "पाला फोडणे, तोडणे, टप करणे व थप्पी लावणे.", chargePerBag: 16.15, isDefault: true },
  { id: "def-14", name: "पाला फोडणे, तोडणे, काटा करणे व थप्पी लावणे.", chargePerBag: 12.14, isDefault: true },
  { id: "def-15", name: "मोठी गोणी", chargePerBag: 10, isDefault: true },
]

// ─── Categories ───

export const getCategories = (): Category[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(CATEGORIES_KEY)
  return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES
}

export const saveCategories = (categories: Category[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  // Sync to Supabase in background
  syncCategoriesToSupabase(categories)
}

// ─── Records ───

export const getRecords = (): DailyRecord[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(RECORDS_KEY)
  return stored ? JSON.parse(stored) : []
}

export const saveRecord = (record: DailyRecord): void => {
  if (typeof window === "undefined") return
  const records = getRecords()
  records.unshift(record)
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
  // Sync to Supabase in background
  syncRecordToSupabase(record)
}

export const deleteRecord = (recordId: string): void => {
  if (typeof window === "undefined") return
  const records = getRecords().filter((r) => r.id !== recordId)
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
  // Delete from Supabase in background
  deleteRecordFromSupabase(recordId)
}

export const updateRecord = (updatedRecord: DailyRecord): void => {
  if (typeof window === "undefined") return
  const records = getRecords().map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
  // Sync to Supabase in background
  syncRecordToSupabase(updatedRecord)
}

// ─── Supabase Sync Helpers ───

async function syncCategoriesToSupabase(categories: Category[]) {
  try {
    // Delete all existing and re-insert
    await supabase.from("hamali_categories").delete().neq("id", "")
    if (categories.length > 0) {
      await supabase.from("hamali_categories").insert(
        categories.map((c) => ({
          id: c.id,
          name: c.name,
          charge_per_bag: c.chargePerBag,
          is_default: c.isDefault,
        }))
      )
    }
  } catch (e) {
    console.warn("Supabase category sync failed:", e)
  }
}

async function syncRecordToSupabase(record: DailyRecord) {
  try {
    await supabase.from("hamali_records").upsert({
      id: record.id,
      date: record.date,
      categories: record.categories,
      grand_total: record.grandTotal,
      created_at: record.createdAt,
    })
  } catch (e) {
    console.warn("Supabase record sync failed:", e)
  }
}

async function deleteRecordFromSupabase(recordId: string) {
  try {
    await supabase.from("hamali_records").delete().eq("id", recordId)
  } catch (e) {
    console.warn("Supabase record delete failed:", e)
  }
}

// ─── Pull from Supabase (called on app load) ───

export async function syncFromSupabase(): Promise<{
  categories: Category[] | null
  records: DailyRecord[] | null
}> {
  try {
    const [catRes, recRes] = await Promise.all([
      supabase.from("hamali_categories").select("*").order("created_at"),
      supabase.from("hamali_records").select("*").order("created_at", { ascending: false }),
    ])

    let categories: Category[] | null = null
    if (catRes.data && catRes.data.length > 0) {
      categories = catRes.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        chargePerBag: Number(c.charge_per_bag),
        isDefault: c.is_default,
      }))
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
    }

    let records: DailyRecord[] | null = null
    if (recRes.data && recRes.data.length > 0) {
      records = recRes.data.map((r: any) => ({
        id: r.id,
        date: r.date,
        categories: r.categories,
        grandTotal: Number(r.grand_total),
        createdAt: r.created_at,
      }))
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
    }

    return { categories, records }
  } catch (e) {
    console.warn("Supabase sync failed, using local data:", e)
    return { categories: null, records: null }
  }
}
