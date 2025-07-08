# OSPO Events Manager - OpenShift Troubleshooting Guide

This guide provides common troubleshooting steps and solutions for the OSPO Events Manager deployment on OpenShift.

## Quick Status Check

```bash
# Check overall deployment status
./monitor-openshift.sh

# Watch deployment in real-time
./monitor-openshift.sh -w

# Check logs for specific component
./monitor-openshift.sh -c app -l
```

## Common Issues and Solutions

### 1. Permission Errors (Project Creation)

**Symptoms:**
- `namespaces is forbidden: User cannot create resource "namespaces"`
- `projects is forbidden: User cannot create resource "projects"`
- Deployment fails with permission errors

**Root Cause:**
User doesn't have cluster-level permissions to create projects/namespaces.

**Solution:**

1. **Ask cluster administrator to run setup script:**
   ```bash
   # Cluster admin should run this
   ./setup-projects.sh
   ```

2. **Manual project creation (cluster admin):**
   ```bash
   oc new-project prod-rh-events-org

   # Grant permissions to user
   oc adm policy add-role-to-user admin USER_EMAIL -n prod-rh-events-org
   ```

3. **Verify permissions:**
   ```bash
   oc auth can-i create projects
   oc auth can-i create pods -n prod-rh-events-org
   ```

**Note:** Everything (application, database, Keycloak, MinIO, and Otterize security) is installed in the same `prod-rh-events-org` project.

### 2. Application Not Responding

**Symptoms:**
- Route returns 502/503 errors
- Application pods in CrashLoopBackOff state
- Health check fails

**Troubleshooting Steps:**

1. **Check pod status:**
   ```bash
   ./monitor-openshift.sh -c app
   ```

2. **Check application logs:**
   ```bash
   ./monitor-openshift.sh -c app -l
   ```

3. **Check if database is accessible:**
   ```bash
   ./monitor-openshift.sh -c postgres
   ```

4. **Restart application pods:**
   ```bash
   oc rollout restart deployment/ospo-events-application
   ```

### 3. Database Connection Issues

**Symptoms:**
- Application logs show database connection errors
- PostgreSQL pod not running
- Database authentication failures

**Troubleshooting Steps:**

1. **Check PostgreSQL status:**
   ```bash
   ./monitor-openshift.sh -c postgres -l
   ```

2. **Verify database credentials:**
   ```bash
   oc get secret ospo-events-postgresql -o yaml
   ```

3. **Test database connection:**
   ```bash
   # Get PostgreSQL pod name
   POSTGRES_POD=$(oc get pods -l app.kubernetes.io/component=postgresql -o jsonpath='{.items[0].metadata.name}')

   # Test connection
   oc exec $POSTGRES_POD -- psql -U postgres -d ospo_events -c "SELECT 1"
   ```

### 4. Keycloak Authentication Issues

**Symptoms:**
- Login redirects fail
- Authentication errors
- Keycloak not accessible

**Troubleshooting Steps:**

1. **Check Keycloak status:**
   ```bash
   ./monitor-openshift.sh -c keycloak -l
   ```

2. **Verify Keycloak configuration:**
   ```bash
   oc get configmap ospo-events-keycloak-config -o yaml
   ```

3. **Test Keycloak endpoint:**
   ```bash
   KEYCLOAK_POD=$(oc get pods -l app.kubernetes.io/component=keycloak -o jsonpath='{.items[0].metadata.name}')
   oc exec $KEYCLOAK_POD -- curl -s http://localhost:8080/auth/realms/ospo/.well-known/openid_configuration
   ```

### 5. Storage Issues

**Symptoms:**
- PVC in Pending state
- Out of storage space
- File upload failures

**Troubleshooting Steps:**

1. **Check PVC status:**
   ```bash
   oc get pvc -l app.kubernetes.io/instance=ospo-events
   ```

2. **Check storage usage:**
   ```bash
   # Check MinIO storage
   MINIO_POD=$(oc get pods -l app.kubernetes.io/component=minio -o jsonpath='{.items[0].metadata.name}')
   oc exec $MINIO_POD -- df -h
   ```

3. **Verify storage class:**
   ```bash
   oc get storageclass
   ```

### 6. Route/Network Issues

**Symptoms:**
- Cannot access application via route
- SSL certificate errors
- Route not created

**Troubleshooting Steps:**

1. **Check route configuration:**
   ```bash
   oc get routes -l app.kubernetes.io/instance=ospo-events
   ```

2. **Test route connectivity:**
   ```bash
   ROUTE_URL=$(oc get routes -l app.kubernetes.io/instance=ospo-events -o jsonpath='{.items[0].spec.host}')
   curl -k -v https://$ROUTE_URL
   ```

3. **Check service endpoints:**
   ```bash
   oc get endpoints -l app.kubernetes.io/instance=ospo-events
   ```

## Update and Rollback Scenarios

### Updating the Application

1. **Update application code only:**
   ```bash
   ./update-openshift.sh -t app
   ```

2. **Update configuration only:**
   ```bash
   ./update-openshift.sh -t config -f values-openshift-secure.yaml
   ```

3. **Update everything:**
   ```bash
   ./update-openshift.sh
   ```

4. **Force update without changes:**
   ```bash
   ./update-openshift.sh --force
   ```

### Rollback Procedures

1. **Check revision history:**
   ```bash
   helm history ospo-events -n prod-rh-events-org
   ```

2. **Rollback to previous version:**
   ```bash
   ./update-openshift.sh -r 2
   ```

3. **Monitor rollback progress:**
   ```bash
   ./monitor-openshift.sh -w
   ```

## Monitoring and Alerting

