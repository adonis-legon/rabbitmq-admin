package com.rabbitmq.admin.util;

/**
 * Thread-local context for storing shovel creation information that needs to be
 * accessed by the audit aspect.
 */
public class ShovelCreationContext {

    private static final ThreadLocal<Integer> sourceQueueMessageCount = new ThreadLocal<>();

    /**
     * Sets the source queue message count for the current thread.
     * 
     * @param messageCount the message count in the source queue at shovel creation
     *                     time
     */
    public static void setSourceQueueMessageCount(Integer messageCount) {
        sourceQueueMessageCount.set(messageCount);
    }

    /**
     * Gets the source queue message count for the current thread.
     * 
     * @return the message count in the source queue at shovel creation time, or
     *         null if not set
     */
    public static Integer getSourceQueueMessageCount() {
        return sourceQueueMessageCount.get();
    }

    /**
     * Clears the source queue message count for the current thread.
     * Should be called after the shovel creation is complete.
     */
    public static void clearSourceQueueMessageCount() {
        sourceQueueMessageCount.remove();
    }
}