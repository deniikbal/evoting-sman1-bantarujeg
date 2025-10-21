"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save } from "lucide-react";

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
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
            }
        } catch (err) {
            setError("Terjadi kesalahan saat mengambil data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Gagal menyimpan pengaturan");
                return;
            }

            setSuccess("Pengaturan berhasil disimpan");
            fetchSettings();
        } catch (err) {
            setError("Terjadi kesalahan saat menyimpan pengaturan");
        } finally {
            setIsSubmitting(false);
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
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold mb-2">Pengaturan Pemilihan</h1>
                <p className="text-muted-foreground">Kelola pengaturan sistem voting</p>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

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
        </div>
    );
}
