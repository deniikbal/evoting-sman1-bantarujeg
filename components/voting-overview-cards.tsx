"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Vote, CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";

interface OverviewData {
  totalStudents: number;
  totalCandidates: number;
  totalVotes: number;
  pendingTokens: number;
  votingEnabled: boolean;
  turnoutPercentage: number;
}

export function VotingOverviewCards() {
  const [data, setData] = useState<OverviewData>({
    totalStudents: 0,
    totalCandidates: 0,
    totalVotes: 0,
    pendingTokens: 0,
    votingEnabled: false,
    turnoutPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      const response = await fetch("/api/admin/overview");
      if (response.ok) {
        const overviewData = await response.json();
        setData(overviewData);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Siswa",
      value: isLoading ? "..." : data.totalStudents.toLocaleString("id-ID"),
      description: "Siswa terdaftar",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Kandidat",
      value: isLoading ? "..." : data.totalCandidates.toLocaleString("id-ID"),
      description: "Kandidat aktif",
      icon: Vote,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Suara Masuk",
      value: isLoading ? "..." : data.totalVotes.toLocaleString("id-ID"),
      description: `${data.turnoutPercentage.toFixed(1)}% partisipasi`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Token Tersedia",
      value: isLoading ? "..." : data.pendingTokens.toLocaleString("id-ID"),
      description: "Belum digunakan",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="px-4 lg:px-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-md ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Voting Status Card */}
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Status Voting
              <Badge variant={data.votingEnabled ? "default" : "secondary"}>
                {data.votingEnabled ? "Aktif" : "Non-Aktif"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Status periode voting saat ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {data.votingEnabled ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    Periode voting sedang berlangsung. Siswa dapat melakukan voting melalui token yang tersedia.
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-600">
                    Periode voting tidak aktif. Admin dapat mengaktifkan voting melalui menu Settings.
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}