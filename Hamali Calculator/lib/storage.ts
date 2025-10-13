import type { Category, DailyRecord } from "@/types/labor"

const CATEGORIES_KEY = "labor-categories"
const RECORDS_KEY = "labor-records"

export const getCategories = (): Category[] => {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(CATEGORIES_KEY)
  return stored ? JSON.parse(stored) : []
}

export const saveCategories = (categories: Category[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

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
}

export const deleteRecord = (recordId: string): void => {
  if (typeof window === "undefined") return

  const records = getRecords().filter((r) => r.id !== recordId)
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}
