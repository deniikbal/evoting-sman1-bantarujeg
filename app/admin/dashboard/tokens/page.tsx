"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Loader2, CheckCircle2, XCircle, Copy, RefreshCw } from "lucide-react";

export default function TokensPage() {
    const [tokens, setTokens] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [generatedToken, setGeneratedToken] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tokensRes, studentsRes] = await Promise.all([
                fetch("/api/admin/tokens"),
                fetch("/api/admin/students"),
            ]);

            const tokensData = await tokensRes.json();
            const studentsData = await studentsRes.json();

            if (tokensRes.ok) setTokens(tokensData.tokens);
            if (studentsRes.ok) setStudents(studentsData.students);
        } catch (err) {
            setError("Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateToken = async () => {
        if (!selectedStudentId) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/admin/tokens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: selectedStudentId }),
            });

            const data = await response.json();
            if (response.ok) {
                setGeneratedToken(data.token);
                setSuccess(`Token: ${data.token}`);
                fetchData();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError("Gagal generate token");
        } finally {
            setIsSubmitting(false);
        }
    };

    const studentsWithoutToken = students.filter(
        (student) => !tokens.some((token) => token.studentId === student.id)
    );

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Manajemen Token</h1>
                    <p className="text-muted-foreground">Generate dan kelola token voting</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Token
                </Button>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Total Token</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tokens.length}</div>
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
                            {studentsWithoutToken.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Token</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>NIS</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>Token</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tokens.map((token) => (
                                <TableRow key={token.id}>
                                    <TableCell>{token.student?.nis}</TableCell>
                                    <TableCell>{token.student?.name}</TableCell>
                                    <TableCell><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{token.token}</code></TableCell>
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Token</DialogTitle>
                        <DialogDescription>Pilih siswa untuk generate token</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Siswa</Label>
                            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih siswa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {studentsWithoutToken.map((student) => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.nis} - {student.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {generatedToken && (
                            <Alert>
                                <AlertDescription>Token: <strong>{generatedToken}</strong></AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Tutup</Button>
                        <Button onClick={handleGenerateToken} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : "Generate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
