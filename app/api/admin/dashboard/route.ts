import { NextResponse } from "next/server";
import { db, students, tokens, votes, candidates } from "@/db";
import { eq, count } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth-admin";

export const dynamic = 'force-dynamic';

interface CandidateVote {
    candidateId: string | null;
    candidateName: string | null;
    voteCount: number;
}

export async function GET() {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get statistics
        const [totalStudents] = await db.select({ count: count() }).from(students);
        const [totalCandidates] = await db
            .select({ count: count() })
            .from(candidates)
            .where(eq(candidates.isActive, true));
        const [totalVotes] = await db.select({ count: count() }).from(votes);
        const [tokensGenerated] = await db.select({ count: count() }).from(tokens);
        const [tokensUsed] = await db
            .select({ count: count() })
            .from(tokens)
            .where(eq(tokens.isUsed, true));

        const settings = await db.query.votingSettings.findFirst();
        const isVotingOpen = settings?.isVotingOpen || false;

        // Get vote results only if voting is closed
        let voteResults: Array<{
            candidateId: string | null;
            candidateName: string | null;
            voteCount: number;
        }> = [];
        let votesByClass: Array<{
            className: string;
            results: CandidateVote[];
            totalVotes: number;
        }> = [];
        
        if (!isVotingOpen) {
            voteResults = await db
                .select({
                    candidateId: votes.candidateId,
                    candidateName: candidates.name,
                    voteCount: count(),
                })
                .from(votes)
                .leftJoin(candidates, eq(votes.candidateId, candidates.id))
                .groupBy(votes.candidateId, candidates.name);

            // Get vote results grouped by class
            const votesByClassRaw = await db
                .select({
                    className: students.class,
                    candidateId: votes.candidateId,
                    candidateName: candidates.name,
                    voteCount: count(),
                })
                .from(votes)
                .innerJoin(students, eq(votes.studentId, students.id))
                .leftJoin(candidates, eq(votes.candidateId, candidates.id))
                .groupBy(students.class, votes.candidateId, candidates.name);

            // Group by class for easier frontend consumption
            const classMap = new Map();
            for (const vote of votesByClassRaw) {
                if (!classMap.has(vote.className)) {
                    classMap.set(vote.className, []);
                }
                classMap.get(vote.className).push({
                    candidateId: vote.candidateId,
                    candidateName: vote.candidateName,
                    voteCount: vote.voteCount,
                });
            }

            votesByClass = Array.from(classMap.entries()).map(([className, results]) => ({
                className,
                results,
                totalVotes: results.reduce((sum: number, r: CandidateVote) => sum + r.voteCount, 0),
            }));
        }

        return NextResponse.json({
            totalStudents: totalStudents.count,
            totalCandidates: totalCandidates.count,
            totalVotes: totalVotes.count,
            tokensGenerated: tokensGenerated.count,
            tokensUsed: tokensUsed.count,
            isVotingOpen,
            voteResults,
            votesByClass,
        });
    } catch (error) {
        console.error("Get dashboard stats error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
