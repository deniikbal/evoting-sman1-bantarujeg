"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Edit, ChevronLeft, ChevronRight, Search, GraduationCap, Users, CheckCircle2, XCircle, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Class {
    id: string;
    name: string;
    teacher: string;
    studentCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

interface Student {
    id: string;
    nis: string;
    name: string;
    class: string;
    hasVoted: boolean;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface ImportResult {
    success: number;
    failed: number;
    duplicate: number;
    errors: Array<{ row: number; error: string }>;
}

export default function ClassesPage() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [classToDelete, setClassToDelete] = useState<Class | null>(null);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [classStudents, setClassStudents] = useState<Student[]>([]);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: "",
        teacher: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    const fetchClasses = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: searchQuery,
            });

            const response = await fetch(`/api/admin/classes?${params}`);
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal mengambil data kelas");
                return;
            }

            setClasses(data.classes);
            setPagination((prev) => ({
                ...prev,
                total: data.pagination.total,
                totalPages: data.pagination.totalPages,
            }));
        } catch (err) {
            toast.error("Terjadi kesalahan saat mengambil data");
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit, searchQuery]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPagination((prev) => ({ ...prev, page: 1 }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = "/api/admin/classes";
            const method = editingId ? "PUT" : "POST";
            const body = editingId
                ? JSON.stringify({ id: editingId, ...formData })
                : JSON.stringify(formData);

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body,
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || (editingId ? "Gagal memperbarui kelas" : "Gagal menambahkan kelas"));
                return;
            }

            toast.success(editingId ? "Data kelas berhasil diperbarui" : "Kelas berhasil ditambahkan");
            setFormData({ name: "", teacher: "" });
            setEditingId(null);
            setIsDialogOpen(false);
            fetchClasses();
        } catch (err) {
            toast.error(editingId ? "Terjadi kesalahan saat memperbarui kelas" : "Terjadi kesalahan saat menambahkan kelas");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (cls: Class) => {
        setEditingId(cls.id);
        setFormData({
            name: cls.name,
            teacher: cls.teacher,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (cls: Class) => {
        setClassToDelete(cls);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!classToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/classes?id=${classToDelete.id}`, {
                method: "DELETE",
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Kelas berhasil dihapus");
                setIsDeleteDialogOpen(false);
                setClassToDelete(null);
                fetchClasses();
            } else {
                toast.error(data.error || "Gagal menghapus kelas");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan saat menghapus kelas");
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (value: string) => {
        setPagination((prev) => ({ ...prev, limit: parseInt(value), page: 1 }));
    };

    const handleViewStudents = async (cls: Class) => {
        setSelectedClass(cls);
        setIsStudentsDialogOpen(true);
        setIsLoadingStudents(true);
        
        try {
            const response = await fetch(`/api/admin/classes/${cls.id}/students`);
            const data = await response.json();
            
            if (response.ok) {
                setClassStudents(data.students);
            } else {
                toast.error(data.error || "Gagal mengambil data siswa");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan saat mengambil data siswa");
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const handleDownloadTemplate = () => {
        const template = [
            { name: "XII IPA 1", teacher: "Budi Santoso, S.Pd" },
            { name: "XII IPA 2", teacher: "Siti Aminah, S.Pd" },
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kelas");
        XLSX.writeFile(wb, "template_kelas.xlsx");
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/admin/classes/import", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal import data");
                return;
            }

            setImportResult(data.result);
            
            if (data.result.success > 0) {
                toast.success(`Berhasil import ${data.result.success} kelas`);
                fetchClasses();
            }

            if (data.result.duplicate > 0) {
                toast.warning(`${data.result.duplicate} kelas sudah terdaftar (dilewati)`);
            }

            if (data.result.failed > 0) {
                toast.error(`${data.result.failed} kelas gagal diimport`);
            }
        } catch (err) {
            toast.error("Terjadi kesalahan saat import data");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    if (isLoading && classes.length === 0) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen Kelas</h1>
                    <p className="text-muted-foreground">Kelola data kelas dan wali kelas</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Kelas
                    </Button>
                    <Button onClick={() => {
                        setEditingId(null);
                        setFormData({ name: "", teacher: "" });
                        setIsDialogOpen(true);
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Kelas
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kelas</CardTitle>
                    <CardDescription>
                        {pagination.total} kelas terdaftar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama kelas atau wali kelas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Kelas</TableHead>
                                <TableHead>Wali Kelas</TableHead>
                                <TableHead className="text-center">Jumlah Siswa</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : classes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        {searchQuery
                                            ? "Tidak ada kelas yang sesuai dengan pencarian"
                                            : "Belum ada kelas yang terdaftar"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                classes.map((cls) => (
                                    <TableRow key={cls.id}>
                                        <TableCell className="font-medium">{cls.name}</TableCell>
                                        <TableCell>{cls.teacher}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewStudents(cls)}
                                                className="hover:bg-primary/10"
                                            >
                                                <Users className="h-4 w-4 mr-2" />
                                                {cls.studentCount || 0}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(cls)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(cls)}
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

                    {/* Pagination */}
                    {pagination.totalPages > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Tampilkan</span>
                                <Select value={pagination.limit.toString()} onValueChange={handleLimitChange}>
                                    <SelectTrigger className="w-[70px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-muted-foreground">
                                    dari {pagination.total} kelas
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">
                                    Halaman {pagination.page} dari {pagination.totalPages || 1}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Class Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                    setEditingId(null);
                    setFormData({ name: "", teacher: "" });
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Data Kelas" : "Tambah Kelas Baru"}</DialogTitle>
                        <DialogDescription>
                            {editingId ? "Perbarui data kelas" : "Masukkan data kelas yang akan ditambahkan"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Kelas</Label>
                                <Input
                                    id="name"
                                    placeholder="Contoh: XII IPA 1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="teacher">Wali Kelas</Label>
                                <Input
                                    id="teacher"
                                    placeholder="Nama wali kelas"
                                    value={formData.teacher}
                                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
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
                                        {editingId ? "Memperbarui..." : "Menyimpan..."}
                                    </>
                                ) : (
                                    editingId ? "Perbarui" : "Simpan"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Import Classes Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Data Kelas</DialogTitle>
                        <DialogDescription>
                            Upload file Excel dengan format yang sesuai
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>File Excel</Label>
                            <div className="flex gap-2">
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileSelect}
                                    disabled={isImporting}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Format: .xlsx atau .xls dengan kolom name dan teacher
                            </p>
                        </div>

                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadTemplate}
                                className="w-full"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Template Excel
                            </Button>
                        </div>

                        {isImporting && (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <span className="ml-2 text-sm">Importing...</span>
                            </div>
                        )}

                        {importResult && (
                            <Alert>
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <p className="font-medium">Hasil Import:</p>
                                        <div className="text-sm space-y-1">
                                            <p className="text-green-600">✓ Berhasil: {importResult.success} kelas</p>
                                            <p className="text-yellow-600">⚠ Duplikat: {importResult.duplicate} kelas</p>
                                            <p className="text-red-600">✗ Gagal: {importResult.failed} kelas</p>
                                        </div>
                                        {importResult.errors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="font-medium text-sm">Detail Error:</p>
                                                <ul className="text-xs space-y-1 mt-1 max-h-40 overflow-y-auto">
                                                    {importResult.errors.map((err, idx) => (
                                                        <li key={idx} className="text-red-600">
                                                            Baris {err.row}: {err.error}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsImportDialogOpen(false);
                                setImportResult(null);
                            }}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Students Modal */}
            <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Daftar Siswa - {selectedClass?.name}</DialogTitle>
                        <DialogDescription>
                            Wali Kelas: {selectedClass?.teacher}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {isLoadingStudents ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : classStudents.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Belum ada siswa di kelas ini</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>NIS</TableHead>
                                            <TableHead>Nama</TableHead>
                                            <TableHead className="text-center">Status Vote</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {classStudents.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-mono">{student.nis}</TableCell>
                                                <TableCell>{student.name}</TableCell>
                                                <TableCell className="text-center">
                                                    {student.hasVoted ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Sudah Vote
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Belum Vote
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsStudentsDialogOpen(false)}
                        >
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Kelas</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus kelas ini?
                        </DialogDescription>
                    </DialogHeader>

                    {classToDelete && (
                        <div className="py-4">
                            <div className="bg-muted p-4 rounded-md space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <GraduationCap className="h-4 w-4" />
                                    <span className="text-sm font-medium">Informasi Kelas:</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p><strong>Nama Kelas:</strong> {classToDelete.name}</p>
                                    <p><strong>Wali Kelas:</strong> {classToDelete.teacher}</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                                ⚠️ Data kelas akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setClassToDelete(null);
                            }}
                            disabled={isDeleting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
