"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FileDown, Trash2, ChevronDown, ChevronRight, Calendar, Pencil, Check, X } from "lucide-react"
import type { DailyRecord, Category } from "@/types/labor"
import { getRecords, deleteRecord, updateRecord, getCategories } from "@/lib/storage"
import { generatePDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"

export function HistoryViewer() {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set())
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [editData, setEditData] = useState<DailyRecord["categories"]>([])
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = () => {
    const loadedRecords = getRecords()
    setRecords(loadedRecords)
    setAvailableCategories(getCategories())
  }

  const handleDeleteRecord = (recordId: string) => {
    deleteRecord(recordId)
    loadRecords()
    toast({
      title: "Record deleted",
      description: "The daily record has been removed from history.",
    })
  }

  const handleGeneratePDF = async (record: DailyRecord) => {
    try {
      await generatePDF(record)
      toast({
        title: "PDF generated successfully",
        description: "The report has been downloaded.",
      })
    } catch (error) {
      toast({
        title: "PDF generation failed",
        description: "There was an error generating the PDF report.",
        variant: "destructive",
      })
    }
  }

  const toggleRecordExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedRecords)
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId)
    } else {
      newExpanded.add(recordId)
    }
    setExpandedRecords(newExpanded)
  }

  const startEditing = (record: DailyRecord) => {
    setEditingRecordId(record.id)
    setEditData(record.categories.map((c) => ({ ...c })))
    // Make sure it's expanded
    const newExpanded = new Set(expandedRecords)
    newExpanded.add(record.id)
    setExpandedRecords(newExpanded)
  }

  const cancelEditing = () => {
    setEditingRecordId(null)
    setEditData([])
  }

  const handleEditBags = (index: number, bags: number) => {
    setEditData((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        bags: Math.max(0, bags),
        totalCharge: Math.max(0, bags) * updated[index].chargePerBag,
      }
      return updated
    })
  }

  const handleEditComment = (index: number, comment: string) => {
    setEditData((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], comment }
      return updated
    })
  }

  const saveEditing = () => {
    if (!editingRecordId) return
    const record = records.find((r) => r.id === editingRecordId)
    if (!record) return

    const newGrandTotal = editData.reduce((sum, c) => sum + c.totalCharge, 0)
    const updatedRecord: DailyRecord = {
      ...record,
      categories: editData.filter(c => c.bags > 0), // Remove entries with 0 bags
      grandTotal: newGrandTotal,
    }

    updateRecord(updatedRecord)
    loadRecords()
    setEditingRecordId(null)
    setEditData([])

    toast({
      title: "Record updated",
      description: `Record updated with new total ₹${newGrandTotal.toFixed(2)}`,
    })
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const handleAddNewCategory = (categoryId: string) => {
    if (!categoryId) return
    const cat = availableCategories.find((c) => c.id === categoryId)
    if (!cat) return
    setEditData((prev) => [
      ...prev,
      {
        categoryId: cat.id,
        categoryName: cat.name,
        bags: 0,
        chargePerBag: cat.chargePerBag,
        totalCharge: 0,
        comment: "",
      },
    ])
  }

  if (records.length === 0) {
    return (
      <Card className="border-2 border-primary">
        <CardContent className="p-4 sm:p-8 text-center">
          <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-primary mb-2">No Records Found</h3>
          <p className="text-sm text-muted-foreground">
            Start by creating your first daily calculation to see records here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-primary font-bold text-lg sm:text-xl">CALCULATION HISTORY</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">View and manage your saved daily calculations</p>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className="space-y-3 sm:space-y-4">
          {records.map((record) => {
            const isExpanded = expandedRecords.has(record.id)
            const isEditing = editingRecordId === record.id
            const { date, time } = formatDateTime(record.createdAt)
            const isEditable = Date.now() - new Date(record.createdAt).getTime() <= 2 * 60 * 60 * 1000

            return (
              <Collapsible key={record.id} open={isExpanded} onOpenChange={() => toggleRecordExpansion(record.id)}>
                <div className="border-2 border-primary rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-primary flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <h4 className="font-medium text-primary text-sm sm:text-base">{date}</h4>
                            <Badge variant="outline" className="border-primary text-primary text-xs w-fit">
                              {time}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {record.categories.length} categories •{" "}
                            {record.categories.reduce((sum, cat) => sum + cat.bags, 0)} total bags
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <span className="text-sm sm:text-lg font-bold text-primary">
                          ₹{record.grandTotal.toFixed(2)}
                        </span>
                        <div className="flex gap-1 sm:gap-2">
                          {isEditable ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditing(record)
                              }}
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground p-1 sm:p-2"
                              title="Edit record"
                            >
                              <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="border-primary/50 text-primary/50 p-1 sm:p-2 cursor-not-allowed"
                              title="Can only edit within 2 hours of creation"
                            >
                              <Pencil className="h-3 w-3 sm:h-4 sm:w-4 opacity-50" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGeneratePDF(record)
                            }}
                            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground p-1 sm:p-2"
                          >
                            <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRecord(record.id)
                            }}
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground p-1 sm:p-2"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-3 sm:p-4 border-t border-primary">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="font-bold text-primary text-xs sm:text-sm min-w-[100px]">
                                Category
                              </TableHead>
                              <TableHead className="font-bold text-primary text-center text-xs sm:text-sm min-w-[60px]">
                                Bags
                              </TableHead>
                              <TableHead className="font-bold text-primary text-center text-xs sm:text-sm min-w-[80px]">
                                Rate/Bag
                              </TableHead>
                              <TableHead className="font-bold text-primary text-center text-xs sm:text-sm min-w-[80px]">
                                Total
                              </TableHead>
                              <TableHead className="font-bold text-primary text-xs sm:text-sm min-w-[60px]">
                                Comment
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(isEditing ? editData : record.categories).map((category, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium text-xs sm:text-sm">
                                  {category.categoryName}
                                </TableCell>
                                <TableCell className="text-center text-xs sm:text-sm">
                                  {isEditing ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      value={category.bags === 0 ? "" : category.bags}
                                      onChange={(e) => handleEditBags(index, Number.parseInt(e.target.value) || 0)}
                                      className="w-16 text-center border-primary mx-auto"
                                    />
                                  ) : (
                                    category.bags
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-xs sm:text-sm">
                                  ₹{category.chargePerBag.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center font-medium text-xs sm:text-sm">
                                  ₹{(isEditing ? category.bags * category.chargePerBag : category.totalCharge).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-muted-foreground">
                                  {isEditing ? (
                                    <Input
                                      type="text"
                                      value={(category as any).comment || ""}
                                      onChange={(e) => handleEditComment(index, e.target.value)}
                                      className="w-24 text-xs border-primary/50"
                                      placeholder="Comment..."
                                    />
                                  ) : (
                                    (category as any).comment || "—"
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            {isEditing && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-2">
                                  <select
                                    className="border border-primary rounded-md p-1 px-2 text-sm bg-background text-primary"
                                    value=""
                                    onChange={(e) => handleAddNewCategory(e.target.value)}
                                  >
                                    <option value="" disabled>
                                      + Add Category
                                    </option>
                                    {availableCategories.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} (₹{c.chargePerBag})
                                      </option>
                                    ))}
                                  </select>
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow className="bg-accent/10 border-t-2 border-primary">
                              <TableCell colSpan={3} className="font-bold text-primary text-right text-xs sm:text-sm">
                                GRAND TOTAL:
                              </TableCell>
                              <TableCell className="font-bold text-center text-sm sm:text-lg text-primary">
                                ₹{(isEditing
                                  ? editData.reduce((sum, c) => sum + c.bags * c.chargePerBag, 0)
                                  : record.grandTotal
                                ).toFixed(2)}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      {isEditing && (
                        <div className="flex gap-2 mt-3 justify-end">
                          <Button
                            size="sm"
                            onClick={saveEditing}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
