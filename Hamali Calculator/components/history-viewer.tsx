"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FileDown, Trash2, ChevronDown, ChevronRight, Calendar } from "lucide-react"
import type { DailyRecord } from "@/types/labor"
import { getRecords, deleteRecord } from "@/lib/storage"
import { generatePDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"

export function HistoryViewer() {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = () => {
    const loadedRecords = getRecords()
    setRecords(loadedRecords)
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

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
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
            const { date, time } = formatDateTime(record.createdAt)

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
                              <TableHead className="font-bold text-primary text-right text-xs sm:text-sm min-w-[80px]">
                                Total
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {record.categories.map((category, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium text-xs sm:text-sm">
                                  {category.categoryName}
                                </TableCell>
                                <TableCell className="text-center text-xs sm:text-sm">{category.bags}</TableCell>
                                <TableCell className="text-center text-xs sm:text-sm">
                                  ₹{category.chargePerBag.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-xs sm:text-sm">
                                  ₹{category.totalCharge.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-accent/10 border-t-2 border-primary">
                              <TableCell colSpan={3} className="font-bold text-primary text-right text-xs sm:text-sm">
                                GRAND TOTAL:
                              </TableCell>
                              <TableCell className="font-bold text-right text-sm sm:text-lg text-primary">
                                ₹{record.grandTotal.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
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
