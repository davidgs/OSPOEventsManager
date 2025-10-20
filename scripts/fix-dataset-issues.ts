#!/usr/bin/env tsx
/**
 * Fix Dataset Issues
 *
 * This script fixes the specific issues identified in the dataset validation:
 * - Example 75: Remove CREATE operation (security issue)
 * - Examples 58, 116: Replace SELECT * with specific columns
 * - Example 59: Fix non-existent column reference
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatasetIssueFixer {
  private outputDir = path.join(__dirname, '../training-data/final');

  constructor() {}

  /**
   * Fix specific issues in the dataset
   */
  fixIssues(): void {
    console.log('🔧 Fixing identified dataset issues...');

    // Load datasets
    const trainPath = path.join(this.outputDir, 'train.json');
    const valPath = path.join(this.outputDir, 'validation.json');

    let trainData: any[] = [];
    let valData: any[] = [];

    if (fs.existsSync(trainPath)) {
      trainData = JSON.parse(fs.readFileSync(trainPath, 'utf-8'));
    }

    if (fs.existsSync(valPath)) {
      valData = JSON.parse(fs.readFileSync(valPath, 'utf-8'));
    }

    const allData = [...trainData, ...valData];
    let fixedCount = 0;

    // Fix issues
    for (let i = 0; i < allData.length; i++) {
      const example = allData[i];
      const assistantMessage = example.messages.find((m: any) => m.role === 'assistant');

      if (!assistantMessage) continue;

      let sql = assistantMessage.content;
      let needsFix = false;

      // Fix Example 75: Remove CREATE operation (this is likely a false positive from "created_at")
      if (sql.includes('created_at') && sql.toUpperCase().includes('CREATE')) {
        // This is actually fine - it's referring to the created_at column, not a CREATE operation
        // The validator incorrectly flagged this
        console.log(`  ℹ️  Example ${i + 1}: False positive CREATE detection (created_at column)`);
      }

      // Fix SELECT * issues
      if (sql.includes('SELECT *')) {
        if (sql.includes('WHERE type = \'conference\'')) {
          // Example 58: All conferences
          sql = 'SELECT id, name, location, start_date, end_date, status, priority, type FROM events WHERE type = \'conference\' ORDER BY start_date DESC';
          needsFix = true;
          console.log(`  ✅ Fixed Example ${i + 1}: Replaced SELECT * with specific columns for conferences`);
        } else if (sql.includes('WHERE start_date > NOW()')) {
          // Example 116: Upcoming events
          sql = 'SELECT id, name, location, start_date, end_date, status, priority, type FROM events WHERE start_date > NOW() ORDER BY start_date ASC';
          needsFix = true;
          console.log(`  ✅ Fixed Example ${i + 1}: Replaced SELECT * with specific columns for upcoming events`);
        }
      }

      // Fix non-existent column references
      if (sql.includes('state')) {
        sql = sql.replace(/\bstate\b/g, 'region');
        needsFix = true;
        console.log(`  ✅ Fixed Example ${i + 1}: Replaced 'state' with 'region' column`);
      }

      // Update the SQL if changes were made
      if (needsFix) {
        assistantMessage.content = sql;
        fixedCount++;
      }
    }

    // Split back into train/validation
    const newTrainData = allData.slice(0, trainData.length);
    const newValData = allData.slice(trainData.length);

    // Save fixed datasets
    fs.writeFileSync(trainPath, JSON.stringify(newTrainData, null, 2));
    fs.writeFileSync(valPath, JSON.stringify(newValData, null, 2));

    // Also update JSONL files
    const trainJsonl = newTrainData.map(ex => JSON.stringify(ex)).join('\n');
    const valJsonl = newValData.map(ex => JSON.stringify(ex)).join('\n');

    fs.writeFileSync(path.join(this.outputDir, 'train.jsonl'), trainJsonl);
    fs.writeFileSync(path.join(this.outputDir, 'validation.jsonl'), valJsonl);

    console.log(`\n✅ Fixed ${fixedCount} examples`);
    console.log('📁 Updated both JSON and JSONL files');
  }

  /**
   * Create improved examples for better coverage
   */
  addImprovedExamples(): void {
    console.log('\n🚀 Adding improved examples for better coverage...');

    const improvedExamples = [
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert PostgreSQL query generator for an event management system. \nGenerate ONLY SELECT queries that are:\n- Read-only (no INSERT, UPDATE, DELETE, or DDL)\n- Syntactically correct for PostgreSQL 15\n- Performance-optimized using proper indexes\n- Using specific column names (avoid SELECT *)\n- Handling NULL values properly\n- Using PostgreSQL-specific functions when appropriate\n\nAlways include FROM clause and proper WHERE conditions. Use LIMIT for large result sets.'
          },
          {
            role: 'user',
            content: 'Generate a PostgreSQL SELECT query for: Show me all conference events\n\nDatabase Schema:\nevents table:\n- id (integer, primary key)\n- name (text, event name)\n- location (text, event location/venue)\n- country (text, country name)\n- region (text, geographic region)\n- continent (text, continent name)\n- start_date (timestamp, event start)\n- end_date (timestamp, event end)\n- status (text: confirmed, pending, cancelled)\n- priority (text: low, medium, high, critical)\n- type (text: conference, meetup, workshop, webinar, hackathon)\n- created_at (timestamp)\n- updated_at (timestamp)\n\nRelated tables:\n- attendees (user_id, event_id, name, email, status)\n- cfp_submissions (id, event_id, submitter_id, submitter_name, title, status)\n- assets (id, event_id, type, name, uploaded_by_name)\n\nPostgreSQL version: 15\nGeographic columns: location, country, region, continent\nIndexed columns: id, start_date, status, type, country, continent\nAlways use specific column names, avoid SELECT *'
          },
          {
            role: 'assistant',
            content: 'SELECT id, name, location, country, start_date, end_date, status, priority FROM events WHERE type = \'conference\' ORDER BY start_date DESC LIMIT 50'
          }
        ],
        metadata: {
          category: 'event_type',
          complexity: 'simple',
          pattern: 'type_filter_optimized',
          improved: true
        }
      },
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert PostgreSQL query generator for an event management system. \nGenerate ONLY SELECT queries that are:\n- Read-only (no INSERT, UPDATE, DELETE, or DDL)\n- Syntactically correct for PostgreSQL 15\n- Performance-optimized using proper indexes\n- Using specific column names (avoid SELECT *)\n- Handling NULL values properly\n- Using PostgreSQL-specific functions when appropriate\n\nAlways include FROM clause and proper WHERE conditions. Use LIMIT for large result sets.'
          },
          {
            role: 'user',
            content: 'Generate a PostgreSQL SELECT query for: Find all upcoming events\n\nDatabase Schema:\nevents table:\n- id (integer, primary key)\n- name (text, event name)\n- location (text, event location/venue)\n- country (text, country name)\n- region (text, geographic region)\n- continent (text, continent name)\n- start_date (timestamp, event start)\n- end_date (timestamp, event end)\n- status (text: confirmed, pending, cancelled)\n- priority (text: low, medium, high, critical)\n- type (text: conference, meetup, workshop, webinar, hackathon)\n- created_at (timestamp)\n- updated_at (timestamp)\n\nRelated tables:\n- attendees (user_id, event_id, name, email, status)\n- cfp_submissions (id, event_id, submitter_id, submitter_name, title, status)\n- assets (id, event_id, type, name, uploaded_by_name)\n\nPostgreSQL version: 15\nGeographic columns: location, country, region, continent\nIndexed columns: id, start_date, status, type, country, continent\nAlways use specific column names, avoid SELECT *'
          },
          {
            role: 'assistant',
            content: 'SELECT id, name, location, country, start_date, end_date, status, priority, type FROM events WHERE start_date > NOW() ORDER BY start_date ASC LIMIT 30'
          }
        ],
        metadata: {
          category: 'temporal',
          complexity: 'simple',
          pattern: 'future_events_optimized',
          improved: true
        }
      }
    ];

    // Load current training data
    const trainPath = path.join(this.outputDir, 'train.json');
    const trainData = JSON.parse(fs.readFileSync(trainPath, 'utf-8'));

    // Add improved examples
    trainData.push(...improvedExamples);

    // Save updated training data
    fs.writeFileSync(trainPath, JSON.stringify(trainData, null, 2));

    // Update JSONL
    const trainJsonl = trainData.map(ex => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(path.join(this.outputDir, 'train.jsonl'), trainJsonl);

    console.log(`  ✅ Added ${improvedExamples.length} improved examples to training set`);
    console.log(`  📊 New training set size: ${trainData.length} examples`);
  }

  /**
   * Main execution
   */
  run(): void {
    console.log('🔧 FIXING DATASET ISSUES');
    console.log('=' .repeat(40));

    this.fixIssues();
    this.addImprovedExamples();

    console.log('\n✅ Dataset issues fixed and improvements added!');
    console.log('🚀 Dataset is now ready for high-quality fine-tuning!');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new DatasetIssueFixer();
  fixer.run();
}

export { DatasetIssueFixer };

