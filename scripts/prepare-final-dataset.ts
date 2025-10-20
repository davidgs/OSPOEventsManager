#!/usr/bin/env tsx
/**
 * Prepare Final Training Dataset for Fine-Tuning
 *
 * This script combines all our generated datasets:
 * - Production query logs (extracted)
 * - Comprehensive training examples (64 examples)
 * - PostgreSQL documentation examples (37 examples)
 * - Additional synthetic examples for edge cases
 *
 * And formats them for fine-tuning with proper train/validation split.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TrainingExample {
  instruction: string;
  input: string;
  output: string;
  metadata?: any;
}

interface FineTuningExample {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  metadata?: any;
}

class FinalDatasetPreparator {
  private allExamples: TrainingExample[] = [];
  private outputDir = path.join(__dirname, '../training-data');
  private finalDir = path.join(this.outputDir, 'final');

  constructor() {
    if (!fs.existsSync(this.finalDir)) {
      fs.mkdirSync(this.finalDir, { recursive: true });
    }
  }

  /**
   * Load all existing datasets
   */
  loadAllDatasets(): void {
    console.log('📂 Loading all existing datasets...');

    const datasetFiles = [
      'comprehensive-training-dataset.json',
      'postgresql-documentation-dataset.json',
      'training-dataset.json' // Original extracted logs
    ];

    let totalLoaded = 0;

    for (const filename of datasetFiles) {
      const filepath = path.join(this.outputDir, filename);
      if (fs.existsSync(filepath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
          const examples = Array.isArray(data) ? data : [];
          this.allExamples.push(...examples);
          console.log(`  ✅ Loaded ${examples.length} examples from ${filename}`);
          totalLoaded += examples.length;
        } catch (error) {
          console.warn(`  ⚠️  Failed to load ${filename}:`, error);
        }
      } else {
        console.warn(`  ⚠️  File not found: ${filename}`);
      }
    }

    console.log(`📊 Total loaded: ${totalLoaded} examples`);
  }

  /**
   * Generate additional synthetic examples for edge cases
   */
  generateSyntheticExamples(): void {
    console.log('🔮 Generating additional synthetic examples...');

    const syntheticExamples: TrainingExample[] = [
      // Edge cases that commonly fail
      {
        instruction: "Generate a PostgreSQL SELECT query for: Show me events",
        input: this.getSchemaContext(),
        output: "SELECT id, name, location, start_date, end_date, status, priority, type FROM events ORDER BY start_date DESC LIMIT 20",
        metadata: { category: 'general', complexity: 'simple', pattern: 'vague_request', synthetic: true }
      },
      {
        instruction: "Generate a PostgreSQL SELECT query for: List events",
        input: this.getSchemaContext(),
        output: "SELECT id, name, location, start_date, end_date, status FROM events ORDER BY start_date DESC",
        metadata: { category: 'general', complexity: 'simple', pattern: 'simple_list', synthetic: true }
      },
      {
        instruction: "Generate a PostgreSQL SELECT query for: What events do we have?",
        input: this.getSchemaContext(),
        output: "SELECT id, name, location, start_date, end_date, status, type FROM events ORDER BY start_date DESC LIMIT 50",
        metadata: { category: 'general', complexity: 'simple', pattern: 'question_format', synthetic: true }
      },
      {
        instruction: "Generate a PostgreSQL SELECT query for: Events",
        input: this.getSchemaContext(),
        output: "SELECT id, name, location, start_date, end_date, status FROM events ORDER BY start_date DESC LIMIT 25",
        metadata: { category: 'general', complexity: 'simple', pattern: 'single_word', synthetic: true }
      },
      {
        instruction: "Generate a PostgreSQL SELECT query for: Find events with no location",
        input: this.getSchemaContext(),
        output: "SELECT id, name, location, start_date, end_date, status FROM events WHERE location IS NULL OR location = '' ORDER BY start_date DESC",
        metadata: { category: 'general', complexity: 'medium', pattern: 'null_handling', synthetic: true }
      },
      {
        instruction: "Generate a PostgreSQL SELECT query for: Events without countries",
        input: this.getSchemaContext(),
        output: "SELECT id, name, location, country, start_date FROM events WHERE country IS NULL ORDER BY start_date DESC",
        metadata: { category: 'geographic', complexity: 'simple', pattern: 'missing_geographic_data', synthetic: true }
      },
      {
        instruction: "Generate a PostgreSQL SELECT query for: Show cancelled events",
        input: this.getSchemaContext(),
        output: "SELECT id, name, location, start_date, end_date, status FROM events WHERE status = 'cancelled' ORDER BY start_date DESC",
        metadata: { category: 'status_priority', complexity: 'simple', pattern: 'cancelled_events', synthetic: true }
      },
      {
        instruction: "Generate a PostgreSQL SELECT query for: Events that have ended",
        input: this.getSchemaContext(),
        output: "SELECT id, name, location, start_date, end_date, status FROM events WHERE end_date < NOW() ORDER BY end_date DESC",
        metadata: { category: 'temporal', complexity: 'simple', pattern: 'ended_events', synthetic: true }
      },
      {
        instruction: "Generate a PostgreSQL SELECT query for: Long event names",
        input: this.getSchemaContext(),
        output: "SELECT id, name, LENGTH(name) as name_length FROM events WHERE LENGTH(name) > 50 ORDER BY LENGTH(name) DESC",
        metadata: { category: 'postgresql_strings', complexity: 'medium', pattern: 'string_length_filter', synthetic: true }
      },
      {
        instruction: "Generate a PostgreSQL SELECT query for: Events by creation date",
        input: this.getSchemaContext(),
        output: "SELECT id, name, created_at, start_date FROM events ORDER BY created_at DESC LIMIT 30",
        metadata: { category: 'temporal', complexity: 'simple', pattern: 'creation_date_sort', synthetic: true }
      }
    ];

    this.allExamples.push(...syntheticExamples);
    console.log(`  ✅ Added ${syntheticExamples.length} synthetic examples`);
  }

  /**
   * Get schema context
   */
  private getSchemaContext(): string {
    return `Database Schema:
events table:
- id (integer, primary key)
- name (text, event name)
- location (text, event location/venue)
- country (text, country name)
- region (text, geographic region)
- continent (text, continent name)
- start_date (timestamp, event start)
- end_date (timestamp, event end)
- status (text: confirmed, pending, cancelled)
- priority (text: low, medium, high, critical)
- type (text: conference, meetup, workshop, webinar, hackathon)
- created_at (timestamp)
- updated_at (timestamp)

Related tables:
- attendees (user_id, event_id, name, email, status)
- cfp_submissions (id, event_id, submitter_id, submitter_name, title, status)
- assets (id, event_id, type, name, uploaded_by_name)

PostgreSQL version: 15
Geographic columns: location, country, region, continent
Indexed columns: id, start_date, status, type, country, continent
Always use specific column names, avoid SELECT *
Generate ONLY SELECT queries (read-only)`;
  }

  /**
   * Deduplicate examples based on instruction and output
   */
  deduplicateExamples(): void {
    console.log('🔄 Deduplicating examples...');

    const seen = new Set<string>();
    const originalCount = this.allExamples.length;

    this.allExamples = this.allExamples.filter(example => {
      const key = `${example.instruction}|||${example.output}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    const duplicatesRemoved = originalCount - this.allExamples.length;
    console.log(`  ✅ Removed ${duplicatesRemoved} duplicates, ${this.allExamples.length} unique examples remain`);
  }

  /**
   * Convert to fine-tuning format (OpenAI/HuggingFace compatible)
   */
  convertToFineTuningFormat(): FineTuningExample[] {
    console.log('🔄 Converting to fine-tuning format...');

    const systemPrompt = `You are an expert PostgreSQL query generator for an event management system.
Generate ONLY SELECT queries that are:
- Read-only (no INSERT, UPDATE, DELETE, or DDL)
- Syntactically correct for PostgreSQL 15
- Performance-optimized using proper indexes
- Using specific column names (avoid SELECT *)
- Handling NULL values properly
- Using PostgreSQL-specific functions when appropriate

Always include FROM clause and proper WHERE conditions. Use LIMIT for large result sets.`;

    return this.allExamples.map(example => ({
      messages: [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        {
          role: 'user' as const,
          content: `${example.instruction}\n\n${example.input}`
        },
        {
          role: 'assistant' as const,
          content: example.output
        }
      ],
      metadata: example.metadata
    }));
  }

  /**
   * Split dataset into train/validation sets
   */
  splitDataset(examples: FineTuningExample[], validationRatio: number = 0.15): {
    train: FineTuningExample[];
    validation: FineTuningExample[];
  } {
    console.log('📊 Splitting dataset into train/validation sets...');

    // Shuffle the examples
    const shuffled = [...examples].sort(() => Math.random() - 0.5);

    const validationSize = Math.floor(shuffled.length * validationRatio);
    const validation = shuffled.slice(0, validationSize);
    const train = shuffled.slice(validationSize);

    console.log(`  📚 Training set: ${train.length} examples (${(train.length/examples.length*100).toFixed(1)}%)`);
    console.log(`  🧪 Validation set: ${validation.length} examples (${(validation.length/examples.length*100).toFixed(1)}%)`);

    return { train, validation };
  }

  /**
   * Generate dataset statistics
   */
  generateStatistics(): void {
    console.log('📈 Generating final dataset statistics...');

    const categoryStats = this.allExamples.reduce((acc, ex) => {
      const category = ex.metadata?.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const complexityStats = this.allExamples.reduce((acc, ex) => {
      const complexity = ex.metadata?.complexity || 'unknown';
      acc[complexity] = (acc[complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sourceStats = this.allExamples.reduce((acc, ex) => {
      const source = ex.metadata?.source || (ex.metadata?.synthetic ? 'synthetic' : 'comprehensive');
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalExamples: this.allExamples.length,
      categories: categoryStats,
      complexities: complexityStats,
      sources: sourceStats,
      generatedAt: new Date().toISOString(),
      readyForFineTuning: true
    };

    fs.writeFileSync(
      path.join(this.finalDir, 'final-dataset-stats.json'),
      JSON.stringify(stats, null, 2)
    );

    console.log('\n📊 FINAL DATASET STATISTICS');
    console.log('=' .repeat(50));
    console.log(`Total Examples: ${stats.totalExamples}`);

    console.log('\n🏷️ Categories:');
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} (${(count/stats.totalExamples*100).toFixed(1)}%)`);
      });

    console.log('\n📊 Complexity:');
    Object.entries(complexityStats)
      .forEach(([complexity, count]) => {
        console.log(`  ${complexity}: ${count} (${(count/stats.totalExamples*100).toFixed(1)}%)`);
      });

    console.log('\n📚 Sources:');
    Object.entries(sourceStats)
      .forEach(([source, count]) => {
        console.log(`  ${source}: ${count} (${(count/stats.totalExamples*100).toFixed(1)}%)`);
      });
  }

  /**
   * Export final datasets
   */
  exportFinalDatasets(): void {
    console.log('\n💾 Exporting final training datasets...');

    // Convert to fine-tuning format
    const fineTuningExamples = this.convertToFineTuningFormat();

    // Split into train/validation
    const { train, validation } = this.splitDataset(fineTuningExamples);

    // Export training set (JSONL format for most fine-tuning frameworks)
    const trainJsonl = train.map(ex => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(path.join(this.finalDir, 'train.jsonl'), trainJsonl);

    // Export validation set
    const validationJsonl = validation.map(ex => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(path.join(this.finalDir, 'validation.jsonl'), validationJsonl);

    // Export as regular JSON as well (for compatibility)
    fs.writeFileSync(
      path.join(this.finalDir, 'train.json'),
      JSON.stringify(train, null, 2)
    );
    fs.writeFileSync(
      path.join(this.finalDir, 'validation.json'),
      JSON.stringify(validation, null, 2)
    );

    // Export combined dataset
    fs.writeFileSync(
      path.join(this.finalDir, 'complete-dataset.json'),
      JSON.stringify(fineTuningExamples, null, 2)
    );

    console.log(`  📁 Training JSONL: ${train.length} examples`);
    console.log(`  📁 Validation JSONL: ${validation.length} examples`);
    console.log(`  📁 Complete dataset: ${fineTuningExamples.length} examples`);
    console.log(`\n📂 All files saved to: ${this.finalDir}`);
  }

  /**
   * Create fine-tuning instructions
   */
  createFineTuningInstructions(): void {
    console.log('\n📋 Creating fine-tuning instructions...');

    const instructions = `# Fine-Tuning Instructions for SQL Query Generation

## Dataset Overview
- **Total Examples**: ${this.allExamples.length}
- **Training Examples**: ~${Math.floor(this.allExamples.length * 0.85)}
- **Validation Examples**: ~${Math.floor(this.allExamples.length * 0.15)}
- **Format**: JSONL (JSON Lines) and JSON

## Files
- \`train.jsonl\` - Training set in JSONL format
- \`validation.jsonl\` - Validation set in JSONL format
- \`train.json\` - Training set in JSON format
- \`validation.json\` - Validation set in JSON format
- \`complete-dataset.json\` - Full dataset
- \`final-dataset-stats.json\` - Dataset statistics

## Recommended Fine-Tuning Parameters

### For Qwen2.5:7b-instruct
\`\`\`bash
# Using LoRA (Low-Rank Adaptation)
python fine_tune.py \\
  --model_name qwen2.5:7b-instruct \\
  --train_file train.jsonl \\
  --validation_file validation.jsonl \\
  --output_dir ./sql-qwen-finetuned \\
  --learning_rate 2e-4 \\
  --batch_size 4 \\
  --gradient_accumulation_steps 4 \\
  --num_epochs 3 \\
  --warmup_steps 100 \\
  --lora_rank 16 \\
  --lora_alpha 32 \\
  --target_modules "q_proj,k_proj,v_proj,o_proj"
\`\`\`

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

Generated: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(this.finalDir, 'FINE_TUNING_INSTRUCTIONS.md'), instructions);
    console.log(`  📋 Instructions saved to: ${path.join(this.finalDir, 'FINE_TUNING_INSTRUCTIONS.md')}`);
  }

  /**
   * Main execution
   */
  run(): void {
    console.log('🎯 PREPARING FINAL TRAINING DATASET');
    console.log('=' .repeat(60));

    this.loadAllDatasets();
    this.generateSyntheticExamples();
    this.deduplicateExamples();
    this.generateStatistics();
    this.exportFinalDatasets();
    this.createFineTuningInstructions();

    console.log('\n🚀 FINAL TRAINING DATASET COMPLETE!');
    console.log(`📊 ${this.allExamples.length} total examples ready for fine-tuning`);
    console.log(`📂 Files saved to: ${this.finalDir}`);
    console.log('🎯 Ready to train a domain-specific SQL generation model!');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  const preparator = new FinalDatasetPreparator();
  preparator.run();
}

export { FinalDatasetPreparator };

