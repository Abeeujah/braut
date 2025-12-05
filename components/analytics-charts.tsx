"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/types/database";

type Child = Database["public"]["Tables"]["children"]["Row"];
type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface ChartData {
  houseDistribution: Array<{ name: string; value: number; color: string }>;
  genderDistribution: Array<{ name: string; value: number }>;
  classDistribution: Array<{
    class: string;
    boys: number;
    girls: number;
  }>;
  redemptionTimeline: Array<{ time: string; redeemed: number }>;
  ageGroups: Array<{ range: string; count: number }>;
  ageHouseDistribution: Array<{
    ageGroup: string;
    Love: number;
    Joy: number;
    Hope: number;
    Peace: number;
  }>;
}

const AGE_GROUP_LABELS: Record<string, string> = {
  PRESCHOOL: "Preschool",
  PRIMARY: "Primary",
  JSS: "JSS",
  SSS: "SSS",
  UNDERGRADUATE: "Undergrad",
};

function getAgeGroup(age: number): string {
  if (age <= 5) return "PRESCHOOL";
  if (age <= 11) return "PRIMARY";
  if (age <= 14) return "JSS";
  if (age <= 17) return "SSS";
  return "UNDERGRADUATE";
}

export function AnalyticsCharts() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const supabase = createClient();

        const { data: children } = await supabase.from("children").select("*");
        const { data: tickets } = await supabase.from("tickets").select("*");

        if (children && tickets) {
          // House distribution
          const houseCount: Record<string, number> = {
            Love: 0,
            Joy: 0,
            Hope: 0,
            Peace: 0,
          };
          const houseColors = {
            Love: "#ef4444",
            Joy: "#eab308",
            Hope: "#2563eb",
            Peace: "#16a34a",
          };

          children.forEach((child) => {
            if (child.house) houseCount[child.house]++;
          });

          const houseDistribution = Object.entries(houseCount).map(
            ([name, value]) => ({
              name,
              value,
              color: houseColors[name as keyof typeof houseColors],
            }),
          );

          // Gender distribution
          const genderCount: Record<string, number> = {
            Male: 0,
            Female: 0,
          };

          children.forEach((child) => {
            genderCount[child.gender]++;
          });

          const genderDistribution = Object.entries(genderCount).map(
            ([name, value]) => ({
              name,
              value,
            }),
          );

          // Class distribution
          const classData: Record<string, Record<string, number>> = {};

          children.forEach((child) => {
            if (!classData[child.class]) {
              classData[child.class] = { boys: 0, girls: 0 };
            }
            if (child.gender === "Male") classData[child.class].boys++;
            else if (child.gender === "Female") classData[child.class].girls++;
          });

          const classDistribution = Object.entries(classData).map(
            ([cls, data]) => ({
              class: cls,
              ...data,
            }),
          );

          // Redemption timeline (group by hour)
          const redemptionByHour: Record<string, number> = {};

          tickets
            .filter((t) => t.redeemed_at)
            .forEach((ticket) => {
              const date = new Date(ticket.redeemed_at!);
              const hour = `${date.getHours()}:00`;
              redemptionByHour[hour] = (redemptionByHour[hour] || 0) + 1;
            });

          const redemptionTimeline = Object.entries(redemptionByHour)
            .map(([time, redeemed]) => ({ time, redeemed }))
            .sort((a, b) => Number.parseInt(a.time) - Number.parseInt(b.time));

          // Age groups (Nigerian education system)
          const ageGroups: Record<string, number> = {
            PRESCHOOL: 0,
            PRIMARY: 0,
            JSS: 0,
            SSS: 0,
            UNDERGRADUATE: 0,
          };

          children.forEach((child) => {
            const group = getAgeGroup(child.age);
            ageGroups[group]++;
          });

          const ageGroupsData = Object.entries(ageGroups).map(
            ([range, count]) => ({
              range: AGE_GROUP_LABELS[range] || range,
              count,
            }),
          );

          // Age-House distribution
          const ageHouseData: Record<string, Record<string, number>> = {
            PRESCHOOL: { Love: 0, Joy: 0, Hope: 0, Peace: 0 },
            PRIMARY: { Love: 0, Joy: 0, Hope: 0, Peace: 0 },
            JSS: { Love: 0, Joy: 0, Hope: 0, Peace: 0 },
            SSS: { Love: 0, Joy: 0, Hope: 0, Peace: 0 },
            UNDERGRADUATE: { Love: 0, Joy: 0, Hope: 0, Peace: 0 },
          };

          children.forEach((child) => {
            const group = getAgeGroup(child.age);
            if (child.house && ageHouseData[group]) {
              ageHouseData[group][child.house]++;
            }
          });

          const ageHouseDistribution = Object.entries(ageHouseData).map(
            ([group, houses]) => ({
              ageGroup: AGE_GROUP_LABELS[group] || group,
              ...houses,
            }),
          );

          setChartData({
            houseDistribution,
            genderDistribution,
            classDistribution,
            redemptionTimeline,
            ageGroups: ageGroupsData,
            ageHouseDistribution,
          });
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel("analytics-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "children" },
        () => {
          fetchAnalytics();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          fetchAnalytics();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  if (!chartData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* House Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>House Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.houseDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.houseDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gender and Age Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.genderDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.ageGroups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Age-House Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Age Group × House Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.ageHouseDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageGroup" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Love" fill="#ef4444" name="Love" />
              <Bar dataKey="Joy" fill="#eab308" name="Joy" />
              <Bar dataKey="Hope" fill="#2563eb" name="Hope" />
              <Bar dataKey="Peace" fill="#16a34a" name="Peace" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Class Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Class-wise Gender Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.classDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="class" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="boys" fill="#3b82f6" name="Boys" />
              <Bar dataKey="girls" fill="#ec4899" name="Girls" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Redemption Timeline */}
      {chartData.redemptionTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Redemption Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.redemptionTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="redeemed"
                  stroke="#f59e0b"
                  name="Redeemed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
