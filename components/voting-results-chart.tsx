"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, TrendingUp } from "lucide-react";

interface CandidateResult {
  id: number;
  name: string;
  photoUrl: string | null;
  voteCount: number;
  percentage: number;
}

export function VotingResultsChart() {
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVotingResults();
  }, []);

  const fetchVotingResults = async () => {
    try {
      const response = await fetch("/api/admin/voting-results");
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates);
        setTotalVotes(data.totalVotes);
      }
    } catch (error) {
      console.error("Error fetching voting results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hasil Voting Sementara</CardTitle>
          <CardDescription>
            Perolehan suara untuk setiap kandidat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hasil Voting Sementara</CardTitle>
          <CardDescription>
            Perolehan suara untuk setiap kandidat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada suara yang masuk</p>
            <p className="text-sm text-gray-500 mt-2">
              Hasil akan muncul setelah siswa mulai melakukan voting
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hasil Voting Sementara</CardTitle>
        <CardDescription>
          Total {totalVotes} suara telah masuk
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {candidates
            .sort((a, b) => b.voteCount - a.voteCount)
            .map((candidate, index) => (
              <div key={candidate.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={candidate.photoUrl || ''} alt={candidate.name} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && candidate.voteCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 text-xs bg-yellow-500 hover:bg-yellow-500">
                          1st
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-sm text-gray-600">
                        {candidate.voteCount.toLocaleString("id-ID")} suara
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {candidate.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Progress
                  value={candidate.percentage}
                  className="h-3"
                  indicatorClassName={
                    index === 0
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                      : "bg-blue-600"
                  }
                />
              </div>
            ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-gray-500 text-center">
            Hasil akan diperbarui secara real-time. Periode voting berakhir sesuai dengan pengaturan admin.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}