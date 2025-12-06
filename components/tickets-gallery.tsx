"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TicketCard } from "@/components/ticket-card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, FolderDown } from "lucide-react"; // Added FolderDown icon
import type { Database } from "@/types/database";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type Child = Database["public"]["Tables"]["children"]["Row"];
type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Registrar = Database["public"]["Tables"]["registrars"]["Row"];

interface ChildWithTicket extends Child {
  ticket?: Ticket;
  registrar?: Registrar;
}

const HOUSE_IMAGES: Record<string, string> = {
  Love: "/tickets/House of Love.jpg",
  Joy: "/tickets/House of Joy.jpg",
  Hope: "/tickets/House of Hope.jpg",
  Peace: "/tickets/House of Peace.jpg",
};

// --- 1. Reusable Image Generation Logic ---
// We extract this so we can call it in a loop without duplicating code
const generateTicketBlob = async (
  child: ChildWithTicket,
): Promise<Blob | null> => {
  if (!child.ticket) return null;

  try {
    const ticketImage = HOUSE_IMAGES[child.house || "Love"];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";

    // Load Template
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = ticketImage;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const W = img.width;
    const H = img.height;

    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";

    // --- Draw Text Logic (Identical to your original code) ---

    // Stub - Ticket Number
    ctx.font = `bold ${Math.round(H * 0.055)}px Arial`;
    ctx.fillText(child.ticket.ticket_number, W * 0.08, H * 0.24);

    // Stub - Name
    ctx.font = `bold ${Math.round(H * 0.056)}px Arial`;
    const name = child.name;
    const spaceIndex = name.indexOf(" ");
    const hasSpace = spaceIndex !== -1;
    let lines = [];

    if (hasSpace) {
      const firstName = name.substring(0, spaceIndex);
      const lastName = name.substring(spaceIndex + 1);
      if (firstName.length > 17) {
        lines.push(firstName.substring(0, 15) + "...");
        lines.push(
          lastName.length > 17 ? lastName.substring(0, 15) + "..." : lastName,
        );
      } else if (lastName.length > 17) {
        lines.push(firstName);
        lines.push(lastName.substring(0, 15) + "...");
      } else if (name.length > 17) {
        lines.push(firstName);
        lines.push(lastName);
      } else {
        lines.push(name);
      }
    } else {
      lines.push(name.length > 17 ? name.substring(0, 15) + "..." : name);
    }

    const fontSize = Math.round(H * 0.056);
    const lineHeight = fontSize * 1.2;
    lines.forEach((line, index) => {
      ctx.fillText(line, W * 0.073, H * 0.6 + index * lineHeight);
    });

    // Main - Ticket Number
    ctx.font = `bold ${Math.round(H * 0.075)}px Arial`;
    ctx.fillText(child.ticket.ticket_number, W * 0.61, H * 0.35);

    // Main - Name
    ctx.font = `bold ${Math.round(H * 0.075)}px Arial`;
    const mainName = name.length > 22 ? name.substring(0, 22) + "..." : name;
    ctx.fillText(mainName, W * 0.57, H * 0.52);

    // --- Draw Photo Logic ---
    if (child.photo_url) {
      const photoImg = new Image();
      photoImg.crossOrigin = "anonymous";
      try {
        await new Promise<void>((resolve, reject) => {
          photoImg.onload = () => resolve();
          photoImg.onerror = reject;
          photoImg.src = child.photo_url!;
        });

        const polaroidX = W * 0.32;
        const polaroidY = H * 0.2;
        const polaroidW = W * 0.15;
        const polaroidH = H * 0.58;
        const photoPadding = polaroidW * 0.0001;
        const photoX = polaroidX + photoPadding;
        const photoY = polaroidY + photoPadding;
        const photoW = polaroidW - photoPadding * 2;
        const photoH = polaroidH - photoPadding * 2;

        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(polaroidX, polaroidY, polaroidW, polaroidH);

        const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
        const rectAspect = photoW / photoH;
        let sX, sY, sW, sH;

        if (imgAspect > rectAspect) {
          sH = photoImg.naturalHeight;
          sW = sH * rectAspect;
          sX = (photoImg.naturalWidth - sW) / 2;
          sY = 0;
        } else {
          sW = photoImg.naturalWidth;
          sH = sW / rectAspect;
          sX = 0;
          sY = (photoImg.naturalHeight - sH) / 2;
        }

        ctx.drawImage(photoImg, sX, sY, sW, sH, photoX, photoY, photoW, photoH);
        ctx.restore();
      } catch (e) {
        console.warn("Could not load child photo:", child.name);
      }
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
    });
  } catch (err) {
    console.error(`Error generating ticket for ${child.name}`, err);
    return null;
  }
};

