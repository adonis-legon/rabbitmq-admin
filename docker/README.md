# Docker Configuration

Simple Docker setup for RabbitMQ Admin.

## Files

- `Dockerfile` - Multi-stage build for local development
- `Dockerfile.release` - Optimized build for CI/CD releases (uses pre-built JAR)
- `docker-compose.yml` - Local development with database
- `docker-compose.prod.yml` - Production deployment configuration
- `.env.example` - Environment variables template
- `init-db.sql` - Database initialization script

## Local Development

1. **Start with database:**

```bash
cd docker
cp .env.example .env
docker-compose up --build
```

2. **Access:** http://localhost:8080

## Production Deployment

**Use the published Docker image with your external database:**

```bash
docker run -d \
  --name rabbitmq-admin \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://your-db:5432/rabbitmq_admin \
  -e SPRING_DATASOURCE_USERNAME=your_user \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -e JWT_SECRET_KEY=your-secret-key \
  username/rabbitmq-admin:latest
```

## Environment Variables

### Required for Production

- `SPRING_DATASOURCE_URL` - Database connection URL
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `JWT_SECRET_KEY` - JWT signing key (change from default!)

### Optional

- `SPRING_PROFILES_ACTIVE` - Spring profile (default: production)
- `SERVER_PORT` - Application port (default: 8080)

## Health Check

Check if the application is running:

```bash
curl http://localhost:8080/actuator/health
```

## Database Setup

The application requires PostgreSQL 15+ with a database and user created:

```sql
CREATE DATABASE rabbitmq_admin;
CREATE USER rabbitmq_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rabbitmq_admin TO rabbitmq_admin;
```

The application will automatically create the required tables on startup.
