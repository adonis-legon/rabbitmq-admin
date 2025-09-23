# Production Deployment Guide

## Overview

This guide covers deploying the RabbitMQ Admin application with resource management features to production environments. The application supports various deployment methods including Docker, Kubernetes, and traditional server deployments.

## Prerequisites

### Configuration Documentation

Before deploying to production, review the comprehensive configuration options available:

- [Application Configuration Reference](../configuration/application-configuration-reference.md) - Complete configuration guide
- [Resource Management Configuration](../configuration/resource-management-config.md) - Resource-specific settings

### System Requirements

**Minimum Requirements:**

- CPU: 2 cores
- RAM: 2GB
- Storage: 10GB
- Java: OpenJDK 21 or later
- Database: PostgreSQL 12 or later

**Recommended Requirements:**

- CPU: 4 cores
- RAM: 4GB
- Storage: 50GB (with log retention)
- Database: PostgreSQL 15 or later with connection pooling

### External Dependencies

**Required:**

- PostgreSQL database (external, managed service recommended)
- RabbitMQ clusters with Management Plugin enabled
- Load balancer (for high availability)
- SSL/TLS certificates

**Optional:**

- Monitoring system (Prometheus/Grafana)
- Log aggregation system (ELK stack)
- Container orchestration (Kubernetes)
- Service mesh (Istio)

## Docker Deployment

### Using Docker Compose (Recommended for single-node deployments)

1. **Prepare environment configuration:**

```bash
# Copy production environment template
cp docker/.env.production.example docker/.env.production

# Edit configuration with your values
nano docker/.env.production
```

2. **Configure required environment variables:**

```bash
# Database connection (required)
DATABASE_URL=jdbc:postgresql://your-db-host:5432/rabbitmq_admin
DATABASE_USERNAME=rabbitmq_admin
DATABASE_PASSWORD=your-secure-password

# JWT secret (required - generate a secure 256-bit key)
JWT_SECRET_KEY=$(openssl rand -base64 32)

# Application port
APP_PORT=8080

# Resource management configuration (optional)
RABBITMQ_ADMIN_RESOURCES_CACHE_ENABLED=true
RABBITMQ_ADMIN_RESOURCES_REFRESH_DEFAULT_INTERVAL=60000
RABBITMQ_ADMIN_RESOURCES_PAGINATION_DEFAULT_PAGE_SIZE=25
RABBITMQ_ADMIN_RESOURCES_RATE_LIMIT_REQUESTS_PER_MINUTE=60
RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_MAX_TOTAL=50
```

3. **Deploy using production compose file:**

```bash
# Deploy the application
docker-compose -f docker/docker-compose.prod.yml --env-file docker/.env.production up -d

# Check deployment status
docker-compose -f docker/docker-compose.prod.yml ps

# View logs
docker-compose -f docker/docker-compose.prod.yml logs -f app
```

4. **Verify deployment:**

```bash
# Health check
curl -f http://localhost:8080/actuator/health

# Check metrics endpoint
curl http://localhost:8080/actuator/metrics
```

### Using Docker Run

```bash
# Run with production configuration
docker run -d \
  --name rabbitmq-admin-prod \
  --restart unless-stopped \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=production \
  -e DATABASE_URL=jdbc:postgresql://your-db-host:5432/rabbitmq_admin \
  -e DATABASE_USERNAME=rabbitmq_admin \
  -e DATABASE_PASSWORD=your-secure-password \
  -e JWT_SECRET_KEY=your-secure-jwt-secret \
  -e RABBITMQ_ADMIN_RESOURCES_CACHE_ENABLED=true \
  -e RABBITMQ_ADMIN_RESOURCES_REFRESH_DEFAULT_INTERVAL=60000 \
  -e RABBITMQ_ADMIN_RESOURCES_PAGINATION_DEFAULT_PAGE_SIZE=25 \
  -e RABBITMQ_ADMIN_RESOURCES_RATE_LIMIT_REQUESTS_PER_MINUTE=60 \
  -e RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_MAX_TOTAL=50 \
  --memory=2g \
  --cpus=1.0 \
  --security-opt no-new-privileges:true \
  --read-only \
  --tmpfs /tmp:noexec,nosuid,size=100m \
  -v /var/log/rabbitmq-admin:/app/logs \
  rabbitmq-admin:latest
```

