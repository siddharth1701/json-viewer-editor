import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { JSONPath } from 'jsonpath-plus';
import { useAppStore } from '@/stores/useAppStore';
import type { JSONValue } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchMode = 'jsonpath' | 'text';

interface TextSearchResult {
  line: number;
  content: string;
  matches: number;
}

interface FindReplaceOptions {
  useRegex: boolean;
  replaceAll: boolean;
  replaceValue: string;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('text');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [textResults, setTextResults] = useState<TextSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [replaceValue, setReplaceValue] = useState('');
  const [replacementCount, setReplacementCount] = useState(0);

  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const updateTabContent = useAppStore((state) => state.updateTabContent);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleTextSearch = () => {
    if (!query.trim() || !activeTab?.content) {
      setError('Please enter a search query');
      return;
    }

    try {
      setError(null);
      const jsonString = JSON.stringify(activeTab.content, null, 2);
      const lines = jsonString.split('\n');
      const foundLines: TextSearchResult[] = [];

      let searchRegex: RegExp;
      try {
        if (useRegex) {
          searchRegex = new RegExp(query, caseSensitive ? 'g' : 'gi');
        } else {
          const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          searchRegex = new RegExp(escapedQuery, caseSensitive ? 'g' : 'gi');
        }
      } catch (regexErr) {
        throw new Error(`Invalid regex: ${(regexErr as Error).message}`);
      }

      lines.forEach((line, index) => {
        const matches = (line.match(searchRegex) || []).length;
        if (matches > 0) {
          foundLines.push({
            line: index + 1,
            content: line,
            matches,
          });
        }
      });

      setTextResults(foundLines);
      setResults([]);

      if (foundLines.length === 0) {
        setError('No matches found');
      }
    } catch (err) {
      setError(`Search error: ${(err as Error).message}`);
      setTextResults([]);
    }
  };

  const handleFindReplace = () => {
    if (!query.trim() || !activeTab?.content || !activeTabId) {
      setError('Please enter a search query');
      return;
    }

    try {
      setError(null);
      let jsonString = JSON.stringify(activeTab.content, null, 2);
      let replacementOccurrences = 0;

      try {
        if (useRegex) {
          const searchRegex = new RegExp(query, caseSensitive ? 'g' : 'gi');
          const beforeReplace = (jsonString.match(searchRegex) || []).length;
          jsonString = jsonString.replace(searchRegex, replaceValue);
          replacementOccurrences = beforeReplace;
        } else {
          const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const searchRegex = new RegExp(escapedQuery, caseSensitive ? 'g' : 'gi');
          const beforeReplace = (jsonString.match(searchRegex) || []).length;
          jsonString = jsonString.replace(searchRegex, replaceValue);
          replacementOccurrences = beforeReplace;
        }

        // Parse and update
        const updatedContent = JSON.parse(jsonString);
        updateTabContent(activeTabId, updatedContent);
        setReplacementCount(replacementOccurrences);
        setTextResults([]);
        setResults([]);

        if (replacementOccurrences > 0) {
          setError(null);
          alert(`Replaced ${replacementOccurrences} occurrence(s)`);
        } else {
          setError('No matches found to replace');
        }
      } catch (regexErr) {
        throw new Error(`Invalid regex or JSON: ${(regexErr as Error).message}`);
      }
    } catch (err) {
      setError(`Replace error: ${(err as Error).message}`);
    }
  };

  const handleJSONPathSearch = () => {
    if (!query.trim() || !activeTab?.content) {
      setError('Please enter a search query');
      return;
    }

    try {
      setError(null);
      const searchResults = JSONPath({
        path: query,
        json: activeTab.content,
        resultType: 'all',
      });

      setResults(searchResults);
      setTextResults([]);

      if (searchResults.length === 0) {
        setError('No results found');
      }
    } catch (err) {
      setError(`Invalid JSONPath query: ${(err as Error).message}`);
      setResults([]);
    }
  };

