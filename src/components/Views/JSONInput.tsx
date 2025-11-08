import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Loader } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { validateJSON, repairJSON, parseJSONC } from '@/utils/jsonUtils';

export default function JSONInput() {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [repairSuggestion, setRepairSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const updateTabContent = useAppStore((state) => state.updateTabContent);
  const addRecentFile = useAppStore((state) => state.addRecentFile);

  const handleParse = () => {
    if (!jsonText.trim()) {
      setError('Please enter some JSON');
      return;
    }

    // Try standard JSON
    let result = validateJSON(jsonText);

    // Try JSONC if standard fails
    if (!result.valid) {
      const jsoncData = parseJSONC(jsonText);
      if (jsoncData) {
        result = { valid: true, data: jsoncData };
      }
    }

    if (result.valid && result.data && activeTabId) {
      updateTabContent(activeTabId, result.data);
      addRecentFile('Pasted JSON', result.data);
      setError(null);
      setRepairSuggestion(null);
    } else if (result.error) {
      setError(`Error at line ${result.error.line}, column ${result.error.column}: ${result.error.message}`);

      // Try to repair
      const repaired = repairJSON(jsonText);
      if (repaired.repaired && repaired.data) {
        setRepairSuggestion(repaired);
      }
    }
  };

  const handleRepair = () => {
    if (repairSuggestion?.data && activeTabId) {
      updateTabContent(activeTabId, repairSuggestion.data);
      addRecentFile('Repaired JSON', repairSuggestion.data);
      setJsonText('');
      setError(null);
      setRepairSuggestion(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = validateJSON(content);

        if (result.valid && result.data && activeTabId) {
          updateTabContent(activeTabId, result.data);
          addRecentFile(file.name, result.data);
          setError(null);
        } else {
          setError('Invalid JSON file');
        }
      } catch {
        setError('Failed to read file');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileUpload({ target: input } as any);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">JSON Viewer & Editor</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Paste, upload, or drag & drop your JSON data to get started
          </p>
        </div>

        {/* Text Input */}
        <div className="relative">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='Paste your JSON here... { "example": "data" }'
            className="w-full h-64 p-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none font-mono text-sm resize-none"
            aria-label="JSON input textarea"
          />
          {error && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              {repairSuggestion && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Suggested fixes:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                    {repairSuggestion.suggestions.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <button
                    onClick={handleRepair}
                    className="mt-2 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm transition-colors"
                  >
                    Apply Fixes
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleParse}
            disabled={!jsonText.trim()}
            className="mt-2 w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            Parse JSON
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          <span className="text-sm text-gray-500 dark:text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* File Upload & Drag-Drop */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload JSON file"
          />
          {loading ? (
            <Loader className="w-12 h-12 mx-auto mb-4 animate-spin text-primary-500" />
          ) : (
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          )}
          <p className="text-lg font-medium mb-1">Drop your JSON file here</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            or click to browse files
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <button
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              const url = prompt('Enter JSON URL:');
              if (url) {
                setLoading(true);
                fetch(url)
                  .then((res) => res.json())
                  .then((data) => {
                    if (activeTabId) {
                      updateTabContent(activeTabId, data);
                      addRecentFile('From URL', data);
                    }
                  })
                  .catch(() => setError('Failed to fetch JSON from URL'))
                  .finally(() => setLoading(false));
              }
            }}
          >
            <LinkIcon className="w-5 h-5" />
            <span>Load from URL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