## Kubernetes Deployment

### Namespace and ConfigMap

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: rabbitmq-admin
  labels:
    name: rabbitmq-admin

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rabbitmq-admin-config
  namespace: rabbitmq-admin
data:
  SPRING_PROFILES_ACTIVE: "production"
  # Resource management configuration
  RABBITMQ_ADMIN_RESOURCES_CACHE_ENABLED: "true"
  RABBITMQ_ADMIN_RESOURCES_REFRESH_DEFAULT_INTERVAL: "60000"
  RABBITMQ_ADMIN_RESOURCES_REFRESH_MIN_INTERVAL: "30000"
  RABBITMQ_ADMIN_RESOURCES_REFRESH_MAX_INTERVAL: "300000"
  RABBITMQ_ADMIN_RESOURCES_PAGINATION_DEFAULT_PAGE_SIZE: "25"
  RABBITMQ_ADMIN_RESOURCES_PAGINATION_MAX_PAGE_SIZE: "200"
  RABBITMQ_ADMIN_RESOURCES_CACHE_DEFAULT_TTL: "60000"
  RABBITMQ_ADMIN_RESOURCES_CACHE_MAX_SIZE: "2000"
  RABBITMQ_ADMIN_RESOURCES_RATE_LIMIT_REQUESTS_PER_MINUTE: "60"
  RABBITMQ_ADMIN_RESOURCES_RATE_LIMIT_BURST_SIZE: "5"
  RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_MAX_TOTAL: "50"
  RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_MAX_PER_ROUTE: "20"
  RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_CONNECTION_TIMEOUT: "15000"
  RABBITMQ_ADMIN_RESOURCES_CONNECTION_POOL_SOCKET_TIMEOUT: "45000"
  # Logging configuration
  LOGGING_LEVEL_COM_RABBITMQ_ADMIN: "INFO"
  LOGGING_LEVEL_COM_RABBITMQ_ADMIN_SERVICE_RABBITMQRESOURCESERVICE: "INFO"
  LOGGING_LEVEL_COM_RABBITMQ_ADMIN_CONTROLLER_RABBITMQRESOURCECONTROLLER: "INFO"
```

### Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: rabbitmq-admin-secrets
  namespace: rabbitmq-admin
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  DATABASE_USERNAME: <base64-encoded-username>
  DATABASE_PASSWORD: <base64-encoded-password>
  JWT_SECRET_KEY: <base64-encoded-jwt-secret>
```

### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rabbitmq-admin
  namespace: rabbitmq-admin
  labels:
    app: rabbitmq-admin
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rabbitmq-admin
  template:
    metadata:
      labels:
        app: rabbitmq-admin
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 65534
        fsGroup: 65534
      containers:
        - name: rabbitmq-admin
          image: rabbitmq-admin:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8080
              name: http
          envFrom:
            - configMapRef:
                name: rabbitmq-admin-config
            - secretRef:
                name: rabbitmq-admin-secrets
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /actuator/health
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 30
            timeoutSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: logs
              mountPath: /app/logs
      volumes:
        - name: tmp
          emptyDir:
            sizeLimit: 100Mi
        - name: logs
          emptyDir:
            sizeLimit: 1Gi
      restartPolicy: Always
```

### Service and Ingress

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq-admin-service
  namespace: rabbitmq-admin
  labels:
    app: rabbitmq-admin
spec:
  selector:
    app: rabbitmq-admin
  ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
  type: ClusterIP

---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rabbitmq-admin-ingress
  namespace: rabbitmq-admin
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - rabbitmq-admin.yourdomain.com
      secretName: rabbitmq-admin-tls
  rules:
    - host: rabbitmq-admin.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: rabbitmq-admin-service
                port:
                  number: 80
```

