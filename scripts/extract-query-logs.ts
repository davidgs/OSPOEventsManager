#!/usr/bin/env tsx
/**
 * Extract AI Chat Query Logs for Fine-Tuning Dataset
 *
 * This script extracts production query logs from the OpenShift cluster
 * and analyzes them to build a training dataset for fine-tuning our AI model.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QueryLog {
  timestamp: string;
  type: 'SUCCESS' | 'FAILURE';
  userQuery: string;
  generatedSQL: string;
  resultCount?: number;
  executionTime?: number;
  error?: string;
  category?: string;
  complexity?: 'simple' | 'medium' | 'complex';
}

interface AnalysisReport {
  totalQueries: number;
  successRate: number;
  failurePatterns: Record<string, number>;
  queryCategories: Record<string, number>;
  complexityDistribution: Record<string, number>;
  commonErrors: Array<{ error: string; count: number; examples: string[] }>;
}

class QueryLogExtractor {
  private logs: QueryLog[] = [];
  private outputDir = path.join(__dirname, '../training-data');

  constructor() {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Extract logs from OpenShift cluster
   */
  async extractFromCluster(): Promise<void> {
    console.log('🔍 Extracting query logs from OpenShift cluster...');

    try {
      // Get the app pod name
      const podName = execSync('oc get pods -l app=ospo-events-manager --no-headers -o custom-columns=":metadata.name" | head -1',
        { encoding: 'utf-8' }).trim();

      if (!podName) {
        throw new Error('No app pod found');
      }

      console.log(`📦 Found pod: ${podName}`);

      // Extract logs with FEEDBACK entries (last 1000 lines to avoid overwhelming)
      const logs = execSync(`oc logs ${podName} --tail=1000 | grep -E "\\[FEEDBACK\\]"`,
        { encoding: 'utf-8' });

      console.log(`📝 Found ${logs.split('\n').filter(l => l.trim()).length} feedback entries`);

      this.parseLogs(logs);

    } catch (error) {
      console.error('❌ Error extracting from cluster:', error);
      console.log('💡 Trying to extract from local logs instead...');

      // Fallback: try to read from local log file if it exists
      await this.extractFromLocalLogs();
    }
  }

  /**
   * Extract from local development logs
   */
  async extractFromLocalLogs(): Promise<void> {
    const logPaths = [
      '/tmp/ospo-events.log',
      './server.log',
      '../logs/app.log'
    ];

    for (const logPath of logPaths) {
      if (fs.existsSync(logPath)) {
        console.log(`📂 Reading from ${logPath}`);
        const logs = fs.readFileSync(logPath, 'utf-8');
        this.parseLogs(logs);
        return;
      }
    }

    console.log('⚠️  No log files found. Creating sample dataset based on known patterns...');
    this.createSampleDataset();
  }

  /**
   * Parse log entries and extract query data
   */
  private parseLogs(logsContent: string): void {
    const lines = logsContent.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        if (line.includes('[FEEDBACK] SUCCESS:')) {
          this.parseSuccessLog(line);
        } else if (line.includes('[FEEDBACK] FAILURE:')) {
          this.parseFailureLog(line);
        }
      } catch (error) {
        console.warn('⚠️  Failed to parse log line:', line.substring(0, 100));
      }
    }

    console.log(`✅ Parsed ${this.logs.length} query logs`);
  }

  /**
   * Parse successful query log
   */
  private parseSuccessLog(line: string): void {
    // Example: [FEEDBACK] SUCCESS: "Find events in Asia" → SQL: SELECT id, name, location, country, region, continent, start_date, end_date FROM events WHERE contin... → 11 rows
    const successMatch = line.match(/\[FEEDBACK\] SUCCESS: "([^"]+)" → SQL: ([^→]+)... → (\d+) rows/);

    if (successMatch) {
      const [, userQuery, sqlStart, resultCount] = successMatch;

      // Extract timestamp if available
      const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/);
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();

      this.logs.push({
        timestamp,
        type: 'SUCCESS',
        userQuery: userQuery.trim(),
        generatedSQL: sqlStart.trim(),
        resultCount: parseInt(resultCount),
        category: this.categorizeQuery(userQuery),
        complexity: this.assessComplexity(userQuery, sqlStart)
      });
    }
  }

  /**
   * Parse failed query log
   */
  private parseFailureLog(line: string): void {
    // Example: [FEEDBACK] FAILURE: "Show me all events in asia" → SQL: `SELECT * FROM events WHERE continent ILIKE '%asia%' OR continent = 'Asia' ORDER BY start_date DESC ... → Error: Failed query: `SELECT * FROM events WHERE continent ILIKE '%asia%' OR continent = 'Asia' ORDER BY start_date DESC LIMIT 1000;`
    const failureMatch = line.match(/\[FEEDBACK\] FAILURE: "([^"]+)" → SQL: ([^→]+)... → Error: ([^$]+)/);

    if (failureMatch) {
      const [, userQuery, sqlStart, error] = failureMatch;

      // Extract timestamp if available
      const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/);
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();

      this.logs.push({
        timestamp,
        type: 'FAILURE',
        userQuery: userQuery.trim(),
        generatedSQL: sqlStart.trim(),
        error: error.trim(),
        category: this.categorizeQuery(userQuery),
        complexity: this.assessComplexity(userQuery, sqlStart)
      });
    }
  }

  /**
   * Categorize query by type
   */
  private categorizeQuery(userQuery: string): string {
    const query = userQuery.toLowerCase();

    if (query.includes('count') || query.includes('how many')) {
      return 'count';
    } else if (query.includes('asia') || query.includes('europe') || query.includes('america') ||
               query.includes('africa') || query.includes('continent') || query.includes('country')) {
      return 'geographic';
    } else if (query.includes('upcoming') || query.includes('past') || query.includes('date') ||
               query.includes('when') || query.includes('2024') || query.includes('2025')) {
      return 'temporal';
    } else if (query.includes('conference') || query.includes('meetup') || query.includes('workshop') ||
               query.includes('hackathon') || query.includes('type')) {
      return 'event_type';
    } else if (query.includes('priority') || query.includes('status') || query.includes('confirmed')) {
      return 'status_priority';
    } else if (query.includes('attendee') || query.includes('speaker') || query.includes('cfp')) {
      return 'related_data';
    } else {
      return 'general';
    }
  }

  /**
   * Assess query complexity
   */
  private assessComplexity(userQuery: string, generatedSQL: string): 'simple' | 'medium' | 'complex' {
    const query = userQuery.toLowerCase();
    const sql = generatedSQL.toLowerCase();

    let complexityScore = 0;

    // Query complexity indicators
    if (query.includes(' and ') || query.includes(' or ')) complexityScore += 1;
    if (query.includes('between') || query.includes('range')) complexityScore += 1;
    if (query.includes('group') || query.includes('aggregate')) complexityScore += 2;

    // SQL complexity indicators
    if (sql.includes('join')) complexityScore += 2;
    if (sql.includes('group by') || sql.includes('having')) complexityScore += 2;
    if (sql.includes('case when') || sql.includes('coalesce')) complexityScore += 1;
    if (sql.includes('subquery') || sql.includes('exists')) complexityScore += 3;

    if (complexityScore <= 1) return 'simple';
    if (complexityScore <= 3) return 'medium';
    return 'complex';
  }

  /**
   * Create sample dataset based on known patterns
   */
  private createSampleDataset(): void {
    console.log('📝 Creating sample dataset based on known failure patterns...');

    // Based on our analysis, create sample queries for each failure pattern
    const sampleQueries = [
      // Missing FROM clause examples
      { userQuery: 'How many events are there?', sql: 'SELECT COUNT(*) FROM events', success: true },
      { userQuery: 'Show all events', sql: 'SELECT * FROM events', success: false, error: 'Missing FROM clause' },

      // Geographic queries
      { userQuery: 'Find events in Asia', sql: 'SELECT id, name, location, country, region, continent FROM events WHERE continent = \'Asia\'', success: true },
      { userQuery: 'Events in Europe', sql: 'SELECT * WHERE continent = \'Europe\'', success: false, error: 'Missing FROM clause' },

      // Backtick issues (now fixed)
      { userQuery: 'All conferences', sql: '`SELECT * FROM events WHERE type = \'conference\'`', success: false, error: 'Syntax error near backtick' },

      // Date/time queries
      { userQuery: 'Upcoming events', sql: 'SELECT * FROM events WHERE start_date > NOW()', success: true },
      { userQuery: 'Events this year', sql: 'SELECT * FROM events WHERE YEAR(start_date) = 2025', success: false, error: 'PostgreSQL uses EXTRACT, not YEAR()' },
    ];

    for (const sample of sampleQueries) {
      this.logs.push({
        timestamp: new Date().toISOString(),
        type: sample.success ? 'SUCCESS' : 'FAILURE',
        userQuery: sample.userQuery,
        generatedSQL: sample.sql,
        resultCount: sample.success ? Math.floor(Math.random() * 50) : undefined,
        error: sample.error,
        category: this.categorizeQuery(sample.userQuery),
        complexity: this.assessComplexity(sample.userQuery, sample.sql)
      });
    }
  }

  /**
   * Analyze the extracted logs
   */
  analyzeQueries(): AnalysisReport {
    console.log('📊 Analyzing query patterns...');

    const totalQueries = this.logs.length;
    const successfulQueries = this.logs.filter(log => log.type === 'SUCCESS').length;
    const successRate = totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 0;

    // Analyze failure patterns
    const failurePatterns: Record<string, number> = {};
    const failedLogs = this.logs.filter(log => log.type === 'FAILURE');

    for (const log of failedLogs) {
      if (log.error) {
        const errorType = this.classifyError(log.error);
        failurePatterns[errorType] = (failurePatterns[errorType] || 0) + 1;
      }
    }

    // Analyze query categories
    const queryCategories: Record<string, number> = {};
    for (const log of this.logs) {
      if (log.category) {
        queryCategories[log.category] = (queryCategories[log.category] || 0) + 1;
      }
    }

    // Analyze complexity distribution
    const complexityDistribution: Record<string, number> = {};
    for (const log of this.logs) {
      if (log.complexity) {
        complexityDistribution[log.complexity] = (complexityDistribution[log.complexity] || 0) + 1;
      }
    }

    // Find common errors with examples
    const errorGroups: Record<string, { count: number; examples: string[] }> = {};
    for (const log of failedLogs) {
      if (log.error) {
        const errorType = this.classifyError(log.error);
        if (!errorGroups[errorType]) {
          errorGroups[errorType] = { count: 0, examples: [] };
        }
        errorGroups[errorType].count++;
        if (errorGroups[errorType].examples.length < 3) {
          errorGroups[errorType].examples.push(log.userQuery);
        }
      }
    }

    const commonErrors = Object.entries(errorGroups)
      .map(([error, data]) => ({ error, ...data }))
      .sort((a, b) => b.count - a.count);

    return {
      totalQueries,
      successRate,
      failurePatterns,
      queryCategories,
      complexityDistribution,
      commonErrors
    };
  }

  /**
   * Classify error type
   */
  private classifyError(error: string): string {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('from clause') || errorLower.includes('missing from')) {
      return 'missing_from_clause';
    } else if (errorLower.includes('syntax error') || errorLower.includes('backtick')) {
      return 'syntax_error';
    } else if (errorLower.includes('column') && errorLower.includes('not exist')) {
      return 'invalid_column';
    } else if (errorLower.includes('table') && errorLower.includes('not exist')) {
      return 'invalid_table';
    } else if (errorLower.includes('function') && errorLower.includes('not exist')) {
      return 'invalid_function';
    } else if (errorLower.includes('permission') || errorLower.includes('access')) {
      return 'permission_error';
    } else {
      return 'other';
    }
  }

  /**
   * Export training dataset in JSON format
   */
  exportTrainingDataset(): void {
    console.log('💾 Exporting training dataset...');

    const trainingData = this.logs.map(log => ({
      instruction: `Generate a PostgreSQL SELECT query for: ${log.userQuery}`,
      input: this.getSchemaContext(),
      output: log.type === 'SUCCESS' ? log.generatedSQL : this.getCorrectSQL(log),
      metadata: {
        category: log.category,
        complexity: log.complexity,
        originalSuccess: log.type === 'SUCCESS',
        error: log.error,
        timestamp: log.timestamp
      }
    }));

    // Export full dataset
    fs.writeFileSync(
      path.join(this.outputDir, 'training-dataset.json'),
      JSON.stringify(trainingData, null, 2)
    );

    // Export by category for targeted training
    const categories = [...new Set(this.logs.map(log => log.category).filter(Boolean))];
    for (const category of categories) {
      const categoryData = trainingData.filter(item => item.metadata.category === category);
      fs.writeFileSync(
        path.join(this.outputDir, `training-dataset-${category}.json`),
        JSON.stringify(categoryData, null, 2)
      );
    }

    console.log(`✅ Exported ${trainingData.length} training examples`);
    console.log(`📁 Files saved to: ${this.outputDir}`);
  }

  /**
   * Get schema context for training
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

Related tables: attendees, cfp_submissions, assets
PostgreSQL version: 15
Geographic columns available: location, country, region, continent`;
  }

  /**
   * Generate correct SQL for failed queries
   */
  private getCorrectSQL(log: QueryLog): string {
    // This is a simplified correction - in practice, we'd want manual review
    if (log.error?.includes('missing from')) {
      return log.generatedSQL.replace(/^SELECT/, 'SELECT id, name, location FROM events WHERE');
    }

    if (log.error?.includes('backtick')) {
      return log.generatedSQL.replace(/`/g, '');
    }

    // Return a safe fallback
    return 'SELECT id, name, location, start_date, end_date, status, priority, type FROM events ORDER BY start_date DESC LIMIT 10';
  }

  /**
   * Generate analysis report
   */
  generateReport(): void {
    const analysis = this.analyzeQueries();

    console.log('\n📈 QUERY LOG ANALYSIS REPORT');
    console.log('=' .repeat(50));
    console.log(`Total Queries: ${analysis.totalQueries}`);
    console.log(`Success Rate: ${analysis.successRate.toFixed(1)}%`);

    console.log('\n🏷️  Query Categories:');
    Object.entries(analysis.queryCategories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} (${(count/analysis.totalQueries*100).toFixed(1)}%)`);
      });

    console.log('\n📊 Complexity Distribution:');
    Object.entries(analysis.complexityDistribution)
      .forEach(([complexity, count]) => {
        console.log(`  ${complexity}: ${count} (${(count/analysis.totalQueries*100).toFixed(1)}%)`);
      });

    console.log('\n❌ Common Failure Patterns:');
    analysis.commonErrors.slice(0, 5).forEach(error => {
      console.log(`  ${error.error}: ${error.count} occurrences`);
      console.log(`    Examples: ${error.examples.slice(0, 2).join(', ')}`);
    });

    // Save detailed report
    fs.writeFileSync(
      path.join(this.outputDir, 'analysis-report.json'),
      JSON.stringify(analysis, null, 2)
    );

    console.log(`\n📋 Detailed report saved to: ${path.join(this.outputDir, 'analysis-report.json')}`);
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    console.log('🚀 Starting Query Log Extraction for Fine-Tuning Dataset');
    console.log('=' .repeat(60));

    await this.extractFromCluster();
    this.generateReport();
    this.exportTrainingDataset();

    console.log('\n✅ Query log extraction completed!');
    console.log(`📊 Ready for fine-tuning with ${this.logs.length} examples`);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  const extractor = new QueryLogExtractor();
  extractor.run().catch(console.error);
}

export { QueryLogExtractor };
