import { NextRequest, NextResponse } from "next/server";
import { db, classes } from "@/db";
import { getAdminSession } from "@/lib/auth-admin";
import { randomBytes } from "crypto";
import * as XLSX from "xlsx";

interface ClassImportRow {
    name?: string | number;
    teacher?: string | number;
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
        if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
            return NextResponse.json(
                { error: "File harus berformat Excel (.xlsx atau .xls)" },
                { status: 400 }
            );
        }

        // Read file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Parse Excel
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return NextResponse.json(
                { error: "File Excel kosong" },
                { status: 400 }
            );
        }

        // Get existing classes to check for duplicates
        const existingClasses = await db.query.classes.findMany();
        const existingNames = new Set(existingClasses.map((c) => c.name.toLowerCase()));

        let successCount = 0;
        let failedCount = 0;
        let duplicateCount = 0;
        const errors: Array<{ row: number; error: string }> = [];

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i] as ClassImportRow;
            const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

            try {
                // Validate required fields
                if (!row.name || !row.teacher) {
                    errors.push({
                        row: rowNumber,
                        error: "Nama kelas dan wali kelas harus diisi",
                    });
                    failedCount++;
                    continue;
                }

                const name = String(row.name).trim();
                const teacher = String(row.teacher).trim();

                // Check for duplicates
                if (existingNames.has(name.toLowerCase())) {
                    duplicateCount++;
                    continue;
                }

                // Insert class
                const classId = randomBytes(16).toString("hex");
                await db.insert(classes).values({
                    id: classId,
                    name,
                    teacher,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                // Add to existing names to prevent duplicates in the same import
                existingNames.add(name.toLowerCase());
                successCount++;
            } catch (error) {
                console.error(`Error importing row ${rowNumber}:`, error);
                errors.push({
                    row: rowNumber,
                    error: "Gagal menyimpan data",
                });
                failedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: "Import selesai",
            result: {
                success: successCount,
                failed: failedCount,
                duplicate: duplicateCount,
                errors,
            },
        });
    } catch (error) {
        console.error("Import classes error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
