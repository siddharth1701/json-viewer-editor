import yaml from 'js-yaml';
import * as xmljs from 'xml-js';
import Papa from 'papaparse';
import type { JSONValue } from '@/types';

/**
 * Converts JSON to YAML
 */
export function jsonToYAML(data: JSONValue): string {
  try {
    return yaml.dump(data, { indent: 2, lineWidth: -1 });
  } catch (error) {
    throw new Error('Failed to convert to YAML: ' + (error as Error).message);
  }
}

/**
 * Converts JSON to XML
 */
export function jsonToXML(data: JSONValue): string {
  try {
    const options = {
      compact: true,
      ignoreComment: true,
      spaces: 2,
    };
    return xmljs.json2xml(JSON.stringify({ root: data }), options);
  } catch (error) {
    throw new Error('Failed to convert to XML: ' + (error as Error).message);
  }
}

/**
 * Converts JSON array to CSV
 */
export function jsonToCSV(data: JSONValue): string {
  try {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array for CSV conversion');
    }

    if (data.length === 0) {
      return '';
    }

    const csv = Papa.unparse(data);
    return csv;
  } catch (error) {
    throw new Error('Failed to convert to CSV: ' + (error as Error).message);
  }
}

/**
 * Converts JSON to TOML (basic implementation)
 */
export function jsonToTOML(data: JSONValue): string {
  try {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error('TOML conversion requires an object');
    }

    let toml = '';

    function convertValue(value: JSONValue): string {
      if (value === null) return 'null';
      if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
      if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
      if (Array.isArray(value)) {
        return '[' + value.map(convertValue).join(', ') + ']';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    }

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        toml += `\n[${key}]\n`;
        Object.entries(value).forEach(([subKey, subValue]) => {
          toml += `${subKey} = ${convertValue(subValue)}\n`;
        });
      } else {
        toml += `${key} = ${convertValue(value)}\n`;
      }
    });

    return toml.trim();
  } catch (error) {
    throw new Error('Failed to convert to TOML: ' + (error as Error).message);
  }
}

/**
 * Converts JSON to HTML documentation
 */
export function jsonToHTML(data: JSONValue, title: string = 'JSON Data'): string {
  function escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  function renderValue(value: JSONValue, indent: number = 0): string {
    const spacing = '  '.repeat(indent);

    if (value === null) {
      return `<span class="null">null</span>`;
    }

    if (typeof value === 'string') {
      return `<span class="string">"${escapeHtml(value)}"</span>`;
    }

    if (typeof value === 'number') {
      return `<span class="number">${value}</span>`;
    }

    if (typeof value === 'boolean') {
      return `<span class="boolean">${value}</span>`;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      let html = '[\n';
      value.forEach((item, index) => {
        html += `${spacing}  ${renderValue(item, indent + 1)}`;
        if (index < value.length - 1) html += ',';
        html += '\n';
      });
      html += `${spacing}]`;
      return html;
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      let html = '{\n';
      entries.forEach(([key, val], index) => {
        html += `${spacing}  <span class="key">"${escapeHtml(key)}"</span>: ${renderValue(val, indent + 1)}`;
        if (index < entries.length - 1) html += ',';
        html += '\n';
      });
      html += `${spacing}}`;
      return html;
    }

    return String(value);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #2c3e50;
      margin-bottom: 20px;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .string { color: #22863a; }
    .number { color: #005cc5; }
    .boolean { color: #d73a49; }
    .null { color: #6f42c1; }
    .key { color: #24292e; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(title)}</h1>
    <pre>${renderValue(data)}</pre>
  </div>
</body>
</html>`;
}
