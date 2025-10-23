"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, RefreshCw, ChevronLeft, ChevronRight, Search, Key, Copy, Check, Trash2, FileDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface Token {
    id: string;
    token: string;
    studentId: string;
    studentName: string;
    studentNis: string;
    isUsed: boolean;
    generatedAt: string;
    usedAt: string | null;
}

interface Student {
    id: string;
    name: string;
    nis: string;
    class: string;
}

interface ExportData {
    name: string;
    class: string;
    token: string;
    status: string;
    nis: string;
}

export default function TokensPage() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [studentsWithoutToken, setStudentsWithoutToken] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
    const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: searchQuery,
                status: statusFilter,
            });

            const [tokensRes, studentsRes] = await Promise.all([
                fetch(`/api/admin/tokens?${queryParams.toString()}`),
                fetch("/api/admin/students?page=1&limit=10000"),
            ]);

            const tokensData = await tokensRes.json();
            const studentsData = await studentsRes.json();

            if (tokensRes.ok) {
                setTokens(tokensData.tokens);
                setPagination(tokensData.pagination);
            }
            
            if (studentsRes.ok) {
                // Count students without token
                const allTokensRes = await fetch("/api/admin/tokens?page=1&limit=10000");
                const allTokensData = await allTokensRes.json();
                const tokenedStudentIds = new Set(
                    allTokensData.tokens.map((t: Token) => t.studentId)
                );
                const withoutToken = studentsData.students.filter(
                    (s: Student) => !tokenedStudentIds.has(s.id)
                ).length;
                setStudentsWithoutToken(withoutToken);
            }
        } catch (err) {
            console.error("Fetch tokens error:", err);
            toast.error("Terjadi kesalahan saat mengambil data");
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
            setSelectedTokenIds([]); // Clear selection when filters/search/page changes
        }, 300); // Debounce search

        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleGenerateAllTokens = async () => {
        setIsGenerating(true);

        try {
            const response = await fetch("/api/admin/tokens/generate-all", {
                method: "POST",
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`Berhasil generate ${data.count} token untuk siswa yang belum punya token`);
                setIsConfirmDialogOpen(false);
                fetchData();
            } else {
                toast.error(data.error || "Gagal generate token");
            }
        } catch (err) {
            console.error("Generate all tokens error:", err);
            toast.error("Terjadi kesalahan saat generate token");
        } finally {
            setIsGenerating(false);
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

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleRegenerateToken = (token: Token) => {
        if (token.isUsed) {
            toast.error("Token sudah terpakai, tidak dapat di-generate ulang");
            return;
        }
        setSelectedToken(token);
        setIsRegenerateDialogOpen(true);
    };

    const handleConfirmRegenerate = async () => {
        if (!selectedToken) return;

        setIsGenerating(true);
        try {
            const response = await fetch("/api/admin/tokens/regenerate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: selectedToken.studentId }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`Token berhasil di-generate ulang: ${data.token}`);
                setIsRegenerateDialogOpen(false);
                setSelectedToken(null);
                fetchData();
            } else {
                toast.error(data.error || "Gagal generate token");
            }
        } catch (err) {
            console.error("Regenerate token error:", err);
            toast.error("Terjadi kesalahan saat generate token");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyToken = async (tokenId: string, tokenString: string) => {
        try {
            await navigator.clipboard.writeText(tokenString);
            setCopiedTokenId(tokenId);
            toast.success("Token berhasil disalin!");
            
            // Reset copied state after 2 seconds
            setTimeout(() => {
                setCopiedTokenId(null);
            }, 2000);
        } catch (err) {
            console.error("Copy token error:", err);
            toast.error("Gagal menyalin token");
        }
    };

    const handleSelectToken = (tokenId: string) => {
        setSelectedTokenIds(prev => 
            prev.includes(tokenId) 
                ? prev.filter(id => id !== tokenId)
                : [...prev, tokenId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTokenIds.length === tokens.length) {
            setSelectedTokenIds([]);
        } else {
            setSelectedTokenIds(tokens.map(token => token.id));
        }
    };

    const handleBulkDelete = () => {
        if (selectedTokenIds.length === 0) {
            toast.error("Pilih token yang akan dihapus");
            return;
        }
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmBulkDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch("/api/admin/tokens/bulk-delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tokenIds: selectedTokenIds }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`Berhasil menghapus ${data.deletedCount} token`);
                setSelectedTokenIds([]);
                setIsDeleteDialogOpen(false);
                fetchData();
            } else {
                toast.error(data.error || "Gagal menghapus token");
            }
        } catch (err) {
            console.error("Bulk delete tokens error:", err);
            toast.error("Terjadi kesalahan saat menghapus token");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            toast.info("Mengunduh data token...");
            
            // Fetch all tokens for export
            const response = await fetch("/api/admin/tokens/export");
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || "Gagal mengambil data");
            }

            const exportData = result.data;

            // Create PDF
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(16);
            doc.text("Daftar Token Pemilihan OSIS", 14, 15);
            
            // Add metadata
            doc.setFontSize(10);
            doc.text(`Total Token: ${exportData.length}`, 14, 25);
            doc.text(`Tanggal Export: ${new Date().toLocaleDateString("id-ID", { 
                year: "numeric", 
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })}`, 14, 31);

            // Create table
            autoTable(doc, {
                startY: 38,
                head: [["No", "Nama Lengkap", "Kelas", "Token"]],
                body: exportData.map((item: ExportData, index: number) => [
                    index + 1,
                    item.name,
                    item.class,
                    item.token,
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [22, 163, 74] }, // Green color
            });

            // Save PDF
            doc.save(`Token_OSIS_${new Date().toISOString().split("T")[0]}.pdf`);
            toast.success("PDF berhasil diunduh!");
        } catch (err) {
            console.error("Export PDF error:", err);
            toast.error("Gagal mengexport PDF");
        }
    };

    const handleExportExcel = async () => {
        try {
            toast.info("Mengunduh data token...");
            
            // Fetch all tokens for export
            const response = await fetch("/api/admin/tokens/export");
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || "Gagal mengambil data");
            }

            const exportData = result.data;

            // Prepare data for Excel
            const excelData = exportData.map((item: ExportData, index: number) => ({
                "No": index + 1,
                "Nama Lengkap": item.name,
                "Kelas": item.class,
                "Token": item.token,
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);
            
            // Set column widths
            ws["!cols"] = [
                { wch: 5 },  // No
                { wch: 30 }, // Nama Lengkap
                { wch: 15 }, // Kelas
                { wch: 15 }, // Token
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Token OSIS");

            // Save Excel file
            XLSX.writeFile(wb, `Token_OSIS_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Excel berhasil diunduh!");
        } catch (err) {
            console.error("Export Excel error:", err);
            toast.error("Gagal mengexport Excel");
        }
    };

    if (isLoading && tokens.length === 0) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Manajemen Token</h1>
                    <p className="text-muted-foreground">Generate dan kelola token voting</p>
                </div>
                <div className="flex gap-2">
                    {selectedTokenIds.length > 0 && (
                        <Button 
                            onClick={handleBulkDelete}
                            variant="destructive"
                            disabled={isDeleting}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus Token ({selectedTokenIds.length})
                        </Button>
                    )}

                    <Button 
                        onClick={() => setIsConfirmDialogOpen(true)} 
                        disabled={studentsWithoutToken === 0}
                        className={studentsWithoutToken === 0 
                            ? "bg-gray-100 text-gray-400 hover:bg-gray-100 hover:text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate Token Semua Siswa
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Total Token</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pagination.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Token Terpakai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {tokens.filter((t) => t.isUsed).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Belum Punya Token</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {studentsWithoutToken}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <CardTitle>Daftar Token</CardTitle>
                            <CardDescription>
                                {pagination.total > 0 ? (
                                    <>
                                        Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                        {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
                                        {pagination.total} token
                                    </>
                                ) : (
                                    "Menampilkan 0 token"
                                )}
                            </CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export Data
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExportPDF}>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export ke PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportExcel}>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export ke Excel
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search and Filter */}
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari NIS, nama siswa, atau token..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="used">Terpakai</SelectItem>
                                <SelectItem value="unused">Belum Terpakai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={tokens.length > 0 && selectedTokenIds.length === tokens.length}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>NIS</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Token</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : tokens.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {searchQuery || statusFilter !== "all" 
                                            ? "Tidak ada token yang sesuai dengan pencarian atau filter"
                                            : "Belum ada token yang dibuat"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tokens.map((token) => (
                                    <TableRow key={token.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedTokenIds.includes(token.id)}
                                                onCheckedChange={() => handleSelectToken(token.id)}
                                                aria-label={`Select token ${token.token}`}
                                            />
                                        </TableCell>
                                        <TableCell>{token.studentNis}</TableCell>
                                        <TableCell>{token.studentName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm">
                                                    {token.token}
                                                </code>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleCopyToken(token.id, token.token)}
                                                    title="Salin token"
                                                >
                                                    {copiedTokenId === token.id ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {token.isUsed ? (
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <CheckCircle2 className="h-4 w-4" /> Terpakai
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 flex items-center gap-1">
                                                    <XCircle className="h-4 w-4" /> Belum
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant={token.isUsed ? "outline" : "default"}
                                                onClick={() => handleRegenerateToken(token)}
                                                disabled={isGenerating || token.isUsed}
                                                className={token.isUsed 
                                                    ? "bg-gray-100 text-gray-400 hover:bg-gray-100 hover:text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600" 
                                                    : "bg-green-600 hover:bg-green-700 text-white"
                                                }
                                                title={token.isUsed ? "Token sudah terpakai, tidak dapat di-generate ulang" : "Generate ulang token"}
                                            >
                                                <Key className="h-4 w-4 mr-1" />
                                                Generate Ulang
                                            </Button>
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

            {/* Confirm Generate All Tokens Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Token untuk Semua Siswa</DialogTitle>
                        <DialogDescription>
                            Konfirmasi untuk generate token untuk semua siswa yang belum memiliki token
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-medium mb-2">Informasi:</p>
                                <ul className="text-sm space-y-1">
                                    <li>• Total siswa yang belum punya token: <strong>{studentsWithoutToken}</strong></li>
                                    <li>• Token akan digenerate secara otomatis untuk semua siswa tersebut</li>
                                    <li>• Proses ini tidak dapat dibatalkan setelah dijalankan</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsConfirmDialogOpen(false)}
                            disabled={isGenerating}
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleGenerateAllTokens} 
                            disabled={isGenerating}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Generate Token
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Regenerate Token Dialog */}
            <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Ulang Token</DialogTitle>
                        <DialogDescription>
                            Konfirmasi untuk generate ulang token siswa
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedToken && (
                        <div className="py-4">
                            <Alert>
                                <Key className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <p className="font-medium">Informasi Siswa:</p>
                                        <div className="text-sm space-y-1">
                                            <p><strong>NIS:</strong> {selectedToken.studentNis}</p>
                                            <p><strong>Nama:</strong> {selectedToken.studentName}</p>
                                            <p><strong>Token Lama:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{selectedToken.token}</code></p>
                                            <p><strong>Status:</strong> <span className={selectedToken.isUsed ? "text-green-600 font-semibold" : "text-gray-600"}>{selectedToken.isUsed ? "Sudah Terpakai" : "Belum Terpakai"}</span></p>
                                        </div>
                                    </div>
                                </AlertDescription>
                            </Alert>
                            {selectedToken.isUsed ? (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertDescription>
                                        ⚠️ <strong>Perhatian:</strong> Token ini sudah terpakai. Siswa sudah melakukan voting. Generate ulang token tidak direkomendasikan.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-4">
                                    ℹ️ Token lama akan dihapus dan token baru akan di-generate. Token baru akan ditampilkan setelah proses selesai.
                                </p>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsRegenerateDialogOpen(false);
                                setSelectedToken(null);
                            }}
                            disabled={isGenerating}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmRegenerate}
                            disabled={isGenerating || selectedToken?.isUsed}
                            className={selectedToken?.isUsed 
                                ? "bg-gray-100 text-gray-400 hover:bg-gray-100 hover:text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600" 
                                : "bg-green-600 hover:bg-green-700 text-white"
                            }
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Key className="mr-2 h-4 w-4" />
                                    Generate Token
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-600" />
                            Hapus Token Terpilih
                        </DialogTitle>
                        <DialogDescription>
                            Konfirmasi untuk menghapus token yang telah dipilih
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                        <Alert variant="destructive">
                            <Trash2 className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-medium">⚠️ Perhatian!</p>
                                    <ul className="text-sm space-y-1">
                                        <li>• Total token yang akan dihapus: <strong>{selectedTokenIds.length}</strong></li>
                                        <li>• Siswa yang tokennya dihapus tidak akan bisa login untuk voting</li>
                                        <li>• Anda perlu generate token baru untuk siswa tersebut jika ingin mereka bisa voting</li>
                                        <li>• Aksi ini tidak dapat dibatalkan setelah dijalankan</li>
                                    </ul>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmBulkDelete}
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
                                    Ya, Hapus Token
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
