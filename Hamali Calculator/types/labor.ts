export interface Category {
  id: string
  name: string
  chargePerBag: number
  isDefault: boolean
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
  }[]
  grandTotal: number
  createdAt: string
}

export interface CalculationEntry {
  categoryId: string
  bags: number
}
