import yaml
import sys

try:
    with open(sys.argv[1], 'r') as f:
        yaml.safe_load(f)
    print(f"YAML validation successful for {sys.argv[1]}")
except Exception as e:
    print(f"YAML validation failed: {e}")