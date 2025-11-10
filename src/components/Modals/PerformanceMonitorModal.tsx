import { useState, useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { PerformanceMonitor, formatRenderTime, formatMemorySize } from '@/utils/performanceUtils';

interface PerformanceData {
  renderTime: number;
  memoryUsage: number | null;
  fileSize: number;
  nodeCount: number;
  depth: number;
  timestamp: string;
}

export default function PerformanceMonitorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const jsonData = activeTab?.content;

  useEffect(() => {
    if (isOpen && jsonData) {
      PerformanceMonitor.startRender();
      const metrics = PerformanceMonitor.getMetrics(jsonData);

      setPerformanceHistory((prev) => [
        {
          renderTime: metrics.renderTime,
          memoryUsage: metrics.memoryUsage,
          fileSize: metrics.fileSize,
          nodeCount: metrics.nodeCount,
          depth: metrics.depth,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 9) // Keep last 10 entries
      ]);
    }
  }, [isOpen, jsonData]);

  if (!isOpen || !jsonData) return null;

  const currentMetrics = performanceHistory[0];

  // Calculate statistics from history
  const avgRenderTime = performanceHistory.length > 0
    ? performanceHistory.reduce((sum, m) => sum + m.renderTime, 0) / performanceHistory.length
    : 0;

  const maxMemory = performanceHistory.length > 0
    ? Math.max(...performanceHistory.map(m => m.memoryUsage || 0))
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-11/12 max-w-2xl max-h-96 flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            <h2 className="font-bold text-lg">Performance Monitor</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {currentMetrics && (
            <div className="space-y-6">
              {/* Current Metrics Grid */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Current Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Render Time */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Render Time</p>
                    <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatRenderTime(currentMetrics.renderTime)}
                    </p>
                  </div>

                  {/* Memory Usage */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Memory Usage</p>
                    <p className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">
                      {formatMemorySize(currentMetrics.memoryUsage)}
                    </p>
                  </div>

                  {/* File Size */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">File Size</p>
                    <p className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
                      {formatMemorySize(currentMetrics.fileSize)}
                    </p>
                  </div>

                  {/* Node Count */}
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Node Count</p>
                    <p className="text-lg font-mono font-bold text-orange-600 dark:text-orange-400">
                      {currentMetrics.nodeCount.toLocaleString()}
                    </p>
                  </div>

                  {/* Max Depth */}
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Max Depth</p>
                    <p className="text-lg font-mono font-bold text-red-600 dark:text-red-400">
                      {currentMetrics.depth}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Measured At</p>
                    <p className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                      {currentMetrics.timestamp}
                    </p>
                  </div>
                </div>
              </div>

              {/* Averages */}
              {performanceHistory.length > 1 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-sm font-semibold mb-2">Statistics</p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Avg Render Time:</span>
                      <p className="font-mono font-bold mt-1">{formatRenderTime(avgRenderTime)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Peak Memory:</span>
                      <p className="font-mono font-bold mt-1">{formatMemorySize(maxMemory)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Measurements:</span>
                      <p className="font-mono font-bold mt-1">{performanceHistory.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* History Toggle */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>

              {/* History Table */}
              {showHistory && performanceHistory.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="p-2 text-left border border-gray-200 dark:border-gray-600">Time</th>
                        <th className="p-2 text-right border border-gray-200 dark:border-gray-600">Render</th>
                        <th className="p-2 text-right border border-gray-200 dark:border-gray-600">Memory</th>
                        <th className="p-2 text-right border border-gray-200 dark:border-gray-600">Nodes</th>
                        <th className="p-2 text-right border border-gray-200 dark:border-gray-600">Depth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceHistory.map((metric, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                          <td className="p-2 border border-gray-200 dark:border-gray-600 font-mono">
                            {metric.timestamp}
                          </td>
                          <td className="p-2 text-right border border-gray-200 dark:border-gray-600 font-mono">
                            {formatRenderTime(metric.renderTime)}
                          </td>
                          <td className="p-2 text-right border border-gray-200 dark:border-gray-600 font-mono">
                            {formatMemorySize(metric.memoryUsage)}
                          </td>
                          <td className="p-2 text-right border border-gray-200 dark:border-gray-600 font-mono">
                            {metric.nodeCount}
                          </td>
                          <td className="p-2 text-right border border-gray-200 dark:border-gray-600 font-mono">
                            {metric.depth}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Info Note */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">Performance Metrics</p>
                <p>These metrics help identify performance bottlenecks. High node count or depth may impact rendering speed.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
