# Kubernetes Deployment Guide

This directory contains Kubernetes manifests and deployment scripts for RabbitMQ Admin application.

## 📋 Prerequisites

- Kubernetes cluster (local or remote)
- `kubectl` configured to access your cluster
- Existing PostgreSQL database (the app doesn't include database deployment)
- Docker image available: `alegon/rabbitmq-admin:latest`

## 🏗️ Architecture

The deployment consists of:

- **Namespace**: `rabbitmq-admin` - Isolated namespace for the application
- **Secret**: Contains database credentials and JWT secret key
- **Deployment**: Single replica deployment of the application
- **Service**: ClusterIP service exposing the application internally
- **Ingress**: Optional ingress for external access

## 🚀 Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.template .env.dev
   ```

2. **Edit the environment file:**
   ```bash
   nano .env.dev
   ```
   
   Fill in your database connection details and JWT secret key.

3. **Deploy to your cluster:**
   ```bash
   ./deploy.sh dev
   ```

4. **Access the application:**
   ```bash
   # Port forward for local access
   kubectl port-forward svc/rabbitmq-admin-service -n rabbitmq-admin 8080:8080
   ```
   
   Then visit: http://localhost:8080

## ⚙️ Configuration

### Environment Files

Create environment-specific files:
- `.env.dev` - Development environment
- `.env.staging` - Staging environment  
- `.env.prod` - Production environment

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection URL
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password
- `JWT_SECRET_KEY` - JWT signing secret (256-bit)

**Example .env file:**
```bash
DATABASE_URL=jdbc:postgresql://postgres-service.database:5432/rabbitmq_admin
DATABASE_USERNAME=rabbitmq_user
DATABASE_PASSWORD=MySecurePassword123!
JWT_SECRET_KEY=$(openssl rand -base64 32)
```

### Security Best Practices

1. **Generate Secure JWT Secret:**
   ```bash
   openssl rand -base64 32
   ```

2. **Use Strong Database Passwords:**
   ```bash
   openssl rand -base64 24
   ```

3. **Keep Environment Files Secure:**
   - Never commit `.env.*` files to version control
   - Set appropriate file permissions: `chmod 600 .env.*`
   - Store securely in production environments

## 📁 Manifest Files

- `namespace.yaml` - Creates the rabbitmq-admin namespace
- `secret.yaml` - Template for secrets (values injected by deploy script)
- `deployment.yaml` - Application deployment with 1 replica
- `service.yaml` - ClusterIP service
- `ingress.yaml` - Ingress configuration (customize for your ingress controller)

## 🔧 Customization

### Resource Limits

Edit `deployment.yaml` to adjust resource requests and limits:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Replicas

For high availability, increase replicas in `deployment.yaml`:

```yaml
spec:
  replicas: 3  # Change from 1 to 3
```

### Ingress Configuration

Update `ingress.yaml` for your ingress controller:

```yaml
metadata:
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - rabbitmq-admin.yourdomain.com
      secretName: rabbitmq-admin-tls
  rules:
    - host: rabbitmq-admin.yourdomain.com  # Your domain
```

## 🛠️ Deployment Commands

### Deploy to Different Environments

```bash
# Development
./deploy.sh dev

# Staging  
./deploy.sh staging

# Production
./deploy.sh prod
```

### Manual Deployment

```bash
# Apply manifests manually
kubectl apply -f namespace.yaml
kubectl apply -f secret.yaml    # After updating with actual values
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

### Update Secret Values

```bash
# Create/update secret with new values
kubectl create secret generic rabbitmq-admin-secrets \
  --namespace=rabbitmq-admin \
  --from-literal=DATABASE_URL="your-db-url" \
  --from-literal=DATABASE_USERNAME="your-username" \
  --from-literal=DATABASE_PASSWORD="your-password" \
  --from-literal=JWT_SECRET_KEY="your-jwt-secret" \
  --dry-run=client -o yaml | kubectl apply -f -
```

## 📊 Monitoring

### Check Deployment Status

```bash
# Watch pod status
kubectl get pods -n rabbitmq-admin -w

# Check deployment status
kubectl get deployments -n rabbitmq-admin

# View service endpoints
kubectl get svc -n rabbitmq-admin

# Check ingress status
kubectl get ingress -n rabbitmq-admin
```

### View Logs

```bash
# Application logs
kubectl logs -f deployment/rabbitmq-admin -n rabbitmq-admin

# Recent logs
kubectl logs --tail=100 -l app=rabbitmq-admin -n rabbitmq-admin
```

### Health Checks

The application includes health check endpoints:

- **Liveness Probe**: `/actuator/health`
- **Readiness Probe**: `/actuator/health/readiness`

## 🔍 Troubleshooting

### Common Issues

1. **Pod CrashLoopBackOff**
   ```bash
   # Check pod logs
   kubectl logs <pod-name> -n rabbitmq-admin
   
   # Check pod events
   kubectl describe pod <pod-name> -n rabbitmq-admin
   ```

2. **Secret Not Found**
   ```bash
   # Verify secret exists
   kubectl get secrets -n rabbitmq-admin
   
   # Check secret contents (base64 encoded)
   kubectl get secret rabbitmq-admin-secrets -n rabbitmq-admin -o yaml
   ```

3. **Database Connection Issues**
   - Verify database is accessible from cluster
   - Check DATABASE_URL format
   - Ensure database credentials are correct

4. **Ingress Not Working**
   - Verify ingress controller is installed
   - Check ingress annotations for your controller
   - Ensure DNS points to ingress controller

### Debug Commands

```bash
# Port forward for testing
kubectl port-forward svc/rabbitmq-admin-service -n rabbitmq-admin 8080:8080

# Execute shell in pod
kubectl exec -it deployment/rabbitmq-admin -n rabbitmq-admin -- /bin/bash

# Check environment variables in pod
kubectl exec deployment/rabbitmq-admin -n rabbitmq-admin -- env | grep -E "DATABASE|JWT"
```

## 🔄 Updates and Rollbacks

### Rolling Updates

```bash
# Update image version
kubectl set image deployment/rabbitmq-admin rabbitmq-admin=alegon/rabbitmq-admin:v2.0.0 -n rabbitmq-admin

# Check rollout status
kubectl rollout status deployment/rabbitmq-admin -n rabbitmq-admin
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/rabbitmq-admin -n rabbitmq-admin

# Rollback to previous version
kubectl rollout undo deployment/rabbitmq-admin -n rabbitmq-admin
```

## 🧹 Cleanup

### Remove Application

```bash
# Delete all resources
kubectl delete namespace rabbitmq-admin

# Or delete individual resources
kubectl delete -f .
```

## 🔐 Default Credentials

After deployment, access the application with:
- **Username**: `admin`
- **Password**: `admin123!`

⚠️ **Important**: Change these credentials immediately after first login!

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)
- [Application Configuration Guide](../docs/configuration/application-configuration-reference.md)
- [Production Deployment Guide](../docs/deployment/production-deployment.md)