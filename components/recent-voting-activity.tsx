"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, Activity } from "lucide-react";

interface RecentVote {
  id: number;
  studentName: string;
  candidateName: string;
  votingTime: string;
  ipAddress: string;
}

export function RecentVotingActivity() {
  const [votes, setVotes] = useState<RecentVote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentVotes();
  }, []);

  const fetchRecentVotes = async () => {
    try {
      const response = await fetch("/api/admin/recent-votes");
      if (response.ok) {
        const data = await response.json();
        setVotes(data.votes);
      }
    } catch (error) {
      console.error("Error fetching recent votes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
    return `${Math.floor(diffInMinutes / 1440)} hari yang lalu`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Aktivitas Voting Terbaru
        </CardTitle>
        <CardDescription>
          10 voting terakhir yang dilakukan siswa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : votes.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada aktivitas voting</p>
            <p className="text-sm text-gray-500 mt-2">
              Aktivitas akan muncul setelah siswa mulai melakukan voting
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {votes.map((vote) => (
              <div
                key={vote.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {vote.studentName}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {vote.candidateName}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(vote.votingTime)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {new Date(vote.votingTime).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && votes.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Menampilkan 10 voting terakhir. Data diperbarui setiap 30 detik.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}