# Multi-stage build for RabbitMQ Admin
# Use a minimal base image with JDK and install Maven manually
FROM eclipse-temurin:21-jdk-jammy AS build

# Install Maven manually for better security control
ENV MAVEN_VERSION=3.9.9
ENV MAVEN_HOME=/opt/maven
ENV PATH=${MAVEN_HOME}/bin:${PATH}

RUN apt-get update && \
  apt-get install -y wget ca-certificates && \
  wget -q https://archive.apache.org/dist/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz && \
  wget -q https://archive.apache.org/dist/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz.sha512 && \
  echo "$(cat apache-maven-${MAVEN_VERSION}-bin.tar.gz.sha512) apache-maven-${MAVEN_VERSION}-bin.tar.gz" | sha512sum -c - && \
  tar xzf apache-maven-${MAVEN_VERSION}-bin.tar.gz -C /opt/ && \
  ln -s /opt/apache-maven-${MAVEN_VERSION} ${MAVEN_HOME} && \
  rm apache-maven-${MAVEN_VERSION}-bin.tar.gz apache-maven-${MAVEN_VERSION}-bin.tar.gz.sha512 && \
  apt-get remove -y wget && \
  apt-get autoremove -y && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Update packages to latest versions for security
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy parent pom and module poms first for better layer caching
COPY pom.xml .
COPY backend/pom.xml backend/
COPY frontend/pom.xml frontend/

# Copy frontend package files for dependency installation
COPY frontend/package.json frontend/
COPY frontend/pnpm-lock.yaml frontend/
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
RUN mvn clean package -DskipTests -pl backend -am

# Runtime stage - using distroless for security
FROM gcr.io/distroless/java21-debian12:nonroot

# Set working directory
WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /app/backend/target/*.jar app.jar

# Distroless images already run as non-root user
# No need for user management or package installation

# Expose port
EXPOSE 8080

# Note: Health checks should be handled by the orchestration platform (k8s, docker-compose)
# Distroless images don't include curl or shell for health checks

# Run the application (distroless uses java as entrypoint)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-XX:+UseG1GC", "-jar", "app.jar"]