"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, LogOut, AlertTriangle, User, School, CreditCard } from "lucide-react";
import Image from "next/image";

interface Candidate {
    id: string;
    name: string;
    photoUrl: string | null;
    vision: string | null;
    mission: string | null;
    orderPosition: number;
}

interface StudentData {
    name: string;
    class: string;
    nis: string;
}

export default function VotePage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const response = await fetch("/api/vote");
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    router.push("/student/login");
                    return;
                }
                setError(data.error || "Gagal mengambil data kandidat");
                return;
            }

            setCandidates(data.candidates);
            setHasVoted(data.hasVoted);
            setStudentData(data.student);
        } catch (err) {
            setError("Terjadi kesalahan saat mengambil data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenConfirmDialog = () => {
        if (!selectedCandidate) {
            setError("Pilih kandidat terlebih dahulu");
            return;
        }
        setError("");
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmVote = async () => {
        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch("/api/vote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ candidateId: selectedCandidate }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Gagal menyimpan suara");
                setIsConfirmDialogOpen(false);
                return;
            }

            setSuccess(true);
            setHasVoted(true);
            setIsConfirmDialogOpen(false);
        } catch (err) {
            setError("Terjadi kesalahan saat menyimpan suara");
            setIsConfirmDialogOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/student/logout", { method: "POST" });
        router.push("/student/login");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-green-600 dark:text-green-400" />
            </div>
        );
    }

    if (success || hasVoted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-3 sm:px-4">
                <Card className="w-full max-w-md text-center mx-3">
                    <CardHeader className="px-4 sm:px-6">
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-xl sm:text-2xl">Terima Kasih!</CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                            Suara Anda telah berhasil tersimpan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                            Suara Anda sangat berarti untuk menentukan pemimpin OSIS periode mendatang.
                        </p>
                        <Button onClick={handleLogout} variant="outline" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            Keluar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-8 px-3 sm:px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Pemilihan Ketua OSIS</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Pilih kandidat pilihan Anda</p>
                    </div>
                    <Button onClick={handleLogout} variant="outline" size="sm" className="w-full sm:w-auto">
                        <LogOut className="mr-2 h-4 w-4" />
                        Keluar
                    </Button>
                </div>

                {studentData && (
                    <Card className="mb-4 sm:mb-6 overflow-hidden border-2 border-green-200 dark:border-green-800 shadow-lg">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 p-4 sm:p-5">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="bg-white/30 backdrop-blur-sm rounded-full p-2.5 sm:p-3 flex-shrink-0">
                                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-md" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white/90 text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 drop-shadow">Informasi Pemilih</p>
                                    <p className="text-white text-base sm:text-xl font-bold tracking-wide drop-shadow-lg truncate">{studentData.name}</p>
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6 px-3 sm:px-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border border-blue-200 dark:border-blue-800 shadow-sm">
                                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2.5 sm:p-3 flex-shrink-0">
                                        <School className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5 sm:mb-1">Kelas</p>
                                        <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 truncate">{studentData.class}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border border-purple-200 dark:border-purple-800 shadow-sm">
                                    <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-2.5 sm:p-3 flex-shrink-0">
                                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-0.5 sm:mb-1">NIS</p>
                                        <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100 font-mono truncate">{studentData.nis}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Alert variant="destructive" className="mb-4 sm:mb-6">
                        <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    {candidates.map((candidate) => (
                        <Card
                            key={candidate.id}
                            className={`cursor-pointer transition-all relative ${
                                selectedCandidate === candidate.id
                                    ? "ring-2 ring-green-600 shadow-lg bg-green-50 dark:bg-green-950"
                                    : "hover:shadow-md"
                            }`}
                            onClick={() => setSelectedCandidate(candidate.id)}
                        >
                            {selectedCandidate === candidate.id && (
                                <div className="absolute top-3 right-3 z-10">
                                    <div className="bg-green-600 text-white rounded-full p-2 shadow-lg">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                </div>
                            )}
                            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                                <div className="flex flex-col items-center text-center">
                                    {selectedCandidate === candidate.id && (
                                        <div className="mb-3">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-green-600 text-white text-xs sm:text-sm font-medium shadow-md">
                                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                Pilihan Anda
                                            </span>
                                        </div>
                                    )}
                                    {candidate.photoUrl ? (
                                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4">
                                            <Image
                                                src={candidate.photoUrl}
                                                alt={candidate.name}
                                                fill
                                                className="rounded-full object-cover"
                                                sizes="(max-width: 640px) 128px, 160px"
                                            />
                                            {selectedCandidate === candidate.id && (
                                                <div className="absolute inset-0 rounded-full ring-3 sm:ring-4 ring-green-600 ring-offset-2 sm:ring-offset-4"></div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold mb-4 ${
                                            selectedCandidate === candidate.id ? 'ring-3 sm:ring-4 ring-green-600 ring-offset-2 sm:ring-offset-4' : ''
                                        }`}>
                                            {candidate.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <CardTitle className="text-base sm:text-lg">{candidate.name}</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">Kandidat #{candidate.orderPosition + 1}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                {candidate.vision && (
                                    <div className="mb-3">
                                        <h4 className="font-semibold text-xs sm:text-sm mb-1">Visi:</h4>
                                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{candidate.vision}</p>
                                    </div>
                                )}
                                {candidate.mission && (
                                    <div>
                                        <h4 className="font-semibold text-xs sm:text-sm mb-1">Misi:</h4>
                                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{candidate.mission}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm sm:text-base truncate">
                                    {selectedCandidate
                                        ? `Anda memilih: ${
                                              candidates.find((c) => c.id === selectedCandidate)?.name
                                          }`
                                        : "Belum ada kandidat yang dipilih"}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Pastikan pilihan Anda sudah benar
                                </p>
                            </div>
                            <Button
                                onClick={handleOpenConfirmDialog}
                                disabled={!selectedCandidate}
                                size="lg"
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                            >
                                Kirim Suara
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Confirm Vote Dialog */}
                <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                    <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
                                <span>Konfirmasi Pilihan Anda</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                                Pastikan pilihan Anda sudah benar. Suara yang sudah dikirim tidak dapat diubah.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedCandidate && (
                            <div className="py-3 sm:py-4">
                                <div className="bg-muted p-3 sm:p-4 rounded-lg">
                                    <p className="text-xs sm:text-sm font-medium mb-3 text-center">Anda akan memilih:</p>
                                    <div className="flex flex-col items-center">
                                        {(() => {
                                            const candidate = candidates.find((c) => c.id === selectedCandidate);
                                            return candidate ? (
                                                <>
                                                    {candidate.photoUrl ? (
                                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-3">
                                                            <Image
                                                                src={candidate.photoUrl}
                                                                alt={candidate.name}
                                                                fill
                                                                className="rounded-full object-cover"
                                                                sizes="(max-width: 640px) 80px, 96px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mb-3">
                                                            {candidate.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <p className="font-bold text-base sm:text-lg">{candidate.name}</p>
                                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                                        Kandidat #{candidate.orderPosition + 1}
                                                    </p>
                                                </>
                                            ) : null;
                                        })()}
                                    </div>
                                </div>
                                <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                                    <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                                        ⚠️ Perhatian: Setelah Anda mengkonfirmasi, suara tidak dapat diubah atau dibatalkan.
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsConfirmDialogOpen(false)}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmVote}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Ya, Kirim Suara
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
