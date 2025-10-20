#!/usr/bin/env tsx
/**
 * Curate PostgreSQL Documentation for Training Dataset
 *
 * This script extracts relevant PostgreSQL syntax examples, functions,
 * and best practices to enhance our fine-tuning dataset with proper
 * PostgreSQL-specific knowledge.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PostgreSQLExample {
  instruction: string;
  input: string;
  output: string;
  metadata: {
    category: string;
    complexity: 'simple' | 'medium' | 'complex';
    pattern: string;
    source: string;
    notes?: string;
  };
}

class PostgreSQLDocumentationCurator {
  private examples: PostgreSQLExample[] = [];
  private outputDir = path.join(__dirname, '../training-data');

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

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

PostgreSQL version: 15
Always use specific column names, avoid SELECT *
Use proper PostgreSQL syntax and functions`;
  }

  /**
   * PostgreSQL Date/Time Functions
   */
  generateDateTimeFunctions(): void {
    console.log('📅 Generating PostgreSQL date/time function examples...');

    const dateTimeExamples = [
      {
        query: "Events from the current week",
        sql: "SELECT id, name, start_date FROM events WHERE start_date >= date_trunc('week', CURRENT_DATE) AND start_date < date_trunc('week', CURRENT_DATE) + interval '1 week'",
        pattern: "date_trunc_week",
        complexity: "complex" as const
      },
      {
        query: "Events from last month",
        sql: "SELECT id, name, start_date FROM events WHERE start_date >= date_trunc('month', CURRENT_DATE) - interval '1 month' AND start_date < date_trunc('month', CURRENT_DATE)",
        pattern: "date_trunc_month",
        complexity: "complex" as const
      },
      {
        query: "Events with age in days",
        sql: "SELECT id, name, start_date, EXTRACT(DAY FROM (CURRENT_DATE - start_date::date)) as days_ago FROM events WHERE start_date < CURRENT_DATE",
        pattern: "date_extract_age",
        complexity: "medium" as const
      },
      {
        query: "Events by day of week",
        sql: "SELECT EXTRACT(DOW FROM start_date) as day_of_week, TO_CHAR(start_date, 'Day') as day_name, COUNT(*) FROM events GROUP BY EXTRACT(DOW FROM start_date), TO_CHAR(start_date, 'Day') ORDER BY day_of_week",
        pattern: "day_of_week_extraction",
        complexity: "complex" as const
      },
      {
        query: "Events in current quarter",
        sql: "SELECT id, name, start_date FROM events WHERE EXTRACT(QUARTER FROM start_date) = EXTRACT(QUARTER FROM CURRENT_DATE) AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)",
        pattern: "quarter_filtering",
        complexity: "medium" as const
      },
      {
        query: "Events with formatted dates",
        sql: "SELECT id, name, TO_CHAR(start_date, 'YYYY-MM-DD HH24:MI') as formatted_start FROM events ORDER BY start_date",
        pattern: "date_formatting",
        complexity: "medium" as const
      },
      {
        query: "Events duration in hours",
        sql: "SELECT id, name, start_date, end_date, EXTRACT(EPOCH FROM (end_date - start_date))/3600 as duration_hours FROM events WHERE end_date IS NOT NULL",
        pattern: "duration_calculation",
        complexity: "medium" as const
      }
    ];

    for (const example of dateTimeExamples) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${example.query}`,
        input: this.getSchemaContext(),
        output: example.sql,
        metadata: {
          category: 'postgresql_datetime',
          complexity: example.complexity,
          pattern: example.pattern,
          source: 'PostgreSQL Date/Time Functions Documentation'
        }
      });
    }
  }

  /**
   * PostgreSQL String Functions
   */
  generateStringFunctions(): void {
    console.log('🔤 Generating PostgreSQL string function examples...');

    const stringExamples = [
      {
        query: "Events with case-insensitive name search",
        sql: "SELECT id, name, location FROM events WHERE name ILIKE '%conference%'",
        pattern: "case_insensitive_like",
        complexity: "simple" as const
      },
      {
        query: "Events with location starting with specific text",
        sql: "SELECT id, name, location FROM events WHERE location ~ '^[Nn]ew'",
        pattern: "regex_matching",
        complexity: "medium" as const
      },
      {
        query: "Events with concatenated location info",
        sql: "SELECT id, name, CONCAT(location, ', ', country) as full_location FROM events WHERE location IS NOT NULL AND country IS NOT NULL",
        pattern: "string_concatenation",
        complexity: "simple" as const
      },
      {
        query: "Events with location length",
        sql: "SELECT id, name, location, LENGTH(location) as location_length FROM events WHERE location IS NOT NULL ORDER BY LENGTH(location) DESC",
        pattern: "string_length",
        complexity: "simple" as const
      },
      {
        query: "Events with uppercase country names",
        sql: "SELECT id, name, location, UPPER(country) as country_upper FROM events WHERE country IS NOT NULL",
        pattern: "string_case_conversion",
        complexity: "simple" as const
      },
      {
        query: "Events with trimmed and cleaned names",
        sql: "SELECT id, TRIM(REGEXP_REPLACE(name, '\\s+', ' ', 'g')) as clean_name FROM events WHERE name IS NOT NULL",
        pattern: "string_cleaning",
        complexity: "medium" as const
      },
      {
        query: "Events with location substring extraction",
        sql: "SELECT id, name, location, SUBSTRING(location FROM 1 FOR 20) as short_location FROM events WHERE location IS NOT NULL",
        pattern: "substring_extraction",
        complexity: "medium" as const
      }
    ];

    for (const example of stringExamples) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${example.query}`,
        input: this.getSchemaContext(),
        output: example.sql,
        metadata: {
          category: 'postgresql_strings',
          complexity: example.complexity,
          pattern: example.pattern,
          source: 'PostgreSQL String Functions Documentation'
        }
      });
    }
  }

  /**
   * PostgreSQL Aggregate Functions
   */
  generateAggregateFunctions(): void {
    console.log('📊 Generating PostgreSQL aggregate function examples...');

    const aggregateExamples = [
      {
        query: "Events with string aggregation of countries",
        sql: "SELECT continent, STRING_AGG(DISTINCT country, ', ' ORDER BY country) as countries FROM events WHERE continent IS NOT NULL AND country IS NOT NULL GROUP BY continent",
        pattern: "string_aggregation",
        complexity: "complex" as const
      },
      {
        query: "Events with array aggregation of types",
        sql: "SELECT continent, ARRAY_AGG(DISTINCT type ORDER BY type) as event_types FROM events WHERE continent IS NOT NULL GROUP BY continent",
        pattern: "array_aggregation",
        complexity: "complex" as const
      },
      {
        query: "Events with statistical aggregates",
        sql: "SELECT continent, COUNT(*) as total_events, MIN(start_date) as earliest_event, MAX(start_date) as latest_event, AVG(EXTRACT(EPOCH FROM (end_date - start_date))/3600) as avg_duration_hours FROM events WHERE continent IS NOT NULL AND end_date IS NOT NULL GROUP BY continent",
        pattern: "statistical_aggregates",
        complexity: "complex" as const
      },
      {
        query: "Events with conditional aggregation",
        sql: "SELECT continent, COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed, COUNT(*) FILTER (WHERE priority = 'high') as high_priority FROM events WHERE continent IS NOT NULL GROUP BY continent",
        pattern: "conditional_aggregation",
        complexity: "complex" as const
      },
      {
        query: "Events with percentile calculations",
        sql: "SELECT continent, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (end_date - start_date))/3600) as median_duration_hours FROM events WHERE continent IS NOT NULL AND end_date IS NOT NULL GROUP BY continent",
        pattern: "percentile_calculation",
        complexity: "complex" as const
      }
    ];

    for (const example of aggregateExamples) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${example.query}`,
        input: this.getSchemaContext(),
        output: example.sql,
        metadata: {
          category: 'postgresql_aggregates',
          complexity: example.complexity,
          pattern: example.pattern,
          source: 'PostgreSQL Aggregate Functions Documentation'
        }
      });
    }
  }

  /**
   * PostgreSQL Window Functions
   */
  generateWindowFunctions(): void {
    console.log('🪟 Generating PostgreSQL window function examples...');

    const windowExamples = [
      {
        query: "Events with row numbers by continent",
        sql: "SELECT id, name, continent, start_date, ROW_NUMBER() OVER (PARTITION BY continent ORDER BY start_date) as event_number FROM events WHERE continent IS NOT NULL",
        pattern: "row_number_window",
        complexity: "complex" as const
      },
      {
        query: "Events with ranking by start date",
        sql: "SELECT id, name, start_date, RANK() OVER (ORDER BY start_date) as date_rank, DENSE_RANK() OVER (ORDER BY start_date) as dense_date_rank FROM events",
        pattern: "ranking_window",
        complexity: "complex" as const
      },
      {
        query: "Events with running totals by continent",
        sql: "SELECT id, name, continent, start_date, COUNT(*) OVER (PARTITION BY continent ORDER BY start_date ROWS UNBOUNDED PRECEDING) as running_count FROM events WHERE continent IS NOT NULL ORDER BY continent, start_date",
        pattern: "running_total_window",
        complexity: "complex" as const
      },
      {
        query: "Events with lag and lead dates",
        sql: "SELECT id, name, start_date, LAG(start_date) OVER (ORDER BY start_date) as previous_event_date, LEAD(start_date) OVER (ORDER BY start_date) as next_event_date FROM events ORDER BY start_date",
        pattern: "lag_lead_window",
        complexity: "complex" as const
      },
      {
        query: "Events with first and last values by type",
        sql: "SELECT id, name, type, start_date, FIRST_VALUE(name) OVER (PARTITION BY type ORDER BY start_date) as first_event_of_type, LAST_VALUE(name) OVER (PARTITION BY type ORDER BY start_date ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_event_of_type FROM events WHERE type IS NOT NULL",
        pattern: "first_last_value_window",
        complexity: "complex" as const
      }
    ];

    for (const example of windowExamples) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${example.query}`,
        input: this.getSchemaContext(),
        output: example.sql,
        metadata: {
          category: 'postgresql_window',
          complexity: example.complexity,
          pattern: example.pattern,
          source: 'PostgreSQL Window Functions Documentation'
        }
      });
    }
  }

  /**
   * PostgreSQL JSON Functions (for future metadata fields)
   */
  generateJSONFunctions(): void {
    console.log('📋 Generating PostgreSQL JSON function examples...');

    const jsonExamples = [
      {
        query: "Events with JSON metadata extraction",
        sql: "SELECT id, name, (metadata->>'speaker_count')::int as speaker_count FROM events WHERE metadata IS NOT NULL AND metadata ? 'speaker_count'",
        pattern: "json_extraction",
        complexity: "medium" as const,
        notes: "Assumes metadata JSONB column exists"
      },
      {
        query: "Events with JSON array length",
        sql: "SELECT id, name, jsonb_array_length(metadata->'tags') as tag_count FROM events WHERE metadata IS NOT NULL AND metadata ? 'tags'",
        pattern: "json_array_length",
        complexity: "medium" as const,
        notes: "Assumes metadata JSONB column with tags array"
      },
      {
        query: "Events with JSON key existence check",
        sql: "SELECT id, name, metadata FROM events WHERE metadata ? 'registration_required' AND (metadata->>'registration_required')::boolean = true",
        pattern: "json_key_existence",
        complexity: "medium" as const,
        notes: "Assumes metadata JSONB column"
      }
    ];

    for (const example of jsonExamples) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${example.query}`,
        input: this.getSchemaContext() + '\n- metadata (jsonb, optional event metadata)',
        output: example.sql,
        metadata: {
          category: 'postgresql_json',
          complexity: example.complexity,
          pattern: example.pattern,
          source: 'PostgreSQL JSON Functions Documentation',
          notes: example.notes
        }
      });
    }
  }

  /**
   * PostgreSQL Performance Optimization Examples
   */
  generatePerformanceExamples(): void {
    console.log('⚡ Generating PostgreSQL performance optimization examples...');

    const performanceExamples = [
      {
        query: "Events with index-optimized continent search",
        sql: "SELECT id, name, location, start_date FROM events WHERE continent = 'Asia' ORDER BY start_date DESC LIMIT 20",
        pattern: "indexed_filter_with_limit",
        complexity: "simple" as const,
        notes: "Uses continent index, includes LIMIT for performance"
      },
      {
        query: "Events with composite index optimization",
        sql: "SELECT id, name, location FROM events WHERE status = 'confirmed' AND type = 'conference' ORDER BY start_date DESC LIMIT 50",
        pattern: "composite_index_optimization",
        complexity: "medium" as const,
        notes: "Optimized for (status, type, start_date) composite index"
      },
      {
        query: "Events with covering index query",
        sql: "SELECT id, name, start_date, status FROM events WHERE continent = 'Europe' AND start_date > CURRENT_DATE ORDER BY start_date ASC",
        pattern: "covering_index_query",
        complexity: "medium" as const,
        notes: "Query can be satisfied entirely from index"
      },
      {
        query: "Events with efficient pagination",
        sql: "SELECT id, name, location, start_date FROM events WHERE start_date > '2024-01-01' ORDER BY start_date DESC, id DESC LIMIT 25 OFFSET 0",
        pattern: "efficient_pagination",
        complexity: "medium" as const,
        notes: "Uses stable sort with id for consistent pagination"
      },
      {
        query: "Events with EXISTS instead of IN for better performance",
        sql: "SELECT e.id, e.name, e.location FROM events e WHERE EXISTS (SELECT 1 FROM attendees a WHERE a.event_id = e.id AND a.status = 'confirmed')",
        pattern: "exists_optimization",
        complexity: "complex" as const,
        notes: "EXISTS is often more efficient than IN with subqueries"
      }
    ];

    for (const example of performanceExamples) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${example.query}`,
        input: this.getSchemaContext() + '\nOptimize for performance using indexes and best practices.',
        output: example.sql,
        metadata: {
          category: 'postgresql_performance',
          complexity: example.complexity,
          pattern: example.pattern,
          source: 'PostgreSQL Performance Tuning Documentation',
          notes: example.notes
        }
      });
    }
  }

  /**
   * PostgreSQL Common Anti-patterns and Corrections
   */
  generateAntiPatterns(): void {
    console.log('🚫 Generating PostgreSQL anti-pattern corrections...');

    const antiPatterns = [
      {
        query: "Events with proper NULL handling",
        wrongSQL: "SELECT * FROM events WHERE country = NULL",
        correctSQL: "SELECT id, name, location, country FROM events WHERE country IS NULL",
        error: "Use IS NULL instead of = NULL",
        pattern: "null_comparison_fix"
      },
      {
        query: "Events with proper date comparison",
        wrongSQL: "SELECT * FROM events WHERE start_date = '2024-01-01'",
        correctSQL: "SELECT id, name, location, start_date FROM events WHERE DATE(start_date) = '2024-01-01'",
        error: "Date comparison should account for time component",
        pattern: "date_comparison_fix"
      },
      {
        query: "Events with proper LIKE escaping",
        wrongSQL: "SELECT * FROM events WHERE name LIKE '%100%'",
        correctSQL: "SELECT id, name FROM events WHERE name LIKE '%100\\%%' ESCAPE '\\'",
        error: "Special characters in LIKE patterns should be escaped",
        pattern: "like_escaping_fix"
      },
      {
        query: "Events with proper boolean handling",
        wrongSQL: "SELECT * FROM events WHERE status = 'true'",
        correctSQL: "SELECT id, name, status FROM events WHERE status = 'confirmed'",
        error: "Use proper enum values instead of string booleans",
        pattern: "boolean_handling_fix"
      },
      {
        query: "Events with efficient counting",
        wrongSQL: "SELECT COUNT(*) FROM (SELECT DISTINCT id FROM events)",
        correctSQL: "SELECT COUNT(DISTINCT id) FROM events",
        error: "Use COUNT(DISTINCT) instead of subquery for counting unique values",
        pattern: "efficient_counting_fix"
      }
    ];

    for (const antiPattern of antiPatterns) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${antiPattern.query}`,
        input: this.getSchemaContext() + '\nAvoid common anti-patterns and use PostgreSQL best practices.',
        output: antiPattern.correctSQL,
        metadata: {
          category: 'postgresql_antipatterns',
          complexity: 'medium',
          pattern: antiPattern.pattern,
          source: 'PostgreSQL Best Practices Documentation',
          notes: `Corrects anti-pattern: ${antiPattern.error}`
        }
      });
    }
  }

  /**
   * Generate all PostgreSQL documentation examples
   */
  generateAllExamples(): void {
    console.log('🐘 Generating PostgreSQL documentation examples...');
    console.log('=' .repeat(60));

    this.generateDateTimeFunctions();
    this.generateStringFunctions();
    this.generateAggregateFunctions();
    this.generateWindowFunctions();
    this.generateJSONFunctions();
    this.generatePerformanceExamples();
    this.generateAntiPatterns();

    console.log(`\n✅ Generated ${this.examples.length} PostgreSQL documentation examples`);
  }

  /**
   * Export the PostgreSQL documentation dataset
   */
  exportDataset(): void {
    console.log('\n💾 Exporting PostgreSQL documentation dataset...');

    // Export full PostgreSQL dataset
    fs.writeFileSync(
      path.join(this.outputDir, 'postgresql-documentation-dataset.json'),
      JSON.stringify(this.examples, null, 2)
    );

    // Export by category
    const categories = [...new Set(this.examples.map(ex => ex.metadata.category))];
    for (const category of categories) {
      const categoryExamples = this.examples.filter(ex => ex.metadata.category === category);
      fs.writeFileSync(
        path.join(this.outputDir, `postgresql-${category.replace('postgresql_', '')}.json`),
        JSON.stringify(categoryExamples, null, 2)
      );
      console.log(`  📁 ${category}: ${categoryExamples.length} examples`);
    }

    console.log(`\n📁 All PostgreSQL files saved to: ${this.outputDir}`);
  }

  /**
   * Generate analysis report
   */
  generateAnalysis(): void {
    console.log('\n📈 Generating PostgreSQL dataset analysis...');

    const categoryStats = this.examples.reduce((acc, ex) => {
      acc[ex.metadata.category] = (acc[ex.metadata.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const complexityStats = this.examples.reduce((acc, ex) => {
      acc[ex.metadata.complexity] = (acc[ex.metadata.complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const analysis = {
      totalExamples: this.examples.length,
      categories: categoryStats,
      complexities: complexityStats,
      generatedAt: new Date().toISOString(),
      source: 'PostgreSQL Official Documentation'
    };

    fs.writeFileSync(
      path.join(this.outputDir, 'postgresql-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );

    console.log('\n📊 POSTGRESQL DATASET ANALYSIS');
    console.log('=' .repeat(45));
    console.log(`Total Examples: ${analysis.totalExamples}`);

    console.log('\n🏷️ Categories:');
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} (${(count/analysis.totalExamples*100).toFixed(1)}%)`);
      });

    console.log('\n📊 Complexity:');
    Object.entries(complexityStats)
      .forEach(([complexity, count]) => {
        console.log(`  ${complexity}: ${count} (${(count/analysis.totalExamples*100).toFixed(1)}%)`);
      });

    console.log(`\n📋 Analysis saved to: ${path.join(this.outputDir, 'postgresql-analysis.json')}`);
  }

  /**
   * Main execution
   */
  run(): void {
    this.generateAllExamples();
    this.exportDataset();
    this.generateAnalysis();

    console.log('\n🎯 POSTGRESQL DOCUMENTATION DATASET READY!');
    console.log(`📊 ${this.examples.length} PostgreSQL-specific examples`);
    console.log('🚀 Ready to combine with comprehensive dataset for fine-tuning!');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  const curator = new PostgreSQLDocumentationCurator();
  curator.run();
}

export { PostgreSQLDocumentationCurator };

