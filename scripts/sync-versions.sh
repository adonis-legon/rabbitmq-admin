#!/bin/bash

# Script to sync versions across all components from main pom.xml

# Change to project root directory (parent of scripts)
cd "$(dirname "$0")/.."

# Get version from main pom.xml
MAIN_VERSION=$(mvn help:evaluate -Dexpression=project.version -q -DforceStdout -f pom.xml)

if [ -z "$MAIN_VERSION" ]; then
    echo "Error: Could not extract version from main pom.xml"
    exit 1
fi

echo "Main project version: $MAIN_VERSION"

# Update frontend package.json
if [ -f "frontend/package.json" ]; then
    echo "Updating frontend/package.json version to $MAIN_VERSION"
    sed -i.bak "s/\"version\": \".*\"/\"version\": \"$MAIN_VERSION\"/" frontend/package.json
    rm -f frontend/package.json.bak
fi

# Verify versions are in sync
echo ""
echo "Version verification:"
echo "Main pom.xml: $MAIN_VERSION"

if [ -f "frontend/package.json" ]; then
    FRONTEND_VERSION=$(grep '"version"' frontend/package.json | sed 's/.*"version": "\(.*\)".*/\1/')
    echo "Frontend package.json: $FRONTEND_VERSION"
fi

echo ""
echo "Version sync complete!"