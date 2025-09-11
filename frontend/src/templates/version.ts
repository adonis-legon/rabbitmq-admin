// This file is auto-generated during build - do not edit manually
export const APP_VERSION = '${project.version}';
export const BUILD_TIMESTAMP = '${maven.build.timestamp}';
export const BUILD_DATE = new Date('${maven.build.timestamp}');

export const getVersionInfo = () => ({
    version: APP_VERSION,
    buildTimestamp: BUILD_TIMESTAMP,
    buildDate: BUILD_DATE,
    isSnapshot: APP_VERSION.includes('SNAPSHOT'),
    shortVersion: APP_VERSION.replace('-SNAPSHOT', ''),
});