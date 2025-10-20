# Training Dependency Fixes

## Problem Identified

The fine-tuning job was failing with import errors:
- `No module named 'datasets'`
- `No module named 'huggingface_hub'`

## Root Cause

1. **Missing Dependencies**: The training script was missing `huggingface_hub` and other essential dependencies
2. **Incomplete Dependency Installation**: Using `--no-deps` flag was skipping critical dependencies
3. **Python Path Issues**: Packages were installed but not properly accessible

## Fixes Applied

### 1. Updated Dependencies List
```python
packages = [
    "datasets==2.19.0",
    "transformers==4.40.0",
    "peft==0.10.0",
    "accelerate==0.29.0",
    "bitsandbytes==0.43.0",
    "huggingface_hub>=0.19.0"  # ADDED
]
```

### 2. Added Essential Dependencies
```python
essential_deps = [
    "fsspec==2024.3.1",
    "pyarrow>=12.0.0",
    "dill>=0.3.0",
    "multiprocess",
    "xxhash",
    "tokenizers>=0.15.0",      # ADDED
    "safetensors>=0.3.0",      # ADDED
    "numpy>=1.21.0",           # ADDED
    "packaging>=20.0"          # ADDED
]
```

### 3. Improved Installation Strategy
- **First attempt**: Install with dependencies (normal pip install)
- **Fallback**: Install without dependencies if first attempt fails
- **Better error handling**: Continue with other packages if one fails

### 4. Enhanced Python Path Management
- Verify `sys.path` includes `/tmp/python_packages`
- Update `PYTHONPATH` environment variable
- Add diagnostic logging for path verification

### 5. Better Import Error Handling
- Try normal import first
- Fallback to manual module loading if needed
- Non-critical imports (like `huggingface_hub`) are warnings, not failures

## Files Created/Modified

### Modified Files
- `train_cluster_with_deps.py` - Fixed dependency installation and import handling

### New Files
- `training-job-fixed-deps.yaml` - Updated training job with better resource allocation
- `update-training-script.sh` - Script to update the ConfigMap with fixed training script
- `diagnose-training-deps.sh` - Diagnostic script to troubleshoot issues
- `TRAINING_FIXES.md` - This documentation

## Deployment Instructions

1. **Update the training script ConfigMap**:
   ```bash
   ./update-training-script.sh
   ```

2. **Deploy the fixed training job**:
   ```bash
   oc apply -f training-job-fixed-deps.yaml
   ```

3. **Monitor the training**:
   ```bash
   oc logs -f job/sql-finetuning-job-fixed-deps -n dev-rh-events-org
   ```

4. **If issues persist, run diagnostics**:
   ```bash
   ./diagnose-training-deps.sh
   ```

## Expected Improvements

- ✅ All required dependencies should install successfully
- ✅ Python imports should work without errors
- ✅ Training should proceed to actual model fine-tuning
- ✅ Better error messages for troubleshooting

## Resource Allocation Changes

The new training job has improved resource allocation:
- **Memory**: 6Gi request, 12Gi limit (increased from 4Gi/8Gi)
- **CPU**: 2 request, 4 limit (increased from 1/2)
- **GPU**: Explicit nvidia.com/gpu resource request
- **Additional volume**: Dedicated `/tmp/python_packages` mount

This should provide enough resources for the dependency installation and training process.
