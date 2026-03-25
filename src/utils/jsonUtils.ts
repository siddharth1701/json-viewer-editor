import type { JSONValue, ValidationError, Statistics } from '@/types';
import { jsonrepair } from 'jsonrepair';
import { traverseJSON, countNodes, getMaxDepth, detectCircularReferences as detectCircularReferencesUtil, getLeafNodes } from './treeTraversal';

/**
 * Validates JSON string and returns parsed JSON or error
 */
export function validateJSON(jsonString: string): {
  valid: boolean;
  data?: JSONValue;
  error?: ValidationError;
} {
  try {
    const data = JSON.parse(jsonString);
    return { valid: true, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      const match = error.message.match(/position (\d+)/);
      const position = match ? parseInt(match[1], 10) : 0;
      const lines = jsonString.substring(0, position).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;

      return {
        valid: false,
        error: {
          line,
          column,
          message: error.message,
        },
      };
    }
    return {
      valid: false,
      error: {
        line: 0,
        column: 0,
        message: 'Unknown error',
      },
    };
  }
}

/**
 * Parse JSONC (JSON with comments)
 */
export function parseJSONC(jsonString: string): JSONValue | null {
  try {
    // Remove single-line comments
    let cleaned = jsonString.replace(/\/\/.*/g, '');
    // Remove multi-line comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Classifies what was fixed during repair by comparing original and repaired strings
 */
function diffSuggestions(original: string, repaired: string): string[] {
  const suggestions: string[] = [];

  // Trailing commas
  if (original.includes(',}') || original.includes(',]')) {
    suggestions.push('Removed trailing commas');
  }

  // Unquoted keys (check for pattern like `key:` becoming `"key":`)
  if (!/^\s*["']/.test(original) && repaired.includes('"')) {
    const keyPattern = /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/;
    if (keyPattern.test(original) && !keyPattern.test(repaired)) {
      suggestions.push('Added quotes around unquoted keys');
    }
  }

  // Unclosed brackets
  if (!original.includes('}') && repaired.includes('}')) {
    suggestions.push('Closed unclosed braces');
  }
  if (!original.includes(']') && repaired.includes(']')) {
    suggestions.push('Closed unclosed brackets');
  }

  // Single to double quotes
  if (original.includes("'") && repaired.includes('"') && !original.includes('"')) {
    suggestions.push('Converted single quotes to double quotes');
  }

  // Python-style booleans/null
  if (/(True|False|None)\b/.test(original)) {
    suggestions.push('Fixed Python-style boolean/null literals');
  }

  // undefined/NaN/Infinity
  if (/(undefined|NaN|Infinity)\b/.test(original)) {
    suggestions.push('Replaced undefined/NaN/Infinity with valid JSON');
  }

  // Duplicate keys warning
  const keyMatches = repaired.match(/"([^"]+)"\s*:/g) || [];
  const keySet = new Set();
  let hasDuplicates = false;
  for (const match of keyMatches) {
    const key = match.replace(/[":\s]/g, '');
    if (keySet.has(key)) {
      hasDuplicates = true;
      break;
    }
    keySet.add(key);
  }
  if (hasDuplicates) {
    suggestions.push('Note: Duplicate keys detected');
  }

  return suggestions;
}

/**
 * Attempts to repair malformed JSON using jsonrepair library
 */
export function repairJSON(jsonString: string): {
  repaired: boolean;
  data?: JSONValue;
  suggestions?: string[];
} {
  try {
    const trimmed = jsonString.trim();

    // Strip BOM if present
    const cleaned = trimmed.charCodeAt(0) === 0xFEFF ? trimmed.slice(1) : trimmed;

    // Try native parse first
    try {
      const data = JSON.parse(cleaned);
      return { repaired: false, data, suggestions: [] };
    } catch {
      // Falls through to repair attempt
    }

    // Attempt repair with jsonrepair
    const repaired = jsonrepair(cleaned);
    const data = JSON.parse(repaired);

    const suggestions = diffSuggestions(cleaned, repaired);

    return { repaired: true, data, suggestions };
  } catch {
    return { repaired: false, suggestions: [] };
  }
}

/**
 * Formats JSON with specified indentation
 */
export function formatJSON(data: JSONValue, indent: number = 2): string {
  return JSON.stringify(data, null, indent);
}

/**
 * Minifies JSON
 */
export function minifyJSON(data: JSONValue): string {
  return JSON.stringify(data);
}

/**
 * Sorts object keys recursively
 */
export function sortKeys(data: JSONValue, recursive: boolean = false): JSONValue {
  if (Array.isArray(data)) {
    return recursive ? data.map((item) => sortKeys(item, true)) : data;
  }

  if (data && typeof data === 'object' && data !== null) {
    const sorted: Record<string, JSONValue> = {};
    Object.keys(data)
      .sort()
      .forEach((key) => {
        sorted[key] = recursive ? sortKeys(data[key], true) : data[key];
      });
    return sorted;
  }

  return data;
}

/**
 * Removes duplicate keys (keeps last occurrence)
 */
export function removeDuplicateKeys(jsonString: string): string {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch {
    return jsonString;
  }
}

/**
 * Escapes special characters in strings
 */
export function escapeStrings(data: JSONValue): JSONValue {
  if (typeof data === 'string') {
    return data
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  if (Array.isArray(data)) {
    return data.map(escapeStrings);
  }

  if (data && typeof data === 'object' && data !== null) {
    const result: Record<string, JSONValue> = {};
    Object.entries(data).forEach(([key, value]) => {
      result[key] = escapeStrings(value);
    });
    return result;
  }

  return data;
}

/**
 * Unescapes special characters in strings
 */
export function unescapeStrings(data: JSONValue): JSONValue {
  if (typeof data === 'string') {
    return data
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }

  if (Array.isArray(data)) {
    return data.map(unescapeStrings);
  }

  if (data && typeof data === 'object' && data !== null) {
    const result: Record<string, JSONValue> = {};
    Object.entries(data).forEach(([key, value]) => {
      result[key] = unescapeStrings(value);
    });
    return result;
  }

  return data;
}

/**
 * Flattens nested JSON structure
 */
export function flattenJSON(
  data: JSONValue,
  prefix: string = '',
  result: Record<string, JSONValue> = {}
): Record<string, JSONValue> {
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      flattenJSON(item, `${prefix}[${index}]`, result);
    });
  } else if (data && typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      flattenJSON(value, newKey, result);
    });
  } else {
    result[prefix] = data;
  }

  return result;
}

