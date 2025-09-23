#!/bin/bash

# Update the training script ConfigMap with the fixed version

echo "🔧 Updating training script ConfigMap with fixed dependencies..."

# Delete existing ConfigMap if it exists
oc delete configmap training-script-with-deps-fixed -n dev-rh-events-org --ignore-not-found=true

# Create new ConfigMap with the fixed training script
oc create configmap training-script-with-deps-fixed \
  --from-file=train_cluster_with_deps.py \
  -n dev-rh-events-org

echo "✅ ConfigMap updated successfully!"

# Verify the ConfigMap was created
echo "🔍 Verifying ConfigMap contents..."
oc get configmap training-script-with-deps-fixed -n dev-rh-events-org -o yaml | head -20

echo ""
echo "🚀 Ready to deploy training job with fixed dependencies!"
echo "Run: oc apply -f training-job-fixed-deps.yaml"
