"use client"

import { useState, useCallback, useEffect } from "react"
import { CategoryManager } from "@/components/category-manager"
import { DailyCalculator } from "@/components/daily-calculator"
import { HistoryViewer } from "@/components/history-viewer"
import { SettingsPanel } from "@/components/settings-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, History, Settings, FileText } from "lucide-react"
import type { Category } from "@/types/labor"
import { syncFromSupabase, getCategories } from "@/lib/storage"

export default function LaborCalculatorApp() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState("calculator")
  const [syncing, setSyncing] = useState(true)

  const handleCategoriesChange = useCallback((newCategories: Category[]) => {
    setCategories(newCategories)
  }, [])

  useEffect(() => {
    // On app load: try syncing from Supabase, then fall back to local
    syncFromSupabase()
      .then(({ categories: remoteCats }) => {
        if (remoteCats && remoteCats.length > 0) {
          setCategories(remoteCats)
        } else {
          setCategories(getCategories())
        }
      })
      .catch(() => {
        setCategories(getCategories())
      })
      .finally(() => setSyncing(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-2 sm:p-4 max-w-6xl">
        <div className="border-2 sm:border-4 border-primary rounded-lg p-3 sm:p-6 bg-card">
          <div className="text-center mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-3xl font-bold text-primary mb-2">LABOR CHARGES CALCULATOR</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Calculate daily labor charges per bag with ease
            </p>
            {syncing && (
              <p className="text-xs text-muted-foreground mt-1 animate-pulse">Syncing data...</p>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-6 border-2 border-primary h-auto">
              <TabsTrigger
                value="calculator"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Calculator</span>
                <span className="sm:hidden">Calc</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <History className="h-3 w-3 sm:h-4 sm:w-4" />
                History
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Categories</span>
                <span className="sm:hidden">Cat</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Set</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator">
              <DailyCalculator categories={categories} />
            </TabsContent>

            <TabsContent value="history">
              <HistoryViewer />
            </TabsContent>

            <TabsContent value="categories">
              <CategoryManager onCategoriesChange={handleCategoriesChange} />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsPanel categories={categories} onCategoriesChange={handleCategoriesChange} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
