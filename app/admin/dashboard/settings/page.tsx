"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Settings {
    id: string;
    isVotingOpen: boolean;
    title: string;
    description: string | null;
    startTime: Date | null;
    endTime: Date | null;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [resetPassword, setResetPassword] = useState("");

    const [formData, setFormData] = useState({
        isVotingOpen: false,
        title: "",
        description: "",
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch("/api/admin/settings");
            const data = await response.json();

            if (response.ok && data.settings) {
                setSettings(data.settings);
                setFormData({
                    isVotingOpen: data.settings.isVotingOpen,
                    title: data.settings.title,
                    description: data.settings.description || "",
                });
            } else {
                toast.error("Gagal mengambil pengaturan");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan saat mengambil data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal menyimpan pengaturan");
                return;
            }

            toast.success("Pengaturan berhasil disimpan");
            fetchSettings();
        } catch (err) {
            toast.error("Terjadi kesalahan saat menyimpan pengaturan");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetVoting = async () => {
        if (!resetPassword.trim()) {
            toast.error("Password tidak boleh kosong");
            return;
        }

        setIsResetting(true);

        try {
            const response = await fetch("/api/admin/voting/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: resetPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal mereset data voting");
                return;
            }

            toast.success("Data voting berhasil direset");
            setIsResetDialogOpen(false);
            setResetPassword("");
        } catch (err) {
            toast.error("Terjadi kesalahan saat mereset data voting");
        } finally {
            setIsResetting(false);
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
            <div>
                <h1 className="text-3xl font-bold mb-2">Pengaturan Pemilihan</h1>
                <p className="text-muted-foreground">Kelola pengaturan sistem voting</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan Umum</CardTitle>
                            <CardDescription>Konfigurasi pemilihan dan status voting</CardDescription>
                        </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="voting-status">Status Pemilihan</Label>
                                <p className="text-sm text-muted-foreground">
                                    {formData.isVotingOpen
                                        ? "Pemilihan sedang dibuka, siswa dapat memberikan suara"
                                        : "Pemilihan ditutup, siswa tidak dapat memberikan suara"}
                                </p>
                            </div>
                            <Switch
                                id="voting-status"
                                checked={formData.isVotingOpen}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, isVotingOpen: checked })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Judul Pemilihan</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Contoh: Pemilihan Ketua OSIS 2024"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Deskripsi pemilihan (opsional)"
                                rows={4}
                            />
                        </div>

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan Pengaturan
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
                </form>

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>Tindakan berbahaya yang tidak dapat dikembalikan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold">Reset Data Voting</h3>
                                <p className="text-sm text-muted-foreground">
                                    Menghapus semua data voting, reset status siswa dan token. Kandidat dan siswa tetap ada.
                                </p>
                            </div>
                            <Button 
                                variant="destructive" 
                                onClick={() => setIsResetDialogOpen(true)}
                                className="w-full"
                            >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Reset Voting
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Konfirmasi Reset Data Voting
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div>
                                <p className="text-sm text-muted-foreground">Tindakan ini akan:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                                    <li>Menghapus semua data voting yang sudah masuk</li>
                                    <li>Reset status <strong>hasVoted</strong> pada semua siswa</li>
                                    <li>Reset status token agar bisa digunakan lagi</li>
                                    <li>Data kandidat dan siswa tetap ada</li>
                                </ul>
                                <p className="mt-3 font-semibold text-destructive text-sm">Aksi ini tidak dapat dikembalikan!</p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-password">Masukkan Password Admin Anda</Label>
                            <Input
                                id="reset-password"
                                type="password"
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                                placeholder="Password untuk konfirmasi"
                                disabled={isResetting}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsResetDialogOpen(false);
                                setResetPassword("");
                            }}
                            disabled={isResetting}
                        >
                            Batal
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleResetVoting}
                            disabled={isResetting}
                        >
                            {isResetting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mereset...
                                </>
                            ) : (
                                "Reset Data Voting"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
