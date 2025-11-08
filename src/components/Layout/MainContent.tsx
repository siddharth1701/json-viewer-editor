import { Plus, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import JSONInput from '../Views/JSONInput';
import ViewTabs from '../Views/ViewTabs';
import TreeView from '../Views/TreeView';
import CodeView from '../Views/CodeView';
import RawView from '../Views/RawView';
import ComparisonView from '../Views/ComparisonView';

export default function MainContent() {
  const tabs = useAppStore((state) => state.tabs);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const addTab = useAppStore((state) => state.addTab);
  const closeTab = useAppStore((state) => state.closeTab);
  const viewMode = useAppStore((state) => state.viewMode);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Check if current tab is a comparison tab
  const isComparisonTab = activeTab?.content &&
    typeof activeTab.content === 'object' &&
    '_comparison' in activeTab.content;

  return (
    <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Document Tabs */}
      <div className="h-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center overflow-x-auto">
        <div className="flex items-center h-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-full px-4 flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 transition-colors relative group ${
                tab.id === activeTabId
                  ? 'bg-gray-50 dark:bg-gray-900 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-sm max-w-[150px] truncate">{tab.label}</span>
              {tab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" title="Unsaved changes" />
              )}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="ml-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {tab.id === activeTabId && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>
          ))}
          <button
            onClick={() => addTab()}
            className="h-full px-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            aria-label="New tab"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isComparisonTab ? (
          <ComparisonView />
        ) : activeTab?.content === null ? (
          <JSONInput />
        ) : (
          <>
            <ViewTabs />
            <div className="flex-1 overflow-hidden">
              {viewMode === 'tree' && <TreeView />}
              {viewMode === 'code' && <CodeView />}
              {viewMode === 'raw' && <RawView />}
              {viewMode === 'visualization' && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="mb-2">Visualization View</p>
                    <p className="text-sm">D3.js tree diagram will be rendered here</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
