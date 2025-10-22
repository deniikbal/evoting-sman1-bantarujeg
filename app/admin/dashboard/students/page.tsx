"use client";

import { useEffect, useState, useRef } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, CheckCircle2, XCircle, Upload, Download, ChevronLeft, ChevronRight, Search, Edit } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface Student {
    id: string;
    nis: string;
    name: string;
    class: string;
    classId?: string | null;
    hasVoted: boolean;
}

interface Class {
    id: string;
    name: string;
    teacher: string;
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

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [classFilter, setClassFilter] = useState("all");
    const [voteStatusFilter, setVoteStatusFilter] = useState("all");
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [classList, setClassList] = useState<Class[]>([]);

    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    const [formData, setFormData] = useState({
        nis: "",
        name: "",
        class: "",
        classId: "" as string | undefined,
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents();
        }, 300); // Debounce search

        return () => clearTimeout(timer);
    }, [pagination.page, pagination.limit, searchQuery, classFilter, voteStatusFilter]);

    const fetchClasses = async () => {
        try {
            const response = await fetch('/api/admin/classes?limit=1000');
            const data = await response.json();
            if (response.ok) {
                setClassList(data.classes);
            }
        } catch (err) {
            console.error('Failed to fetch classes:', err);
        }
    };

    const fetchStudents = async () => {
        try {
            setIsLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: searchQuery,
                class: classFilter,
                voteStatus: voteStatusFilter,
            });

            const response = await fetch(`/api/admin/students?${queryParams.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal mengambil data siswa");
                return;
            }

            setStudents(data.students);
            setPagination(data.pagination);
            if (data.filters?.classes) {
                setAvailableClasses(data.filters.classes);
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
            const url = "/api/admin/students";
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
                toast.error(data.error || (editingId ? "Gagal memperbarui siswa" : "Gagal menambahkan siswa"));
                return;
            }

            toast.success(editingId ? "Data siswa berhasil diperbarui" : "Siswa berhasil ditambahkan");
            setFormData({ nis: "", name: "", class: "" });
            setEditingId(null);
            setIsDialogOpen(false);
            fetchStudents();
        } catch (err) {
            toast.error(editingId ? "Terjadi kesalahan saat memperbarui siswa" : "Terjadi kesalahan saat menambahkan siswa");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (student: Student) => {
        setEditingId(student.id);
        setFormData({
            nis: student.nis,
            name: student.name,
            class: student.class,
            classId: student.classId || undefined,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (student: Student) => {
        setStudentToDelete(student);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!studentToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/students?id=${studentToDelete.id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal menghapus siswa");
                return;
            }

            toast.success("Siswa berhasil dihapus");
            setIsDeleteDialogOpen(false);
            setStudentToDelete(null);
            fetchStudents();
        } catch (err) {
            toast.error("Terjadi kesalahan saat menghapus siswa");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownloadTemplate = () => {
        const template = [
            { nis: "12345", name: "Contoh Nama", class: "XII IPA 1" },
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "template_import_siswa.xlsx");
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/admin/students/import", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal import siswa");
                return;
            }

            setImportResult(data.result);
            toast.success(
                `Import selesai: ${data.result.success} berhasil, ${data.result.duplicate} duplikat, ${data.result.failed} gagal`
            );
            fetchStudents();
        } catch (err) {
            toast.error("Terjadi kesalahan saat import siswa");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handlePageChange = (newPage: number) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (newLimit: string) => {
        setPagination((prev) => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleClassFilterChange = (value: string) => {
        setClassFilter(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleVoteStatusFilterChange = (value: string) => {
        setVoteStatusFilter(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    if (isLoading && students.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Manajemen Siswa</h1>
                <p className="text-muted-foreground">Kelola data siswa yang terdaftar</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <CardTitle>Daftar Siswa</CardTitle>
                            <CardDescription>
                                {pagination.total > 0 ? (
                                    <>
                                        Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                        {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
                                        {pagination.total} siswa
                                    </>
                                ) : (
                                    "Menampilkan 0 siswa"
                                )}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                Import Siswa
                            </Button>
                            <Button size="sm" onClick={() => {
                                setEditingId(null);
                                setFormData({ nis: "", name: "", class: "", classId: undefined });
                                setIsDialogOpen(true);
                            }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Siswa
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search and Filters */}
                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari NIS, nama, atau kelas..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={classFilter} onValueChange={handleClassFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter Kelas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kelas</SelectItem>
                                {availableClasses.map((cls) => (
                                    <SelectItem key={cls} value={cls}>
                                        {cls}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={voteStatusFilter} onValueChange={handleVoteStatusFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status Voting" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="voted">Sudah Vote</SelectItem>
                                <SelectItem value="not_voted">Belum Vote</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

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
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {searchQuery || classFilter !== "all" || voteStatusFilter !== "all"
                                            ? "Tidak ada siswa yang sesuai dengan pencarian atau filter"
                                            : "Belum ada data siswa"}
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
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(student)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(student)}
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

                    {/* Pagination Controls */}
                    {pagination.total > 0 && (
                        <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Baris per halaman:</span>
                            <Select
                                value={pagination.limit.toString()}
                                onValueChange={handleLimitChange}
                            >
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
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Halaman {pagination.page} dari {pagination.totalPages || 1}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= (pagination.totalPages || 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Student Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                    setEditingId(null);
                    setFormData({ nis: "", name: "", class: "", classId: undefined });
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Data Siswa" : "Tambah Siswa Baru"}</DialogTitle>
                        <DialogDescription>
                            {editingId ? "Perbarui data siswa" : "Masukkan data siswa yang akan ditambahkan"}
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
                                <Select
                                    value={formData.classId || ""}
                                    onValueChange={(value) => {
                                        const selectedClass = classList.find(c => c.id === value);
                                        setFormData({
                                            ...formData,
                                            classId: value,
                                            class: selectedClass?.name || ""
                                        });
                                    }}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classList.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name} - {cls.teacher}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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

            {/* Import Students Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Import Data Siswa</DialogTitle>
                        <DialogDescription>
                            Upload file Excel (.xlsx) untuk import data siswa secara massal
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Template File</Label>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadTemplate}
                                className="w-full"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Template Excel
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Download template untuk melihat format yang benar
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="import-file">Upload File Excel</Label>
                            <Input
                                id="import-file"
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleImportFile}
                                disabled={isImporting}
                            />
                            <p className="text-xs text-muted-foreground">
                                Format: .xlsx atau .xls dengan kolom: nis, name, class
                            </p>
                        </div>

                        {isImporting && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sedang mengimport data...
                            </div>
                        )}

                        {importResult && (
                            <div className="space-y-2">
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="space-y-1">
                                            <p className="font-medium">Hasil Import:</p>
                                            <ul className="text-sm space-y-1">
                                                <li>✓ Berhasil: {importResult.success} siswa</li>
                                                <li>⊘ Duplikat (dilewati): {importResult.duplicate} siswa</li>
                                                <li>✗ Gagal: {importResult.failed} siswa</li>
                                            </ul>
                                        </div>
                                    </AlertDescription>
                                </Alert>

                                {importResult.errors.length > 0 && (
                                    <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-1">
                                        <p className="text-sm font-medium mb-2">Detail Error:</p>
                                        {importResult.errors.map((error, idx) => (
                                            <p key={idx} className="text-xs text-muted-foreground">
                                                Baris {error.row}: {error.error}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
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

            {/* Confirm Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Siswa</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus siswa ini?
                        </DialogDescription>
                    </DialogHeader>
                    
                    {studentToDelete && (
                        <div className="py-4">
                            <Alert>
                                <AlertDescription>
                                    <div className="space-y-1">
                                        <p><strong>NIS:</strong> {studentToDelete.nis}</p>
                                        <p><strong>Nama:</strong> {studentToDelete.name}</p>
                                        <p><strong>Kelas:</strong> {studentToDelete.class}</p>
                                    </div>
                                </AlertDescription>
                            </Alert>
                            <p className="text-sm text-muted-foreground mt-4">
                                Tindakan ini tidak dapat dibatalkan. Data siswa dan token terkait akan dihapus secara permanen.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setStudentToDelete(null);
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
                                    Hapus Siswa
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
