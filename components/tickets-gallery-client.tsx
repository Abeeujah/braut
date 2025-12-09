"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TicketCard } from "@/components/ticket-card"
import { ChildDetailModal } from "@/components/child-detail-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, RefreshCw, FolderDown, Search, ChevronLeft, ChevronRight, Archive, Eye } from "lucide-react"
import type { ChildWithTicket, SortField, SortDir } from "@/lib/tickets/queries"
import { generateTicketBlob } from "@/lib/tickets/generate-ticket-blob"
import { fetchAllChildrenForBulkDownload } from "@/app/actions/bulk-tickets"
import JSZip from "jszip"
import { saveAs } from "file-saver"

interface Props {
  children: ChildWithTicket[]
  total: number
  page: number
  pageSize: number
  sortField: SortField
  sortDir: SortDir
  search: string
  house: string
}

export function TicketsGalleryClient({
  children: childrenWithTickets,
  total,
  page,
  pageSize,
  sortField,
  sortDir,
  search,
  house,
}: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState("")
  const [bulkProgressPercent, setBulkProgressPercent] = useState(0)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [searchInput, setSearchInput] = useState(search)
  const [selectedChild, setSelectedChild] = useState<ChildWithTicket | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const updateQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    if (updates.q !== undefined || updates.sort !== undefined || updates.house !== undefined) {
      params.set("page", "1")
    }
    router.push(`?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateQuery({ q: searchInput || undefined })
  }

  const handleSortChange = (value: string) => {
    const [field, dir] = value.split("-") as [SortField, SortDir]
    updateQuery({ sort: field, dir })
  }

  const handleHouseChange = (value: string) => {
    updateQuery({ house: value === "all" ? undefined : value })
  }

  const handlePageChange = (newPage: number) => {
    updateQuery({ page: String(newPage) })
  }

  const downloadTicket = async (child: ChildWithTicket) => {
    if (!child.ticket) return
    setDownloadingId(child.id)

    try {
      const blob = await generateTicketBlob(child)
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ticket-${child.ticket.ticket_number}-${child.name.replace(/\s+/g, "_")}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } finally {
      setDownloadingId(null)
    }
  }

  const downloadPageTickets = async () => {
    const validChildren = childrenWithTickets.filter((c) => c.ticket)
    if (validChildren.length === 0) return

    setIsBulkDownloading(true)
    const zip = new JSZip()

    try {
      for (let i = 0; i < validChildren.length; i++) {
        const child = validChildren[i]
        setBulkProgress(`Generating ${i + 1}/${validChildren.length}: ${child.name}`)

        const blob = await generateTicketBlob(child)
        if (blob && child.ticket) {
          const folderName = child.house ? `House of ${child.house}` : "Unassigned"
          const fileName = `${child.ticket.ticket_number}_${child.name.replace(/\s+/g, "_")}.png`
          zip.folder(folderName)?.file(fileName, blob)
        }
      }

      setBulkProgress("Compressing files...")
      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, `Tickets_Page_${page}.zip`)
    } catch (err) {
      console.error("Bulk download failed", err)
      alert("Failed to generate bulk tickets. Check console.")
    } finally {
      setIsBulkDownloading(false)
      setBulkProgress("")
    }
  }

  const downloadAllTickets = async () => {
    setIsDownloadingAll(true)
    setIsBulkDownloading(true)
    setBulkProgress("Fetching all records from server...")
    setBulkProgressPercent(0)

    try {
      const { children: allChildren, total: totalCount } = await fetchAllChildrenForBulkDownload(
        search || undefined,
        house || undefined
      )

      const validChildren = allChildren.filter((c) => c.ticket)
      if (validChildren.length === 0) {
        alert("No tickets to download")
        return
      }

      setBulkProgress(`Generating ${validChildren.length} tickets...`)
      const zip = new JSZip()
      const batchSize = 10

      for (let i = 0; i < validChildren.length; i += batchSize) {
        const batch = validChildren.slice(i, Math.min(i + batchSize, validChildren.length))
        
        await Promise.all(
          batch.map(async (child) => {
            const blob = await generateTicketBlob(child as ChildWithTicket)
            if (blob && child.ticket) {
              const folderName = child.house ? `House of ${child.house}` : "Unassigned"
              const fileName = `${child.ticket.ticket_number}_${child.name.replace(/\s+/g, "_")}.png`
              zip.folder(folderName)?.file(fileName, blob)
            }
          })
        )

        const processed = Math.min(i + batchSize, validChildren.length)
        const percent = Math.round((processed / validChildren.length) * 100)
        setBulkProgressPercent(percent)
        setBulkProgress(`Generated ${processed}/${validChildren.length} tickets (${percent}%)`)
      }

      setBulkProgress("Compressing ZIP file...")
      setBulkProgressPercent(100)
      const content = await zip.generateAsync({ type: "blob" })
      
      const timestamp = new Date().toISOString().split("T")[0]
      const filterSuffix = house ? `_${house}` : ""
      const searchSuffix = search ? `_search` : ""
      saveAs(content, `All_Tickets${filterSuffix}${searchSuffix}_${timestamp}.zip`)
    } catch (err) {
      console.error("Bulk download all failed", err)
      alert("Failed to generate all tickets. Check console.")
    } finally {
      setIsDownloadingAll(false)
      setIsBulkDownloading(false)
      setBulkProgress("")
      setBulkProgressPercent(0)
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4">
        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name..."
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          <Select value={`${sortField}-${sortDir}`} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest first</SelectItem>
              <SelectItem value="created_at-asc">Oldest first</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="house-asc">House A-Z</SelectItem>
              <SelectItem value="house-desc">House Z-A</SelectItem>
            </SelectContent>
          </Select>

          <Select value={house || "all"} onValueChange={handleHouseChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter house" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Houses</SelectItem>
              <SelectItem value="Love">Love</SelectItem>
              <SelectItem value="Joy">Joy</SelectItem>
              <SelectItem value="Hope">Hope</SelectItem>
              <SelectItem value="Peace">Peace</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats and Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-foreground">
              {total.toLocaleString()} Tickets
            </h2>
            <p className="text-sm text-muted-foreground">
              {isBulkDownloading
                ? bulkProgress
                : `Showing ${childrenWithTickets.length} of ${total}`}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => updateQuery({ _ts: Date.now().toString() })}
              variant="outline"
              className="rounded-full"
              disabled={isBulkDownloading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <Button
              onClick={downloadPageTickets}
              variant="outline"
              className="rounded-full"
              disabled={isBulkDownloading || childrenWithTickets.length === 0}
            >
              <FolderDown className="w-4 h-4 mr-2" />
              Download Page
            </Button>

            <Button
              onClick={downloadAllTickets}
              className="rounded-full bg-foreground text-background hover:opacity-80"
              disabled={isBulkDownloading || total === 0}
            >
              {isDownloadingAll ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Archive className="w-4 h-4 mr-2" />
              )}
              {isDownloadingAll ? "Processing..." : `Download All (${total})`}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isBulkDownloading && (
          <div className="space-y-2">
            <Progress value={bulkProgressPercent} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">{bulkProgress}</p>
          </div>
        )}
      </div>

      {/* Tickets Grid */}
      {childrenWithTickets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No tickets found{search ? ` for "${search}"` : ""}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {childrenWithTickets.map((child) =>
            child.ticket ? (
              <div key={child.id} className="group">
                <div className="relative transition-transform duration-200 hover:scale-[1.02]">
                  <TicketCard
                    child={child}
                    ticketNumber={child.ticket.ticket_number}
                    registrarName={child.registrar?.name}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                      onClick={() => setSelectedChild(child)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> View
                    </Button>
                    <Button
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                      disabled={downloadingId === child.id}
                      onClick={() => downloadTicket(child)}
                    >
                      {downloadingId === child.id ? (
                        "Downloading..."
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Child Detail Modal */}
      {selectedChild && (
        <ChildDetailModal
          child={selectedChild}
          isOpen={!!selectedChild}
          onClose={() => setSelectedChild(null)}
          onUpdate={() => {
            setSelectedChild(null)
            updateQuery({ _ts: Date.now().toString() })
          }}
        />
      )}
    </div>
  )
}
