package com.rabbitmq.admin.aspect;

import com.rabbitmq.admin.model.AuditOperationType;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods that should be audited as write operations.
 * When applied to a method, the WriteOperationAuditAspect will automatically
 * capture operation details, success/failure status, and timing information.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditWriteOperation {

    /**
     * The type of write operation being performed.
     * This determines how the operation will be categorized in audit logs.
     */
    AuditOperationType operationType();

    /**
     * The type of resource being affected by this operation.
     * Examples: "exchange", "queue", "binding", "message"
     */
    String resourceType();

    /**
     * Optional description of the operation for additional context.
     * This can be used to provide more detailed information about what the
     * operation does.
     */
    String description() default "";

    /**
     * Whether to include method parameters in the audit details.
     * When true, method parameters will be captured and stored as part of the audit
     * record.
     * Be careful with sensitive data when enabling this.
     */
    boolean includeParameters() default false;

    /**
     * Whether to include the method return value in the audit details.
     * When true, the return value will be captured and stored as part of the audit
     * record.
     * Be careful with sensitive data when enabling this.
     */
    boolean includeReturnValue() default false;
}