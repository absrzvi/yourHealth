import { prisma } from '@/lib/prisma';

type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'VIEW_RECORD' 
  | 'CREATE_RECORD' 
  | 'UPDATE_RECORD' 
  | 'DELETE_RECORD'
  | 'EXPORT_DATA'
  | 'UPLOAD_FILE'
  | 'DOWNLOAD_FILE'
  | 'DELETE_FILE'
  | 'REQUEST'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'REQUEST_COMPLETED'
  | 'SESSION_CREATED'
  | 'SESSION_ENDED'
  | 'PASSWORD_CHANGED'
  | 'PROFILE_UPDATED'
  | 'LOGIN_ATTEMPT_FAILED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED';

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string | string[] | undefined;
  userAgent?: string | null;
}

/**
 * Logs an audit event to the database
 */
export const logAuditEvent = async (params: AuditLogParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : '{}',
        ipAddress: Array.isArray(params.ipAddress) 
          ? params.ipAddress[0] 
          : params.ipAddress || 'unknown',
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw to avoid blocking the main operation
  }
};

/**
 * Creates a request logger middleware for Express/Next.js API routes
 */
export const withAuditLogging = (handler: Function, action: AuditAction, resourceType: string) => {
  return async (req: any, res: any) => {
    try {
      // Log the request
      await logAuditEvent({
        userId: req.user?.id || 'anonymous',
        action,
        resourceType,
        resourceId: req.query.id || req.body.id,
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
        metadata: {
          method: req.method,
          url: req.url,
          params: req.params,
          query: req.query,
          // Don't log the entire body as it might contain sensitive data
          bodyKeys: req.body ? Object.keys(req.body) : [],
        },
      });

      // Call the handler
      return handler(req, res);
    } catch (error) {
      console.error('Audit logging middleware error:', error);
      // Still call the handler even if audit logging fails
      return handler(req, res);
    }
  };
};

/**
 * Gets audit logs for a specific user
 */
export const getUserAuditLogs = async (userId: string, limit = 50) => {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
};

/**
 * Gets audit logs for a specific resource
 */
export const getResourceAuditLogs = async (resourceType: string, resourceId: string, limit = 50) => {
  return prisma.auditLog.findMany({
    where: { 
      resourceType,
      resourceId,
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
};