export function TicketsGallery() {
  const [childrenWithTickets, setChildrenWithTickets] = useState<
    ChildWithTicket[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for single download
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // State for bulk download
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data: children, error: childrenError } = await supabase
        .from("children")
        .select("*")
        .order("created_at", { ascending: false });

      if (childrenError) throw childrenError;

      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("*");

      if (ticketsError) throw ticketsError;

      const { data: registrars } = await supabase
        .from("registrars")
        .select("*");

      const registrarsMap = (registrars || []).reduce((acc, r) => {
        acc[r.id] = r;
        return acc;
      }, {} as Record<string, Registrar>);

      const combined = (children || []).map((child) => ({
        ...child,
        ticket: (tickets || []).find((t) => t.child_id === child.id),
        registrar: child.registered_by ? registrarsMap[child.registered_by] : undefined,
      }));

      setChildrenWithTickets(combined);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const supabase = createClient();
    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "children" },
        fetchData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        fetchData,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Single Download Handler ---
  const downloadTicket = async (child: ChildWithTicket) => {
    if (!child.ticket) return;
    setDownloadingId(child.id);

    try {
      const blob = await generateTicketBlob(child);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ticket-${child.ticket.ticket_number}-${child.name.replace(/\s+/g, "_")}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // --- Bulk Download Handler ---
  const downloadAllTickets = async () => {
    const validChildren = childrenWithTickets.filter((c) => c.ticket);
    if (validChildren.length === 0) return;

    setIsBulkDownloading(true);
    const zip = new JSZip();

    try {
      // Loop through all children
      for (let i = 0; i < validChildren.length; i++) {
        const child = validChildren[i];

        // Update progress UI
        setBulkProgress(
          `Generating ${i + 1}/${validChildren.length}: ${child.name}`,
        );

        // Generate the image blob
        const blob = await generateTicketBlob(child);

        if (blob && child.ticket) {
          // Determine folder name (default to 'Unassigned' if house is missing)
          const folderName = child.house
            ? `House of ${child.house}`
            : "Unassigned";
          const fileName = `${child.ticket.ticket_number}_${child.name.replace(/\s+/g, "_")}.png`;

          // Add to zip structure: House Folder -> File
          zip.folder(folderName)?.file(fileName, blob);
        }
      }

      setBulkProgress("Compressing files...");

      // Generate the final zip file
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "All_Tickets_Organized.zip");
    } catch (err) {
      console.error("Bulk download failed", err);
      alert("Failed to generate bulk tickets. Check console.");
    } finally {
      setIsBulkDownloading(false);
      setBulkProgress("");
    }
  };

  if (loading)
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading tickets...
      </div>
    );
  if (error)
    return <div className="text-center py-12 text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-foreground">
            {childrenWithTickets.length} Tickets Generated
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isBulkDownloading
              ? bulkProgress
              : "Click individual tickets or download all."}
          </p>
        </div>

        <div className="flex gap-2">
          {/* REFRESH BUTTON */}
          <Button
            onClick={fetchData}
            variant="outline"
            className="rounded-full"
            disabled={isBulkDownloading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {/* DOWNLOAD ALL BUTTON */}
          <Button
            onClick={downloadAllTickets}
            className="rounded-full bg-foreground text-background hover:opacity-80"
            disabled={isBulkDownloading || childrenWithTickets.length === 0}
          >
            {isBulkDownloading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FolderDown className="w-4 h-4 mr-2" />
            )}
            {isBulkDownloading ? "Processing..." : "Download All (ZIP)"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {childrenWithTickets.map((child) =>
          child.ticket ? (
            <div
              key={child.id}
              className="group cursor-pointer"
              onClick={() => downloadTicket(child)}
            >
              <div className="relative transition-transform duration-200 hover:scale-[1.02]">
                <TicketCard
                  child={child}
                  ticketNumber={child.ticket.ticket_number}
                  registrarName={child.registrar?.name}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors flex items-center justify-center">
                  <Button
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    disabled={downloadingId === child.id}
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
          ) : null,
        )}
      </div>
    </div>
  );
}
