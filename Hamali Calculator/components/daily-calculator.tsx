"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Save, FileDown } from "lucide-react"
import type { Category, DailyRecord, CalculationEntry } from "@/types/labor"
import { saveRecord } from "@/lib/storage"
import { generatePDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"

interface DailyCalculatorProps {
  categories: Category[]
}

export function DailyCalculator({ categories }: DailyCalculatorProps) {
  const [entries, setEntries] = useState<CalculationEntry[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Initialize entries when categories change
    setEntries(categories.map((cat) => ({ categoryId: cat.id, bags: 0 })))
  }, [categories])

  const calculations = useMemo(() => {
    return entries
      .map((entry) => {
        const category = categories.find((cat) => cat.id === entry.categoryId)
        if (!category) return null

        return {
          categoryId: entry.categoryId,
          categoryName: category.name,
          bags: entry.bags,
          chargePerBag: category.chargePerBag,
          totalCharge: entry.bags * category.chargePerBag,
        }
      })
      .filter(Boolean)
  }, [entries, categories])

  const grandTotal = useMemo(() => {
    return calculations.reduce((sum, calc) => sum + (calc?.totalCharge || 0), 0)
  }, [calculations])

  const handleBagsChange = (categoryId: string, bags: number) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.categoryId === categoryId ? { ...entry, bags: Math.max(0, bags) } : entry)),
    )
  }

  const handleSaveRecord = () => {
    if (grandTotal === 0) {
      toast({
        title: "No data to save",
        description: "Please enter bag quantities before saving.",
        variant: "destructive",
      })
      return
    }

    const record: DailyRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      categories: calculations.filter((calc) => calc && calc.bags > 0) as any[],
      grandTotal,
      createdAt: new Date().toISOString(),
    }

    saveRecord(record)

    // Reset entries
    setEntries(categories.map((cat) => ({ categoryId: cat.id, bags: 0 })))

    toast({
      title: "Record saved successfully",
      description: `Daily calculation saved with total ₹${grandTotal.toFixed(2)}`,
    })
  }

  const handleGeneratePDF = async () => {
    if (grandTotal === 0) {
      toast({
        title: "No data to export",
        description: "Please enter bag quantities before generating PDF.",
        variant: "destructive",
      })
      return
    }

    try {
      const record: DailyRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        categories: calculations.filter((calc) => calc && calc.bags > 0) as any[],
        grandTotal,
        createdAt: new Date().toISOString(),
      }

      await generatePDF(record)

      toast({
        title: "PDF generated successfully",
        description: "Your daily report has been downloaded.",
      })
    } catch (error) {
      toast({
        title: "PDF generation failed",
        description: "There was an error generating the PDF report.",
        variant: "destructive",
      })
    }
  }

  if (categories.length === 0) {
    return (
      <Card className="border-2 border-primary">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No categories added yet. Please add categories first to start calculating.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-2 border-primary">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-primary font-bold text-lg sm:text-xl">DAILY CALCULATION</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Enter the number of bags for each category to calculate charges
          </p>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const entry = entries.find((e) => e.categoryId === category.id)
              return (
                <div key={category.id} className="space-y-2">
                  <Label className="text-sm font-medium text-primary">{category.name}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={entry?.bags === 0 ? "" : entry?.bags || ""}
                      onChange={(e) => handleBagsChange(category.id, Number.parseInt(e.target.value) || 0)}
                      className="border-primary flex-1"
                      placeholder="0"
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      @ ₹{category.chargePerBag}/bag
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-primary font-bold text-lg sm:text-xl">CALCULATION RESULTS</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="border-2 border-primary rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead className="font-bold text-primary text-xs sm:text-sm min-w-[100px]">Category</TableHead>
                    <TableHead className="font-bold text-primary text-center text-xs sm:text-sm min-w-[60px]">
                      Bags
                    </TableHead>
                    <TableHead className="font-bold text-primary text-center text-xs sm:text-sm min-w-[80px]">
                      Rate/Bag
                    </TableHead>
                    <TableHead className="font-bold text-primary text-right text-xs sm:text-sm min-w-[80px]">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.map((calc) => {
                    if (!calc || calc.bags === 0) return null
                    return (
                      <TableRow key={calc.categoryId}>
                        <TableCell className="font-medium text-xs sm:text-sm">{calc.categoryName}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">{calc.bags}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">
                          ₹{calc.chargePerBag.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs sm:text-sm">
                          ₹{calc.totalCharge.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {calculations.some((calc) => calc && calc.bags > 0) && (
                    <TableRow className="bg-accent/10 border-t-2 border-primary">
                      <TableCell colSpan={3} className="font-bold text-primary text-right text-xs sm:text-sm">
                        GRAND TOTAL:
                      </TableCell>
                      <TableCell className="font-bold text-right text-sm sm:text-lg text-primary">
                        ₹{grandTotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6 justify-center">
            <Button
              onClick={handleSaveRecord}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
              disabled={grandTotal === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Record
            </Button>
            <Button
              onClick={handleGeneratePDF}
              className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
              disabled={grandTotal === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Generate PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
