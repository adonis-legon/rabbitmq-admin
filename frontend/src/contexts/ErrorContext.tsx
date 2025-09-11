import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertTitle, Collapse, IconButton } from '@mui/material';
import { Close, ExpandMore, ExpandLess } from '@mui/icons-material';
import { ErrorContextType, Notification, NotificationSeverity } from '../types/error';

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
    children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

    const generateId = () => `notification-${Date.now()}-${Math.random()}`;

    const addNotification = (
        message: string,
        severity: NotificationSeverity,
        details?: string,
        autoHide: boolean = true
    ) => {
        const notification: Notification = {
            id: generateId(),
            message,
            severity,
            details,
            timestamp: Date.now(),
            autoHide,
        };

        setNotifications(prev => [...prev, notification]);

        if (autoHide) {
            setTimeout(() => {
                removeNotification(notification.id);
            }, severity === 'error' ? 8000 : 5000); // Errors stay longer
        }
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setExpandedNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const toggleExpanded = (id: string) => {
        setExpandedNotifications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const showError = (message: string, details?: string) => {
        addNotification(message, 'error', details, false); // Errors don't auto-hide
    };

    const showSuccess = (message: string) => {
        addNotification(message, 'success');
    };

    const showWarning = (message: string) => {
        addNotification(message, 'warning');
    };

    const showInfo = (message: string) => {
        addNotification(message, 'info');
    };

    const clearNotifications = () => {
        setNotifications([]);
        setExpandedNotifications(new Set());
    };

    const contextValue: ErrorContextType = {
        showError,
        showSuccess,
        showWarning,
        showInfo,
        clearNotifications,
    };

    return (
        <ErrorContext.Provider value={contextValue}>
            {children}

            {/* Render notifications */}
            {notifications.map((notification) => {
                const isExpanded = expandedNotifications.has(notification.id);

                return (
                    <Snackbar
                        key={notification.id}
                        open={true}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        sx={{
                            position: 'relative',
                            top: `${notifications.indexOf(notification) * 80}px`,
                            zIndex: 1400 + notifications.indexOf(notification)
                        }}
                    >
                        <Alert
                            severity={notification.severity}
                            variant="filled"
                            sx={{
                                minWidth: '300px',
                                maxWidth: '500px',
                                '& .MuiAlert-message': {
                                    width: '100%'
                                }
                            }}
                            action={
                                <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={() => removeNotification(notification.id)}
                                >
                                    <Close fontSize="small" />
                                </IconButton>
                            }
                        >
                            <AlertTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {notification.severity.charAt(0).toUpperCase() + notification.severity.slice(1)}
                                {notification.details && (
                                    <IconButton
                                        size="small"
                                        color="inherit"
                                        onClick={() => toggleExpanded(notification.id)}
                                        sx={{ ml: 1 }}
                                    >
                                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                )}
                            </AlertTitle>

                            {notification.message}

                            {notification.details && (
                                <Collapse in={isExpanded}>
                                    <div style={{
                                        marginTop: '8px',
                                        padding: '8px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px',
                                        fontSize: '0.875rem',
                                        fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}>
                                        {notification.details}
                                    </div>
                                </Collapse>
                            )}
                        </Alert>
                    </Snackbar>
                );
            })}
        </ErrorContext.Provider>
    );
};

export const useError = (): ErrorContextType => {
    const context = useContext(ErrorContext);
    if (context === undefined) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
};