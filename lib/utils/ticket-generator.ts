import type { Database } from "@/types/database";

type Child = Database["public"]["Tables"]["children"]["Row"];

/**
 * Generate a unique ticket ID (used before registration)
 */
export function generateTicketId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * Generate a ticket number based on house and count
 * Used after house is assigned by database
 */
export function generateTicketNumber(house: string, houseCount: number) {
  const houseInitial = house.charAt(0).toUpperCase();
  const paddedCount = String(houseCount).padStart(4, "0");
  return `${houseInitial}-${paddedCount}`;
}

/**
 * Generate QR code data for ticket
 */
export function getTicketData(child: Child, ticketNumber: string) {
  return JSON.stringify({
    ticket: ticketNumber,
    name: child.name,
    house: child.house,
    timestamp: Date.now(),
  });
}
