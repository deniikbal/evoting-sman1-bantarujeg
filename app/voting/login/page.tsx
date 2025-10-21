"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from "@/lib/auth-client";
import { Loader2, Vote, School } from "lucide-react";

export default function StudentVotingLoginPage() {
    const [nis, setNis] = useState("");
    const [token, setToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn.credentials({
                nis,
                token,
                providerName: "student-login",
            });

            if (result.error) {
                setError(result.error.message || "Login gagal. Periksa NIS dan token Anda.");
            } else {
                router.push("/voting/cast");
            }
        } catch (err) {
            setError("Terjadi kesalahan yang tidak terduga. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-600 rounded-full">
                            <School className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        E-Voting SMAN 1 Bantarujeg
                    </h1>
                    <p className="text-gray-600">
                        Sistem Pemilihan Ketua OSIS
                    </p>
                </div>

                {/* Login Card */}
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
                            <Vote className="h-5 w-5" />
                            Login Siswa
                        </CardTitle>
                        <CardDescription>
                            Masukkan NIS dan token voting Anda untuk mengakses sistem
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="nis">Nomor Induk Siswa (NIS)</Label>
                                <Input
                                    id="nis"
                                    type="text"
                                    placeholder="Masukkan NIS Anda"
                                    value={nis}
                                    onChange={(e) => setNis(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    maxLength={20}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="token">Token Voting</Label>
                                <Input
                                    id="token"
                                    type="text"
                                    placeholder="Masukkan token voting Anda"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    maxLength={50}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Token dapat diperoleh dari admin sekolah
                                </p>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Masuk...
                                    </>
                                ) : (
                                    "Masuk ke Sistem Voting"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="text-center">
                        <p className="text-xs text-muted-foreground">
                            Jika mengalami kesulitan, hubungi admin sekolah untuk bantuan
                        </p>
                    </CardFooter>
                </Card>

                {/* Info Section */}
                <div className="text-center text-sm text-gray-600">
                    <p>
                        Pastikan Anda telah menerima token voting yang valid dari admin.
                        Token bersifat rahasia dan hanya dapat digunakan sekali.
                    </p>
                </div>
            </div>
        </div>
    );
}