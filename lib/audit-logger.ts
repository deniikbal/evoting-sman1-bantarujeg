import { db } from '@/db';
import { votes, votingTokens, students, candidates } from '@/db/schema/evoting';
import { eq } from 'drizzle-orm';

interface AuditLog {
  action: string;
  userId?: string;
  role?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Simple in-memory audit log storage
// In production, you might want to use a dedicated audit log table or external logging service
const auditLogs: AuditLog[] = [];

export class AuditLogger {
  static log(
    action: string,
    details: Record<string, any> = {},
    metadata?: {
      userId?: string;
      role?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const logEntry: AuditLog = {
      action,
      userId: metadata?.userId,
      role: metadata?.role,
      details,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      timestamp: new Date(),
    };

    auditLogs.push(logEntry);

    // Keep only last 1000 logs in memory
    if (auditLogs.length > 1000) {
      auditLogs.splice(0, auditLogs.length - 1000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${action}:`, {
        ...logEntry,
        // Remove sensitive data from console logs
        details: this.sanitizeDetails(logEntry.details),
      });
    }

    // In production, you might want to:
    // - Store in a dedicated audit log table
    // - Send to external logging service
    // - Write to secure log files
  }

  static sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };

    // Remove sensitive fields
    const sensitiveFields = ['token', 'password', 'sessionId'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  static getLogs(limit: number = 100): AuditLog[] {
    return auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  static async logVoteCast(
    studentId: number,
    candidateId: number,
    tokenId: number,
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    // Get student and candidate details for audit
    try {
      const [student] = await db
        .select({ name: students.name, nis: students.nis })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);

      const [candidate] = await db
        .select({ name: candidates.name })
        .from(candidates)
        .where(eq(candidates.id, candidateId))
        .limit(1);

      this.log('VOTE_CAST', {
        studentId,
        studentName: student?.name || 'Unknown',
        studentNis: student?.nis || 'Unknown',
        candidateId,
        candidateName: candidate?.name || 'Unknown',
        tokenId,
      }, {
        userId: `student-${studentId}`,
        role: 'student',
        ...metadata,
      });
    } catch (error) {
      console.error('Error logging vote cast:', error);
      // Still log basic information even if detailed lookup fails
      this.log('VOTE_CAST', {
        studentId,
        candidateId,
        tokenId,
        error: 'Failed to fetch details',
      }, metadata);
    }
  }

  static async logTokenGenerated(
    studentIds: number[],
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    this.log('TOKENS_GENERATED', {
      count: studentIds.length,
      studentIds,
    }, {
      role: 'admin',
      ...metadata,
    });
  }

  static async logStudentAdded(
    studentId: number,
    studentData: { nis: string; name: string; grade: string; class: string },
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    this.log('STUDENT_ADDED', {
      studentId,
      ...studentData,
    }, {
      role: 'admin',
      ...metadata,
    });
  }

  static async logCandidateAdded(
    candidateId: number,
    candidateData: { name: string; bio: string },
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    this.log('CANDIDATE_ADDED', {
      candidateId,
      ...candidateData,
    }, {
      role: 'admin',
      ...metadata,
    });
  }

  static async logVotingToggled(
    enabled: boolean,
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    this.log('VOTING_TOGGLED', {
      enabled,
    }, {
      role: 'admin',
      ...metadata,
    });
  }

  static async logVotingReset(
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    this.log('VOTING_RESET', {}, {
      role: 'admin',
      ...metadata,
    });
  }

  static async logLoginAttempt(
    nis: string,
    success: boolean,
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    this.log('LOGIN_ATTEMPT', {
      nis,
      success,
    }, {
      role: 'student',
      ...metadata,
    });
  }

  static async logUnauthorizedAccess(
    pathname: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    this.log('UNAUTHORIZED_ACCESS', {
      pathname,
    }, metadata);
  }

  static async logSuspiciousActivity(
    activity: string,
    details: Record<string, any>,
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    this.log('SUSPICIOUS_ACTIVITY', {
      activity,
      ...details,
    }, metadata);
  }
}

// Helper function to extract request metadata
export function extractRequestMetadata(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ipAddress: request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}