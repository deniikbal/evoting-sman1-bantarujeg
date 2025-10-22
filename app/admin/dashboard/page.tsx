"use client";

import { useState, useEffect } from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users, Vote, CheckCircle2, XCircle, Loader2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DashboardStats {
    totalStudents: number;
    totalCandidates: number;
    totalVotes: number;
    tokensGenerated: number;
    tokensUsed: number;
    isVotingOpen: boolean;
    voteResults: Array<{
        candidateId: string;
        candidateName: string;
        voteCount: number;
    }>;
    votesByClass: Array<{
        className: string;
        results: Array<{
            candidateId: string;
            candidateName: string;
            voteCount: number;
        }>;
        totalVotes: number;
    }>;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminDashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        totalCandidates: 0,
        totalVotes: 0,
        tokensGenerated: 0,
        tokensUsed: 0,
        isVotingOpen: false,
        voteResults: [],
        votesByClass: [],
    });

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/admin/dashboard");
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal mengambil data dashboard");
                return;
            }

            setStats(data);
            
            // Set default selected class to first class if available
            if (data.votesByClass.length > 0 && !selectedClass) {
                setSelectedClass(data.votesByClass[0].className);
            }
        } catch (err) {
            toast.error("Terjadi kesalahan saat mengambil data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleVoting = async () => {
        setIsToggling(true);
        try {
            const response = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isVotingOpen: !stats.isVotingOpen }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Gagal mengubah status pemilihan");
                return;
            }

            toast.success(
                stats.isVotingOpen
                    ? "Pemilihan berhasil ditutup"
                    : "Pemilihan berhasil dibuka"
            );
            setIsConfirmDialogOpen(false);
            fetchDashboardStats();
        } catch (err) {
            toast.error("Terjadi kesalahan saat mengubah status");
        } finally {
            setIsToggling(false);
        }
    };

    const statsCards = [
        {
            title: "Total Siswa",
            value: stats.totalStudents,
            icon: Users,
            description: "Siswa terdaftar",
            color: "text-green-600 dark:text-green-400",
        },
        {
            title: "Kandidat Aktif",
            value: stats.totalCandidates,
            icon: Vote,
            description: "Kandidat tersedia",
            color: "text-purple-600 dark:text-purple-400",
        },
        {
            title: "Total Suara",
            value: stats.totalVotes,
            icon: CheckCircle2,
            description: `Dari ${stats.totalStudents} siswa`,
            color: "text-green-600 dark:text-green-400",
        },
        {
            title: "Token Terpakai",
            value: `${stats.tokensUsed}/${stats.tokensGenerated}`,
            icon: XCircle,
            description: "Token digunakan",
            color: "text-orange-600 dark:text-orange-400",
        },
    ];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard Admin</h1>
                <p className="text-muted-foreground">
                    Selamat datang di panel administrasi E-Voting
                </p>
            </div>

            {/* Status Pemilihan */}
            <Card className={stats.isVotingOpen ? "border-green-500" : "border-gray-300"}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Status Pemilihan
                                <span
                                    className={`text-sm font-normal px-3 py-1 rounded-full ${
                                        stats.isVotingOpen
                                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    }`}
                                >
                                    {stats.isVotingOpen ? "Dibuka" : "Ditutup"}
                                </span>
                            </CardTitle>
                            <CardDescription className="mt-1.5">
                                {stats.isVotingOpen
                                    ? "Pemilihan sedang berlangsung"
                                    : "Pemilihan belum dibuka atau sudah ditutup"}
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setIsConfirmDialogOpen(true)}
                            variant={stats.isVotingOpen ? "destructive" : "default"}
                            size="lg"
                        >
                            {stats.isVotingOpen ? (
                                <>
                                    <PowerOff className="mr-2 h-5 w-5" />
                                    Tutup Pemilihan
                                </>
                            ) : (
                                <>
                                    <Power className="mr-2 h-5 w-5" />
                                    Buka Pemilihan
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">{stat.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Vote Results */}
            {!stats.isVotingOpen && stats.voteResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Hasil Pemilihan</CardTitle>
                        <CardDescription>
                            Hasil perhitungan suara setelah pemilihan ditutup
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.voteResults.map((result) => {
                                const percentage = stats.totalVotes > 0
                                    ? ((result.voteCount / stats.totalVotes) * 100).toFixed(1)
                                    : 0;

                                return (
                                    <div key={result.candidateId} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{result.candidateName}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {result.voteCount} suara ({percentage}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Message when voting is open */}
            {stats.isVotingOpen && (
                <Card className="border-amber-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <PowerOff className="h-5 w-5" />
                            Hasil Pemilihan Disembunyikan
                        </CardTitle>
                        <CardDescription>
                            Hasil pemilihan akan ditampilkan setelah pemilihan ditutup untuk menjaga netralitas proses voting.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {/* Vote Results by Class */}
            {!stats.isVotingOpen && stats.votesByClass.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>Hasil Pemilihan Per Kelas</CardTitle>
                                <CardDescription>
                                    Breakdown hasil voting berdasarkan kelas
                                </CardDescription>
                            </div>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Pilih Kelas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stats.votesByClass.map((classData) => (
                                        <SelectItem key={classData.className} value={classData.className}>
                                            {classData.className}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const classData = stats.votesByClass.find(c => c.className === selectedClass);
                            if (!classData) return null;

                            const chartData = classData.results.map((result) => ({
                                name: result.candidateName,
                                value: result.voteCount,
                            }));

                            return (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => 
                                                        `${(percent * 100).toFixed(0)}%`
                                                    }
                                                    outerRadius={120}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value: number) => [`${value} suara`, 'Total']}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-muted rounded-lg">
                                            <h3 className="font-semibold mb-1">Kelas: {classData.className}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Total Suara: {classData.totalVotes}
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {classData.results.map((result, index) => {
                                                const percentage = classData.totalVotes > 0
                                                    ? ((result.voteCount / classData.totalVotes) * 100).toFixed(1)
                                                    : 0;
                                                return (
                                                    <div key={result.candidateId} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div 
                                                                    className="w-4 h-4 rounded-full flex-shrink-0" 
                                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                                />
                                                                <span className="font-medium">{result.candidateName}</span>
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">
                                                                {result.voteCount} suara ({percentage}%)
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                            <div
                                                                className="h-2 rounded-full transition-all"
                                                                style={{ 
                                                                    width: `${percentage}%`,
                                                                    backgroundColor: COLORS[index % COLORS.length]
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>
            )}

            {/* Confirm Toggle Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {stats.isVotingOpen ? "Tutup Pemilihan?" : "Buka Pemilihan?"}
                        </DialogTitle>
                        <DialogDescription>
                            {stats.isVotingOpen
                                ? "Pemilihan akan ditutup dan siswa tidak dapat melakukan voting."
                                : "Pemilihan akan dibuka dan siswa dapat melakukan voting dengan token mereka."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="bg-muted p-4 rounded-md">
                            <p className="text-sm font-medium mb-2">
                                {stats.isVotingOpen ? "⚠️ Perhatian:" : "ℹ️ Informasi:"}
                            </p>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                                {stats.isVotingOpen ? (
                                    <>
                                        <li>• Siswa tidak akan bisa mengakses halaman voting</li>
                                        <li>• Token yang sudah terpakai tetap tercatat</li>
                                        <li>• Hasil voting tetap tersimpan</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Siswa dapat mulai melakukan voting</li>
                                        <li>• Pastikan token sudah di-generate</li>
                                        <li>• Pastikan kandidat sudah diatur</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsConfirmDialogOpen(false)}
                            disabled={isToggling}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleToggleVoting}
                            disabled={isToggling}
                            variant={stats.isVotingOpen ? "destructive" : "default"}
                        >
                            {isToggling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : stats.isVotingOpen ? (
                                <>
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Ya, Tutup
                                </>
                            ) : (
                                <>
                                    <Power className="mr-2 h-4 w-4" />
                                    Ya, Buka
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