### Deploy to Kubernetes

```bash
# Apply all configurations
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Check deployment status
kubectl get pods -n rabbitmq-admin
kubectl get services -n rabbitmq-admin
kubectl get ingress -n rabbitmq-admin

# View logs
kubectl logs -f deployment/rabbitmq-admin -n rabbitmq-admin
```

## Traditional Server Deployment

### System Preparation

1. **Install Java 21:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-21-jdk

# RHEL/CentOS
sudo yum install java-21-openjdk-devel

# Verify installation
java -version
```

2. **Create application user:**

```bash
# Create dedicated user
sudo useradd -r -s /bin/false rabbitmq-admin

# Create directories
sudo mkdir -p /opt/rabbitmq-admin
sudo mkdir -p /var/log/rabbitmq-admin
sudo mkdir -p /etc/rabbitmq-admin

# Set permissions
sudo chown rabbitmq-admin:rabbitmq-admin /opt/rabbitmq-admin
sudo chown rabbitmq-admin:rabbitmq-admin /var/log/rabbitmq-admin
sudo chown rabbitmq-admin:rabbitmq-admin /etc/rabbitmq-admin
```

3. **Deploy application:**

```bash
# Copy JAR file
sudo cp rabbitmq-admin.jar /opt/rabbitmq-admin/

# Create configuration file
sudo tee /etc/rabbitmq-admin/application.properties << EOF
spring.profiles.active=production
spring.profiles.active=production
spring.datasource.url=jdbc:postgresql://your-db-host:5432/rabbitmq_admin
spring.datasource.username=rabbitmq_admin
spring.datasource.password=your-secure-password
app.jwt.secret-key=your-secure-jwt-secret

# Resource management configuration
rabbitmq.admin.resources.cache.enabled=true
rabbitmq.admin.resources.cache.default-ttl=60000
rabbitmq.admin.resources.cache.max-size=2000
rabbitmq.admin.resources.refresh.default-interval=60000
rabbitmq.admin.resources.refresh.min-interval=30000
rabbitmq.admin.resources.refresh.max-interval=300000
rabbitmq.admin.resources.pagination.default-page-size=25
rabbitmq.admin.resources.pagination.max-page-size=200
rabbitmq.admin.resources.rate-limit.per-user.requests-per-minute=60
rabbitmq.admin.resources.rate-limit.per-user.burst-size=5
rabbitmq.admin.resources.connection-pool.max-total=50
rabbitmq.admin.resources.connection-pool.max-per-route=20
rabbitmq.admin.resources.connection-pool.connection-timeout=15000
rabbitmq.admin.resources.connection-pool.socket-timeout=45000

# Security and audit configuration
rabbitmq.admin.resources.security.min-role=USER
rabbitmq.admin.resources.audit.enabled=true
rabbitmq.admin.resources.data-protection.filter-sensitive-properties=true
rabbitmq.admin.resources.data-protection.mask-sensitive-values=true

# Monitoring configuration
rabbitmq.admin.resources.health.enabled=true
rabbitmq.admin.resources.health.check-interval=60000
rabbitmq.admin.resources.metrics.enabled=true

# Application-level monitoring configuration
app.monitoring.performance.slow-threshold-ms=5000
app.monitoring.performance.critical-threshold-ms=10000
app.monitoring.health.check-interval-minutes=5
app.monitoring.health.timeout-seconds=15

# Logging configuration
logging.file.name=/var/log/rabbitmq-admin/application.log
logging.level.com.rabbitmq.admin.service.RabbitMQResourceService=INFO
logging.level.com.rabbitmq.admin.controller.RabbitMQResourceController=INFO
rabbitmq.admin.resources.logging.log-slow-requests=true
rabbitmq.admin.resources.logging.slow-request-threshold=5000
rabbitmq.admin.resources.logging.log-errors=true
EOF

