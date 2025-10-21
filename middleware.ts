import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for admin routes
    if (pathname.startsWith("/admin")) {
        // Allow access to login page
        if (pathname === "/admin/login") {
            return NextResponse.next();
        }

        // Check admin session
        const adminSession = request.cookies.get("admin_session");
        const adminId = request.cookies.get("admin_id");

        if (!adminSession || !adminId) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    // Check for student routes
    if (pathname.startsWith("/student")) {
        // Allow access to login page
        if (pathname === "/student/login") {
            return NextResponse.next();
        }

        // Check student session
        const studentSession = request.cookies.get("student_session");
        const studentId = request.cookies.get("student_id");

        if (!studentSession || !studentId) {
            return NextResponse.redirect(new URL("/student/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/student/:path*"],
};
