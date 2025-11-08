import { useState } from 'react';
import { ChevronLeft, BarChart3, Clock, FileText, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { calculateStatistics, formatFileSize } from '@/utils/jsonUtils';
import { getAllSamples } from '@/utils/samples';

export default function LeftSidebar() {
  const leftSidebarOpen = useAppStore((state) => state.leftSidebarOpen);
  const toggleLeftSidebar = useAppStore((state) => state.toggleLeftSidebar);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const recentFiles = useAppStore((state) => state.recentFiles);
  const loadRecentFile = useAppStore((state) => state.loadRecentFile);
  const loadOrSwitchToTab = useAppStore((state) => state.loadOrSwitchToTab);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const stats = activeTab?.content ? calculateStatistics(activeTab.content) : null;
  const samples = getAllSamples();

  const [analyzeResult, setAnalyzeResult] = useState<any>(null);

  const handleAnalyze = () => {
    if (!activeTab?.content) {
      alert('Please load some JSON first');
      return;
    }

    const analyze = (obj: any, results: any = { circular: 0, empty: 0, duplicates: new Map(), deepNesting: 0 }, path = '', visited = new Set()): any => {
      // Circular reference check
      if (typeof obj === 'object' && obj !== null) {
        if (visited.has(obj)) {
          results.circular++;
          return results;
        }
        visited.add(obj);
      }

      // Deep nesting check
      const depth = path.split('.').filter(Boolean).length;
      if (depth > results.deepNesting) {
        results.deepNesting = depth;
      }

      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          const value = obj[key];
          const newPath = path ? `${path}.${key}` : key;

          // Empty value check
          if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
            results.empty++;
          }

          // Track duplicates
          const valueStr = JSON.stringify(value);
          if (results.duplicates.has(valueStr)) {
            results.duplicates.set(valueStr, results.duplicates.get(valueStr) + 1);
          } else {
            results.duplicates.set(valueStr, 1);
          }

          // Recurse
          if (typeof value === 'object' && value !== null) {
            analyze(value, results, newPath, new Set(visited));
          }
        }
      }

      return results;
    };

    const results = analyze(activeTab.content);
    const duplicatesList = Array.from(results.duplicates.entries())
      .filter(([_, count]) => count > 1)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    setAnalyzeResult({
      circular: results.circular,
      empty: results.empty,
      duplicates: duplicatesList,
      deepNesting: results.deepNesting
    });
  };

  if (!leftSidebarOpen) {
    return (
      <button
        onClick={toggleLeftSidebar}
        className="w-8 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center justify-center"
        aria-label="Open left sidebar"
      >
        <ChevronLeft className="w-4 h-4 rotate-180" />
      </button>
    );
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-sm">Tools & Info</h2>
        <button
          onClick={toggleLeftSidebar}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="Close left sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Statistics */}
        <section className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold text-sm">Statistics</h3>
          </div>
          {stats ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Size</span>
                <span className="font-mono">{formatFileSize(stats.totalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Keys</span>
                <span className="font-mono">{stats.keyCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Values</span>
                <span className="font-mono">{stats.valueCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Max Depth</span>
                <span className="font-mono">{stats.maxDepth}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No data</p>
          )}

          {/* JSON Analysis */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">JSON Analysis</h4>
              <button
                onClick={handleAnalyze}
                disabled={!activeTab?.content}
                className="px-2 py-1 text-xs bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Analyze
              </button>
            </div>

            {analyzeResult ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600 dark:text-gray-400">Circular References:</span>
                  <span className="font-mono font-semibold">{analyzeResult.circular}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600 dark:text-gray-400">Empty Values:</span>
                  <span className="font-mono font-semibold">{analyzeResult.empty}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600 dark:text-gray-400">Duplicate Values:</span>
                  <span className="font-mono font-semibold">{analyzeResult.duplicates.length}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600 dark:text-gray-400">Deep Nesting (&gt;10):</span>
                  <span className="font-mono font-semibold">{analyzeResult.deepNesting > 10 ? analyzeResult.deepNesting : 0}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click "Analyze" to check for issues
              </p>
            )}
          </div>
        </section>

        {/* Sample Data */}
        <section className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold text-sm">Sample Data</h3>
          </div>
          <div className="space-y-1">
            {samples.map((sample) => (
              <button
                key={sample.id}
                onClick={() => loadOrSwitchToTab(sample.name, sample.data)}
                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={sample.description}
              >
                {sample.name}
              </button>
            ))}
          </div>
        </section>

        {/* Recent Files */}
        <section className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary-500" />
            <h3 className="font-semibold text-sm">Recent Files</h3>
          </div>
          {recentFiles.length > 0 ? (
            <div className="space-y-1">
              {recentFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => loadRecentFile(file.id)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors truncate"
                >
                  {file.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No recent files</p>
          )}
        </section>
      </div>
    </aside>
  );
}
