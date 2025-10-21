import { db, students, tokens, votes, candidates, votingSettings } from "@/db";
import { eq, count, sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Vote, CheckCircle2, XCircle } from "lucide-react";

export default async function AdminDashboardPage() {
    // Get statistics
    const [totalStudents] = await db.select({ count: count() }).from(students);
    const [totalCandidates] = await db.select({ count: count() }).from(candidates).where(eq(candidates.isActive, true));
    const [totalVotes] = await db.select({ count: count() }).from(votes);
    const [tokensGenerated] = await db.select({ count: count() }).from(tokens);
    const [tokensUsed] = await db.select({ count: count() }).from(tokens).where(eq(tokens.isUsed, true));
    
    const settings = await db.query.votingSettings.findFirst();
    const isVotingOpen = settings?.isVotingOpen || false;

    // Get vote results
    const voteResults = await db
        .select({
            candidateId: votes.candidateId,
            candidateName: candidates.name,
            voteCount: count(),
        })
        .from(votes)
        .leftJoin(candidates, eq(votes.candidateId, candidates.id))
        .groupBy(votes.candidateId, candidates.name);

    const stats = [
        {
            title: "Total Siswa",
            value: totalStudents.count,
            icon: Users,
            description: "Siswa terdaftar",
            color: "text-green-600 dark:text-green-400",
        },
        {
            title: "Kandidat Aktif",
            value: totalCandidates.count,
            icon: Vote,
            description: "Kandidat tersedia",
            color: "text-purple-600 dark:text-purple-400",
        },
        {
            title: "Total Suara",
            value: totalVotes.count,
            icon: CheckCircle2,
            description: `Dari ${totalStudents.count} siswa`,
            color: "text-green-600 dark:text-green-400",
        },
        {
            title: "Token Terpakai",
            value: `${tokensUsed.count}/${tokensGenerated.count}`,
            icon: XCircle,
            description: "Token digunakan",
            color: "text-orange-600 dark:text-orange-400",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard Admin</h1>
                <p className="text-muted-foreground">
                    Selamat datang di panel administrasi E-Voting
                </p>
            </div>

            {/* Status Pemilihan */}
            <Card className={isVotingOpen ? "border-green-500" : "border-gray-300"}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Status Pemilihan
                        <span
                            className={`text-sm font-normal px-3 py-1 rounded-full ${
                                isVotingOpen
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                        >
                            {isVotingOpen ? "Dibuka" : "Ditutup"}
                        </span>
                    </CardTitle>
                    <CardDescription>
                        {isVotingOpen
                            ? "Pemilihan sedang berlangsung"
                            : "Pemilihan belum dibuka atau sudah ditutup"}
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
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
            {voteResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Hasil Sementara</CardTitle>
                        <CardDescription>
                            Hasil perhitungan suara (real-time)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {voteResults.map((result) => {
                                const percentage = totalVotes.count > 0
                                    ? ((result.voteCount / totalVotes.count) * 100).toFixed(1)
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
        </div>
    );
}
