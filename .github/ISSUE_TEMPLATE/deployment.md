---
name: Deployment Issue
about: Report issues related to deployment or configuration
title: '[DEPLOY] '
labels: deployment
assignees: ''

---

## Deployment Issue
<!-- Brief description of the deployment problem -->

## Environment
- **Deployment Type**: [OpenShift / Kubernetes / Other]
- **Environment**: [Dev / Prod / Staging]
- **Namespace**: [e.g., prod-rh-events-org]
- **Cluster**: [e.g., ospo-osci.z3b1.p1.openshiftapps.com]
- **Deployment Method**: [deploy.sh / Manual / CI/CD]
- **Application Version**:

## Deployment Command
<!-- What command did you run? -->
```bash
./deploy.sh --prod
```

## Configuration
- **Environment Variables**: [Configured via .env / ConfigMap / Secret]
- **Custom Configurations**: [Any custom settings applied]

## Expected Behavior
<!-- What should have happened during deployment? -->

## Actual Behavior
<!-- What actually happened? -->

## Error Output
<!-- Paste the complete error output -->
<details>
<summary>Deployment logs</summary>

```
Paste deployment logs here
```
</details>

## Pod Status
<!-- Output of `oc get pods` or `kubectl get pods` -->
```
NAME                        READY   STATUS    RESTARTS   AGE
ospo-app-xxxxx             0/1     Error     0          5m
```

## Pod Logs
<!-- Output of `oc logs <pod-name>` for failing pods -->
<details>
<summary>Pod logs</summary>

```
Paste pod logs here
```
</details>

## Events
<!-- Output of `oc get events` or `kubectl get events` -->
<details>
<summary>Cluster events</summary>

```
Paste events here
```
</details>

## Resource Status
<!-- Check resource status -->
- [ ] Pods running
- [ ] Services created
- [ ] Routes/Ingress configured
- [ ] ConfigMaps applied
- [ ] Secrets present
- [ ] PVCs bound
- [ ] ImageStream created (if OpenShift)
- [ ] BuildConfig successful (if OpenShift)

## Pre-Deployment Checklist
<!-- What was done before deployment? -->
- [ ] Ran `./configure.sh`
- [ ] Updated `.env` file
- [ ] Logged into OpenShift/Kubernetes
- [ ] In correct namespace
- [ ] Previous deployment cleaned up (if redeploying)
- [ ] Database initialized
- [ ] Keycloak configured

## Component Affected
<!-- Which component is having issues? -->
- [ ] PostgreSQL
- [ ] Keycloak
- [ ] Application (ospo-app)
- [ ] MinIO
- [ ] Routes/Ingress
- [ ] Persistent Storage
- [ ] All components

## Previous Deployments
<!-- Has this worked before? -->
- **Last Successful Deployment**: [Date or N/A]
- **Changes Since Last Deployment**: [What changed?]

## Additional Context
<!-- Add any other context about the problem -->

### Network Connectivity
- [ ] Can access cluster
- [ ] Can pull images
- [ ] DNS resolution working
- [ ] Certificates valid

### Related Issues
<!-- Link to related deployment issues -->
- Related to #
- Similar to #

## Troubleshooting Steps Attempted
<!-- What have you tried to fix this? -->
1.
2.
3.

---

**For Maintainers:**
- [ ] Issue reproduced
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Documentation updated
- [ ] Deployment tested
