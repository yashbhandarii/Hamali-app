"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Settings, Trash2, Download, Upload } from "lucide-react"
import type { Category } from "@/types/labor"
import { saveCategories, getRecords } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

interface SettingsPanelProps {
  categories: Category[]
  onCategoriesChange: (categories: Category[]) => void
}

export function SettingsPanel({ categories, onCategoriesChange }: SettingsPanelProps) {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)
  const { toast } = useToast()

  const handleChargeUpdate = (categoryId: string, newCharge: number) => {
    const updated = localCategories.map((cat) => (cat.id === categoryId ? { ...cat, chargePerBag: newCharge } : cat))
    setLocalCategories(updated)
  }

  const handleSaveChanges = () => {
    saveCategories(localCategories)
    onCategoriesChange(localCategories)
    toast({
      title: "Settings saved",
      description: "Category charges have been updated successfully.",
    })
  }

  const handleClearAllData = () => {
    localStorage.removeItem("labor-categories")
    localStorage.removeItem("labor-records")
    setLocalCategories([])
    onCategoriesChange([])
    toast({
      title: "All data cleared",
      description: "Categories and history have been reset.",
      variant: "destructive",
    })
  }

  const handleExportData = () => {
    const data = {
      categories: localCategories,
      records: getRecords(),
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `labor-calculator-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Data exported",
      description: "Your data has been downloaded as a backup file.",
    })
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        if (data.categories && Array.isArray(data.categories)) {
          setLocalCategories(data.categories)
          saveCategories(data.categories)
          onCategoriesChange(data.categories)
        }

        if (data.records && Array.isArray(data.records)) {
          localStorage.setItem("labor-records", JSON.stringify(data.records))
        }

        toast({
          title: "Data imported",
          description: "Your backup data has been restored successfully.",
        })
      } catch (error) {
        toast({
          title: "Import failed",
          description: "The backup file is invalid or corrupted.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)

    // Reset the input
    event.target.value = ""
  }

  const hasChanges = JSON.stringify(categories) !== JSON.stringify(localCategories)

  return (
    <div className="space-y-6">
      {localCategories.length > 0 && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-primary font-bold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              CATEGORY CHARGES
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Update the charges for each category. These will be used for new calculations.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {localCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border border-primary rounded">
                  <Label className="font-medium text-primary">{category.name}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={category.chargePerBag}
                      onChange={(e) => handleChargeUpdate(category.id, Number.parseFloat(e.target.value) || 0)}
                      className="w-24 text-center border-primary"
                      step="0.01"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground">/bag</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveChanges}
                disabled={!hasChanges}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-primary font-bold">DATA MANAGEMENT</CardTitle>
          <p className="text-sm text-muted-foreground">Backup, restore, or clear your application data.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-primary">Export Data</Label>
              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </Button>
              <p className="text-xs text-muted-foreground">Save all your categories and history records</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-primary">Import Data</Label>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  variant="outline"
                  className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Backup
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Restore from a previously exported backup file</p>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-2">
            <Label className="text-sm font-medium text-destructive">Danger Zone</Label>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your categories, custom charges, and calculation history. This
                    action cannot be undone. Consider exporting your data first.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData} className="bg-destructive hover:bg-destructive/90">
                    Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground">Permanently delete all categories and history records</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