# Set permissions
sudo chown rabbitmq-admin:rabbitmq-admin /etc/rabbitmq-admin/application.properties
sudo chmod 600 /etc/rabbitmq-admin/application.properties
```

4. **Create systemd service:**

```bash
sudo tee /etc/systemd/system/rabbitmq-admin.service << EOF
[Unit]
Description=RabbitMQ Admin Application
After=network.target

[Service]
Type=simple
User=rabbitmq-admin
Group=rabbitmq-admin
ExecStart=/usr/bin/java -Xms512m -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar /opt/rabbitmq-admin/rabbitmq-admin.jar --spring.config.location=/etc/rabbitmq-admin/application.properties
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rabbitmq-admin

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/rabbitmq-admin

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable rabbitmq-admin
sudo systemctl start rabbitmq-admin

# Check status
sudo systemctl status rabbitmq-admin
```

## Database Setup

### PostgreSQL Configuration

1. **Create database and user:**

```sql
-- Connect as postgres superuser
CREATE DATABASE rabbitmq_admin;
CREATE USER rabbitmq_admin WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE rabbitmq_admin TO rabbitmq_admin;

-- Connect to rabbitmq_admin database
\c rabbitmq_admin;
GRANT ALL ON SCHEMA public TO rabbitmq_admin;
```

2. **Optimize for production:**

```sql
-- Performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();
```

3. **Connection pooling (recommended):**

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure PgBouncer
sudo tee /etc/pgbouncer/pgbouncer.ini << EOF
[databases]
rabbitmq_admin = host=localhost port=5432 dbname=rabbitmq_admin

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
logfile = /var/log/postgresql/pgbouncer.log
pidfile = /var/run/postgresql/pgbouncer.pid
admin_users = postgres
pool_mode = transaction
server_reset_query = DISCARD ALL
max_client_conn = 100
default_pool_size = 20
reserve_pool_size = 5
EOF

# Start PgBouncer
sudo systemctl enable pgbouncer
sudo systemctl start pgbouncer
```

## Load Balancer Configuration

### Nginx Configuration

```nginx
upstream rabbitmq_admin {
    least_conn;
    server 10.0.1.10:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name rabbitmq-admin.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rabbitmq-admin.yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://rabbitmq_admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Health check
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # WebSocket support (if needed in future)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /actuator/health {
        proxy_pass http://rabbitmq_admin;
        access_log off;
    }
}
```

## Monitoring and Observability

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "rabbitmq-admin"
    static_configs:
      - targets: ["rabbitmq-admin:8080"]
    metrics_path: "/actuator/prometheus"
    scrape_interval: 30s
