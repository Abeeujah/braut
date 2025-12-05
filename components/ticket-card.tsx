"use client";

import type { Database } from "@/types/database";

type Child = Database["public"]["Tables"]["children"]["Row"];

interface TicketCardProps {
  child: Child;
  ticketNumber: string;
}

const HOUSE_IMAGES: Record<string, string> = {
  Love: "/tickets/House of Love.jpg",
  Joy: "/tickets/House of Joy.jpg",
  Hope: "/tickets/House of Hope.jpg",
  Peace: "/tickets/House of Peace.jpg",
};

export function TicketCard({ child, ticketNumber }: TicketCardProps) {
  const ticketImage = HOUSE_IMAGES[child.house || "Love"];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="relative w-full overflow-hidden rounded-xl shadow-lg"
        style={{ aspectRatio: "1587/540" }}
      >
        {/* Background ticket image */}
        <img
          src={ticketImage}
          alt={`House of ${child.house} ticket`}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay content positioned on the template */}
        <div className="absolute inset-0">
          {/* ===== LEFT STUB (Attendant copy) ===== */}

          {/* Stub - Ticket Number (next to "No.") */}
          <div
            className="absolute text-black font-bold"
            style={{
              top: "22%",
              left: "3%",
              fontSize: "clamp(8px, 2vw, 18px)",
            }}
          >
            {ticketNumber}
          </div>

          {/* Stub - Name (in the white box under "Name:") */}
          <div
            className="absolute text-black font-semibold truncate"
            style={{
              top: "58%",
              left: "2%",
              width: "23%",
              fontSize: "clamp(6px, 1.8vw, 16px)",
            }}
          >
            {`${child.name.length > 15 ? child.name.substring(0, 15) + "..." : child.name}`}
          </div>

          {/* ===== CENTER - Polaroid Photo ===== */}
          <div
            className="absolute"
            style={{
              top: "20%",
              left: "29.5%",
              width: "17.5%",
              height: "58%",
            }}
          >
            <div
              className="relative w-full h-full bg-gray-300 p-[1%] shadow-lg"
              // style={{ transform: "rotate(-6deg)" }}
            >
              <div className="w-full h-full overflow-hidden bg-gray-200">
                {child.photo_url ? (
                  <img
                    src={child.photo_url}
                    alt={child.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-1/3 h-1/3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== RIGHT SECTION (Main ticket) ===== */}

          {/* Main - Ticket Number (inside "No." white field) */}
          <div
            className="absolute text-black font-bold"
            style={{
              top: "32%",
              left: "63%",
              fontSize: "clamp(8px, 2vw, 18px)",
            }}
          >
            {ticketNumber}
          </div>

          {/* Main - Name (inside "Name:" white field) */}
          <div
            className="absolute text-black font-semibold truncate"
            style={{
              top: "49%",
              left: "57%",
              width: "38%",
              fontSize: "clamp(8px, 2vw, 18px)",
            }}
          >
            {child.name}
          </div>
        </div>
      </div>

      {/* Ticket details below */}
      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground px-2">
        <div className="flex items-center gap-4">
          <span>Age: {child.age}</span>
          <span>Class: {child.class}</span>
          <span>{child.gender}</span>
        </div>
        <span className="font-mono font-medium text-foreground">
          #{ticketNumber}
        </span>
      </div>
    </div>
  );
}
