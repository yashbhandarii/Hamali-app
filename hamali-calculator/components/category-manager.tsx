"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"
import type { Category } from "@/types/labor"
import { getCategories, saveCategories } from "@/lib/storage"

interface CategoryManagerProps {
  onCategoriesChange: (categories: Category[]) => void
}

export function CategoryManager({ onCategoriesChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState({ name: "", chargePerBag: "" })

  useEffect(() => {
    const loadedCategories = getCategories()
    setCategories(loadedCategories)
    onCategoriesChange(loadedCategories)
  }, [onCategoriesChange])

  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.chargePerBag) return

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      chargePerBag: Number.parseFloat(newCategory.chargePerBag),
      isDefault: false,
    }

    const updatedCategories = [...categories, category]
    setCategories(updatedCategories)
    saveCategories(updatedCategories)
    onCategoriesChange(updatedCategories)
    setNewCategory({ name: "", chargePerBag: "" })
  }

  const handleDeleteCategory = (categoryId: string) => {
    const updatedCategories = categories.filter((c) => c.id !== categoryId)
    setCategories(updatedCategories)
    saveCategories(updatedCategories)
    onCategoriesChange(updatedCategories)
  }

  const handleUpdateCharge = (categoryId: string, newCharge: number) => {
    const updatedCategories = categories.map((c) => (c.id === categoryId ? { ...c, chargePerBag: newCharge } : c))
    setCategories(updatedCategories)
    saveCategories(updatedCategories)
    onCategoriesChange(updatedCategories)
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-primary font-bold text-lg sm:text-xl">MANAGE CATEGORIES</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 space-y-4">
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border border-primary rounded"
            >
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium text-primary break-words">{category.name}</Label>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="text-sm text-muted-foreground">₹</Label>
                <Input
                  type="number"
                  value={category.chargePerBag}
                  onChange={(e) => handleUpdateCharge(category.id, Number.parseFloat(e.target.value) || 0)}
                  className="w-20 sm:w-20 text-center border-primary flex-shrink-0"
                  step="0.01"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id)}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-primary pt-4">
          <Label className="text-sm font-medium text-primary mb-2 block">ADD NEW CATEGORY</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Category name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="border-primary flex-1"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Charge"
                value={newCategory.chargePerBag}
                onChange={(e) => setNewCategory({ ...newCategory, chargePerBag: e.target.value })}
                className="w-24 sm:w-24 border-primary"
                step="0.01"
              />
              <Button
                onClick={handleAddCategory}
                className="bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0"
                disabled={!newCategory.name || !newCategory.chargePerBag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
