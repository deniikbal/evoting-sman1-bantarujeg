"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Settings,
  Power,
  Clock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Users,
  Vote,
} from "lucide-react";

interface VotingSettings {
  votingEnabled: boolean;
  startTime: string;
  endTime: string;
  schoolName: string;
  electionTitle: string;
}

export default function VotingSettingsPage() {
  const [settings, setSettings] = useState<VotingSettings>({
    votingEnabled: false,
    startTime: "",
    endTime: "",
    schoolName: "SMAN 1 Bantarujeg",
    electionTitle: "Pemilihan Ketua OSIS 2024/2025",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCandidates: 0,
    totalVotes: 0,
  });

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings({
          votingEnabled: data.votingEnabled || false,
          startTime: data.startTime || "",
          endTime: data.endTime || "",
          schoolName: data.schoolName || "SMAN 1 Bantarujeg",
          electionTitle: data.electionTitle || "Pemilihan Ketua OSIS 2024/2025",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/overview");
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalStudents: data.totalStudents,
          totalCandidates: data.totalCandidates,
          totalVotes: data.totalVotes,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Pengaturan berhasil disimpan");
        fetchStats(); // Refresh stats
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menyimpan pengaturan");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Terjadi kesalahan saat menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVoting = async () => {
    const newStatus = !settings.votingEnabled;

    if (newStatus) {
      // Enable voting
      if (!confirm("Apakah Anda yakin ingin mengaktifkan voting? Siswa akan dapat melakukan voting.")) {
        return;
      }
    } else {
      // Disable voting
      if (!confirm("Apakah Anda yakin ingin menonaktifkan voting? Siswa tidak akan dapat melakukan voting.")) {
        return;
      }
    }

    setSettings({ ...settings, votingEnabled: newStatus });

    try {
      const response = await fetch("/api/admin/settings/toggle-voting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: newStatus }),
      });

      if (response.ok) {
        toast.success(`Voting berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}`);
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal mengubah status voting");
        // Revert on error
        setSettings({ ...settings, votingEnabled: !newStatus });
      }
    } catch (error) {
      console.error("Error toggling voting:", error);
      toast.error("Terjadi kesalahan saat mengubah status voting");
      // Revert on error
      setSettings({ ...settings, votingEnabled: !newStatus });
    }
  };

  const handleResetVoting = async () => {
    if (!confirm("Apakah Anda yakin ingin mereset semua data voting? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua suara yang telah masuk.")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/settings/reset-voting", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Data voting berhasil direset");
        fetchStats();
        fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal mereset voting");
      }
    } catch (error) {
      console.error("Error resetting voting:", error);
      toast.error("Terjadi kesalahan saat mereset voting");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan Voting</h1>
          <p className="text-gray-600">
            Kelola konfigurasi sistem voting
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleResetVoting}
            className="text-red-600 hover:text-red-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Voting
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Siswa terdaftar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kandidat</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Kandidat aktif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suara</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVotes}</div>
            <p className="text-xs text-muted-foreground">
              Suara masuk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Voting Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              Kontrol Voting
            </CardTitle>
            <CardDescription>
              Aktifkan atau nonaktifkan periode voting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Status Voting</Label>
                <p className="text-sm text-gray-600">
                  {settings.votingEnabled
                    ? "Voting sedang aktif, siswa dapat melakukan voting"
                    : "Voting non-aktif, siswa tidak dapat melakukan voting"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={settings.votingEnabled ? "default" : "secondary"}>
                  {settings.votingEnabled ? "Aktif" : "Non-Aktif"}
                </Badge>
                <Switch
                  checked={settings.votingEnabled}
                  onCheckedChange={handleToggleVoting}
                />
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Hanya aktifkan voting saat semua kandidat dan token telah siap.
                Pastikan sistem sudah teruji sebelum dibuka untuk siswa.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Time Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Waktu Voting
            </CardTitle>
            <CardDescription>
              Atur jadwal periode voting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="startTime">Waktu Mulai</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={settings.startTime}
                onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endTime">Waktu Selesai</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={settings.endTime}
                onChange={(e) => setSettings({ ...settings, endTime: e.target.value })}
              />
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Pengaturan waktu bersifat opsional. Jika tidak diisi, voting akan berjalan tanpa batas waktu hingga dinonaktifkan secara manual.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pengaturan Umum
          </CardTitle>
          <CardDescription>
            Informasi dasar yang akan ditampilkan di sistem voting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="schoolName">Nama Sekolah</Label>
              <Input
                id="schoolName"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                placeholder="SMAN 1 Bantarujeg"
              />
            </div>
            <div>
              <Label htmlFor="electionTitle">Judul Pemilihan</Label>
              <Input
                id="electionTitle"
                value={settings.electionTitle}
                onChange={(e) => setSettings({ ...settings, electionTitle: e.target.value })}
                placeholder="Pemilihan Ketua OSIS 2024/2025"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Sistem</CardTitle>
          <CardDescription>
            Status dan informasi sistem voting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Status Database</Label>
              <Badge variant="outline" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Terhubung
              </Badge>
            </div>
            <div>
              <Label>Versi Sistem</Label>
              <span className="text-sm text-gray-600 ml-2">v1.0.0</span>
            </div>
            <div>
              <Label>Partisipasi</Label>
              <span className="text-sm text-gray-600 ml-2">
                {stats.totalStudents > 0
                  ? `${((stats.totalVotes / stats.totalStudents) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
            <div>
              <Label>Status Token</Label>
              <Badge variant="outline" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Aktif
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}