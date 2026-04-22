export interface Category {
  id: string
  name: string
  chargePerBag: number
  isDefault: boolean
}

export interface Expense {
  id: string
  amount: number
  comment: string
}

export interface DailyRecord {
  id: string
  date: string
  categories: {
    categoryId: string
    categoryName: string
    bags: number
    chargePerBag: number
    totalCharge: number
    comment?: string
  }[]
  expenses?: Expense[]
  grandTotal: number
  createdAt: string
}

export interface CalculationEntry {
  entryId: string
  categoryId: string
  bags: number
  comment: string
}
