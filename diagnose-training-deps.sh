#!/bin/bash

# Diagnostic script for training dependency issues

echo "🔍 Diagnosing training dependency issues..."

# Check if we're in the right namespace
echo "📋 Current namespace:"
oc project

echo ""
echo "🔍 Checking existing training jobs..."
oc get jobs -l app=sql-finetuning -n dev-rh-events-org

echo ""
echo "🔍 Checking ConfigMaps..."
oc get configmaps | grep training

echo ""
echo "🔍 Checking if training data ConfigMap exists..."
oc get configmap training-data -n dev-rh-events-org

echo ""
echo "🔍 Checking GPU nodes..."
oc get nodes -l nvidia.com/gpu.present=true

echo ""
echo "🔍 Checking existing training pods..."
oc get pods -l app=sql-finetuning -n dev-rh-events-org

echo ""
echo "🔍 Checking recent training job logs (if any)..."
RECENT_POD=$(oc get pods -l app=sql-finetuning -n dev-rh-events-org --sort-by=.metadata.creationTimestamp -o name | tail -1)
if [ ! -z "$RECENT_POD" ]; then
    echo "Recent pod: $RECENT_POD"
    echo "Last 50 lines of logs:"
    oc logs $RECENT_POD -n dev-rh-events-org --tail=50
else
    echo "No recent training pods found"
fi

echo ""
echo "🔍 Checking Python package installation in recent pod..."
if [ ! -z "$RECENT_POD" ]; then
    echo "Checking Python path and packages..."
    oc exec $RECENT_POD -n dev-rh-events-org -- python3 -c "
import sys
print('Python paths:')
for p in sys.path[:5]:
    print(f'  {p}')
print()
print('Checking /tmp/python_packages...')
import os
if os.path.exists('/tmp/python_packages'):
    packages = os.listdir('/tmp/python_packages')
    print(f'Packages found: {len(packages)}')
    for p in packages[:10]:
        print(f'  {p}')
else:
    print('  /tmp/python_packages not found')
print()
print('Testing imports...')
try:
    import datasets
    print('✅ datasets imported successfully')
except Exception as e:
    print(f'❌ datasets import failed: {e}')

try:
    import huggingface_hub
    print('✅ huggingface_hub imported successfully')
except Exception as e:
    print(f'❌ huggingface_hub import failed: {e}')

try:
    import transformers
    print('✅ transformers imported successfully')
except Exception as e:
    print(f'❌ transformers import failed: {e}')
"
fi

echo ""
echo "✅ Diagnosis complete!"
echo ""
echo "🔧 To fix and redeploy:"
echo "1. ./update-training-script.sh"
echo "2. oc apply -f training-job-fixed-deps.yaml"
echo "3. oc logs -f job/sql-finetuning-job-fixed-deps -n dev-rh-events-org"
