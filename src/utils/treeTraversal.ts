import type { JSONValue } from '@/types';

/**
 * Generic tree traversal for JSON structures
 * Handles both arrays and objects recursively
 */

export type TraversalCallback = (
  value: JSONValue,
  path: string,
  depth: number
) => void;

export type TraversalTransform = (
  value: JSONValue,
  path: string,
  depth: number
) => JSONValue;

/**
 * Traverse JSON structure and execute callback for each node
 */
export function traverseJSON(
  data: JSONValue,
  callback: TraversalCallback,
  path: string = '$',
  depth: number = 0
): void {
  callback(data, path, depth);

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      traverseJSON(item, callback, `${path}[${index}]`, depth + 1);
    });
  } else if (data && typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      const newPath = path === '$' ? `$.${key}` : `${path}.${key}`;
      traverseJSON(value, callback, newPath, depth + 1);
    });
  }
}

/**
 * Transform JSON structure recursively
 */
export function transformJSON(
  data: JSONValue,
  transform: TraversalTransform,
  path: string = '$',
  depth: number = 0
): JSONValue {
  const transformed = transform(data, path, depth);

  if (Array.isArray(transformed)) {
    return transformed.map((item, index) =>
      transformJSON(item, transform, `${path}[${index}]`, depth + 1)
    );
  } else if (transformed && typeof transformed === 'object' && transformed !== null) {
    const result: Record<string, JSONValue> = {};
    Object.entries(transformed).forEach(([key, value]) => {
      const newPath = path === '$' ? `$.${key}` : `${path}.${key}`;
      result[key] = transformJSON(value, transform, newPath, depth + 1);
    });
    return result;
  }

  return transformed;
}

/**
 * Find all values matching a predicate
 */
export function findInJSON(
  data: JSONValue,
  predicate: (value: JSONValue, path: string, depth: number) => boolean,
  path: string = '$',
  depth: number = 0
): Array<{ value: JSONValue; path: string; depth: number }> {
  const results: Array<{ value: JSONValue; path: string; depth: number }> = [];

  if (predicate(data, path, depth)) {
    results.push({ value: data, path, depth });
  }

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      results.push(
        ...findInJSON(item, predicate, `${path}[${index}]`, depth + 1)
      );
    });
  } else if (data && typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      const newPath = path === '$' ? `$.${key}` : `${path}.${key}`;
      results.push(...findInJSON(value, predicate, newPath, depth + 1));
    });
  }

  return results;
}

/**
 * Calculate maximum depth of JSON structure
 */
export function getMaxDepth(data: JSONValue, depth: number = 0): number {
  if (Array.isArray(data)) {
    if (data.length === 0) return depth;
    return Math.max(...data.map((item) => getMaxDepth(item, depth + 1)));
  } else if (data && typeof data === 'object' && data !== null) {
    const depths = Object.values(data).map((value) =>
      getMaxDepth(value, depth + 1)
    );
    return depths.length === 0 ? depth : Math.max(...depths);
  }
  return depth;
}

/**
 * Count total nodes in JSON structure
 */
export function countNodes(data: JSONValue): number {
  let count = 1;

  if (Array.isArray(data)) {
    data.forEach((item) => {
      count += countNodes(item);
    });
  } else if (data && typeof data === 'object' && data !== null) {
    Object.values(data).forEach((value) => {
      count += countNodes(value);
    });
  }

  return count;
}

/**
 * Detect circular references in JSON-like structure
 */
export function detectCircularReferences(
  data: JSONValue,
  path: string = '$',
  visited = new WeakSet()
): string[] {
  const paths: string[] = [];

  if (data && typeof data === 'object') {
    if (visited.has(data as object)) {
      paths.push(path);
      return paths;
    }
    visited.add(data as object);

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        paths.push(
          ...detectCircularReferences(item, `${path}[${index}]`, visited)
        );
      });
    } else {
      Object.entries(data).forEach(([key, value]) => {
        const newPath = path === '$' ? `$.${key}` : `${path}.${key}`;
        paths.push(
          ...detectCircularReferences(value, newPath, visited)
        );
      });
    }
  }

  return paths;
}

/**
 * Find all leaf nodes (values, not collections)
 */
export function getLeafNodes(
  data: JSONValue,
  path: string = '$',
  depth: number = 0
): Array<{ value: JSONValue; path: string; depth: number }> {
  const leaves: Array<{ value: JSONValue; path: string; depth: number }> = [];

  if (Array.isArray(data)) {
    if (data.length === 0) {
      leaves.push({ value: data, path, depth });
    } else {
      data.forEach((item, index) => {
        leaves.push(...getLeafNodes(item, `${path}[${index}]`, depth + 1));
      });
    }
  } else if (data && typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      leaves.push({ value: data, path, depth });
    } else {
      entries.forEach(([key, value]) => {
        const newPath = path === '$' ? `$.${key}` : `${path}.${key}`;
        leaves.push(...getLeafNodes(value, newPath, depth + 1));
      });
    }
  } else {
    // Primitive value
    leaves.push({ value: data, path, depth });
  }

  return leaves;
}
