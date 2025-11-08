import { useAppStore } from '@/stores/useAppStore';
import { calculateStatistics, formatFileSize } from '@/utils/jsonUtils';
import { Shield } from 'lucide-react';

export default function StatusBar() {
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const maskSensitiveData = useAppStore((state) => state.maskSensitiveData);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const stats = activeTab?.content ? calculateStatistics(activeTab.content) : null;

  return (
    <footer className="h-6 bg-primary-600 dark:bg-primary-700 text-white px-4 flex items-center justify-between text-xs no-print">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          <span>Client-side only</span>
        </div>
        {stats && (
          <>
            <span className="opacity-50">|</span>
            <span>
              Size: <span className="font-mono">{formatFileSize(stats.totalSize)}</span>
            </span>
            <span className="opacity-50">|</span>
            <span>
              Keys: <span className="font-mono">{stats.keyCount}</span>
            </span>
            <span className="opacity-50">|</span>
            <span>
              Depth: <span className="font-mono">{stats.maxDepth}</span>
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {maskSensitiveData && (
          <span className="px-2 py-0.5 bg-yellow-500 text-yellow-900 rounded text-xs font-medium">
            MASKING ENABLED
          </span>
        )}
        <span>JSON Viewer & Editor v1.0.0</span>
      </div>
    </footer>
  );
}
