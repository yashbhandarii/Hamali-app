"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Save, FileDown, Plus, Trash2, Minus } from "lucide-react"
import type { Category, DailyRecord, CalculationEntry, Expense } from "@/types/labor"
import { saveRecord } from "@/lib/storage"
import { generatePDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"

interface DailyCalculatorProps {
  categories: Category[]
}

export function DailyCalculator({ categories }: DailyCalculatorProps) {
  const [entries, setEntries] = useState<CalculationEntry[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: `exp-${Date.now()}`, amount: 0, comment: "" },
  ])
  const { toast } = useToast()
  const formRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const inputs = formRef.current?.querySelectorAll<HTMLInputElement>("input[data-field-index]")
      if (!inputs) return
      const arr = Array.from(inputs)
      const currentIdx = arr.indexOf(e.currentTarget)
      if (currentIdx < arr.length - 1) {
        arr[currentIdx + 1].focus()
      }
    } else if (e.key === "Tab" && !e.shiftKey) {
      // Default Tab goes forward – we override to go backward
      e.preventDefault()
      const inputs = formRef.current?.querySelectorAll<HTMLInputElement>("input[data-field-index]")
      if (!inputs) return
      const arr = Array.from(inputs)
      const currentIdx = arr.indexOf(e.currentTarget)
      if (currentIdx > 0) {
        arr[currentIdx - 1].focus()
      }
    }
  }, [])

  useEffect(() => {
    // Initialize one entry per category
    setEntries(
      categories.map((cat) => ({
        entryId: `${cat.id}-${Date.now()}`,
        categoryId: cat.id,
        bags: 0,
        comment: "",
      }))
    )
  }, [categories])

  const calculations = useMemo(() => {
    return entries
      .map((entry) => {
        const category = categories.find((cat) => cat.id === entry.categoryId)
        if (!category) return null

        return {
          entryId: entry.entryId,
          categoryId: entry.categoryId,
          categoryName: category.name,
          bags: entry.bags,
          chargePerBag: category.chargePerBag,
          totalCharge: entry.bags * category.chargePerBag,
          comment: entry.comment,
        }
      })
      .filter(Boolean)
  }, [entries, categories])

  const totalCharges = useMemo(() => {
    return calculations.reduce((sum, calc) => sum + (calc?.totalCharge || 0), 0)
  }, [calculations])

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  }, [expenses])

  const grandTotal = useMemo(() => {
    return totalCharges - totalExpenses
  }, [totalCharges, totalExpenses])

  const handleBagsChange = (entryId: string, bags: number) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.entryId === entryId ? { ...entry, bags: Math.max(0, bags) } : entry)),
    )
  }

  const handleCommentChange = (entryId: string, comment: string) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.entryId === entryId ? { ...entry, comment } : entry)),
    )
  }

  const handleAddDuplicate = (categoryId: string) => {
    const newEntry: CalculationEntry = {
      entryId: `${categoryId}-${Date.now()}`,
      categoryId,
      bags: 0,
      comment: "",
    }
    // Insert after the last entry of the same category
    setEntries((prev) => {
      const lastIndex = prev.map((e) => e.categoryId).lastIndexOf(categoryId)
      const newEntries = [...prev]
      newEntries.splice(lastIndex + 1, 0, newEntry)
      return newEntries
    })
  }

  const handleRemoveEntry = (entryId: string, categoryId: string) => {
    // Only allow removal if there's more than one entry for this category
    const count = entries.filter((e) => e.categoryId === categoryId).length
    if (count <= 1) return
    setEntries((prev) => prev.filter((e) => e.entryId !== entryId))
  }

  // ─── Expense Handlers ───

  const handleAddExpense = () => {
    setExpenses((prev) => [
      ...prev,
      { id: `exp-${Date.now()}`, amount: 0, comment: "" },
    ])
  }

  const handleRemoveExpense = (expenseId: string) => {
    if (expenses.length <= 1) return
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
  }

  const handleExpenseAmountChange = (expenseId: string, amount: number) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === expenseId ? { ...e, amount: Math.max(0, amount) } : e
      )
    )
  }

  const handleExpenseCommentChange = (expenseId: string, comment: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === expenseId ? { ...e, comment } : e))
    )
  }

  const handleSaveRecord = () => {
    if (totalCharges === 0) {
      toast({
        title: "No data to save",
        description: "Please enter bag quantities before saving.",
        variant: "destructive",
      })
      return
    }

    const activeExpenses = expenses.filter((e) => e.amount > 0)

    const record: DailyRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      categories: calculations
        .filter((calc) => calc && calc.bags > 0)
        .map((calc) => ({
          categoryId: calc!.categoryId,
          categoryName: calc!.categoryName,
          bags: calc!.bags,
          chargePerBag: calc!.chargePerBag,
          totalCharge: calc!.totalCharge,
          comment: calc!.comment || undefined,
        })),
      expenses: activeExpenses.length > 0 ? activeExpenses : undefined,
      grandTotal,
      createdAt: new Date().toISOString(),
    }

    saveRecord(record)

    // Reset entries
    setEntries(
      categories.map((cat) => ({
        entryId: `${cat.id}-${Date.now()}`,
        categoryId: cat.id,
        bags: 0,
        comment: "",
      }))
    )
    // Reset expenses
    setExpenses([{ id: `exp-${Date.now()}`, amount: 0, comment: "" }])

    toast({
      title: "Record saved successfully",
      description: `Daily calculation saved with total ₹${grandTotal.toFixed(2)}`,
    })
  }

  const handleGeneratePDF = async () => {
    if (totalCharges === 0) {
      toast({
        title: "No data to export",
        description: "Please enter bag quantities before generating PDF.",
        variant: "destructive",
      })
      return
    }

    try {
      const activeExpenses = expenses.filter((e) => e.amount > 0)

      const record: DailyRecord = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        categories: calculations
          .filter((calc) => calc && calc.bags > 0)
          .map((calc) => ({
            categoryId: calc!.categoryId,
            categoryName: calc!.categoryName,
            bags: calc!.bags,
            chargePerBag: calc!.chargePerBag,
            totalCharge: calc!.totalCharge,
            comment: calc!.comment || undefined,
          })),
        expenses: activeExpenses.length > 0 ? activeExpenses : undefined,
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
          <div className="space-y-3" ref={formRef}>
            {entries.map((entry) => {
              const category = categories.find((c) => c.id === entry.categoryId)
              if (!category) return null
              const duplicateCount = entries.filter((e) => e.categoryId === entry.categoryId).length

              return (
                <div key={entry.entryId} className="p-3 border border-primary/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm font-medium text-primary flex-1 break-words">
                      {category.name}
                    </Label>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      @ ₹{category.chargePerBag}/bag
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={entry.bags === 0 ? "" : entry.bags}
                      onChange={(e) => handleBagsChange(entry.entryId, Number.parseInt(e.target.value) || 0)}
                      onKeyDown={handleKeyDown}
                      data-field-index="true"
                      className="border-primary w-20 sm:w-24"
                      placeholder="Bags"
                    />
                    <Input
                      type="text"
                      value={entry.comment}
                      onChange={(e) => handleCommentChange(entry.entryId, e.target.value)}
                      onKeyDown={handleKeyDown}
                      data-field-index="true"
                      className="border-primary/50 flex-1 text-xs"
                      placeholder="Comment..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddDuplicate(entry.categoryId)}
                      className="border-accent text-accent hover:bg-accent hover:text-accent-foreground flex-shrink-0 p-1 h-8 w-8"
                      title="Add another row for this category"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {duplicateCount > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveEntry(entry.entryId, entry.categoryId)}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex-shrink-0 p-1 h-8 w-8"
                        title="Remove this row"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* ─── Expense Section ─── */}
            <div className="mt-4 pt-4 border-t-2 border-destructive/30">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-bold text-destructive flex items-center gap-1">
                  <Minus className="h-4 w-4" />
                  EXPENSES (Deductions)
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddExpense}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 px-2 text-xs"
                  title="Add another expense"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Expense
                </Button>
              </div>
              <div className="space-y-2">
                {expenses.map((expense, idx) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-2 p-2 border border-destructive/20 rounded-lg bg-destructive/5"
                  >
                    <span className="text-xs text-destructive font-medium w-5 text-center flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <Input
                      type="number"
                      min="0"
                      value={expense.amount === 0 ? "" : expense.amount}
                      onChange={(e) =>
                        handleExpenseAmountChange(
                          expense.id,
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                      onKeyDown={handleKeyDown}
                      data-field-index="true"
                      className="border-destructive/50 w-24 sm:w-28 text-sm"
                      placeholder="₹ Amount"
                    />
                    <Input
                      type="text"
                      value={expense.comment}
                      onChange={(e) =>
                        handleExpenseCommentChange(expense.id, e.target.value)
                      }
                      onKeyDown={handleKeyDown}
                      data-field-index="true"
                      className="border-destructive/30 flex-1 text-xs"
                      placeholder="Expense description..."
                    />
                    {expenses.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveExpense(expense.id)}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex-shrink-0 p-1 h-8 w-8"
                        title="Remove this expense"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {totalExpenses > 0 && (
                <div className="mt-2 text-right text-sm font-medium text-destructive">
                  Total Expenses: −₹{totalExpenses.toFixed(2)}
                </div>
              )}
            </div>
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
                    <TableHead className="font-bold text-primary text-center text-xs sm:text-sm min-w-[80px]">
                      Total
                    </TableHead>
                    <TableHead className="font-bold text-primary text-xs sm:text-sm min-w-[80px]">
                      Comment
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.map((calc) => {
                    if (!calc || calc.bags === 0) return null
                    return (
                      <TableRow key={calc.entryId}>
                        <TableCell className="font-medium text-xs sm:text-sm">{calc.categoryName}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">{calc.bags}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">
                          ₹{calc.chargePerBag.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center font-medium text-xs sm:text-sm">
                          ₹{calc.totalCharge.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground">
                          {calc.comment || "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {totalExpenses > 0 && (
                    <>
                      <TableRow className="bg-primary/5 border-t border-primary/30">
                        <TableCell colSpan={3} className="font-medium text-primary text-right text-xs sm:text-sm">
                          Subtotal:
                        </TableCell>
                        <TableCell className="font-medium text-center text-xs sm:text-sm text-primary">
                          ₹{totalCharges.toFixed(2)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      {expenses
                        .filter((e) => e.amount > 0)
                        .map((expense) => (
                          <TableRow key={expense.id} className="bg-destructive/5">
                            <TableCell colSpan={3} className="font-medium text-destructive text-right text-xs sm:text-sm">
                              − Expense: {expense.comment || "(no description)"}
                            </TableCell>
                            <TableCell className="font-medium text-center text-xs sm:text-sm text-destructive">
                              −₹{expense.amount.toFixed(2)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        ))}
                    </>
                  )}
                  {calculations.some((calc) => calc && calc.bags > 0) && (
                    <TableRow className="bg-accent/10 border-t-2 border-primary">
                      <TableCell colSpan={3} className="font-bold text-primary text-right text-xs sm:text-sm">
                        GRAND TOTAL:
                      </TableCell>
                      <TableCell className="font-bold text-center text-sm sm:text-lg text-primary">
                        ₹{grandTotal.toFixed(2)}
                      </TableCell>
                      <TableCell />
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
