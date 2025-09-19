# Fine-Tuning Instructions for SQL Query Generation

## Dataset Overview
- **Total Examples**: 117
- **Training Examples**: ~99
- **Validation Examples**: ~17
- **Format**: JSONL (JSON Lines) and JSON

## Files
- `train.jsonl` - Training set in JSONL format
- `validation.jsonl` - Validation set in JSONL format
- `train.json` - Training set in JSON format
- `validation.json` - Validation set in JSON format
- `complete-dataset.json` - Full dataset
- `final-dataset-stats.json` - Dataset statistics

## Recommended Fine-Tuning Parameters

### For Qwen2.5:7b-instruct
```bash
# Using LoRA (Low-Rank Adaptation)
python fine_tune.py \
  --model_name qwen2.5:7b-instruct \
  --train_file train.jsonl \
  --validation_file validation.jsonl \
  --output_dir ./sql-qwen-finetuned \
  --learning_rate 2e-4 \
  --batch_size 4 \
  --gradient_accumulation_steps 4 \
  --num_epochs 3 \
  --warmup_steps 100 \
  --lora_rank 16 \
  --lora_alpha 32 \
  --target_modules "q_proj,k_proj,v_proj,o_proj"
```

### Expected Training Time
- **GPU**: A100 (40GB) - ~4-6 hours
- **GPU**: RTX 4090 (24GB) - ~8-12 hours  
- **GPU**: V100 (16GB) - ~12-18 hours

### Cloud Training Options
- **Google Colab Pro+**: A100 runtime
- **AWS SageMaker**: ml.p3.2xlarge or ml.g5.xlarge
- **Azure ML**: Standard_NC24ads_A100_v4
- **Vast.ai**: Spot instances with A100/RTX 4090

## Validation Metrics
Monitor these during training:
- **Loss**: Should decrease steadily
- **Accuracy**: SQL syntax correctness
- **BLEU Score**: Query similarity to expected output
- **Execution Success Rate**: Queries that run without errors

## Post-Training Validation
Test the fine-tuned model with:
1. **Syntax validation**: All generated queries should be valid PostgreSQL
2. **Security validation**: All queries should be read-only (SELECT only)
3. **Performance testing**: Queries should use indexes appropriately
4. **Domain accuracy**: Geographic and temporal queries should be correct

## Deployment
1. Export the fine-tuned model to GGUF format for Ollama
2. Test with a subset of production queries
3. Deploy with A/B testing against the base model
4. Monitor performance metrics in production

## Success Criteria
- **Query Success Rate**: >95% (up from current ~85%)
- **Fallback Usage**: <5% (down from current ~15%)
- **Response Time**: <500ms average
- **User Satisfaction**: Improved accuracy for geographic and temporal queries

Generated: 2025-09-18T18:15:35.676Z
