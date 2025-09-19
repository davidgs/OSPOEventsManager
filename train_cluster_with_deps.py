#!/usr/bin/env python3
"""
Fine-tune Qwen2.5-7B-Instruct for SQL generation in OpenShift cluster
"""

import subprocess
import sys
import os
import json
import logging

# Add the package directory to Python path immediately
sys.path.insert(0, '/tmp/python_packages')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def install_dependencies():
    """Install required packages"""
    logger.info("🔧 Installing required packages...")

    # Set up a writable location for pip installs
    install_dir = "/tmp/python_packages"
    os.makedirs(install_dir, exist_ok=True)
    os.environ['PYTHONPATH'] = f"{install_dir}:{os.environ.get('PYTHONPATH', '')}"

    packages = [
        "datasets==2.19.0",
        "transformers==4.40.0",
        "peft==0.10.0",
        "accelerate==0.29.0",
        "bitsandbytes==0.43.0"
    ]

    for package in packages:
        logger.info(f"Installing {package}...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", package,
                "--no-cache-dir", "--target", install_dir, "--break-system-packages",
                "--no-deps"  # Skip dependency resolution to avoid conflicts
            ])
            logger.info(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to install {package}: {e}")
            # Don't exit immediately, try to install other packages
            logger.info("Continuing with other packages...")

    # Now install any missing dependencies that we actually need
    essential_deps = [
        "fsspec==2024.3.1",  # Compatible version for datasets
        "pyarrow>=12.0.0",
        "dill>=0.3.0",
        "multiprocess",
        "xxhash"
    ]

    for dep in essential_deps:
        logger.info(f"Installing essential dependency: {dep}...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", dep,
                "--no-cache-dir", "--target", install_dir, "--break-system-packages",
                "--no-deps"
            ])
            logger.info(f"✅ {dep} installed successfully")
        except subprocess.CalledProcessError as e:
            logger.warning(f"⚠️ Failed to install {dep}: {e}")
            # Continue anyway

    logger.info("✅ All dependencies installed successfully!")

# Install dependencies first
install_dependencies()

# Now import the required packages
try:
    import torch
    logger.info("✅ PyTorch imported successfully!")

    # Try importing datasets
    try:
        from datasets import Dataset
        logger.info("✅ datasets imported successfully!")
    except ImportError as e:
        logger.error(f"❌ datasets import error: {e}")
        # Try to import manually
        import importlib.util
        datasets_path = "/tmp/python_packages/datasets/__init__.py"
        if os.path.exists(datasets_path):
            spec = importlib.util.spec_from_file_location("datasets", datasets_path)
            datasets_module = importlib.util.module_from_spec(spec)
            sys.modules["datasets"] = datasets_module
            spec.loader.exec_module(datasets_module)
            from datasets import Dataset
            logger.info("✅ datasets imported via manual loading!")
        else:
            logger.error("❌ datasets __init__.py not found")
            raise e

    from transformers import (
        AutoTokenizer, AutoModelForCausalLM,
        TrainingArguments, Trainer,
        DataCollatorForLanguageModeling
    )
    logger.info("✅ transformers imported successfully!")

    from peft import LoraConfig, get_peft_model, TaskType
    logger.info("✅ peft imported successfully!")

    from datetime import datetime
    logger.info("✅ All modules imported successfully!")

except ImportError as e:
    logger.error(f"❌ Import error: {e}")
    logger.info("🔍 Checking installed packages...")
    import subprocess
    result = subprocess.run([sys.executable, "-c", "import sys; print('\\n'.join(sys.path))"],
                          capture_output=True, text=True)
    logger.info(f"Python path: {result.stdout}")

    # List what's actually in the package directory
    import os
    if os.path.exists('/tmp/python_packages'):
        packages = os.listdir('/tmp/python_packages')
        logger.info(f"Packages in /tmp/python_packages: {packages[:20]}...")  # Show first 20

        # Check if datasets directory exists and its contents
        datasets_dir = "/tmp/python_packages/datasets"
        if os.path.exists(datasets_dir):
            datasets_contents = os.listdir(datasets_dir)
            logger.info(f"datasets directory contents: {datasets_contents[:10]}...")

    # Try a simple test import
    try:
        sys.path.insert(0, '/tmp/python_packages')
        import datasets
        logger.info("✅ Simple datasets import worked!")
    except Exception as e2:
        logger.error(f"❌ Simple import also failed: {e2}")

    sys.exit(1)

