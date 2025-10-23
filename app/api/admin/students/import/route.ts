import { NextRequest, NextResponse } from "next/server";
import { db, students } from "@/db";
import { getAdminSession } from "@/lib/auth-admin";
import * as XLSX from "xlsx";
import { randomBytes } from "crypto";

export const dynamic = 'force-dynamic';

interface ImportStudent {
    nis: string;
    name: string;
    class: string;
}

interface ImportResult {
    success: number;
    failed: number;
    duplicate: number;
    errors: Array<{ row: number; error: string; data?: ImportStudent }>;
}

export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "File tidak ditemukan" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Format file tidak valid. Gunakan file Excel (.xlsx atau .xls)" },
                { status: 400 }
            );
        }

        // Read file buffer
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json<ImportStudent>(worksheet);

        if (data.length === 0) {
            return NextResponse.json(
                { error: "File Excel kosong" },
                { status: 400 }
            );
        }

        // Validate required columns
        const firstRow = data[0];
        if (!firstRow.nis || !firstRow.name || !firstRow.class) {
            return NextResponse.json(
                {
                    error: "Format Excel tidak valid. Pastikan memiliki kolom: nis, name, class",
                },
                { status: 400 }
            );
        }

        const result: ImportResult = {
            success: 0,
            failed: 0,
            duplicate: 0,
            errors: [],
        };

        // Get existing NIS to check for duplicates
        const existingStudents = await db.query.students.findMany();
        const existingNIS = new Set(existingStudents.map((s: typeof existingStudents[number]) => s.nis));

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // Excel row number (1-indexed + header)

            try {
                // Validate data
                if (!row.nis || !row.name || !row.class) {
                    result.failed++;
                    result.errors.push({
                        row: rowNumber,
                        error: "Data tidak lengkap",
                        data: row,
                    });
                    continue;
                }

                // Clean data
                const nis = String(row.nis).trim();
                const name = String(row.name).trim();
                const studentClass = String(row.class).trim();

                // Check duplicate NIS
                if (existingNIS.has(nis)) {
                    result.duplicate++;
                    result.errors.push({
                        row: rowNumber,
                        error: "NIS sudah terdaftar",
                        data: { nis, name, class: studentClass },
                    });
                    continue;
                }

                // Insert student
                const studentId = randomBytes(16).toString("hex");
                await db.insert(students).values({
                    id: studentId,
                    nis,
                    name,
                    class: studentClass,
                    hasVoted: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                // Add to existing NIS set to prevent duplicates within the same import
                existingNIS.add(nis);
                result.success++;
            } catch (error) {
                result.failed++;
                result.errors.push({
                    row: rowNumber,
                    error: error instanceof Error ? error.message : "Gagal menyimpan data",
                    data: row,
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Import selesai",
            result,
        });
    } catch (error) {
        console.error("Import students error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Terjadi kesalahan saat import",
            },
            { status: 500 }
        );
    }
}
