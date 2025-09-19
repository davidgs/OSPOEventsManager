#!/usr/bin/env tsx
/**
 * Generate Comprehensive Training Dataset for SQL Fine-Tuning
 *
 * This script creates a large, diverse dataset of query examples based on:
 * - Known failure patterns from our production system
 * - PostgreSQL documentation patterns
 * - Event management domain knowledge
 * - Geographic and temporal query variations
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
  metadata: {
    category: string;
    complexity: 'simple' | 'medium' | 'complex';
    pattern: string;
    notes?: string;
  };
}

class TrainingDatasetGenerator {
  private examples: TrainingExample[] = [];
  private outputDir = path.join(__dirname, '../training-data');

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Get the schema context for all examples
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
Always use specific column names, avoid SELECT *`;
  }

  /**
   * Generate basic counting queries
   */
  generateCountingQueries(): void {
    console.log('📊 Generating counting queries...');

    const countingExamples = [
      {
        query: "How many events are there?",
        sql: "SELECT COUNT(*) FROM events",
        pattern: "simple_count"
      },
      {
        query: "How many events are confirmed?",
        sql: "SELECT COUNT(*) FROM events WHERE status = 'confirmed'",
        pattern: "filtered_count"
      },
      {
        query: "Count events by type",
        sql: "SELECT type, COUNT(*) FROM events GROUP BY type ORDER BY COUNT(*) DESC",
        pattern: "grouped_count"
      },
      {
        query: "How many events are there in Asia?",
        sql: "SELECT COUNT(*) FROM events WHERE continent = 'Asia'",
        pattern: "geographic_count"
      },
      {
        query: "How many upcoming events?",
        sql: "SELECT COUNT(*) FROM events WHERE start_date > NOW()",
        pattern: "temporal_count"
      },
      {
        query: "Count events by priority level",
        sql: "SELECT priority, COUNT(*) FROM events GROUP BY priority ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END",
        pattern: "priority_grouped_count"
      },
      {
        query: "How many events in each country?",
        sql: "SELECT country, COUNT(*) FROM events WHERE country IS NOT NULL GROUP BY country ORDER BY COUNT(*) DESC",
        pattern: "geographic_grouped_count"
      },
      {
        query: "Total events this year",
        sql: "SELECT COUNT(*) FROM events WHERE EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM NOW())",
        pattern: "temporal_extract_count"
      }
    ];

    for (const example of countingExamples) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${example.query}`,
        input: this.getSchemaContext(),
        output: example.sql,
        metadata: {
          category: 'count',
          complexity: example.pattern.includes('group') ? 'medium' : 'simple',
          pattern: example.pattern
        }
      });
    }
  }

  /**
   * Generate geographic queries
   */
  generateGeographicQueries(): void {
    console.log('🌍 Generating geographic queries...');

    const continents = ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'];
    const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'Japan', 'China', 'India', 'Brazil', 'Canada', 'Australia'];

    // Basic continent queries
    for (const continent of continents) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: Find events in ${continent}`,
        input: this.getSchemaContext(),
        output: `SELECT id, name, location, country, region, continent, start_date, end_date, status, priority FROM events WHERE continent = '${continent}' ORDER BY start_date DESC`,
        metadata: {
          category: 'geographic',
          complexity: 'simple',
          pattern: 'continent_filter'
        }
      });

      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: Show all ${continent} events`,
        input: this.getSchemaContext(),
        output: `SELECT id, name, location, country, region, continent, start_date, end_date, status FROM events WHERE continent = '${continent}' ORDER BY start_date ASC`,
        metadata: {
          category: 'geographic',
          complexity: 'simple',
          pattern: 'continent_filter_alt'
        }
      });
    }

    // Country-specific queries
    for (const country of countries.slice(0, 5)) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: Events in ${country}`,
        input: this.getSchemaContext(),
        output: `SELECT id, name, location, country, start_date, end_date, status, priority FROM events WHERE country = '${country}' ORDER BY start_date DESC`,
        metadata: {
          category: 'geographic',
          complexity: 'simple',
          pattern: 'country_filter'
        }
      });
    }

    // Complex geographic queries
    this.examples.push({
      instruction: 'Generate a PostgreSQL SELECT query for: Events in Europe or North America',
      input: this.getSchemaContext(),
      output: "SELECT id, name, location, country, continent, start_date, end_date FROM events WHERE continent IN ('Europe', 'North America') ORDER BY start_date DESC",
      metadata: {
        category: 'geographic',
        complexity: 'medium',
        pattern: 'multiple_continent_filter'
      }
    });

    this.examples.push({
      instruction: 'Generate a PostgreSQL SELECT query for: Find events outside of Asia',
      input: this.getSchemaContext(),
      output: "SELECT id, name, location, country, continent, start_date, end_date FROM events WHERE continent != 'Asia' OR continent IS NULL ORDER BY start_date DESC",
      metadata: {
        category: 'geographic',
        complexity: 'medium',
        pattern: 'negative_geographic_filter'
      }
    });
  }

  /**
   * Generate temporal queries
   */
  generateTemporalQueries(): void {
    console.log('⏰ Generating temporal queries...');

    const temporalExamples = [
      {
        query: "Show upcoming events",
        sql: "SELECT id, name, location, start_date, end_date, status, priority FROM events WHERE start_date > NOW() ORDER BY start_date ASC",
        pattern: "future_events",
        complexity: "simple" as const
      },
      {
        query: "Past events",
        sql: "SELECT id, name, location, start_date, end_date, status FROM events WHERE end_date < NOW() ORDER BY start_date DESC",
        pattern: "past_events",
        complexity: "simple" as const
      },
      {
        query: "Events happening this week",
        sql: "SELECT id, name, location, start_date, end_date FROM events WHERE start_date >= date_trunc('week', NOW()) AND start_date < date_trunc('week', NOW()) + interval '1 week' ORDER BY start_date ASC",
        pattern: "current_week",
        complexity: "complex" as const
      },
      {
        query: "Events in 2024",
        sql: "SELECT id, name, location, start_date, end_date, status FROM events WHERE EXTRACT(YEAR FROM start_date) = 2024 ORDER BY start_date ASC",
        pattern: "year_filter",
        complexity: "medium" as const
      },
      {
        query: "Events next month",
        sql: "SELECT id, name, location, start_date, end_date FROM events WHERE start_date >= date_trunc('month', NOW()) + interval '1 month' AND start_date < date_trunc('month', NOW()) + interval '2 months' ORDER BY start_date ASC",
        pattern: "next_month",
        complexity: "complex" as const
      },
      {
        query: "Events in the last 30 days",
        sql: "SELECT id, name, location, start_date, end_date, status FROM events WHERE start_date >= NOW() - interval '30 days' AND start_date <= NOW() ORDER BY start_date DESC",
        pattern: "last_30_days",
        complexity: "medium" as const
      },
      {
        query: "Events starting today",
        sql: "SELECT id, name, location, start_date, end_date FROM events WHERE DATE(start_date) = CURRENT_DATE ORDER BY start_date ASC",
        pattern: "today_events",
        complexity: "medium" as const
      },
      {
        query: "Events between January and March 2024",
        sql: "SELECT id, name, location, start_date, end_date FROM events WHERE start_date >= '2024-01-01' AND start_date < '2024-04-01' ORDER BY start_date ASC",
        pattern: "date_range",
        complexity: "medium" as const
      }
    ];

    for (const example of temporalExamples) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${example.query}`,
        input: this.getSchemaContext(),
        output: example.sql,
        metadata: {
          category: 'temporal',
          complexity: example.complexity,
          pattern: example.pattern
        }
      });
    }
  }

  /**
   * Generate event type and status queries
   */
  generateEventTypeStatusQueries(): void {
    console.log('🏷️ Generating event type and status queries...');

    const types = ['conference', 'meetup', 'workshop', 'webinar', 'hackathon'];
    const statuses = ['confirmed', 'pending', 'cancelled'];
    const priorities = ['low', 'medium', 'high', 'critical'];

    // Event type queries
    for (const type of types) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: All ${type} events`,
        input: this.getSchemaContext(),
        output: `SELECT id, name, location, start_date, end_date, status, priority FROM events WHERE type = '${type}' ORDER BY start_date DESC`,
        metadata: {
          category: 'event_type',
          complexity: 'simple',
          pattern: 'type_filter'
        }
      });
    }

    // Status queries
    for (const status of statuses) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${status} events`,
        input: this.getSchemaContext(),
        output: `SELECT id, name, location, start_date, end_date, status, type FROM events WHERE status = '${status}' ORDER BY start_date DESC`,
        metadata: {
          category: 'status_priority',
          complexity: 'simple',
          pattern: 'status_filter'
        }
      });
    }

    // Priority queries
    for (const priority of priorities) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${priority} priority events`,
        input: this.getSchemaContext(),
        output: `SELECT id, name, location, start_date, end_date, status, priority FROM events WHERE priority = '${priority}' ORDER BY start_date DESC`,
        metadata: {
          category: 'status_priority',
          complexity: 'simple',
          pattern: 'priority_filter'
        }
      });
    }

    // Combined queries
    this.examples.push({
      instruction: 'Generate a PostgreSQL SELECT query for: Confirmed conferences',
      input: this.getSchemaContext(),
      output: "SELECT id, name, location, start_date, end_date, status, priority FROM events WHERE type = 'conference' AND status = 'confirmed' ORDER BY start_date DESC",
      metadata: {
        category: 'event_type',
        complexity: 'medium',
        pattern: 'type_status_filter'
      }
    });

    this.examples.push({
      instruction: 'Generate a PostgreSQL SELECT query for: High priority upcoming events',
      input: this.getSchemaContext(),
      output: "SELECT id, name, location, start_date, end_date, status, priority FROM events WHERE priority = 'high' AND start_date > NOW() ORDER BY start_date ASC",
      metadata: {
        category: 'status_priority',
        complexity: 'medium',
        pattern: 'priority_temporal_filter'
      }
    });
  }

  /**
   * Generate complex multi-table join queries
   */
  generateJoinQueries(): void {
    console.log('🔗 Generating join queries...');

    const joinExamples = [
      {
        query: "Events with attendee counts",
        sql: "SELECT e.id, e.name, e.location, e.start_date, COUNT(a.id) as attendee_count FROM events e LEFT JOIN attendees a ON e.id = a.event_id GROUP BY e.id, e.name, e.location, e.start_date ORDER BY attendee_count DESC",
        pattern: "event_attendee_count",
        complexity: "complex" as const
      },
      {
        query: "Events with CFP submission counts",
        sql: "SELECT e.id, e.name, e.location, e.start_date, COUNT(c.id) as cfp_count FROM events e LEFT JOIN cfp_submissions c ON e.id = c.event_id GROUP BY e.id, e.name, e.location, e.start_date ORDER BY cfp_count DESC",
        pattern: "event_cfp_count",
        complexity: "complex" as const
      },
      {
        query: "Events with the most attendees",
        sql: "SELECT e.id, e.name, e.location, COUNT(a.id) as attendee_count FROM events e LEFT JOIN attendees a ON e.id = a.event_id GROUP BY e.id, e.name, e.location ORDER BY attendee_count DESC LIMIT 10",
        pattern: "top_events_by_attendees",
        complexity: "complex" as const
      },
      {
        query: "Upcoming events with confirmed attendees",
        sql: "SELECT DISTINCT e.id, e.name, e.location, e.start_date FROM events e JOIN attendees a ON e.id = a.event_id WHERE e.start_date > NOW() AND a.status = 'confirmed' ORDER BY e.start_date ASC",
        pattern: "upcoming_with_confirmed_attendees",
        complexity: "complex" as const
      }
    ];

    for (const example of joinExamples) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${example.query}`,
        input: this.getSchemaContext(),
        output: example.sql,
        metadata: {
          category: 'related_data',
          complexity: example.complexity,
          pattern: example.pattern
        }
      });
    }
  }

  /**
   * Generate common failure patterns with corrections
   */
  generateFailurePatterns(): void {
    console.log('❌ Generating failure pattern corrections...');

    const failureCorrections = [
      {
        query: "Show all events",
        wrongSQL: "SELECT * WHERE status = 'confirmed'",
        correctSQL: "SELECT id, name, location, start_date, end_date, status, priority, type FROM events ORDER BY start_date DESC",
        error: "Missing FROM clause",
        pattern: "missing_from_clause"
      },
      {
        query: "Count events in Europe",
        wrongSQL: "SELECT COUNT(*) WHERE continent = 'Europe'",
        correctSQL: "SELECT COUNT(*) FROM events WHERE continent = 'Europe'",
        error: "Missing FROM clause",
        pattern: "missing_from_clause"
      },
      {
        query: "All conferences",
        wrongSQL: "`SELECT * FROM events WHERE type = 'conference'`",
        correctSQL: "SELECT id, name, location, start_date, end_date, status, priority FROM events WHERE type = 'conference' ORDER BY start_date DESC",
        error: "Backtick syntax error",
        pattern: "backtick_syntax"
      },
      {
        query: "Events in London",
        wrongSQL: "SELECT * FROM events WHERE city = 'London'",
        correctSQL: "SELECT id, name, location, country, start_date, end_date FROM events WHERE location ILIKE '%London%'",
        error: "Invalid column 'city'",
        pattern: "invalid_column"
      },
      {
        query: "Events this year",
        wrongSQL: "SELECT * FROM events WHERE YEAR(start_date) = 2024",
        correctSQL: "SELECT id, name, location, start_date, end_date FROM events WHERE EXTRACT(YEAR FROM start_date) = 2024",
        error: "MySQL YEAR() function not supported",
        pattern: "mysql_function"
      },
      {
        query: "Recent events",
        wrongSQL: "SELECT * FROM events WHERE start_date > DATE_SUB(NOW(), INTERVAL 30 DAY)",
        correctSQL: "SELECT id, name, location, start_date, end_date FROM events WHERE start_date > NOW() - INTERVAL '30 days'",
        error: "MySQL DATE_SUB not supported",
        pattern: "mysql_function"
      }
    ];

    for (const correction of failureCorrections) {
      // Add the correct version
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${correction.query}`,
        input: this.getSchemaContext(),
        output: correction.correctSQL,
        metadata: {
          category: 'general',
          complexity: 'simple',
          pattern: correction.pattern,
          notes: `Corrected from common error: ${correction.error}`
        }
      });
    }
  }

  /**
   * Generate PostgreSQL-specific syntax examples
   */
  generatePostgreSQLSpecificQueries(): void {
    console.log('🐘 Generating PostgreSQL-specific queries...');

    const postgresExamples = [
      {
        query: "Events with case-insensitive location search",
        sql: "SELECT id, name, location, country FROM events WHERE location ILIKE '%paris%'",
        pattern: "case_insensitive_search",
        complexity: "medium" as const
      },
      {
        query: "Events ordered by priority (custom order)",
        sql: "SELECT id, name, priority, start_date FROM events ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END, start_date ASC",
        pattern: "custom_order",
        complexity: "complex" as const
      },
      {
        query: "Events with null-safe country filtering",
        sql: "SELECT id, name, location, country FROM events WHERE country IS NOT NULL AND country != '' ORDER BY country",
        pattern: "null_safe_filter",
        complexity: "medium" as const
      },
      {
        query: "Events grouped by month",
        sql: "SELECT DATE_TRUNC('month', start_date) as month, COUNT(*) FROM events GROUP BY DATE_TRUNC('month', start_date) ORDER BY month",
        pattern: "date_truncation",
        complexity: "complex" as const
      },
      {
        query: "Events with string aggregation of types",
        sql: "SELECT continent, STRING_AGG(DISTINCT type, ', ' ORDER BY type) as event_types FROM events WHERE continent IS NOT NULL GROUP BY continent",
        pattern: "string_aggregation",
        complexity: "complex" as const
      }
    ];

    for (const example of postgresExamples) {
      this.examples.push({
        instruction: `Generate a PostgreSQL SELECT query for: ${example.query}`,
        input: this.getSchemaContext(),
        output: example.sql,
        metadata: {
          category: 'postgresql_specific',
          complexity: example.complexity,
          pattern: example.pattern
        }
      });
    }
  }

  /**
   * Generate all training examples
   */
  generateAllExamples(): void {
    console.log('🚀 Generating comprehensive training dataset...');
    console.log('=' .repeat(60));

    this.generateCountingQueries();
    this.generateGeographicQueries();
    this.generateTemporalQueries();
    this.generateEventTypeStatusQueries();
    this.generateJoinQueries();
    this.generateFailurePatterns();
    this.generatePostgreSQLSpecificQueries();

    console.log(`\n✅ Generated ${this.examples.length} training examples`);
  }

  /**
   * Export the dataset
   */
  exportDataset(): void {
    console.log('\n💾 Exporting training dataset...');

    // Export full dataset
    fs.writeFileSync(
      path.join(this.outputDir, 'comprehensive-training-dataset.json'),
      JSON.stringify(this.examples, null, 2)
    );

    // Export by category
    const categories = [...new Set(this.examples.map(ex => ex.metadata.category))];
    for (const category of categories) {
      const categoryExamples = this.examples.filter(ex => ex.metadata.category === category);
      fs.writeFileSync(
        path.join(this.outputDir, `training-${category}.json`),
        JSON.stringify(categoryExamples, null, 2)
      );
      console.log(`  📁 ${category}: ${categoryExamples.length} examples`);
    }

    // Export by complexity
    const complexities = [...new Set(this.examples.map(ex => ex.metadata.complexity))];
    for (const complexity of complexities) {
      const complexityExamples = this.examples.filter(ex => ex.metadata.complexity === complexity);
      fs.writeFileSync(
        path.join(this.outputDir, `training-${complexity}.json`),
        JSON.stringify(complexityExamples, null, 2)
      );
      console.log(`  📊 ${complexity}: ${complexityExamples.length} examples`);
    }

    console.log(`\n📁 All files saved to: ${this.outputDir}`);
  }

  /**
   * Generate analysis report
   */
  generateAnalysis(): void {
    console.log('\n📈 Generating dataset analysis...');

    const categoryStats = this.examples.reduce((acc, ex) => {
      acc[ex.metadata.category] = (acc[ex.metadata.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const complexityStats = this.examples.reduce((acc, ex) => {
      acc[ex.metadata.complexity] = (acc[ex.metadata.complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const patternStats = this.examples.reduce((acc, ex) => {
      acc[ex.metadata.pattern] = (acc[ex.metadata.pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const analysis = {
      totalExamples: this.examples.length,
      categories: categoryStats,
      complexities: complexityStats,
      patterns: patternStats,
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(this.outputDir, 'dataset-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );

    console.log('\n📊 DATASET ANALYSIS');
    console.log('=' .repeat(40));
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

    console.log(`\n📋 Analysis saved to: ${path.join(this.outputDir, 'dataset-analysis.json')}`);
  }

  /**
   * Main execution
   */
  run(): void {
    this.generateAllExamples();
    this.exportDataset();
    this.generateAnalysis();

    console.log('\n🎯 TRAINING DATASET READY!');
    console.log(`📊 ${this.examples.length} examples across ${new Set(this.examples.map(ex => ex.metadata.category)).size} categories`);
    console.log('🚀 Ready for fine-tuning process!');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new TrainingDatasetGenerator();
  generator.run();
}

export { TrainingDatasetGenerator };
