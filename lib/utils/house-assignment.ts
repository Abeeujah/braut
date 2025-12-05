import type { Database } from "@/types/database";

type Child = Database["public"]["Tables"]["children"]["Row"];

/**
 * Get house distribution statistics
 * Used by dashboard for displaying stats
 */
export function getHouseStats(children: Child[]) {
  const stats: Record<string, { total: number; male: number; female: number }> = {
    Love: { total: 0, male: 0, female: 0 },
    Joy: { total: 0, male: 0, female: 0 },
    Hope: { total: 0, male: 0, female: 0 },
    Peace: { total: 0, male: 0, female: 0 },
  };

  children.forEach((child) => {
    if (child.house && stats[child.house]) {
      stats[child.house].total++;

      if (child.gender === "Male") stats[child.house].male++;
      else if (child.gender === "Female") stats[child.house].female++;
    }
  });

  return stats;
}
