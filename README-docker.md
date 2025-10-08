# RabbitMQ Admin

[![Docker Pulls](https://img.shields.io/docker/pulls/alegon/rabbitmq-admin)](https://hub.docker.com/r/alegon/rabbitmq-admin)
[![Docker Image Size](https://img.shields.io/docker/image-size/alegon/rabbitmq-admin)](https://hub.docker.com/r/alegon/rabbitmq-admin)
[![GitHub](https://img.shields.io/github/license/adonis-legon/rabbitmq-admin)](https://github.com/adonis-legon/rabbitmq-admin)

A comprehensive web application for managing RabbitMQ clusters with authentication, authorization, and multi-cluster support.

## 🐳 Quick Docker Start

```bash
# Run with Docker Compose (recommended)
curl -o docker-compose.yml https://raw.githubusercontent.com/adonis-legon/rabbitmq-admin/main/docker/docker-compose.yml
docker-compose up -d

# Or run standalone
docker run -d \
  --name rabbitmq-admin \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://your-db:5432/rabbitmq_admin \
  -e SPRING_DATASOURCE_USERNAME=your_user \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -e JWT_SECRET_KEY=your-256-bit-secret-key \
  alegon/rabbitmq-admin:latest
```

**Default Access**: http://localhost:8080 (admin/admin123!)

## 🚀 Features

- **Multi-cluster Management**: Connect and manage multiple RabbitMQ clusters
- **User Authentication**: Secure login with JWT tokens and role-based access
- **Resource Management**: Create, modify, and delete queues, exchanges, bindings
- **Message Operations**: Send, receive, and purge messages with acknowledgment modes
- **Audit Logging**: Complete audit trail of all administrative operations
- **Real-time Monitoring**: Live cluster status and resource metrics
- **Containerization**: Full Docker support with production-ready configurations

## 📋 Requirements

### Production (Docker)
- **Docker 24+**
- **PostgreSQL 15+**
- **Memory**: 512MB minimum, 1GB recommended

### Development
- **Java 21+**
- **Node.js 20+**
- **Maven 3.9+**
- **PostgreSQL 15+**

## ⚙️ Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL | Yes | - |
| `SPRING_DATASOURCE_USERNAME` | Database username | Yes | - |
| `SPRING_DATASOURCE_PASSWORD` | Database password | Yes | - |
| `JWT_SECRET_KEY` | JWT signing key (256+ bits) | Yes | - |
| `SERVER_PORT` | Application port | No | `8080` |
| `LOGGING_LEVEL_ROOT` | Logging level | No | `INFO` |

## 🔐 Default Credentials

- **Username**: `admin`
- **Password**: `admin123!`

*Change these immediately in production!*

## 🐳 Production Docker Setup

### Database Setup
```sql
CREATE DATABASE rabbitmq_admin;
CREATE USER rabbitmq_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE rabbitmq_admin TO rabbitmq_user;
```

### Docker Compose Production
```yaml
version: '3.8'
services:
  rabbitmq-admin:
    image: alegon/rabbitmq-admin:latest
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/rabbitmq_admin
      SPRING_DATASOURCE_USERNAME: rabbitmq_user
      SPRING_DATASOURCE_PASSWORD: secure_password
      JWT_SECRET_KEY: your-very-long-secret-key-minimum-256-bits
      SPRING_PROFILES_ACTIVE: production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: rabbitmq_admin
      POSTGRES_USER: rabbitmq_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🏷️ Available Tags

- `latest` - Latest stable release
- `0.1.0` - Current version

## 📊 Health Checks

- **Health**: `GET /actuator/health`
- **Info**: `GET /actuator/info`
- **Metrics**: `GET /actuator/metrics`

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin and user roles with different permissions
- **Audit Logging**: All operations logged with user tracking
- **SQL Injection Protection**: Parameterized queries throughout
- **XSS Protection**: Input sanitization and CSP headers
- **HTTPS Support**: SSL/TLS configuration for production

## 📝 API Documentation

Interactive API documentation available at:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI Spec: `http://localhost:8080/v3/api-docs`

## 🛠️ Development

### Local Development
```bash
git clone https://github.com/adonis-legon/rabbitmq-admin.git
cd rabbitmq-admin
./radmin-cli build dev
```

### CLI Tool
```bash
# Build commands  
./radmin-cli build [dev|prod]
./radmin-cli build clean

# Version management
./radmin-cli version [get|set VERSION]

# Testing
./radmin-cli test [unit|integration|all]
```

## 📂 Project Structure

```
rabbitmq-admin/
├── backend/           # Spring Boot application
├── frontend/          # React TypeScript application  
├── docker/           # Docker configurations
├── scripts/          # Build and deployment scripts
└── radmin-cli        # Unified CLI tool
```

## 🧪 Testing

```bash
# Run all tests
./radmin-cli test all

# Unit tests only
./radmin-cli test unit

# Integration tests
./radmin-cli test integration
```

## 🌐 Browser Support

- **Chrome 90+**
- **Firefox 88+**
- **Safari 14+**
- **Edge 90+**

## 📞 Support & Contributing

- **GitHub**: https://github.com/adonis-legon/rabbitmq-admin
- **Issues**: https://github.com/adonis-legon/rabbitmq-admin/issues
- **License**: MIT License

## 🔄 Version History

- **0.1.2** - Enhanced Docker Hub integration, improved CI/CD
- **0.1.1** - Audit logging, security improvements  
- **0.1.0** - Initial release with core functionality