### Real-time Monitoring

1. **Watch all components:**
   ```bash
   ./monitor-openshift.sh -w
   ```

2. **Watch specific component:**
   ```bash
   ./monitor-openshift.sh -c app -w
   ```

3. **Monitor with logs:**
   ```bash
   ./monitor-openshift.sh -w -l
   ```

### Log Analysis

1. **Get recent logs from all components:**
   ```bash
   ./monitor-openshift.sh -l
   ```

2. **Get more detailed logs:**
   ```bash
   ./monitor-openshift.sh -c app -l -n 500
   ```

3. **Follow live logs:**
   ```bash
   oc logs -f -l app.kubernetes.io/component=application
   ```

## Performance Issues

### Resource Constraints

1. **Check resource usage:**
   ```bash
   oc top pods -l app.kubernetes.io/instance=ospo-events
   ```

2. **Check resource limits:**
   ```bash
   oc describe pods -l app.kubernetes.io/instance=ospo-events | grep -A 5 "Limits"
   ```

3. **Scale application:**
   ```bash
   oc scale deployment ospo-events-application --replicas=3
   ```

### Database Performance

1. **Check database connections:**
   ```bash
   POSTGRES_POD=$(oc get pods -l app.kubernetes.io/component=postgresql -o jsonpath='{.items[0].metadata.name}')
   oc exec $POSTGRES_POD -- psql -U postgres -d ospo_events -c "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **Check slow queries:**
   ```bash
   oc exec $POSTGRES_POD -- psql -U postgres -d ospo_events -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
   ```

## Emergency Procedures

### Complete Restart

1. **Restart all components:**
   ```bash
   oc rollout restart deployment/ospo-events-application
   oc rollout restart deployment/ospo-events-keycloak
   oc rollout restart deployment/ospo-events-postgresql
   oc rollout restart deployment/ospo-events-minio
   ```

2. **Monitor restart progress:**
   ```bash
   ./monitor-openshift.sh -w
   ```

### Emergency Rollback

1. **Immediate rollback to last known good version:**
   ```bash
   helm rollback ospo-events -n prod-rh-events-org --wait --timeout=10m
   ```

2. **Verify rollback:**
   ```bash
   ./monitor-openshift.sh
   ```

## Useful Commands Reference

### OpenShift CLI Commands

```bash
# Project management
oc project prod-rh-events-org
oc get all -l app.kubernetes.io/instance=ospo-events

# Pod management
oc get pods -o wide
oc logs <pod-name> -f
oc exec <pod-name> -- <command>
oc describe pod <pod-name>

# Service and route management
oc get svc,routes
oc port-forward service/ospo-events-application 8080:4576

# Storage management
oc get pvc,pv
oc describe pvc <pvc-name>

# Events and troubleshooting
oc get events --sort-by=.metadata.creationTimestamp
oc describe deployment <deployment-name>
```

### Helm Commands

```bash
# Release management
helm list -n prod-rh-events-org
helm status ospo-events -n prod-rh-events-org
helm history ospo-events -n prod-rh-events-org

# Values and configuration
helm get values ospo-events -n prod-rh-events-org
helm get manifest ospo-events -n prod-rh-events-org

# Upgrade and rollback
helm upgrade ospo-events ./ospo-app-chart -n prod-rh-events-org
helm rollback ospo-events <revision> -n prod-rh-events-org
```

## Getting Help

### Log Collection

When reporting issues, please collect and provide:

1. **Deployment status:**
   ```bash
   ./monitor-openshift.sh > deployment-status.txt
   ```

2. **Recent logs:**
   ```bash
   ./monitor-openshift.sh -l > recent-logs.txt
   ```

3. **Helm information:**
   ```bash
   helm status ospo-events -n prod-rh-events-org > helm-status.txt
   helm history ospo-events -n prod-rh-events-org > helm-history.txt
   ```

4. **OpenShift events:**
   ```bash
   oc get events --sort-by=.metadata.creationTimestamp > events.txt
   ```

### Support Contacts

- **Application Issues**: Check application logs and health endpoints
- **Infrastructure Issues**: Check OpenShift cluster status and resources
- **Database Issues**: Check PostgreSQL logs and connection settings
- **Authentication Issues**: Check Keycloak configuration and realm settings

## Preventive Measures

### Regular Health Checks

1. **Set up monitoring cron job:**
   ```bash
   # Add to crontab
   */5 * * * * /path/to/monitor-openshift.sh > /tmp/ospo-health.log 2>&1
   ```

2. **Regular backup verification:**
   ```bash
   # Check database backups
   oc exec $POSTGRES_POD -- pg_dumpall -U postgres > backup-test.sql
   ```

3. **Resource usage monitoring:**
   ```bash
   # Check resource trends
   oc top pods -l app.kubernetes.io/instance=ospo-events --sort-by=memory
   ```

### Update Best Practices

1. **Always test updates in staging first**
2. **Take database backup before major updates**
3. **Monitor deployment during updates**
4. **Have rollback plan ready**
5. **Update during low-traffic periods**

## Security Considerations

### Regular Security Checks

1. **Check for security updates:**
   ```bash
   helm repo update
   helm search repo ospo-events --versions
   ```

2. **Review pod security context:**
   ```bash
   oc get pods -o yaml | grep -A 10 securityContext
   ```

3. **Check network policies:**
   ```bash
   oc get networkpolicies
   ```

### Incident Response

1. **Isolate affected components**
2. **Collect forensic information**
3. **Apply security patches**
4. **Review and update security policies**

This troubleshooting guide should help you quickly identify and resolve common issues with the OSPO Events Manager OpenShift deployment.