```

### Grafana Dashboard

Import the provided Grafana dashboard JSON or create custom dashboards monitoring:

- Application metrics (request rate, response time, error rate)
- Resource management metrics (cache hit rate, API call rate)
- JVM metrics (heap usage, GC performance)
- Database metrics (connection pool, query performance)

### Log Aggregation

```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/rabbitmq-admin/*.log
    fields:
      service: rabbitmq-admin
      environment: production
    fields_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "rabbitmq-admin-%{+yyyy.MM.dd}"
```

## Security Considerations

### SSL/TLS Configuration

1. **Generate or obtain SSL certificates:**

```bash
# Using Let's Encrypt
sudo certbot certonly --webroot -w /var/www/html -d rabbitmq-admin.yourdomain.com

# Or use your organization's CA
```

2. **Configure application for HTTPS:**

```yaml
server:
  port: 8443
  ssl:
    enabled: true
    key-store: /path/to/keystore.p12
    key-store-password: your-keystore-password
    key-store-type: PKCS12
```

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect to HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8080/tcp  # Application (if not behind load balancer)

# Database access (restrict to application servers)
sudo ufw allow from 10.0.1.0/24 to any port 5432

# Enable firewall
sudo ufw enable
```

### Security Hardening

1. **Application security:**

```yaml
# Additional security configuration
security:
  require-ssl: true
  headers:
    frame-options: DENY
    content-type-options: nosniff
    xss-protection: "1; mode=block"
    hsts: "max-age=31536000; includeSubDomains"
```

2. **System hardening:**

```bash
# Disable unnecessary services
sudo systemctl disable apache2
sudo systemctl disable nginx  # if not used as load balancer

# Update system packages
sudo apt update && sudo apt upgrade -y

# Configure automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/var/backups/rabbitmq-admin"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="rabbitmq_admin_backup_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U rabbitmq_admin -d rabbitmq_admin > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/${BACKUP_FILE}.gz"
```

### Application Configuration Backup

```bash
#!/bin/bash
# backup-config.sh

BACKUP_DIR="/var/backups/rabbitmq-admin/config"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configuration files
tar -czf $BACKUP_DIR/config_backup_${DATE}.tar.gz \
  /etc/rabbitmq-admin/ \
  /etc/systemd/system/rabbitmq-admin.service

echo "Configuration backup completed: $BACKUP_DIR/config_backup_${DATE}.tar.gz"
```

### Recovery Procedures

1. **Database recovery:**

```bash
# Stop application
sudo systemctl stop rabbitmq-admin

# Restore database
gunzip -c /var/backups/rabbitmq-admin/rabbitmq_admin_backup_YYYYMMDD_HHMMSS.sql.gz | \
  psql -h localhost -U rabbitmq_admin -d rabbitmq_admin

# Start application
sudo systemctl start rabbitmq-admin
```

2. **Application recovery:**

```bash
# Restore configuration
tar -xzf /var/backups/rabbitmq-admin/config/config_backup_YYYYMMDD_HHMMSS.tar.gz -C /

# Reload systemd
sudo systemctl daemon-reload

# Restart application
sudo systemctl restart rabbitmq-admin
```

## Troubleshooting

### Common Issues

1. **Application won't start:**

```bash
# Check logs
sudo journalctl -u rabbitmq-admin -f

# Check configuration
sudo -u rabbitmq-admin java -jar /opt/rabbitmq-admin/rabbitmq-admin.jar --spring.config.location=/etc/rabbitmq-admin/application.properties --debug
```

2. **Database connection issues:**

```bash
# Test database connectivity
psql -h your-db-host -U rabbitmq_admin -d rabbitmq_admin -c "SELECT 1;"

# Check connection pool
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
```

3. **Performance issues:**

```bash
# Monitor JVM metrics
curl http://localhost:8080/actuator/metrics/jvm.memory.used

# Check resource usage
top -p $(pgrep -f rabbitmq-admin)
```

### Health Checks

```bash
# Application health
curl -f http://localhost:8080/actuator/health

# Detailed health information
curl http://localhost:8080/actuator/health | jq .

# Metrics endpoint
curl http://localhost:8080/actuator/metrics
```

## Maintenance

### Regular Maintenance Tasks

1. **Weekly:**

   - Review application logs for errors
   - Check disk space usage
   - Verify backup completion
   - Monitor performance metrics

2. **Monthly:**

   - Update system packages
   - Review security logs
   - Analyze performance trends
   - Test backup recovery procedures

3. **Quarterly:**
   - Review and update security configurations
   - Performance tuning based on usage patterns
   - Capacity planning review
   - Disaster recovery testing

### Scaling Considerations

1. **Horizontal scaling:**

   - Deploy multiple application instances
   - Use load balancer for distribution
   - Ensure session affinity if needed
   - Monitor resource utilization

2. **Vertical scaling:**

   - Increase JVM heap size
   - Add more CPU cores
   - Increase database connection pool
   - Monitor memory usage patterns

3. **Database scaling:**
   - Implement read replicas
   - Use connection pooling
   - Optimize queries and indexes
   - Consider database partitioning

This deployment guide provides comprehensive instructions for deploying the RabbitMQ Admin application with resource management features in production environments. Follow the security best practices and monitoring recommendations to ensure a stable and secure deployment.
