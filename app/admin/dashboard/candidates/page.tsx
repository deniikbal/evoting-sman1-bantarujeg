"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface Candidate {
    id: string;
    name: string;
    vision: string | null;
    mission: string | null;
    photoUrl: string | null;
    orderPosition: number;
    isActive: boolean;
}

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");

    const [formData, setFormData] = useState({
        name: "",
        vision: "",
        mission: "",
        photoUrl: "",
        orderPosition: 0,
    });

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const response = await fetch("/api/admin/candidates");
            const data = await response.json();
            if (response.ok) {
                setCandidates(data.candidates);
            } else {
                toast.error(data.error || "Gagal mengambil data kandidat");
            }
        } catch (err) {
            console.error("Fetch candidates error:", err);
            toast.error("Terjadi kesalahan saat mengambil data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadImage = async () => {
        if (!selectedFile) return null;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal upload foto");
                return null;
            }

            return data.url;
        } catch (err) {
            console.error("Upload image error:", err);
            toast.error("Terjadi kesalahan saat upload foto");
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let photoUrl = formData.photoUrl;

            // Upload image if new file selected
            if (selectedFile) {
                const uploadedUrl = await handleUploadImage();
                if (uploadedUrl) {
                    photoUrl = uploadedUrl;
                } else {
                    setIsSubmitting(false);
                    return;
                }
            }

            const url = "/api/admin/candidates";
            const method = editingId ? "PUT" : "POST";
            const body = editingId 
                ? { id: editingId, ...formData, photoUrl } 
                : { ...formData, photoUrl };

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal menyimpan kandidat");
                return;
            }

            toast.success(data.message || "Kandidat berhasil disimpan");
            setFormData({ name: "", vision: "", mission: "", photoUrl: "", orderPosition: 0 });
            setSelectedFile(null);
            setPreviewUrl("");
            setIsDialogOpen(false);
            setEditingId(null);
            fetchCandidates();
        } catch (err) {
            console.error("Save candidate error:", err);
            toast.error("Terjadi kesalahan saat menyimpan kandidat");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (candidate: Candidate) => {
        setEditingId(candidate.id);
        setFormData({
            name: candidate.name,
            vision: candidate.vision || "",
            mission: candidate.mission || "",
            photoUrl: candidate.photoUrl || "",
            orderPosition: candidate.orderPosition,
        });
        setPreviewUrl(candidate.photoUrl || "");
        setSelectedFile(null);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus kandidat ini?")) return;

        try {
            const response = await fetch(`/api/admin/candidates?id=${id}`, { method: "DELETE" });
            const data = await response.json();

            if (response.ok) {
                toast.success("Kandidat berhasil dihapus");
                fetchCandidates();
            } else {
                toast.error(data.error || "Gagal menghapus kandidat");
            }
        } catch (err) {
            console.error("Delete candidate error:", err);
            toast.error("Terjadi kesalahan saat menghapus kandidat");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Manajemen Kandidat</h1>
                    <p className="text-muted-foreground">Kelola kandidat ketua OSIS</p>
                </div>
                <Button onClick={() => { setEditingId(null); setFormData({ name: "", vision: "", mission: "", photoUrl: "", orderPosition: 0 }); setPreviewUrl(""); setSelectedFile(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Kandidat
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {candidates.map((candidate) => (
                    <Card key={candidate.id} className="flex flex-col h-full">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col items-center text-center">
                                {candidate.photoUrl ? (
                                    <div className="relative w-40 h-40 mb-4">
                                        <Image
                                            src={candidate.photoUrl}
                                            alt={candidate.name}
                                            fill
                                            className="rounded-full object-cover"
                                            sizes="(max-width: 768px) 160px, 160px"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white text-5xl font-bold mb-4">
                                        {candidate.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                                    <CardDescription>Nomor Urut: {candidate.orderPosition}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1">
                            <div className="flex-1 min-h-[120px]">
                                {candidate.vision && <p className="text-sm mb-2"><strong>Visi:</strong> <span className="text-muted-foreground">{candidate.vision}</span></p>}
                                {candidate.mission && (
                                    <div className="text-sm">
                                        <strong>Misi:</strong>
                                        <ol className="list-decimal list-inside mt-1 space-y-1 text-muted-foreground">
                                            {candidate.mission.split('\n').filter(m => m.trim()).map((misi, index) => (
                                                <li key={index}>{misi.trim()}</li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 justify-center pt-4 mt-4 border-t">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(candidate)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(candidate.id)}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Hapus
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Kandidat" : "Tambah Kandidat"}</DialogTitle>
                        <DialogDescription>Masukkan data kandidat</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Left Column - Photo Upload */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="photo">Foto Kandidat</Label>
                                    <Input 
                                        id="photo" 
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handleFileSelect}
                                    />
                                    <p className="text-xs text-muted-foreground">JPEG, PNG, WebP - Max 5MB</p>
                                </div>
                                {previewUrl ? (
                                    <div className="flex justify-center">
                                        <div className="relative w-64 h-64">
                                            <Image 
                                                src={previewUrl} 
                                                alt="Preview" 
                                                fill
                                                className="object-cover rounded-lg border shadow-md"
                                                sizes="256px"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-center">
                                        <div className="w-64 h-64 bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
                                            <p className="text-sm text-muted-foreground text-center px-4">
                                                Preview foto akan muncul di sini
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Form Fields */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Kandidat</Label>
                                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="orderPosition">Nomor Urut</Label>
                                    <Input id="orderPosition" type="number" value={formData.orderPosition} onChange={(e) => setFormData({ ...formData, orderPosition: parseInt(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vision">Visi</Label>
                                    <Textarea 
                                        id="vision" 
                                        value={formData.vision} 
                                        onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                                        rows={4}
                                        placeholder="Masukkan visi kandidat"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mission">Misi</Label>
                                    <Textarea 
                                        id="mission" 
                                        value={formData.mission} 
                                        onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                                        rows={4}
                                        placeholder="Masukkan misi kandidat"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting || isUploading}>
                                {isSubmitting || isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isUploading ? "Uploading..." : "Menyimpan..."}</> : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
