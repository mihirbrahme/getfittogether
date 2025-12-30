// Audit logging utility for tracking participant actions
// This helps maintain a comprehensive audit trail for compliance and debugging

import { supabase } from './supabase';

export type AuditAction =
    | 'check_in_submitted'
    | 'biometrics_updated'
    | 'profile_updated'
    | 'goal_created'
    | 'goal_updated'
    | 'goal_deleted'
    | 'login'
    | 'logout'
    | 'password_changed';

export type ResourceType =
    | 'daily_log'
    | 'biometric_log'
    | 'profile'
    | 'user_goal'
    | 'user_goal_assignment'
    | 'auth';

interface AuditLogOptions {
    userId: string;
    action: AuditAction;
    resourceType: ResourceType;
    resourceId?: string;
    details?: Record<string, any>;
}

/**
 * Log an audit event to the database
 * @param options - Audit log parameters
 * @returns Promise<void>
 */
export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
    const { userId, action, resourceType, resourceId, details } = options;

    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: userId,
                action,
                resource_type: resourceType,
                resource_id: resourceId || null,
                details: details || null,
                // IP and user agent could be added via Edge Functions in production
            });

        if (error) {
            console.error('Audit log error:', error);
            // Don't throw - audit logging should not break app functionality
        }
    } catch (err) {
        console.error('Audit log exception:', err);
        // Silently fail - audit logging is non-critical
    }
}

/**
 * Convenience function to log check-in submission
 */
export async function logCheckIn(userId: string, date: string, points: number) {
    await logAuditEvent({
        userId,
        action: 'check_in_submitted',
        resourceType: 'daily_log',
        details: { date, points }
    });
}

/**
 * Convenience function to log biometric update
 * NOTE: We only log field names, not values, to avoid PII in audit logs
 */
export async function logBiometricUpdate(userId: string, biometricId: string, data: any) {
    await logAuditEvent({
        userId,
        action: 'biometrics_updated',
        resourceType: 'biometric_log',
        resourceId: biometricId,
        details: {
            fields_updated: Object.keys(data).filter(k => data[k] !== null),
            record_id: biometricId,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Convenience function to log profile update
 */
export async function logProfileUpdate(userId: string, changes: Record<string, any>) {
    await logAuditEvent({
        userId,
        action: 'profile_updated',
        resourceType: 'profile',
        resourceId: userId,
        details: changes
    });
}