def load_dataset_from_configmap(train_file="/data/train.jsonl", val_file="/data/validation.jsonl"):
    """Load dataset from mounted ConfigMap"""
    logger.info("Loading dataset from ConfigMap...")

    with open(train_file, 'r') as f:
        train_data = [json.loads(line) for line in f]

    with open(val_file, 'r') as f:
        val_data = [json.loads(line) for line in f]

    logger.info(f"Loaded {len(train_data)} training examples, {len(val_data)} validation examples")
    return Dataset.from_list(train_data), Dataset.from_list(val_data)

def format_messages(examples):
    """Format messages for training"""
    formatted = []
    for example in examples['messages']:
        text = ""
        for message in example:
            role = message['role']
            content = message['content']
            if role == 'system':
                text += f"<|im_start|>system\n{content}<|im_end|>\n"
            elif role == 'user':
                text += f"<|im_start|>user\n{content}<|im_end|>\n"
            elif role == 'assistant':
                text += f"<|im_start|>assistant\n{content}<|im_end|>\n"
        formatted.append(text)
    return {'text': formatted}

def main():
    logger.info("🚀 Starting SQL Generation Fine-tuning in OpenShift")

    # Configuration
    MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"
    OUTPUT_DIR = "/output/sql-qwen-finetuned"

    # Training parameters (optimized for cluster GPU)
    LEARNING_RATE = 2e-4
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', '1'))  # Very conservative for shared GPU
    GRADIENT_ACCUMULATION_STEPS = int(os.getenv('GRADIENT_ACCUMULATION_STEPS', '32'))
    NUM_EPOCHS = int(os.getenv('NUM_EPOCHS', '1'))
    WARMUP_STEPS = int(os.getenv('WARMUP_STEPS', '50'))

    # LoRA parameters
    LORA_RANK = int(os.getenv('LORA_RANK', '4'))
    LORA_ALPHA = int(os.getenv('LORA_ALPHA', '8'))
    LORA_DROPOUT = float(os.getenv('LORA_DROPOUT', '0.1'))

    # Check GPU availability
    if torch.cuda.is_available():
        gpu_count = torch.cuda.device_count()
        logger.info(f"✅ CUDA available with {gpu_count} GPU(s)")
        for i in range(gpu_count):
            gpu_name = torch.cuda.get_device_name(i)
            gpu_memory = torch.cuda.get_device_properties(i).total_memory / 1024**3
            logger.info(f"  GPU {i}: {gpu_name} ({gpu_memory:.1f}GB)")
    else:
        logger.error("❌ CUDA not available!")
        exit(1)

    # Load tokenizer and model
    logger.info(f"Loading model: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
        use_cache=False  # Disable cache for training
    )

    # Add padding token if not present
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Setup LoRA
    logger.info("Setting up LoRA configuration...")
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=LORA_RANK,
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Load and prepare dataset
    train_dataset, val_dataset = load_dataset_from_configmap()

    # Tokenize dataset
    def tokenize_function(examples):
        formatted = format_messages(examples)
        return tokenizer(
            formatted['text'],
            truncation=True,
            padding=False,
            max_length=2048,
            return_tensors="pt"
        )

    logger.info("Tokenizing datasets...")
    train_dataset = train_dataset.map(tokenize_function, batched=True, remove_columns=train_dataset.column_names)
    val_dataset = val_dataset.map(tokenize_function, batched=True, remove_columns=val_dataset.column_names)

    # Data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,
    )

    # Training arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        overwrite_output_dir=True,
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
        learning_rate=LEARNING_RATE,
        warmup_steps=WARMUP_STEPS,
        logging_steps=5,
        save_steps=100,
        eval_steps=100,
        evaluation_strategy="steps",
        save_strategy="steps",
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        fp16=True,
        dataloader_pin_memory=False,
        remove_unused_columns=False,
        report_to=None,  # Disable wandb in cluster
        gradient_checkpointing=True,  # Save memory
    )

    # Create trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=data_collator,
        tokenizer=tokenizer,
    )

    # Train
    logger.info("🏃 Starting training...")
    trainer.train()

    # Save final model
    logger.info("💾 Saving model...")
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    logger.info("✅ Training completed successfully!")
    logger.info(f"Model saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
