#!/bin/bash

# Monitor the fine-tuning job in OpenShift

NAMESPACE=$(oc project -q)
JOB_NAME="sql-finetuning-job"

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# Check job status
check_job_status() {
    echo "🔍 Checking job status..."
    oc get job $JOB_NAME -n $NAMESPACE -o wide
    echo ""
    
    # Get pod status
    POD_NAME=$(oc get pods -n $NAMESPACE -l job-name=$JOB_NAME --no-headers -o custom-columns=":metadata.name" | head -1)
    
    if [[ -n "$POD_NAME" ]]; then
        echo "📦 Pod status:"
        oc get pod $POD_NAME -n $NAMESPACE -o wide
        echo ""
        
        # Check GPU allocation
        echo "🎮 GPU allocation:"
        oc describe pod $POD_NAME -n $NAMESPACE | grep -A 5 -B 5 "nvidia.com/gpu"
        echo ""
    fi
}

# Show logs
show_logs() {
    POD_NAME=$(oc get pods -n $NAMESPACE -l job-name=$JOB_NAME --no-headers -o custom-columns=":metadata.name" | head -1)
    
    if [[ -n "$POD_NAME" ]]; then
        echo "📋 Training logs:"
        oc logs $POD_NAME -n $NAMESPACE -f
    else
        print_error "No pod found for job $JOB_NAME"
    fi
}

# Get training output
get_output() {
    POD_NAME=$(oc get pods -n $NAMESPACE -l job-name=$JOB_NAME --no-headers -o custom-columns=":metadata.name" | head -1)
    
    if [[ -n "$POD_NAME" ]]; then
        echo "📁 Copying trained model from pod..."
        oc cp $NAMESPACE/$POD_NAME:/output ./fine-tuned-model/
        print_success "Model copied to: ./fine-tuned-model/"
    else
        print_error "No pod found for job $JOB_NAME"
    fi
}

# Main menu
case "${1:-status}" in
    "status")
        check_job_status
        ;;
    "logs")
        show_logs
        ;;
    "output")
        get_output
        ;;
    "all")
        check_job_status
        echo ""
        show_logs
        ;;
    *)
        echo "Usage: $0 {status|logs|output|all}"
        echo ""
        echo "Commands:"
        echo "  status  - Show job and pod status"
        echo "  logs    - Follow training logs"
        echo "  output  - Copy trained model from pod"
        echo "  all     - Show status and follow logs"
        ;;
esac