/**
 * Unflattens a flattened JSON structure
 */
export function unflattenJSON(data: Record<string, JSONValue>): JSONValue {
  const result: Record<string, JSONValue> = {};

  Object.entries(data).forEach(([key, value]) => {
    const keys = key.split(/\.|\[|\]/).filter(Boolean);
    let current: Record<string, JSONValue> = result;

    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        current[k] = value;
      } else {
        const nextKey = keys[index + 1];
        const isArray = /^\d+$/.test(nextKey);
        if (!(k in current)) {
          current[k] = isArray ? [] : {};
        }
        current = current[k] as Record<string, JSONValue>;
      }
    });
  });

  return result;
}

/**
 * Calculates statistics for JSON data
 */
export function calculateStatistics(data: JSONValue): Statistics {
  const stats: Statistics = {
    totalSize: JSON.stringify(data).length,
    keyCount: 0,
    valueCount: 0,
    maxDepth: getMaxDepth(data),
    typeDistribution: {},
  };

  traverseJSON(data, (value, _, __) => {
    if (Array.isArray(value)) {
      stats.typeDistribution.array = (stats.typeDistribution.array || 0) + 1;
    } else if (value && typeof value === 'object' && value !== null) {
      stats.typeDistribution.object = (stats.typeDistribution.object || 0) + 1;
      stats.keyCount += Object.keys(value).length;
    } else {
      stats.valueCount++;
      const type = value === null ? 'null' : typeof value;
      stats.typeDistribution[type] = (stats.typeDistribution[type] || 0) + 1;
    }
  });

  return stats;
}

/**
 * Detects circular references
 */
export function detectCircularReferences(data: JSONValue): string[] {
  return detectCircularReferencesUtil(data);
}

/**
 * Finds empty values and null values
 */
export function findEmptyValues(data: JSONValue): string[] {
  const paths: string[] = [];

  function traverse(value: JSONValue, path: string = '$') {
    if (value === null || value === '' || value === undefined) {
      paths.push(path);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        paths.push(path);
      }
      value.forEach((item, index) => traverse(item, `${path}[${index}]`));
    } else if (typeof value === 'object' && value !== null) {
      if (Object.keys(value).length === 0) {
        paths.push(path);
      }
      Object.entries(value).forEach(([key, val]) => {
        traverse(val, `${path}.${key}`);
      });
    }
  }

  traverse(data);
  return paths;
}

/**
 * Finds duplicate values
 */
export function findDuplicateValues(data: JSONValue): Array<{
  value: JSONValue;
  paths: string[];
}> {
  const valueMap = new Map<string, string[]>();

  function traverse(value: JSONValue, path: string = '$') {
    const key = JSON.stringify(value);

    if (!valueMap.has(key)) {
      valueMap.set(key, []);
    }
    valueMap.get(key)!.push(path);

    if (Array.isArray(value)) {
      value.forEach((item, index) => traverse(item, `${path}[${index}]`));
    } else if (value && typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([k, val]) => {
        traverse(val, `${path}.${k}`);
      });
    }
  }

  traverse(data);

  const duplicates: Array<{ value: JSONValue; paths: string[] }> = [];
  valueMap.forEach((paths, valueStr) => {
    if (paths.length > 1) {
      duplicates.push({
        value: JSON.parse(valueStr),
        paths,
      });
    }
  });

  return duplicates;
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Gets the type of a JSON value
 */
export function getValueType(value: JSONValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Gets JSON path for a value
 */
export function getPath(keys: (string | number)[]): string {
  if (keys.length === 0) return '$';

  return (
    '$.' +
    keys
      .map((key) => (typeof key === 'number' ? `[${key}]` : key))
      .join('.')
      .replace(/\.\[/g, '[')
  );
}
