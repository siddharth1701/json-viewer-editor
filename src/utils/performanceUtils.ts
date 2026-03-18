import { countNodes, getMaxDepth } from './treeTraversal';
import type { JSONValue } from '@/types';

export interface PerformanceMetrics {
  renderTime: number; // milliseconds
  memoryUsage: number | null; // bytes, null if not available
  fileSize: number; // bytes
  nodeCount: number;
  depth: number;
}

export class PerformanceMonitor {
  private static startTime: number = 0;
  private static startMemory: number | null = null;

  /**
   * Start measuring render time
   */
  static startRender(): void {
    this.startTime = performance.now();
    const perfObj = performance as Performance & { memory?: { usedJSHeapSize: number } };
    if (perfObj.memory) {
      this.startMemory = perfObj.memory.usedJSHeapSize;
    }
  }

  /**
   * End measuring render time and return duration
   */
  static endRender(): number {
    return performance.now() - this.startTime;
  }

  /**
   * Get current memory usage (if available)
   */
  static getMemoryUsage(): number | null {
    const perfObj = performance as Performance & { memory?: { usedJSHeapSize: number } };
    if (perfObj.memory) {
      return perfObj.memory.usedJSHeapSize;
    }
    return null;
  }

  /**
   * Get memory delta (difference from start)
   */
  static getMemoryDelta(): number | null {
    const perfObj = performance as Performance & { memory?: { usedJSHeapSize: number } };
    if (perfObj.memory && this.startMemory !== null) {
      return perfObj.memory.usedJSHeapSize - this.startMemory;
    }
    return null;
  }

  /**
   * Count nodes in JSON structure
   */
  static countNodes(obj: unknown): number {
    return countNodes(obj as JSONValue);
  }

  /**
   * Calculate max depth of JSON structure
   */
  static calculateDepth(obj: unknown): number {
    return getMaxDepth(obj as JSONValue);
  }

  /**
   * Get comprehensive performance metrics for JSON data
   */
  static getMetrics(jsonData: unknown): PerformanceMetrics {
    const renderTime = this.endRender();
    const memoryUsage = this.getMemoryUsage();
    const jsonString = JSON.stringify(jsonData);
    const fileSize = new Blob([jsonString]).size;
    const nodeCount = this.countNodes(jsonData);
    const depth = this.calculateDepth(jsonData);

    return {
      renderTime,
      memoryUsage,
      fileSize,
      nodeCount,
      depth
    };
  }
}

/**
 * Format milliseconds to readable string
 */
export const formatRenderTime = (ms: number): string => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Format bytes to human-readable size
 */
export const formatMemorySize = (bytes: number | null): string => {
  if (bytes === null) return 'N/A';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = Math.abs(bytes);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};
