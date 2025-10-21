"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  User,
  Vote,
  CheckCircle,
  XCircle,
  Search,
  Image as ImageIcon,
} from "lucide-react";

interface Candidate {
  id: number;
  name: string;
  photoUrl: string | null;
  bio: string;
  vision: string | null;
  mission: string | null;
  isActive: boolean;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function CandidatesManagementPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    vision: "",
    mission: "",
    photoUrl: "",
    isActive: true,
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch("/api/admin/candidates");
      if (response.ok) {
        const data = await response.json();
        setCandidates(data);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error("Gagal memuat data kandidat");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    try {
      const response = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Kandidat berhasil ditambahkan");
        setFormData({
          name: "",
          bio: "",
          vision: "",
          mission: "",
          photoUrl: "",
          isActive: true,
        });
        setShowAddDialog(false);
        fetchCandidates();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menambahkan kandidat");
      }
    } catch (error) {
      console.error("Error adding candidate:", error);
      toast.error("Terjadi kesalahan saat menambahkan kandidat");
    }
  };

  const handleEditCandidate = async () => {
    if (!editingCandidate) return;

    try {
      const response = await fetch(`/api/admin/candidates/${editingCandidate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Kandidat berhasil diperbarui");
        setShowEditDialog(false);
        setEditingCandidate(null);
        setFormData({
          name: "",
          bio: "",
          vision: "",
          mission: "",
          photoUrl: "",
          isActive: true,
        });
        fetchCandidates();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal memperbarui kandidat");
      }
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast.error("Terjadi kesalahan saat memperbarui kandidat");
    }
  };

  const handleDeleteCandidate = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kandidat ini?")) return;

    try {
      const response = await fetch(`/api/admin/candidates/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Kandidat berhasil dihapus");
        fetchCandidates();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menghapus kandidat");
      }
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast.error("Terjadi kesalahan saat menghapus kandidat");
    }
  };

  const openEditDialog = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      bio: candidate.bio,
      vision: candidate.vision || "",
      mission: candidate.mission || "",
      photoUrl: candidate.photoUrl || "",
      isActive: candidate.isActive,
    });
    setShowEditDialog(true);
  };

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.bio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCandidates = filteredCandidates.filter(c => c.isActive);
  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Kandidat</h1>
          <p className="text-gray-600">
            Kelola data kandidat Ketua OSIS ({activeCandidates.length} aktif, {totalVotes} total suara)
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kandidat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Kandidat Baru</DialogTitle>
              <DialogDescription>
                Tambahkan kandidat untuk pemilihan Ketua OSIS
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap kandidat"
                />
              </div>
              <div>
                <Label htmlFor="bio">Biodata</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Masukkan biodata singkat kandidat"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="vision">Visi</Label>
                <Textarea
                  id="vision"
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  placeholder="Masukkan visi kandidat"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="mission">Misi</Label>
                <Textarea
                  id="mission"
                  value={formData.mission}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  placeholder="Masukkan misi kandidat"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="photoUrl">URL Foto</Label>
                <Input
                  id="photoUrl"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Aktif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleAddCandidate}>Tambah Kandidat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kandidat</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCandidates.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeCandidates.length} aktif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suara</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVotes.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">
              Dari semua kandidat
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suara Tertinggi</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {candidates.length > 0 ? Math.max(...candidates.map(c => c.voteCount)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Suara per kandidat terbanyak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Kandidat ({filteredCandidates.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Cari kandidat berdasarkan nama atau biodata..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Memuat data kandidat...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Suara</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-gray-500">
                          {searchTerm ? "Tidak ada kandidat yang cocok dengan pencarian" : "Belum ada data kandidat"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={candidate.photoUrl || ''} alt={candidate.name} />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{candidate.name}</p>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {candidate.bio}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {candidate.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Non-Aktif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-lg font-semibold">
                            {candidate.voteCount.toLocaleString("id-ID")}
                          </div>
                          {totalVotes > 0 && (
                            <div className="text-xs text-gray-600">
                              {((candidate.voteCount / totalVotes) * 100).toFixed(1)}%
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(candidate.createdAt).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(candidate)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCandidate(candidate.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Kandidat</DialogTitle>
            <DialogDescription>
              Perbarui data kandidat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap kandidat"
              />
            </div>
            <div>
              <Label htmlFor="edit-bio">Biodata</Label>
              <Textarea
                id="edit-bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Masukkan biodata singkat kandidat"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-vision">Visi</Label>
              <Textarea
                id="edit-vision"
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                placeholder="Masukkan visi kandidat"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-mission">Misi</Label>
              <Textarea
                id="edit-mission"
                value={formData.mission}
                onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                placeholder="Masukkan misi kandidat"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-photoUrl">URL Foto</Label>
              <Input
                id="edit-photoUrl"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://example.com/photo.jpg"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleEditCandidate}>Perbarui Kandidat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}