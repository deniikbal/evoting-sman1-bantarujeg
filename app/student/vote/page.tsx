"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, LogOut } from "lucide-react";
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

    const handleVote = async () => {
        if (!selectedCandidate) {
            setError("Pilih kandidat terlebih dahulu");
            return;
        }

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
                return;
            }

            setSuccess(true);
            setHasVoted(true);
        } catch (err) {
            setError("Terjadi kesalahan saat menyimpan suara");
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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        );
    }

    if (success || hasVoted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl">Terima Kasih!</CardTitle>
                        <CardDescription>
                            Suara Anda telah berhasil tersimpan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Pemilihan Ketua OSIS</h1>
                        <p className="text-muted-foreground">Pilih kandidat pilihan Anda</p>
                    </div>
                    <Button onClick={handleLogout} variant="outline" size="sm">
                        <LogOut className="mr-2 h-4 w-4" />
                        Keluar
                    </Button>
                </div>

                {studentData && (
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-sm text-muted-foreground">Nama</p>
                                    <p className="font-semibold">{studentData.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Kelas</p>
                                    <p className="font-semibold">{studentData.class}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">NIS</p>
                                    <p className="font-semibold">{studentData.nis}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {candidates.map((candidate) => (
                        <Card
                            key={candidate.id}
                            className={`cursor-pointer transition-all ${
                                selectedCandidate === candidate.id
                                    ? "ring-2 ring-green-600 shadow-lg"
                                    : "hover:shadow-md"
                            }`}
                            onClick={() => setSelectedCandidate(candidate.id)}
                        >
                            <CardHeader className="pb-4">
                                <div className="flex flex-col items-center text-center">
                                    {candidate.photoUrl ? (
                                        <Image
                                            src={candidate.photoUrl}
                                            alt={candidate.name}
                                            width={120}
                                            height={120}
                                            className="rounded-full object-cover mb-4"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white text-4xl font-bold mb-4">
                                            {candidate.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <CardTitle className="text-lg">{candidate.name}</CardTitle>
                                        <CardDescription>Kandidat #{candidate.orderPosition + 1}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {candidate.vision && (
                                    <div className="mb-3">
                                        <h4 className="font-semibold text-sm mb-1">Visi:</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-3">{candidate.vision}</p>
                                    </div>
                                )}
                                {candidate.mission && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">Misi:</h4>
                                        <p className="text-sm text-muted-foreground line-clamp-3">{candidate.mission}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">
                                    {selectedCandidate
                                        ? `Anda memilih: ${
                                              candidates.find((c) => c.id === selectedCandidate)?.name
                                          }`
                                        : "Belum ada kandidat yang dipilih"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Pastikan pilihan Anda sudah benar
                                </p>
                            </div>
                            <Button
                                onClick={handleVote}
                                disabled={!selectedCandidate || isSubmitting}
                                size="lg"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    "Kirim Suara"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
