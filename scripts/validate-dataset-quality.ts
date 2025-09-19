#!/usr/bin/env tsx
/**
 * Validate Training Dataset Quality
 *
 * This script performs comprehensive quality validation on our fine-tuning dataset:
 * - SQL syntax validation
 * - Security checks (read-only enforcement)
 * - Performance analysis
 * - Consistency checks
 * - Domain-specific validation
 * - Format validation for fine-tuning
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

interface DatasetValidation {
  totalExamples: number;
  validExamples: number;
  invalidExamples: number;
  overallScore: number;
  categories: {
    syntaxValidation: ValidationResult;
    securityValidation: ValidationResult;
    performanceValidation: ValidationResult;
    consistencyValidation: ValidationResult;
    domainValidation: ValidationResult;
    formatValidation: ValidationResult;
  };
  detailedResults: Array<{
    index: number;
    instruction: string;
    sql: string;
    issues: string[];
    score: number;
  }>;
}

class DatasetQualityValidator {
  private trainingData: any[] = [];
  private validationData: any[] = [];
  private outputDir = path.join(__dirname, '../training-data/final');

  constructor() {
    this.loadDatasets();
  }

  /**
   * Load training and validation datasets
   */
  private loadDatasets(): void {
    console.log('📂 Loading datasets for validation...');

    try {
      const trainPath = path.join(this.outputDir, 'train.json');
      const valPath = path.join(this.outputDir, 'validation.json');

      if (fs.existsSync(trainPath)) {
        this.trainingData = JSON.parse(fs.readFileSync(trainPath, 'utf-8'));
        console.log(`  ✅ Loaded ${this.trainingData.length} training examples`);
      }

      if (fs.existsSync(valPath)) {
        this.validationData = JSON.parse(fs.readFileSync(valPath, 'utf-8'));
        console.log(`  ✅ Loaded ${this.validationData.length} validation examples`);
      }
    } catch (error) {
      console.error('❌ Failed to load datasets:', error);
      process.exit(1);
    }
  }

  /**
   * Extract SQL from message format
   */
  private extractSQL(example: any): string {
    if (example.messages) {
      // Fine-tuning format
      const assistantMessage = example.messages.find((m: any) => m.role === 'assistant');
      return assistantMessage?.content || '';
    }
    // Direct format
    return example.output || '';
  }

  /**
   * Extract instruction from message format
   */
  private extractInstruction(example: any): string {
    if (example.messages) {
      // Fine-tuning format
      const userMessage = example.messages.find((m: any) => m.role === 'user');
      return userMessage?.content || '';
    }
    // Direct format
    return example.instruction || '';
  }

  /**
   * Validate SQL syntax
   */
  validateSQLSyntax(examples: any[]): ValidationResult {
    console.log('🔍 Validating SQL syntax...');

    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    for (let i = 0; i < examples.length; i++) {
      const sql = this.extractSQL(examples[i]);
      const instruction = this.extractInstruction(examples[i]);

      // Basic SQL syntax checks
      if (!sql.trim()) {
        errors.push(`Example ${i + 1}: Empty SQL query`);
        continue;
      }

      // Must start with SELECT
      if (!sql.trim().toUpperCase().startsWith('SELECT')) {
        errors.push(`Example ${i + 1}: Query must start with SELECT (found: ${sql.substring(0, 20)}...)`);
        continue;
      }

      // Must have FROM clause (except for simple expressions)
      if (!sql.toUpperCase().includes(' FROM ') && !sql.includes('NOW()') && !sql.includes('CURRENT_')) {
        errors.push(`Example ${i + 1}: Missing FROM clause in query: ${sql.substring(0, 50)}...`);
        continue;
      }

      // Check for common syntax errors
      if (sql.includes('`')) {
        errors.push(`Example ${i + 1}: Contains backticks (PostgreSQL doesn't use backticks): ${sql.substring(0, 50)}...`);
        continue;
      }

      // Check for MySQL-specific functions
      const mysqlFunctions = ['YEAR(', 'MONTH(', 'DAY(', 'DATE_SUB(', 'DATE_ADD(', 'CURDATE()', 'CURTIME()'];
      for (const func of mysqlFunctions) {
        if (sql.includes(func)) {
          errors.push(`Example ${i + 1}: Contains MySQL-specific function ${func}, use PostgreSQL equivalent`);
          break;
        }
      }

      // Check for proper NULL handling
      if (sql.includes('= NULL') || sql.includes('!= NULL')) {
        warnings.push(`Example ${i + 1}: Use IS NULL/IS NOT NULL instead of = NULL/!= NULL`);
      }

      // Check for SELECT *
      if (sql.includes('SELECT *')) {
        warnings.push(`Example ${i + 1}: Uses SELECT *, prefer specific column names for performance`);
      }

      validCount++;
    }

    const score = (validCount / examples.length) * 100;
    return {
      passed: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  /**
   * Validate security (read-only enforcement)
   */
  validateSecurity(examples: any[]): ValidationResult {
    console.log('🛡️ Validating security (read-only enforcement)...');

    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    const writeOperations = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE',
      'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK', 'SET SESSION', 'SET GLOBAL'
    ];

    // CREATE operations that are dangerous (but exclude created_at column references)
    const createOperations = ['CREATE TABLE', 'CREATE INDEX', 'CREATE VIEW', 'CREATE FUNCTION', 'CREATE TRIGGER'];

    for (let i = 0; i < examples.length; i++) {
      const sql = this.extractSQL(examples[i]).toUpperCase();

      let hasWriteOperation = false;
      for (const op of writeOperations) {
        if (sql.includes(op)) {
          errors.push(`Example ${i + 1}: Contains write operation '${op}' - only SELECT queries allowed`);
          hasWriteOperation = true;
          break;
        }
      }

      // Check for CREATE operations more carefully
      for (const createOp of createOperations) {
        if (sql.includes(createOp)) {
          errors.push(`Example ${i + 1}: Contains write operation '${createOp}' - only SELECT queries allowed`);
          hasWriteOperation = true;
          break;
        }
      }

      // Check for dangerous functions
      const dangerousFunctions = ['PG_SLEEP(', 'PG_TERMINATE_BACKEND(', 'PG_CANCEL_BACKEND('];
      for (const func of dangerousFunctions) {
        if (sql.includes(func)) {
          errors.push(`Example ${i + 1}: Contains dangerous function ${func}`);
          hasWriteOperation = true;
          break;
        }
      }

      if (!hasWriteOperation) {
        validCount++;
      }
    }

    const score = (validCount / examples.length) * 100;
    return {
      passed: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  /**
   * Validate performance considerations
   */
  validatePerformance(examples: any[]): ValidationResult {
    console.log('⚡ Validating performance considerations...');

    const errors: string[] = [];
    const warnings: string[] = [];
    let goodPerformanceCount = 0;

    for (let i = 0; i < examples.length; i++) {
      const sql = this.extractSQL(examples[i]);
      const sqlUpper = sql.toUpperCase();

      // Check for LIMIT clause on potentially large result sets
      if (sqlUpper.includes('SELECT') && !sqlUpper.includes('COUNT(') &&
          !sqlUpper.includes('LIMIT') && !sqlUpper.includes('GROUP BY')) {
        warnings.push(`Example ${i + 1}: Consider adding LIMIT clause for large result sets`);
      }

      // Check for inefficient patterns
      if (sqlUpper.includes('SELECT DISTINCT') && sqlUpper.includes('ORDER BY')) {
        const distinctPos = sqlUpper.indexOf('SELECT DISTINCT');
        const orderPos = sqlUpper.indexOf('ORDER BY');
        if (distinctPos < orderPos) {
          warnings.push(`Example ${i + 1}: DISTINCT with ORDER BY can be inefficient, consider alternatives`);
        }
      }

      // Check for subqueries that could be JOINs
      if (sqlUpper.includes('WHERE') && sqlUpper.includes('IN (SELECT')) {
        warnings.push(`Example ${i + 1}: Consider using EXISTS or JOIN instead of IN with subquery for better performance`);
      }

      // Check for proper use of indexes (based on our known indexed columns)
      const indexedColumns = ['id', 'start_date', 'status', 'type', 'country', 'continent'];
      let usesIndex = false;
      for (const col of indexedColumns) {
        if (sqlUpper.includes(`WHERE ${col.toUpperCase()}`) ||
            sqlUpper.includes(`ORDER BY ${col.toUpperCase()}`)) {
          usesIndex = true;
          break;
        }
      }

      if (sqlUpper.includes('WHERE') && !usesIndex) {
        warnings.push(`Example ${i + 1}: Query doesn't appear to use indexed columns for filtering`);
      }

      // Count as good performance if no major issues
      goodPerformanceCount++;
    }

    const score = Math.max(0, 100 - (warnings.length / examples.length) * 20);
    return {
      passed: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  /**
   * Validate consistency across examples
   */
  validateConsistency(examples: any[]): ValidationResult {
    console.log('🔄 Validating consistency across examples...');

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for consistent column naming
    const columnVariations: Record<string, string[]> = {};
    const tableNames = new Set<string>();

    for (let i = 0; i < examples.length; i++) {
      const sql = this.extractSQL(examples[i]);

      // Extract table names
      const fromMatch = sql.match(/FROM\s+(\w+)/i);
      if (fromMatch) {
        tableNames.add(fromMatch[1].toLowerCase());
      }

      // Check for consistent event table reference
      if (sql.includes('FROM') && !sql.toLowerCase().includes('from events') &&
          !sql.toLowerCase().includes('from attendees') && !sql.toLowerCase().includes('from cfp_submissions')) {
        warnings.push(`Example ${i + 1}: Uses unexpected table name, should primarily use 'events' table`);
      }
    }

    // Check for consistent date formats
    const datePatterns = [
      /'\d{4}-\d{2}-\d{2}'/g,  // YYYY-MM-DD
      /'\d{2}\/\d{2}\/\d{4}'/g,  // MM/DD/YYYY
      /'\d{2}-\d{2}-\d{4}'/g   // MM-DD-YYYY
    ];

    let consistentDateFormat = true;
    for (let i = 0; i < examples.length; i++) {
      const sql = this.extractSQL(examples[i]);
      let formatCount = 0;

      for (const pattern of datePatterns) {
        if (pattern.test(sql)) {
          formatCount++;
        }
      }

      if (formatCount > 1) {
        warnings.push(`Example ${i + 1}: Uses multiple date formats, should be consistent`);
        consistentDateFormat = false;
      }
    }

    const score = 100 - (warnings.length / examples.length) * 10;
    return {
      passed: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  /**
   * Validate domain-specific correctness
   */
  validateDomainSpecific(examples: any[]): ValidationResult {
    console.log('🏷️ Validating domain-specific correctness...');

    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    // Known valid values for our domain
    const validStatuses = ['confirmed', 'pending', 'cancelled'];
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    const validTypes = ['conference', 'meetup', 'workshop', 'webinar', 'hackathon'];
    const validContinents = ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'];

    for (let i = 0; i < examples.length; i++) {
      const sql = this.extractSQL(examples[i]);
      const instruction = this.extractInstruction(examples[i]);
      let hasIssues = false;

      // Check for invalid status values
      const statusMatch = sql.match(/status\s*=\s*'([^']+)'/i);
      if (statusMatch && !validStatuses.includes(statusMatch[1])) {
        errors.push(`Example ${i + 1}: Invalid status value '${statusMatch[1]}', valid values: ${validStatuses.join(', ')}`);
        hasIssues = true;
      }

      // Check for invalid priority values
      const priorityMatch = sql.match(/priority\s*=\s*'([^']+)'/i);
      if (priorityMatch && !validPriorities.includes(priorityMatch[1])) {
        errors.push(`Example ${i + 1}: Invalid priority value '${priorityMatch[1]}', valid values: ${validPriorities.join(', ')}`);
        hasIssues = true;
      }

      // Check for invalid type values
      const typeMatch = sql.match(/type\s*=\s*'([^']+)'/i);
      if (typeMatch && !validTypes.includes(typeMatch[1])) {
        errors.push(`Example ${i + 1}: Invalid type value '${typeMatch[1]}', valid values: ${validTypes.join(', ')}`);
        hasIssues = true;
      }

      // Check for invalid continent values
      const continentMatch = sql.match(/continent\s*=\s*'([^']+)'/i);
      if (continentMatch && !validContinents.includes(continentMatch[1])) {
        warnings.push(`Example ${i + 1}: Potentially invalid continent '${continentMatch[1]}', common values: ${validContinents.join(', ')}`);
      }

      // Check for non-existent columns
      const nonExistentColumns = ['city', 'state', 'province', 'zip_code', 'postal_code'];
      for (const col of nonExistentColumns) {
        if (sql.toLowerCase().includes(col)) {
          errors.push(`Example ${i + 1}: References non-existent column '${col}', use 'location', 'country', 'region', or 'continent'`);
          hasIssues = true;
        }
      }

      // Check geographic queries for proper column usage
      if (instruction.toLowerCase().includes('asia') || instruction.toLowerCase().includes('europe') ||
          instruction.toLowerCase().includes('america') || instruction.toLowerCase().includes('africa')) {
        if (!sql.toLowerCase().includes('continent')) {
          warnings.push(`Example ${i + 1}: Geographic query should likely use 'continent' column`);
        }
      }

      if (!hasIssues) {
        validCount++;
      }
    }

    const score = (validCount / examples.length) * 100;
    return {
      passed: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  /**
   * Validate format for fine-tuning
   */
  validateFormat(examples: any[]): ValidationResult {
    console.log('📋 Validating format for fine-tuning...');

    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      let hasFormatIssues = false;

      // Check for proper message structure
      if (!example.messages || !Array.isArray(example.messages)) {
        errors.push(`Example ${i + 1}: Missing or invalid 'messages' array`);
        hasFormatIssues = true;
        continue;
      }

      // Should have exactly 3 messages: system, user, assistant
      if (example.messages.length !== 3) {
        errors.push(`Example ${i + 1}: Should have exactly 3 messages (system, user, assistant), found ${example.messages.length}`);
        hasFormatIssues = true;
      }

      // Check message roles
      const roles = example.messages.map((m: any) => m.role);
      const expectedRoles = ['system', 'user', 'assistant'];
      if (JSON.stringify(roles) !== JSON.stringify(expectedRoles)) {
        errors.push(`Example ${i + 1}: Invalid message roles. Expected: ${expectedRoles.join(', ')}, found: ${roles.join(', ')}`);
        hasFormatIssues = true;
      }

      // Check that all messages have content
      for (let j = 0; j < example.messages.length; j++) {
        const message = example.messages[j];
        if (!message.content || typeof message.content !== 'string' || message.content.trim().length === 0) {
          errors.push(`Example ${i + 1}: Message ${j + 1} (${message.role}) has empty or invalid content`);
          hasFormatIssues = true;
        }
      }

      // Check system message content
      const systemMessage = example.messages[0];
      if (systemMessage.role === 'system' && !systemMessage.content.includes('PostgreSQL')) {
        warnings.push(`Example ${i + 1}: System message should mention PostgreSQL for domain specificity`);
      }

      if (!hasFormatIssues) {
        validCount++;
      }
    }

    const score = (validCount / examples.length) * 100;
    return {
      passed: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  /**
   * Generate detailed results for individual examples
   */
  generateDetailedResults(examples: any[]): Array<{
    index: number;
    instruction: string;
    sql: string;
    issues: string[];
    score: number;
  }> {
    console.log('📊 Generating detailed results for each example...');

    const results = [];

    for (let i = 0; i < examples.length; i++) {
      const sql = this.extractSQL(examples[i]);
      const instruction = this.extractInstruction(examples[i]);
      const issues: string[] = [];
      let score = 100;

      // Quick validation for this specific example
      if (!sql.trim().toUpperCase().startsWith('SELECT')) {
        issues.push('Not a SELECT query');
        score -= 50;
      }

      if (sql.includes('`')) {
        issues.push('Contains backticks');
        score -= 20;
      }

      if (!sql.toUpperCase().includes(' FROM ') && !sql.includes('NOW()')) {
        issues.push('Missing FROM clause');
        score -= 30;
      }

      if (sql.includes('SELECT *')) {
        issues.push('Uses SELECT *');
        score -= 10;
      }

      const writeOps = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER'];
      const createOps = ['CREATE TABLE', 'CREATE INDEX', 'CREATE VIEW', 'CREATE FUNCTION', 'CREATE TRIGGER'];

      for (const op of writeOps) {
        if (sql.toUpperCase().includes(op)) {
          issues.push(`Contains write operation: ${op}`);
          score -= 50;
          break;
        }
      }

      for (const createOp of createOps) {
        if (sql.toUpperCase().includes(createOp)) {
          issues.push(`Contains write operation: ${createOp}`);
          score -= 50;
          break;
        }
      }

      results.push({
        index: i + 1,
        instruction: instruction.substring(0, 100) + (instruction.length > 100 ? '...' : ''),
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        issues,
        score: Math.max(0, score)
      });
    }

    return results;
  }

  /**
   * Run comprehensive validation
   */
  validateDataset(): DatasetValidation {
    console.log('🚀 Starting comprehensive dataset validation...');
    console.log('=' .repeat(60));

    const allExamples = [...this.trainingData, ...this.validationData];

    const syntaxValidation = this.validateSQLSyntax(allExamples);
    const securityValidation = this.validateSecurity(allExamples);
    const performanceValidation = this.validatePerformance(allExamples);
    const consistencyValidation = this.validateConsistency(allExamples);
    const domainValidation = this.validateDomainSpecific(allExamples);
    const formatValidation = this.validateFormat(allExamples);

    const detailedResults = this.generateDetailedResults(allExamples);

    // Calculate overall scores
    const categoryScores = [
      syntaxValidation.score,
      securityValidation.score,
      performanceValidation.score,
      consistencyValidation.score,
      domainValidation.score,
      formatValidation.score
    ];

    const overallScore = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
    const validExamples = detailedResults.filter(r => r.issues.length === 0).length;

    return {
      totalExamples: allExamples.length,
      validExamples,
      invalidExamples: allExamples.length - validExamples,
      overallScore,
      categories: {
        syntaxValidation,
        securityValidation,
        performanceValidation,
        consistencyValidation,
        domainValidation,
        formatValidation
      },
      detailedResults
    };
  }

  /**
   * Generate validation report
   */
  generateReport(validation: DatasetValidation): void {
    console.log('\n📈 DATASET QUALITY VALIDATION REPORT');
    console.log('=' .repeat(60));

    console.log(`📊 Overall Score: ${validation.overallScore.toFixed(1)}/100`);
    console.log(`✅ Valid Examples: ${validation.validExamples}/${validation.totalExamples} (${(validation.validExamples/validation.totalExamples*100).toFixed(1)}%)`);
    console.log(`❌ Invalid Examples: ${validation.invalidExamples}`);

    console.log('\n🏷️ Category Scores:');
    Object.entries(validation.categories).forEach(([category, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${status} ${category}: ${result.score.toFixed(1)}/100`);

      if (result.errors.length > 0) {
        console.log(`    Errors: ${result.errors.length}`);
        result.errors.slice(0, 3).forEach(error => {
          console.log(`      - ${error}`);
        });
        if (result.errors.length > 3) {
          console.log(`      ... and ${result.errors.length - 3} more`);
        }
      }

      if (result.warnings.length > 0) {
        console.log(`    Warnings: ${result.warnings.length}`);
        result.warnings.slice(0, 2).forEach(warning => {
          console.log(`      - ${warning}`);
        });
        if (result.warnings.length > 2) {
          console.log(`      ... and ${result.warnings.length - 2} more`);
        }
      }
    });

    // Show worst performing examples
    const worstExamples = validation.detailedResults
      .filter(r => r.issues.length > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    if (worstExamples.length > 0) {
      console.log('\n❌ Examples Needing Attention:');
      worstExamples.forEach(example => {
        console.log(`  Example ${example.index} (Score: ${example.score}/100):`);
        console.log(`    Instruction: ${example.instruction}`);
        console.log(`    SQL: ${example.sql}`);
        console.log(`    Issues: ${example.issues.join(', ')}`);
      });
    }

    // Save detailed report
    const reportPath = path.join(this.outputDir, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(validation, null, 2));
    console.log(`\n📋 Detailed report saved to: ${reportPath}`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (validation.overallScore >= 90) {
      console.log('🎯 Dataset quality is EXCELLENT! Ready for fine-tuning.');
    } else if (validation.overallScore >= 80) {
      console.log('✅ Dataset quality is GOOD. Minor improvements recommended.');
    } else if (validation.overallScore >= 70) {
      console.log('⚠️  Dataset quality is FAIR. Address major issues before fine-tuning.');
    } else {
      console.log('❌ Dataset quality is POOR. Significant improvements needed.');
    }

    if (validation.categories.syntaxValidation.errors.length > 0) {
      console.log('  - Fix SQL syntax errors before training');
    }
    if (validation.categories.securityValidation.errors.length > 0) {
      console.log('  - Remove all write operations (critical security issue)');
    }
    if (validation.categories.domainValidation.errors.length > 0) {
      console.log('  - Correct domain-specific values and column references');
    }
    if (validation.categories.formatValidation.errors.length > 0) {
      console.log('  - Fix message format issues for fine-tuning compatibility');
    }
  }

  /**
   * Main execution
   */
  run(): void {
    const validation = this.validateDataset();
    this.generateReport(validation);

    console.log('\n🏁 Dataset validation completed!');

    if (validation.overallScore >= 85) {
      console.log('🚀 Dataset is ready for fine-tuning!');
    } else {
      console.log('⚠️  Please address the issues above before proceeding with fine-tuning.');
    }
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DatasetQualityValidator();
  validator.run();
}

export { DatasetQualityValidator };
