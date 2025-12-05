"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, Loader2 } from "lucide-react"

interface BatchDownloadProps {
  ticketsCount: number
  onDownloadPDF: () => Promise<void>
  onDownloadZip: () => Promise<void>
}

export function BatchDownload({ ticketsCount, onDownloadPDF, onDownloadZip }: BatchDownloadProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async (type: "pdf" | "zip") => {
    try {
      setIsLoading(true)
      if (type === "pdf") {
        await onDownloadPDF()
      } else {
        await onDownloadZip()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isLoading || ticketsCount === 0} size="sm">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Batch Download ({ticketsCount})
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDownload("pdf")}>Download as Single PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload("zip")}>Download as ZIP (Individual PDFs)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
