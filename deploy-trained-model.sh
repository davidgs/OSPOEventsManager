#!/bin/bash

# Deploy the fine-tuned model to replace the current Ollama model

set -e

NAMESPACE="sql-finetuning"
FINETUNED_MODEL_DIR="./fine-tuned-model/sql-qwen-finetuned"

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

if [[ ! -d "$FINETUNED_MODEL_DIR" ]]; then
    print_error "Fine-tuned model not found at: $FINETUNED_MODEL_DIR"
    print_status "Please run: ./monitor-training.sh output"
    exit 1
fi

print_status "🔄 Converting fine-tuned model to GGUF format for Ollama..."

# Create conversion script
cat > convert-to-gguf.py << 'EOCONV'
#!/usr/bin/env python3
"""
Convert fine-tuned model to GGUF format for Ollama
"""

import os
import subprocess
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

def convert_model():
    print("🔄 Converting LoRA adapter to full model...")
    
    # Load base model and adapter
    base_model_name = "Qwen/Qwen2.5-7B-Instruct"
    adapter_path = "./fine-tuned-model/sql-qwen-finetuned"
    output_path = "./fine-tuned-model/merged-model"
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(base_model_name)
    
    # Load base model
    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype="auto",
        device_map="auto"
    )
    
    # Load and merge LoRA adapter
    model = PeftModel.from_pretrained(model, adapter_path)
    model = model.merge_and_unload()
    
    # Save merged model
    model.save_pretrained(output_path)
    tokenizer.save_pretrained(output_path)
    
    print(f"✅ Merged model saved to: {output_path}")
    
    # Convert to GGUF using llama.cpp
    print("🔄 Converting to GGUF format...")
    
    # This would require llama.cpp conversion tools
    print("⚠️  GGUF conversion requires llama.cpp tools")
    print("   Manual steps:")
    print("   1. Install llama.cpp")
    print("   2. Run: python convert-hf-to-gguf.py merged-model")
    print("   3. Run: ./quantize merged-model.gguf merged-model-q4_0.gguf q4_0")

if __name__ == "__main__":
    convert_model()
EOCONV

python3 convert-to-gguf.py

print_status "📋 Next steps to deploy the fine-tuned model:"
print_status "1. Complete GGUF conversion (see instructions above)"
print_status "2. Copy GGUF file to Ollama pod:"
print_status "   oc cp merged-model-q4_0.gguf ollama-pod:/root/.ollama/models/"
print_status "3. Create Ollama model file:"
print_status "   oc exec ollama-pod -- ollama create sql-qwen-finetuned -f /path/to/modelfile"
print_status "4. Update OLLAMA_MODEL environment variable to use the new model"

print_success "🎯 Fine-tuned model conversion initiated!"
