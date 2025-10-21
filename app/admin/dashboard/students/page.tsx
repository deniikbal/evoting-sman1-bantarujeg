"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Student {
    id: string;
    nis: string;
    name: string;
    class: string;
    hasVoted: boolean;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        nis: "",
        name: "",
        class: "",
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await fetch("/api/admin/students");
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Gagal mengambil data siswa");
                return;
            }

            setStudents(data.students);
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
            const response = await fetch("/api/admin/students", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Gagal menambahkan siswa");
                return;
            }

            setSuccess("Siswa berhasil ditambahkan");
            setFormData({ nis: "", name: "", class: "" });
            setIsDialogOpen(false);
            fetchStudents();
        } catch (err) {
            setError("Terjadi kesalahan saat menambahkan siswa");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (studentId: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus siswa ini?")) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/students?id=${studentId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Gagal menghapus siswa");
                return;
            }

            setSuccess("Siswa berhasil dihapus");
            fetchStudents();
        } catch (err) {
            setError("Terjadi kesalahan saat menghapus siswa");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Manajemen Siswa</h1>
                    <p className="text-muted-foreground">Kelola data siswa yang terdaftar</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Siswa
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Siswa</CardTitle>
                    <CardDescription>Total: {students.length} siswa</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>NIS</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Kelas</TableHead>
                                <TableHead>Status Voting</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        Belum ada data siswa
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.nis}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.class}</TableCell>
                                        <TableCell>
                                            {student.hasVoted ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Sudah
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                    <XCircle className="h-4 w-4" />
                                                    Belum
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(student.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add Student Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Siswa Baru</DialogTitle>
                        <DialogDescription>
                            Masukkan data siswa yang akan ditambahkan
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nis">NIS</Label>
                                <Input
                                    id="nis"
                                    placeholder="Nomor Induk Siswa"
                                    value={formData.nis}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nis: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    placeholder="Nama siswa"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="class">Kelas</Label>
                                <Input
                                    id="class"
                                    placeholder="Contoh: XII IPA 1"
                                    value={formData.class}
                                    onChange={(e) =>
                                        setFormData({ ...formData, class: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    "Simpan"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
