. Please stop itI want access to the KubeFlow dashboard, and KubeFlow trainer#!/bin/bash

# Kubeflow Installation Script for OpenShift
# This script installs Kubeflow using the Open Data Hub operator approach

set -e

echo "🚀 Starting Kubeflow installation on OpenShift..."

# Check if we're connected to OpenShift
if ! oc whoami >/dev/null 2>&1; then
    echo "❌ Not connected to OpenShift. Please run 'oc login' first."
    exit 1
fi

echo "✅ Connected to OpenShift as: $(oc whoami)"

# Create the kubeflow namespace
echo "📦 Creating kubeflow namespace..."
oc create namespace kubeflow --dry-run=client -o yaml | oc apply -f -

# Install the Open Data Hub operator
echo "🔧 Installing Open Data Hub operator..."
cat <<EOF | oc apply -f -
apiVersion: operators.coreos.com/v1
kind: OperatorGroup
metadata:
  name: opendatahub-operator-group
  namespace: kubeflow
spec:
  targetNamespaces:
  - kubeflow
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: opendatahub-operator
  namespace: kubeflow
spec:
  channel: stable
  name: opendatahub-operator
  source: redhat-operators
  sourceNamespace: openshift-marketplace
EOF

echo "⏳ Waiting for operator to be ready..."
oc wait --for=condition=Installed --timeout=300s subscription/opendatahub-operator -n kubeflow || {
    echo "❌ Operator installation failed or timed out"
    exit 1
}

echo "✅ Open Data Hub operator installed successfully"

# Create KFDef resource for Kubeflow
echo "🎯 Creating Kubeflow deployment configuration..."
cat <<EOF | oc apply -f -
apiVersion: kfdef.apps.kubeflow.org/v1
kind: KFDef
metadata:
  name: kubeflow
  namespace: kubeflow
spec:
  applications:
  - kustomizeConfig:
      repoRef:
        name: manifests
        path: apps/jupyter/upstream/overlays/istio
    name: jupyter-web-app
  - kustomizeConfig:
      repoRef:
        name: manifests
        path: apps/centraldashboard/upstream/overlays/istio
    name: centraldashboard
  - kustomizeConfig:
      repoRef:
        name: manifests
        path: apps/profiles/upstream/overlays/istio
    name: profiles
  - kustomizeConfig:
      repoRef:
        name: manifests
        path: apps/pipeline/upstream/overlays/istio
    name: pipeline
  - kustomizeConfig:
      repoRef:
        name: manifests
        path: apps/training-operator/upstream/overlays/istio
    name: training-operator
  - kustomizeConfig:
      repoRef:
        name: manifests
        path: apps/katib/upstream/overlays/istio
    name: katib
  repos:
  - name: manifests
    uri: https://github.com/kubeflow/manifests/archive/v1.7.0.tar.gz
  version: v1.7.0
EOF

echo "⏳ Waiting for Kubeflow components to be deployed..."
echo "This may take several minutes..."

# Wait for pods to be ready
oc wait --for=condition=Ready --timeout=600s pod -l app=centraldashboard -n kubeflow || {
    echo "⚠️  Central dashboard not ready, but continuing..."
}

echo "🔍 Checking Kubeflow installation status..."
oc get pods -n kubeflow

echo "🌐 Setting up access to Kubeflow dashboard..."

# Create a route for the central dashboard
oc expose service centraldashboard -n kubeflow || {
    echo "⚠️  Could not create route for central dashboard"
}

# Create a route for Jupyter
oc expose service jupyter-web-app-service -n kubeflow || {
    echo "⚠️  Could not create route for Jupyter"
}

echo "📋 Kubeflow installation completed!"
echo ""
echo "🔗 Access URLs:"
echo "  Central Dashboard: https://$(oc get route centraldashboard -n kubeflow -o jsonpath='{.spec.host}' 2>/dev/null || echo 'Not available')"
echo "  Jupyter: https://$(oc get route jupyter-web-app-service -n kubeflow -o jsonpath='{.spec.host}' 2>/dev/null || echo 'Not available')"
echo ""
echo "📊 Check installation status with:"
echo "  oc get pods -n kubeflow"
echo "  oc get routes -n kubeflow"
echo ""
echo "🎯 Next steps:"
echo "  1. Access the Kubeflow dashboard"
echo "  2. Create a training pipeline for your SQL fine-tuning"
echo "  3. Test with your existing training data"
