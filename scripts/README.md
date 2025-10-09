# Scripts Directory

This directory contains the core automation scripts for the RabbitMQ Admin project. These scripts are called by the main `radmin-cli` tool.

## Scripts Overview

### Build & Development

- **`build.sh`** - Main build automation script
  - `build.sh jar` - Build standalone JAR
  - `build.sh docker` - Build Docker image
  - `build.sh dev` - Start development environment
  - `build.sh clean` - Clean build artifacts
  - `build.sh test` - Run all tests

### Runtime

- **`run.sh`** - Application runtime script
  - `run.sh jar` - Run JAR with external database
  - `run.sh docker` - Run with Docker Compose (includes DB)
  - `run.sh container` - Run published Docker image

### Deployment

- **`deploy.sh`** - Container deployment script
  - `deploy.sh run` - Deploy container with external database
  - `deploy.sh stop` - Stop running container
  - `deploy.sh logs` - View container logs
  - `deploy.sh status` - Check container status

### Testing

- **`e2e-test.sh`** - End-to-end testing for local development only
  - Comprehensive resource management validation
  - Real RabbitMQ cluster integration testing
  - **NOT part of CI/CD pipeline** (too slow and potentially flaky)
  - Use for: local development, manual validation, pre-release verification

- **`test-multiarch-build.sh`** - Test multi-architecture Docker builds locally
  - Validates AMD64 and ARM64 Docker image builds
  - Requires Docker BuildKit and buildx
  - Useful for testing before CI/CD deployment

### Version Management

- **`sync-versions.sh`** - Synchronize versions across all components from main pom.xml

## Usage

**Recommended**: Use the main CLI tool instead of calling these scripts directly:

```bash
# Use the unified CLI (recommended)
./radmin-cli build jar
./radmin-cli run docker
./radmin-cli deploy run --db-url jdbc:postgresql://db:5432/rabbitmq_admin --db-user admin --db-pass secret --jwt-secret my-secret
```

**Direct usage** (if needed):

```bash
# Direct script calls (not recommended)
./scripts/build.sh jar
./scripts/run.sh docker
./scripts/deploy.sh run --db-url jdbc:postgresql://db:5432/rabbitmq_admin --db-user admin --db-pass secret --jwt-secret my-secret
```

## Help

The main CLI tool provides comprehensive help:

```bash
./radmin-cli help                # Show all commands
./radmin-cli build --help        # Show build options (via scripts/build.sh --help)
./radmin-cli deploy --help       # Show deploy options (via scripts/deploy.sh --help)
```
