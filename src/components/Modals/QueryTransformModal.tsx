import { useState } from 'react';
import { X, Copy, Download } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

interface QueryResult {
  success: boolean;
  data?: any;
  error?: string;
  paths?: string[];
}

export default function QueryTransformModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'jsonpath' | 'schema'>('jsonpath');
  const [jsonPathQuery, setJsonPathQuery] = useState('$');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const activeTab_store = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const activeTabData = tabs.find((tab) => tab.id === activeTab_store);
  const jsonData = activeTabData?.content;

  // Simple JSONPath implementation
  const evaluateJsonPath = (data: any, path: string): QueryResult => {
    try {
      if (!path.trim()) {
        return { success: false, error: 'JSONPath query cannot be empty' };
      }

      // Handle root path
      if (path === '$') {
        return { success: true, data, paths: ['$'] };
      }

      // Simple JSONPath parser for basic paths like $.key, $.key.subkey, $.array[0], etc.
      let current = data;
      const pathSegments = path.replace(/^\$\.?/, '').split('.');
      const matchedPaths: string[] = [];

      for (const segment of pathSegments) {
        if (!segment) continue;

        // Handle array notation like "key[0]"
        const arrayMatch = segment.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
          const key = arrayMatch[1];
          const index = parseInt(arrayMatch[2], 10);

          if (current && typeof current === 'object' && key in current) {
            const arr = current[key];
            if (Array.isArray(arr) && index < arr.length) {
              current = arr[index];
              matchedPaths.push(`$${matchedPaths.length > 0 ? '.' : ''}${segment}`);
            } else {
              return { success: false, error: `Array index ${index} not found in ${key}` };
            }
          } else {
            return { success: false, error: `Key '${key}' not found` };
          }
        } else {
          // Regular key access
          if (current && typeof current === 'object' && segment in current) {
            current = current[segment];
            matchedPaths.push(`${matchedPaths.length === 0 ? '$' : ''}${matchedPaths.length === 0 ? '.' : ''}${segment}`);
          } else {
            return { success: false, error: `Key '${segment}' not found` };
          }
        }
      }

      return {
        success: true,
        data: current,
        paths: matchedPaths.length > 0 ? matchedPaths : ['$']
      };
    } catch (err) {
      return {
        success: false,
        error: `JSONPath evaluation error: ${(err as Error).message}`
      };
    }
  };

  // Generate JSON Schema
  const generateJsonSchema = (data: any): any => {
    if (data === null) {
      return { type: 'null' };
    }

    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? generateJsonSchema(data[0]) : {},
        minItems: 0,
        maxItems: data.length
      };
    }

    if (typeof data === 'object') {
      const properties: any = {};
      const required: string[] = [];

      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          properties[key] = generateJsonSchema(data[key]);
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required,
        additionalProperties: false
      };
    }

    // Primitives
    if (typeof data === 'string') {
      return { type: 'string' };
    }
    if (typeof data === 'number') {
      return Number.isInteger(data) ? { type: 'integer' } : { type: 'number' };
    }
    if (typeof data === 'boolean') {
      return { type: 'boolean' };
    }

    return { type: 'unknown' };
  };

  const handleQueryExecute = () => {
    if (!jsonData) {
      setQueryResult({
        success: false,
        error: 'No JSON data loaded. Please load JSON first.'
      });
      return;
    }

    const result = evaluateJsonPath(jsonData, jsonPathQuery);
    setQueryResult(result);
  };

  const handleGenerateSchema = () => {
    if (!jsonData) {
      setQueryResult({
        success: false,
        error: 'No JSON data loaded. Please load JSON first.'
      });
      return;
    }

    const schema = generateJsonSchema(jsonData);
    setQueryResult({
      success: true,
      data: schema
    });
  };

  const handleCopyResult = () => {
    if (queryResult?.success && queryResult.data) {
      const text = JSON.stringify(queryResult.data, null, 2);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadResult = () => {
    if (queryResult?.success && queryResult.data) {
      const data = JSON.stringify(queryResult.data, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `query-result-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-11/12 max-w-4xl max-h-96 flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-lg">Query & Transform</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab('jsonpath');
              setQueryResult(null);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'jsonpath'
                ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            JSONPath Tester
          </button>
          <button
            onClick={() => {
              setActiveTab('schema');
              setQueryResult(null);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'schema'
                ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            Generate JSON Schema
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex flex-col">
          {activeTab === 'jsonpath' && (
            <div className="flex-1 flex flex-col p-6 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">JSONPath Query</label>
                <input
                  type="text"
                  value={jsonPathQuery}
                  onChange={(e) => setJsonPathQuery(e.target.value)}
                  placeholder="$.user.name or $.items[0].id"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleQueryExecute()}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Examples: $ (root), $.name, $.items[0], $.user.address.city
                </p>
              </div>

              <button
                onClick={handleQueryExecute}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Execute Query
              </button>

              {queryResult && (
                <div className="flex-1 overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  {queryResult.success ? (
                    <>
                      <p className="text-xs font-mono text-green-600 dark:text-green-400 mb-2">
                        Query matched successfully
                      </p>
                      <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto">
                        {JSON.stringify(queryResult.data, null, 2)}
                      </pre>
                    </>
                  ) : (
                    <p className="text-xs font-mono text-red-600 dark:text-red-400">
                      Error: {queryResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="flex-1 flex flex-col p-6 gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate a JSON Schema from the current JSON data.
              </p>

              <button
                onClick={handleGenerateSchema}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Generate Schema
              </button>

              {queryResult && (
                <div className="flex-1 overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  {queryResult.success ? (
                    <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto">
                      {JSON.stringify(queryResult.data, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs font-mono text-red-600 dark:text-red-400">
                      Error: {queryResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Action Buttons */}
        {queryResult?.success && queryResult.data && (
          <div className="h-12 border-t border-gray-200 dark:border-gray-700 px-6 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              onClick={handleCopyResult}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownloadResult}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
