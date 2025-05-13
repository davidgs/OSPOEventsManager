#!/bin/bash

# Forward port from app service
echo "Forwarding application port to localhost:7777..."
kubectl port-forward service/lb-ospo-app 7777:7777 &
APP_PORT_PID=$!

# Forward Keycloak port
echo "Forwarding Keycloak port to localhost:8080..."
kubectl port-forward service/keycloak 8080:8080 &
KEYCLOAK_PORT_PID=$!

# Forward MinIO port
echo "Forwarding MinIO console port to localhost:9001..."
kubectl port-forward service/minio 9001:9001 &
MINIO_PORT_PID=$!

echo "Port forwarding started. Press Ctrl+C to stop."

# Store PIDs for cleanup
echo "${APP_PORT_PID} ${KEYCLOAK_PORT_PID} ${MINIO_PORT_PID}" > port-forward-pids.txt

# Trap Ctrl+C to kill port-forward processes
trap cleanup INT

function cleanup {
    echo "Stopping port forwarding..."
    if [ -f port-forward-pids.txt ]; then
        while read pid; do
            kill $pid 2>/dev/null
        done < <(cat port-forward-pids.txt)
        rm port-forward-pids.txt
    fi
    exit 0
}

# Wait for user to press Ctrl+C
wait