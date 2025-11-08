import { useAppStore } from '@/stores/useAppStore';
import { minifyJSON } from '@/utils/jsonUtils';

export default function RawView() {
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const jsonString = activeTab?.content ? minifyJSON(activeTab.content) : '';

  if (!activeTab?.content) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No JSON data to display
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white dark:bg-gray-900 p-4">
      <pre className="text-sm font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere text-gray-900 dark:text-gray-100">
        {jsonString}
      </pre>
    </div>
  );
}
