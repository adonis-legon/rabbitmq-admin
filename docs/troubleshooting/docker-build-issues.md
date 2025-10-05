# Docker Build Issues Troubleshooting

## Issue: "failed to execute bake: read |0: file already closed"

### Problem
When running `./radmin-cli build dev`, the Docker Compose build process fails with the error:
```
failed to execute bake: read |0: file already closed
```

### Root Cause
This issue occurs with newer versions of Docker Compose (v2.x) that use Docker buildx by default. The buildx builder can sometimes encounter issues with file handle management during long-running builds, especially when building complex multi-stage Dockerfiles.

### Solution
The issue has been resolved by modifying the build process to:

1. **Pre-build the Docker image manually**: Use `docker build` directly instead of relying on Docker Compose's built-in build functionality
2. **Use pre-built image in docker-compose**: Configure docker-compose.yml to use the pre-built image rather than building on-demand

### Changes Made

#### scripts/build.sh
Modified the `start_dev()` function to:
- Build the Docker image manually using `docker build -f docker/Dockerfile -t rabbitmq-admin:latest .`
- Start services with `docker-compose up -d` (without `--build` flag)

#### docker/docker-compose.yml
- Removed the `build` section from the app service
- Changed to use `image: rabbitmq-admin:latest`
- Removed obsolete `version: "3.8"` attribute to eliminate warnings

### Verification
After the fix:
```bash
./radmin-cli build dev
```

Should successfully:
1. Build the Docker image (takes ~1-3 seconds due to caching)
2. Start both PostgreSQL and the application containers
3. Make the application available at http://localhost:8080

### Alternative Workarounds
If you encounter similar issues in the future:

1. **Clean Docker cache**: `docker system prune -f`
2. **Use legacy build**: Set `DOCKER_BUILDKIT=0` environment variable
3. **Increase Docker resources**: Allocate more memory/CPU to Docker Desktop
4. **Use different builder**: `docker buildx create --use --name mybuilder`

### Related Commands
- `docker-compose ps` - Check service status
- `docker-compose logs -f` - View real-time logs
- `docker-compose down` - Stop services
- `docker-compose down -v` - Stop services and remove volumes