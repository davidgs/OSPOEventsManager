#!/bin/bash

# Monitor the minimal training job
JOB_NAME="sql-finetuning-job-final"
NAMESPACE=$(oc project -q)

echo "🔍 Monitoring training job: $JOB_NAME in namespace: $NAMESPACE"
echo "=========================================="

# Function to check job status
check_status() {
    echo "📊 Job Status:"
    oc get job $JOB_NAME -o wide 2>/dev/null || echo "❌ Job not found"

    echo ""
    echo "🏃 Pod Status:"
    oc get pods -l job-name=$JOB_NAME -o wide 2>/dev/null || echo "❌ No pods found"

    echo ""
}

# Function to show logs
show_logs() {
    echo "📝 Training Logs:"
    echo "=================="
    POD_NAME=$(oc get pods -l job-name=$JOB_NAME -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [[ -n "$POD_NAME" ]]; then
        oc logs $POD_NAME -f
    else
        echo "❌ No pod found to show logs"
    fi
}

# Function to show events
show_events() {
    echo "📋 Recent Events:"
    echo "=================="
    POD_NAME=$(oc get pods -l job-name=$JOB_NAME -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [[ -n "$POD_NAME" ]]; then
        oc describe pod $POD_NAME | grep -A 20 "Events:"
    else
        echo "❌ No pod found to show events"
    fi
}

# Parse command line arguments
case "${1:-status}" in
    "status")
        check_status
        ;;
    "logs")
        show_logs
        ;;
    "events")
        show_events
        ;;
    "all")
        check_status
        echo ""
        show_events
        ;;
    "watch")
        watch -n 10 "$0 status"
        ;;
    *)
        echo "Usage: $0 [status|logs|events|all|watch]"
        echo "  status  - Show job and pod status (default)"
        echo "  logs    - Show training logs (follows)"
        echo "  events  - Show pod events"
        echo "  all     - Show status and events"
        echo "  watch   - Continuously monitor status"
        exit 1
        ;;
esac
