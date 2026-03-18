import { JSONValue } from '@/types';

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_JSON_STRING_LENGTH = 5 * 1024 * 1024; // 5MB for string representation

/**
 * Validate JSON value doesn't exceed size limits
 */
export function validateJSONSize(data: JSONValue): { valid: boolean; message?: string } {
  try {
    const jsonString = JSON.stringify(data);
    const sizeBytes = new Blob([jsonString]).size;

    if (sizeBytes > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `JSON size (${formatBytes(sizeBytes)}) exceeds maximum allowed (${formatBytes(MAX_FILE_SIZE)})`,
      };
    }

    if (jsonString.length > MAX_JSON_STRING_LENGTH) {
      return {
        valid: false,
        message: `JSON is too large to process (${formatBytes(jsonString.length)} characters)`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      message: 'Failed to validate JSON size',
    };
  }
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file size before processing
 */
export function validateFileSize(file: File): { valid: boolean; message?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size (${formatBytes(file.size)}) exceeds maximum allowed (${formatBytes(MAX_FILE_SIZE)})`,
    };
  }
  return { valid: true };
}

/**
 * Check if a value is a valid JSON object (not array or primitive)
 */
export function isValidJSONObject(value: JSONValue): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is a valid JSON array
 */
export function isValidJSONArray(value: JSONValue): boolean {
  return Array.isArray(value);
}

/**
 * Safe JSON stringify with error handling
 */
export function safeStringify(value: JSONValue, indent: number = 2): { success: boolean; result?: string; error?: string } {
  try {
    const result = JSON.stringify(value, null, indent);

    // Check size after stringification
    if (result.length > MAX_JSON_STRING_LENGTH) {
      return {
        success: false,
        error: `Stringified JSON exceeds maximum size (${formatBytes(result.length)})`,
      };
    }

    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: `Failed to stringify JSON: ${(error as Error).message}`,
    };
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeParse(jsonString: string): { success: boolean; data?: JSONValue; error?: string } {
  try {
    // Check string length before parsing
    if (jsonString.length > MAX_JSON_STRING_LENGTH) {
      return {
        success: false,
        error: `JSON string exceeds maximum size (${formatBytes(jsonString.length)})`,
      };
    }

    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON: ${(error as Error).message}`,
    };
  }
}
