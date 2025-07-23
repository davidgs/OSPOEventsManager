import React, { useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";
import { Trash2, Upload, Download, ArrowRight, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import {
  eventPriorities,
  eventTypes,
  eventGoals,
  eventStatuses,
} from "../../../../shared/database-types";

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface ColumnMapping {
  csvColumn: string;
  dbColumn: string | null;
  include: boolean;
  defaultValue?: string;
}

// Database columns for events table
const DB_COLUMNS = [
  { key: "name", label: "Event Name", required: true, type: "text" },
  { key: "link", label: "Event Link", required: false, type: "url" },
  { key: "start_date", label: "Start Date", required: false, type: "date" },
  { key: "end_date", label: "End Date", required: false, type: "date" },
  { key: "location", label: "Location", required: false, type: "text" },
  {
    key: "priority",
    label: "Priority",
    required: false,
    type: "select",
    options: eventPriorities,
  },
  {
    key: "type",
    label: "Event Type",
    required: false,
    type: "select",
    options: eventTypes,
  },
  {
    key: "goal",
    label: "Goals",
    required: false,
    type: "multiselect",
    options: eventGoals,
  },
  { key: "cfp_deadline", label: "CFP Deadline", required: false, type: "date" },
  { key: "early_bird_deadline", label: "Early Bird Registration Deadline", required: false, type: "date" },
  {
    key: "status",
    label: "Status",
    required: false,
    type: "select",
    options: eventStatuses,
  },
  {
    key: "source",
    label: "Source",
    required: false,
    type: "select",
    options: [
      "manual",
      "csv_import",
      "api_import",
      "suggested",
      "external_sync",
    ],
  },
  { key: "notes", label: "Notes", required: false, type: "text" },
] as const;

export function CSVImportModal({
  open,
  onOpenChange,
  onImportComplete,
}: CSVImportModalProps) {
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>(
    {}
  );
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [step, setStep] = useState<
    "upload" | "mapping" | "preview" | "results"
  >("upload");
  const { toast } = useToast();

  const parseCSV = useCallback((content: string): CSVData => {
    const lines = content.trim().split("\n");

    // Helper function to parse a CSV line properly handling quotes
    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      let i = 0;

      while (i < line.length) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Handle escaped quotes
            current += '"';
            i += 2;
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
            i++;
          }
        } else if (char === "," && !inQuotes) {
          // End of field
          result.push(current.trim());
          current = "";
          i++;
        } else {
          current += char;
          i++;
        }
      }

      // Add the last field
      result.push(current.trim());
      return result;
    };

    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map((line) => parseCsvLine(line));

    return { headers, rows };
  }, []);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }

      try {
        const content = await file.text();
        const data = parseCSV(content);

        if (data.headers.length === 0) {
          throw new Error("No headers found in CSV");
        }

        setCsvData(data);

        // Initialize column mappings
        const mappings: ColumnMapping[] = data.headers.map((header) => ({
          csvColumn: header,
          dbColumn: null,
          include: true,
        }));

        setColumnMappings(mappings);
        setStep("mapping");

        toast({
          title: "CSV uploaded successfully",
          description: `Found ${data.headers.length} columns and ${data.rows.length} rows.`,
        });
      } catch (error) {
        toast({
          title: "Error parsing CSV",
          description:
            error instanceof Error
              ? error.message
              : "Failed to parse CSV file.",
          variant: "destructive",
        });
      }
    },
    [parseCSV, toast]
  );

  const updateMapping = useCallback(
    (csvColumn: string, dbColumn: string | null) => {
      setColumnMappings((prev) =>
        prev.map((mapping) =>
          mapping.csvColumn === csvColumn ? { ...mapping, dbColumn } : mapping
        )
      );
    },
    []
  );

  const toggleColumnInclude = useCallback((csvColumn: string) => {
    setColumnMappings((prev) =>
      prev.map((mapping) =>
        mapping.csvColumn === csvColumn
          ? {
              ...mapping,
              include: !mapping.include,
              dbColumn: mapping.include ? null : mapping.dbColumn,
            }
          : mapping
      )
    );
  }, []);

  const mappedColumns = useMemo(() => {
    return columnMappings.filter((m) => m.include && m.dbColumn);
  }, [columnMappings]);

  const missingRequiredColumns = useMemo(() => {
    const mappedDbColumns = mappedColumns.map((m) => m.dbColumn);
    return DB_COLUMNS.filter(
      (col) => col.required && !mappedDbColumns.includes(col.key)
    );
  }, [mappedColumns]);

  const canProceed = missingRequiredColumns.length === 0;

  const handleImport = async () => {
    if (!csvData || !canProceed) return;

    setIsImporting(true);

    try {
      const mappingConfig = Object.fromEntries(
        mappedColumns.map((m) => [m.csvColumn, m.dbColumn])
      );

      const response = await apiRequest("POST", "/api/events/import-csv", {
        csvData: csvData.rows,
        columnMapping: mappingConfig,
        defaultValues: defaultValues,
      });

      if (!response.ok) {
        throw new Error("Import failed");
      }

      const result = await response.json();

      // Create detailed feedback message
      let title = "Import completed";
      let description = `Successfully imported ${result.imported} events.`;

      if (result.skipped > 0) {
        description += ` ${result.skipped} events were skipped.`;
      }

      // If there are errors, show them in the description
      if (result.errors && result.errors.length > 0) {
        const errorSummary = result.errors.slice(0, 3).join("\n");
        const remainingErrors =
          result.errors.length > 3
            ? `\n... and ${result.errors.length - 3} more`
            : "";
        description += `\n\nDetails:\n${errorSummary}${remainingErrors}`;
      }

      toast({
        title,
        description,
        variant:
          result.skipped > 0 || (result.errors && result.errors.length > 0)
            ? "default"
            : "default",
      });

      // Store results and show results step
      setImportResults(result);
      setStep("results");

      onImportComplete();
      onOpenChange(false);
      resetState();
    } catch (error) {
      toast({
        title: "Import failed",
        description:
          error instanceof Error ? error.message : "Failed to import events.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setCsvData(null);
    setColumnMappings([]);
    setDefaultValues({});
    setImportResults(null);
    setStep("upload");
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Upload CSV File</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a CSV file containing event data to import
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="csv-file">CSV File</Label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
        />
      </div>

      <div className="rounded-lg bg-muted p-4">
        <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• First row must contain column headers</li>
          <li>
            • Required fields: Name, Link, Start Date, End Date, Location,
            Priority, Type, Goals
          </li>
          <li>• Dates should be in YYYY-MM-DD format</li>
          <li>• Goals can be comma-separated values</li>
        </ul>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-shrink-0">
        <h3 className="text-lg font-medium">Map CSV Columns</h3>
        <p className="text-sm text-muted-foreground">
          Map your CSV columns to database fields. Required fields must be
          mapped.
        </p>
      </div>

      {missingRequiredColumns.length > 0 && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex-shrink-0">
          <h4 className="font-medium text-destructive mb-2">
            Missing Required Fields:
          </h4>
          <div className="flex flex-wrap gap-2">
            {missingRequiredColumns.map((col) => (
              <Badge key={col.key} variant="destructive">
                {col.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-6">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {columnMappings.map((mapping, index) => (
              <Card key={mapping.csvColumn}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={mapping.include}
                        onChange={() => toggleColumnInclude(mapping.csvColumn)}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">{mapping.csvColumn}</div>
                        <div className="text-sm text-muted-foreground">
                          Sample: {csvData?.rows[0]?.[index] || "N/A"}
                        </div>
                      </div>
                    </div>

                    {mapping.include && (
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={mapping.dbColumn || "__no_mapping__"}
                          onValueChange={(value) =>
                            updateMapping(
                              mapping.csvColumn,
                              value === "__no_mapping__" ? null : value
                            )
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select database column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__no_mapping__">
                              No mapping
                            </SelectItem>
                            {DB_COLUMNS.map((col) => (
                              <SelectItem key={col.key} value={col.key}>
                                {col.label}{" "}
                                {col.required && (
                                  <span className="text-destructive">*</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Default Values Section */}
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium">Set Default Values</h4>
            <p className="text-sm text-muted-foreground">
              Set default values for database columns that aren't mapped from
              your CSV.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DB_COLUMNS.filter(
              (col) => !mappedColumns.some((m) => m.dbColumn === col.key)
            ).map((col) => (
              <div key={col.key} className="space-y-2">
                <Label
                  htmlFor={`default-${col.key}`}
                  className="text-sm font-medium"
                >
                  {col.label}{" "}
                  {col.required && <span className="text-destructive">*</span>}
                </Label>
                {col.type === "select" && col.options ? (
                  <Select
                    value={defaultValues[col.key] || ""}
                    onValueChange={(value) =>
                      setDefaultValues((prev) => ({
                        ...prev,
                        [col.key]: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={`Select ${col.label.toLowerCase()}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {col.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={`default-${col.key}`}
                    type={
                      col.type === "date"
                        ? "date"
                        : col.type === "url"
                        ? "url"
                        : "text"
                    }
                    placeholder={`Enter default ${col.label.toLowerCase()}`}
                    value={defaultValues[col.key] || ""}
                    onChange={(e) =>
                      setDefaultValues((prev) => ({
                        ...prev,
                        [col.key]: e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between flex-shrink-0 pt-4 border-t">
        <Button variant="outline" onClick={resetState}>
          Back to Upload
        </Button>
        <Button onClick={() => setStep("preview")} disabled={!canProceed}>
          Preview Import
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Preview Import</h3>
        <p className="text-sm text-muted-foreground">
          Review the data that will be imported. Showing first 5 rows.
        </p>
      </div>

      <div className="rounded-lg border">
        <ScrollArea className="h-64">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {mappedColumns.map((mapping) => (
                  <th
                    key={mapping.dbColumn}
                    className="p-2 text-left font-medium"
                  >
                    {
                      DB_COLUMNS.find((col) => col.key === mapping.dbColumn)
                        ?.label
                    }
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData?.rows.slice(0, 5).map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b">
                  {mappedColumns.map((mapping) => {
                    const csvIndex = csvData.headers.indexOf(mapping.csvColumn);
                    return (
                      <td key={mapping.dbColumn} className="p-2">
                        {row[csvIndex] || ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep("mapping")}>
          Back to Mapping
        </Button>
        <Button onClick={handleImport} disabled={isImporting}>
          {isImporting
            ? "Importing..."
            : `Import ${csvData?.rows.length} Events`}
        </Button>
      </div>
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Import Results</h3>
        <p className="text-sm text-muted-foreground">
          Here's a summary of your CSV import.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {importResults?.imported || 0}
            </div>
            <div className="text-sm text-muted-foreground">Events Imported</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {importResults?.skipped || 0}
            </div>
            <div className="text-sm text-muted-foreground">Events Skipped</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {csvData?.rows.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Processed</div>
          </CardContent>
        </Card>
      </div>

      {importResults?.errors && importResults.errors.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Skipped Events & Errors:</h4>
          <ScrollArea className="h-64 rounded-md border p-4">
            <div className="space-y-2">
              {importResults.errors.map((error: string, index: number) => (
                <div
                  key={index}
                  className="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded"
                >
                  {error}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep("preview")}>
          Back to Preview
        </Button>
        <Button
          onClick={() => {
            onOpenChange(false);
            resetState();
          }}
        >
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Import Events from CSV</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div
              className={`h-2 w-2 rounded-full ${
                step === "upload" ? "bg-primary" : "bg-muted"
              }`}
            />
            <div className="text-sm">Upload</div>
            <div className="h-px bg-muted flex-1" />
            <div
              className={`h-2 w-2 rounded-full ${
                step === "mapping" ? "bg-primary" : "bg-muted"
              }`}
            />
            <div className="text-sm">Mapping</div>
            <div className="h-px bg-muted flex-1" />
            <div
              className={`h-2 w-2 rounded-full ${
                step === "preview" ? "bg-primary" : "bg-muted"
              }`}
            />
            <div className="text-sm">Preview</div>
            <div className="h-px bg-muted flex-1" />
            <div
              className={`h-2 w-2 rounded-full ${
                step === "results" ? "bg-primary" : "bg-muted"
              }`}
            />
            <div className="text-sm">Results</div>
          </div>

          <Separator className="flex-shrink-0" />

          {/* Step content - make this scrollable */}
          <div className="flex-1 overflow-y-auto">
            {step === "upload" && renderUploadStep()}
            {step === "mapping" && renderMappingStep()}
            {step === "preview" && renderPreviewStep()}
            {step === "results" && renderResultsStep()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