  const handleSearch = () => {
    if (searchMode === 'text') {
      handleTextSearch();
    } else {
      handleJSONPathSearch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Real-time search for text mode
  useEffect(() => {
    if (searchMode === 'text' && query.trim() && !showReplace) {
      const timeoutId = setTimeout(() => {
        handleTextSearch();
      }, 300); // Debounce by 300ms

      return () => clearTimeout(timeoutId);
    } else if (!query.trim()) {
      setTextResults([]);
      setResults([]);
      setError(null);
    }
  }, [query, caseSensitive, useRegex, searchMode, activeTab?.content, showReplace]);

  const handleLineClick = (lineNumber: number) => {
    // This would scroll to the line in the JSON viewer
    // For now, we'll just show a notification
    // In a full implementation, you'd need to pass a callback or use a store
    console.log('Navigate to line:', lineNumber);
    // Close modal and potentially highlight the line
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Search className="w-6 h-6 text-primary-500" />
              <h3 className="text-xl font-bold">Search JSON</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Mode Tabs */}
          <div className="px-6 pt-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setSearchMode('text');
                setResults([]);
                setTextResults([]);
                setError(null);
              }}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                searchMode === 'text'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Text Search
            </button>
            <button
              onClick={() => {
                setSearchMode('jsonpath');
                setResults([]);
                setTextResults([]);
                setError(null);
              }}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                searchMode === 'jsonpath'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              JSONPath Query
            </button>
          </div>

          {/* Search Input */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder={
                  searchMode === 'text'
                    ? 'Search for text, words, or phrases... (auto-search enabled)'
                    : 'Enter JSONPath query (e.g., $.users[*].name)'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              {searchMode === 'jsonpath' && (
                <button
                  onClick={handleSearch}
                  disabled={!activeTab?.content}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Search
                </button>
              )}
              {searchMode === 'text' && query && (
                <div className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                  Searching...
                </div>
              )}
            </div>

            {/* Text Search Options */}
            {searchMode === 'text' && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={caseSensitive}
                      onChange={(e) => setCaseSensitive(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Case sensitive</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useRegex}
                      onChange={(e) => setUseRegex(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Use regex</span>
                  </label>
                  <button
                    onClick={() => setShowReplace(!showReplace)}
                    className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {showReplace ? 'Hide Replace' : 'Find & Replace'}
                  </button>
                </div>

                {/* Find & Replace UI */}
                {showReplace && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Replace with:
                      </label>
                      <input
                        type="text"
                        placeholder="Enter replacement text..."
                        value={replaceValue}
                        onChange={(e) => setReplaceValue(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleFindReplace}
                      disabled={!query.trim()}
                      className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      Replace All
                    </button>
                    {replacementCount > 0 && (
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm">
                        ✓ Replaced {replacementCount} occurrence(s)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Examples */}
            {searchMode === 'jsonpath' && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Quick Examples:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    '$.users[*].name',
                    '$..email',
                    '$.data.items[?(@.active)]',
                    '$.store.book[0].title',
                    '$[*].price',
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setQuery(example)}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors font-mono"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Text Search Results */}
            {textResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">
                    Found {textResults.length} {textResults.length === 1 ? 'line' : 'lines'} with matches
                  </h4>
                </div>

                <div className="space-y-2">
                  {textResults.map((result, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleLineClick(result.line)}
                            className="inline-flex items-center justify-center w-16 h-6 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded transition-colors cursor-pointer"
                            title={`Click to navigate to line ${result.line}`}
                          >
                            Line {result.line}
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
                            {result.content}
                          </pre>
                          {result.matches > 1 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">
                              {result.matches} matches on this line
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(result.content);
                            alert('Line copied to clipboard!');
                          }}
                          className="flex-shrink-0 text-xs px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JSONPath Results */}
            {results.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">
                    Found {results.length} {results.length === 1 ? 'result' : 'results'}
                  </h4>
                </div>

                {results.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                        {result.path}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(result.value, null, 2));
                          alert('Copied to clipboard!');
                        }}
                        className="text-xs px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="text-sm font-mono bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                      {JSON.stringify(result.value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {!error && results.length === 0 && textResults.length === 0 && query && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No results found for your query</p>
              </div>
            )}

            {!query && !error && results.length === 0 && textResults.length === 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-4">
                <div>
                  <h5 className="font-semibold mb-2">JSONPath Query Syntax:</h5>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>
                      <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">$</code> - Root
                      object
                    </li>
                    <li>
                      <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">@</code> - Current
                      object
                    </li>
                    <li>
                      <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">.</code> or{' '}
                      <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">[]</code> - Child
                      operator
                    </li>
                    <li>
                      <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">..</code> -
                      Recursive descent
                    </li>
                    <li>
                      <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">*</code> -
                      Wildcard
                    </li>
                    <li>
                      <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">[n]</code> - Array
                      index
                    </li>
                    <li>
                      <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                        [?(expression)]
                      </code>{' '}
                      - Filter expression
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
