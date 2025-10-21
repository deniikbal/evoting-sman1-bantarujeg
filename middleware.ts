import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { AuditLogger, extractRequestMetadata } from '@/lib/audit-logger';

// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const RATE_LIMIT_MAX_REQUESTS = {
    '/api/voting/cast': 1, // 1 vote attempt per 15 minutes
    '/api/auth/': 5, // 5 auth attempts per 15 minutes
    'default': 100, // 100 requests per 15 minutes for other routes
};

// Rate limiting function
function checkRateLimit(key: string, limit: number): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
        });
        return true;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count++;
    return true;
}

// Get rate limit key for request
function getRateLimitKey(request: NextRequest): string {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const pathname = request.nextUrl.pathname;
    return `${ip}:${pathname}`;
}

// Get rate limit for specific route
function getRateLimit(pathname: string): number {
    if (pathname.startsWith('/api/voting/cast')) {
        return RATE_LIMIT_MAX_REQUESTS['/api/voting/cast'];
    }
    if (pathname.startsWith('/api/auth/')) {
        return RATE_LIMIT_MAX_REQUESTS['/api/auth/'];
    }
    return RATE_LIMIT_MAX_REQUESTS['default'];
}

// Security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // XSS Protection
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy (basic)
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
    );

    return response;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Apply rate limiting to API routes
    if (pathname.startsWith('/api/')) {
        const rateLimitKey = getRateLimitKey(request);
        const limit = getRateLimit(pathname);

        if (!checkRateLimit(rateLimitKey, limit)) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000) // seconds
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString(),
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString(),
                    }
                }
            );
        }
    }

    // Define public routes that don't require authentication
    const publicRoutes = [
        '/',
        '/sign-in',
        '/sign-up',
        '/voting/login',
        '/api/auth',
        '/api/candidates',
        '/api/settings',
    ];

    // Define admin routes
    const adminRoutes = [
        '/dashboard',
        '/dashboard/students',
        '/dashboard/candidates',
        '/dashboard/settings',
    ];

    // Define student voting routes
    const votingRoutes = [
        '/voting/cast',
    ];

    // Define sensitive API routes that require special protection
    const sensitiveApiRoutes = [
        '/api/admin/',
        '/api/voting/cast',
    ];

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route =>
        pathname.startsWith(route)
    );

    const response = NextResponse.next();
    addSecurityHeaders(response);

    if (isPublicRoute) {
        return response;
    }

    // Get the session
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    // If no session, redirect to login
    if (!session?.user) {
        if (pathname.startsWith('/voting')) {
            // Redirect to student login for voting routes
            return NextResponse.redirect(new URL('/voting/login', request.url));
        } else {
            // Redirect to admin login for admin routes
            return NextResponse.redirect(new URL('/sign-in', request.url));
        }
    }

    // Check role-based access
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    const isVotingRoute = votingRoutes.some(route => pathname.startsWith(route));
    const isSensitiveApi = sensitiveApiRoutes.some(route => pathname.startsWith(route));

    if (isAdminRoute && session.user.role !== 'admin') {
        // If trying to access admin routes but not admin, redirect to sign-in
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    if (isVotingRoute && session.user.role !== 'student') {
        // If trying to access voting routes but not student, redirect to student login
        return NextResponse.redirect(new URL('/voting/login', request.url));
    }

    if (isSensitiveApi && session.user.role !== 'admin') {
        // Log unauthorized access attempt
        AuditLogger.logUnauthorizedAccess(pathname, {
            ...extractRequestMetadata(request),
            userId: session.user.id,
            role: session.user.role,
        });

        // Protect sensitive API routes
        return NextResponse.json(
            { error: 'Unauthorized - Admin access required' },
            { status: 401 }
        );
    }

    // Special handling for root dashboard redirect
    if (pathname === '/') {
        if (session.user.role === 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else if (session.user.role === 'student') {
            return NextResponse.redirect(new URL('/voting/cast', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes that handle their own auth)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};