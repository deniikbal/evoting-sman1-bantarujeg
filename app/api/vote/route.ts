import { NextRequest, NextResponse } from "next/server";
import { db, students, tokens, votes, candidates, votingSettings } from "@/db";
import { eq, and } from "drizzle-orm";
import { getStudentSession } from "@/lib/auth-student";
import { z } from "zod";
import { randomBytes } from "crypto";

const voteSchema = z.object({
    candidateId: z.string().min(1, "Candidate ID harus diisi"),
});

export async function POST(request: NextRequest) {
    try {
        // Get student session
        const student = await getStudentSession();
        if (!student) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if voting is open
        const settings = await db.query.votingSettings.findFirst();
        if (!settings || !settings.isVotingOpen) {
            return NextResponse.json(
                { error: "Pemilihan belum dibuka atau sudah ditutup" },
                { status: 403 }
            );
        }

        // Check if student has already voted
        if (student.hasVoted) {
            return NextResponse.json(
                { error: "Anda sudah memberikan suara" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validation = voteSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            );
        }

        const { candidateId } = validation.data;

        // Verify candidate exists and is active
        const candidate = await db.query.candidates.findFirst({
            where: eq(candidates.id, candidateId),
        });

        if (!candidate || !candidate.isActive) {
            return NextResponse.json(
                { error: "Kandidat tidak valid" },
                { status: 400 }
            );
        }

        // Use transaction to ensure atomicity
        await db.transaction(async (tx) => {
            // Create vote record
            const voteId = randomBytes(16).toString("hex");
            await tx.insert(votes).values({
                id: voteId,
                studentId: student.id,
                candidateId: candidateId,
                votedAt: new Date(),
            });

            // Mark student as voted
            await tx
                .update(students)
                .set({ 
                    hasVoted: true,
                    updatedAt: new Date() 
                })
                .where(eq(students.id, student.id));

            // Mark token as used
            await tx
                .update(tokens)
                .set({ 
                    isUsed: true,
                    usedAt: new Date() 
                })
                .where(eq(tokens.studentId, student.id));
        });

        return NextResponse.json({
            success: true,
            message: "Suara berhasil disimpan",
        });
    } catch (error) {
        console.error("Vote submission error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}

// Get candidates for voting
export async function GET() {
    try {
        const student = await getStudentSession();
        if (!student) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if voting is open
        const settings = await db.query.votingSettings.findFirst();
        if (!settings || !settings.isVotingOpen) {
            return NextResponse.json(
                { error: "Pemilihan belum dibuka atau sudah ditutup" },
                { status: 403 }
            );
        }

        // Get active candidates
        const activeCandidates = await db.query.candidates.findMany({
            where: eq(candidates.isActive, true),
            orderBy: (candidates, { asc }) => [asc(candidates.orderPosition)],
        });

        return NextResponse.json({
            candidates: activeCandidates,
            hasVoted: student.hasVoted,
            student: {
                name: student.name,
                class: student.class,
                nis: student.nis,
            },
        });
    } catch (error) {
        console.error("Get candidates error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
