export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

export type ViewMode = 'tree' | 'code' | 'raw' | 'visualization';

export type SyntaxTheme = 'github' | 'monokai' | 'dracula';

export interface Tab {
  id: string;
  label: string;
  content: JSONValue;
  isDirty: boolean;
  filePath?: string;
  history: JSONValue[];
  historyIndex: number;
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
}

export interface SearchMatch {
  path: string;
  key: string;
  value: JSONValue;
  line?: number;
}

export interface RecentFile {
  id: string;
  name: string;
  content: JSONValue;
  timestamp: number;
}

export interface Statistics {
  totalSize: number;
  keyCount: number;
  valueCount: number;
  maxDepth: number;
  typeDistribution: Record<string, number>;
}

export interface DiffResult {
  additions: string[];
  deletions: string[];
  modifications: string[];
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuData {
  path: string;
  key: string;
  value: JSONValue;
  type: string;
}

export type ExportFormat = 'json' | 'yaml' | 'xml' | 'csv' | 'toml' | 'html' | 'pdf';

export type CodeLanguage = 'typescript' | 'javascript' | 'python' | 'java' | 'csharp' | 'go';
