// Version utilities for the frontend application

// Get version from Vite environment variables (injected during build)
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0-SNAPSHOT';
export const BUILD_TIMESTAMP = import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString();
export const BUILD_DATE = new Date(BUILD_TIMESTAMP);

export const getVersionInfo = () => ({
    version: APP_VERSION,
    buildTimestamp: BUILD_TIMESTAMP,
    buildDate: BUILD_DATE,
    isSnapshot: APP_VERSION.includes('SNAPSHOT'),
    shortVersion: APP_VERSION.replace('-SNAPSHOT', ''),
    displayVersion: APP_VERSION.includes('SNAPSHOT')
        ? `${APP_VERSION.replace('-SNAPSHOT', '')} (dev)`
        : APP_VERSION,
});

export const formatBuildDate = (locale: string = 'en-US') => {
    return BUILD_DATE.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};