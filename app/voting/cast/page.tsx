"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Vote, CheckCircle, User, Shield, AlertCircle } from "lucide-react";
import { signOut } from "@/lib/auth-client";

interface Candidate {
  id: number;
  name: string;
  photoUrl: string | null;
  bio: string;
  vision: string | null;
  mission: string | null;
}

interface User {
  name: string;
  nis: string;
}

export default function VotingCastPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [votingEnabled, setVotingEnabled] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchVotingData();
    }, []);

    const fetchVotingData = async () => {
        try {
            // Check if user is authenticated
            const sessionResponse = await fetch('/api/auth/session');
            if (!sessionResponse.ok) {
                router.push('/voting/login');
                return;
            }

            const sessionData = await sessionResponse.json();
            if (!sessionData.user || sessionData.user.role !== 'student') {
                router.push('/voting/login');
                return;
            }

            setUser({
                name: sessionData.user.name,
                nis: sessionData.user.nis
            });

            // Fetch voting status
            const settingsResponse = await fetch('/api/settings/voting-status');
            const settingsData = await settingsResponse.json();

            if (!settingsData.enabled) {
                setVotingEnabled(false);
                setIsLoading(false);
                return;
            }

            setVotingEnabled(true);

            // Check if student has already voted
            const voteCheckResponse = await fetch('/api/voting/check-status');
            if (voteCheckResponse.ok) {
                const voteStatus = await voteCheckResponse.json();
                if (voteStatus.hasVoted) {
                    setHasVoted(true);
                    setIsLoading(false);
                    return;
                }
            }

            // Fetch candidates
            const candidatesResponse = await fetch('/api/candidates');
            if (candidatesResponse.ok) {
                const candidatesData = await candidatesResponse.json();
                setCandidates(candidatesData);
            }
        } catch (error) {
            console.error('Error fetching voting data:', error);
            toast.error('Gagal memuat data voting');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVote = async () => {
        if (!selectedCandidate) {
            toast.error('Silakan pilih kandidat terlebih dahulu');
            return;
        }

        setIsVoting(true);
        try {
            const response = await fetch('/api/voting/cast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    candidateId: parseInt(selectedCandidate),
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('Voting berhasil! Terima kasih atas partisipasi Anda.');
                setHasVoted(true);
            } else {
                toast.error(result.error || 'Voting gagal. Silakan coba lagi.');
            }
        } catch (error) {
            console.error('Error casting vote:', error);
            toast.error('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsVoting(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/voting/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Memuat data voting...</p>
                </div>
            </div>
        );
    }

    if (!votingEnabled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <CardTitle>Voting Belum Dimulai</CardTitle>
                        <CardDescription>
                            Periode voting belum dibuka oleh admin. Silakan coba lagi nanti.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="text-center">
                        <Button onClick={handleLogout} variant="outline">
                            Keluar
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (hasVoted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <CardTitle className="text-2xl text-green-800">Voting Berhasil!</CardTitle>
                        <CardDescription>
                            Terima kasih atas partisipasi Anda dalam pemilihan Ketua OSIS.
                            Suara Anda telah tersimpan dengan aman.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                            Setiap siswa hanya dapat voting sekali. Hasil akan diumumkan setelah periode voting selesai.
                        </p>
                        <Button onClick={handleLogout} variant="outline">
                            Keluar dari Sistem
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">E-Voting SMAN 1 Bantarujeg</h1>
                                <p className="text-sm text-gray-600">Pemilihan Ketua OSIS 2024/2025</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-600">NIS: {user?.nis}</p>
                            </div>
                            <Button onClick={handleLogout} variant="outline" size="sm">
                                Keluar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <Vote className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Pilih Kandidat Anda</h2>
                    <p className="text-gray-600">
                        Tinjau visi dan misi setiap kandidat sebelum melakukan voting
                    </p>
                </div>

                {candidates.length === 0 ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Belum ada kandidat yang tersedia. Silakan hubungi admin.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-6">
                        {/* Candidate Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pilih Salah Satu Kandidat</CardTitle>
                                <CardDescription>
                                    Klik pada kandidat untuk melihat detail dan memilih
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={selectedCandidate} onValueChange={setSelectedCandidate}>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {candidates.map((candidate) => (
                                            <div key={candidate.id} className="relative">
                                                <RadioGroupItem
                                                    value={candidate.id.toString()}
                                                    id={`candidate-${candidate.id}`}
                                                    className="sr-only"
                                                />
                                                <Label
                                                    htmlFor={`candidate-${candidate.id}`}
                                                    className={`cursor-pointer rounded-lg border-2 p-4 block transition-all ${
                                                        selectedCandidate === candidate.id.toString()
                                                            ? 'border-blue-600 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="text-center space-y-3">
                                                        <Avatar className="w-20 h-20 mx-auto">
                                                            <AvatarImage src={candidate.photoUrl || ''} alt={candidate.name} />
                                                            <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                                                                <User className="h-8 w-8" />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <h3 className="font-semibold text-lg">{candidate.name}</h3>
                                                            <Badge variant="secondary" className="mt-1">
                                                                Kandidat #{candidate.id}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-600 line-clamp-3">
                                                            {candidate.bio}
                                                        </p>
                                                    </div>
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {/* Selected Candidate Details */}
                        {selectedCandidate && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detail Kandidat</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        const candidate = candidates.find(c => c.id.toString() === selectedCandidate);
                                        if (!candidate) return null;
                                        return (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="w-16 h-16">
                                                        <AvatarImage src={candidate.photoUrl || ''} alt={candidate.name} />
                                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                                            <User className="h-6 w-6" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="text-xl font-semibold">{candidate.name}</h3>
                                                        <Badge variant="outline">Kandidat #{candidate.id}</Badge>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-semibold mb-2">Biodata</h4>
                                                    <p className="text-gray-700">{candidate.bio}</p>
                                                </div>

                                                {candidate.vision && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Visi</h4>
                                                        <p className="text-gray-700 whitespace-pre-line">{candidate.vision}</p>
                                                    </div>
                                                )}

                                                {candidate.mission && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Misi</h4>
                                                        <p className="text-gray-700 whitespace-pre-line">{candidate.mission}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        )}

                        {/* Voting Action */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>Penting:</strong> Voting hanya dapat dilakukan sekali dan tidak dapat dibatalkan.
                                            Pastikan Anda telah memilih kandidat dengan benar.
                                        </AlertDescription>
                                    </Alert>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="lg"
                                                className="w-full md:w-auto"
                                                disabled={!selectedCandidate || isVoting}
                                            >
                                                {isVoting ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Memproses...
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Vote className="h-4 w-4" />
                                                        Submit Voting
                                                    </div>
                                                )}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Konfirmasi Voting</DialogTitle>
                                                <DialogDescription>
                                                    Apakah Anda yakin ingin memilih kandidat ini?
                                                    Tindakan ini tidak dapat dibatalkan.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4">
                                                {(() => {
                                                    const candidate = candidates.find(c => c.id.toString() === selectedCandidate);
                                                    return candidate ? (
                                                        <div className="text-center">
                                                            <Avatar className="w-16 h-16 mx-auto mb-3">
                                                                <AvatarImage src={candidate.photoUrl || ''} alt={candidate.name} />
                                                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                    <User className="h-6 w-6" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <h3 className="font-semibold text-lg">{candidate.name}</h3>
                                                            <p className="text-sm text-gray-600">Kandidat #{candidate.id}</p>
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={handleVote} disabled={isVoting}>
                                                    Ya, Saya Yakin
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}