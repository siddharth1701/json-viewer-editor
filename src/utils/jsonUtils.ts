import type { JSONValue, ValidationError, Statistics } from '@/types';

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
 * Attempts to repair malformed JSON
 */
export function repairJSON(jsonString: string): {
  repaired: boolean;
  data?: JSONValue;
  suggestions?: string[];
} {
  const suggestions: string[] = [];
  let repairedString = jsonString.trim();

  // Try to fix common issues
  // 1. Missing quotes around keys
  if (repairedString.includes('{') || repairedString.includes('[')) {
    const keyRegex = /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
    if (keyRegex.test(repairedString)) {
      repairedString = repairedString.replace(keyRegex, '$1"$2":');
      suggestions.push('Added quotes around unquoted keys');
    }
  }

  // 2. Trailing commas
  if (repairedString.includes(',]') || repairedString.includes(',}')) {
    repairedString = repairedString.replace(/,(\s*[}\]])/g, '$1');
    suggestions.push('Removed trailing commas');
  }

  // 3. Single quotes to double quotes
  if (repairedString.includes("'")) {
    repairedString = repairedString.replace(/'/g, '"');
    suggestions.push('Converted single quotes to double quotes');
  }

  try {
    const data = JSON.parse(repairedString);
    return { repaired: true, data, suggestions };
  } catch {
    return { repaired: false, suggestions };
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
  const result: any = {};

  Object.entries(data).forEach(([key, value]) => {
    const keys = key.split(/\.|\[|\]/).filter(Boolean);
    let current = result;

    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        current[k] = value;
      } else {
        const nextKey = keys[index + 1];
        const isArray = /^\d+$/.test(nextKey);
        current[k] = current[k] || (isArray ? [] : {});
        current = current[k];
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
    maxDepth: 0,
    typeDistribution: {},
  };

  function traverse(value: JSONValue, depth: number = 0) {
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    if (Array.isArray(value)) {
      stats.typeDistribution.array = (stats.typeDistribution.array || 0) + 1;
      value.forEach((item) => traverse(item, depth + 1));
    } else if (value && typeof value === 'object' && value !== null) {
      stats.typeDistribution.object = (stats.typeDistribution.object || 0) + 1;
      Object.entries(value).forEach(([key, val]) => {
        stats.keyCount++;
        traverse(val, depth + 1);
      });
    } else {
      stats.valueCount++;
      const type = value === null ? 'null' : typeof value;
      stats.typeDistribution[type] = (stats.typeDistribution[type] || 0) + 1;
    }
  }

  traverse(data);
  return stats;
}

/**
 * Detects circular references
 */
export function detectCircularReferences(data: JSONValue): string[] {
  const seen = new WeakSet();
  const paths: string[] = [];

  function traverse(value: JSONValue, path: string = '$') {
    if (value && typeof value === 'object') {
      if (seen.has(value as object)) {
        paths.push(path);
        return;
      }

      seen.add(value as object);

      if (Array.isArray(value)) {
        value.forEach((item, index) => traverse(item, `${path}[${index}]`));
      } else {
        Object.entries(value).forEach(([key, val]) => {
          traverse(val, `${path}.${key}`);
        });
      }
    }
  }

  traverse(data);
  return paths;
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
