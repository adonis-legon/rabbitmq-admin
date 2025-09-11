# Multi-stage build for RabbitMQ Admin Dashboard
FROM maven:3.9.6-eclipse-temurin-21 AS build

# Set working directory
WORKDIR /app

# Copy parent pom and module poms first for better layer caching
COPY pom.xml .
COPY backend/pom.xml backend/
COPY frontend/pom.xml frontend/

# Copy frontend package files for dependency installation
COPY frontend/package*.json frontend/
COPY frontend/vite.config.ts frontend/
COPY frontend/tsconfig.json frontend/
COPY frontend/tsconfig.node.json frontend/

# Download Maven dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY backend/src backend/src
COPY frontend/src frontend/src
COPY frontend/public frontend/public
COPY frontend/index.html frontend/

# Build the complete application with frontend assets included
RUN mvn clean package -DskipTests -Pproduction

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

# Install curl for health checks and create non-root user
RUN apk add --no-cache curl && \
    addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /app/backend/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM optimization for containerized environment
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]