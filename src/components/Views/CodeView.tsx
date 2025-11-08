import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '@/stores/useAppStore';
import { formatJSON } from '@/utils/jsonUtils';

export default function CodeView() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const updateTabContent = useAppStore((state) => state.updateTabContent);
  const indentation = useAppStore((state) => state.indentation);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const jsonString = activeTab?.content
    ? formatJSON(activeTab.content, indentation)
    : '';

  const handleEditorChange = (value: string | undefined) => {
    if (value && activeTabId) {
      try {
        const parsed = JSON.parse(value);
        updateTabContent(activeTabId, parsed);
      } catch {
        // Invalid JSON, don't update
      }
    }
  };

  if (!activeTab?.content) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No JSON data to display
      </div>
    );
  }

  return (
    <div className="h-full">
      <Editor
        height="100%"
        defaultLanguage="json"
        value={jsonString}
        onChange={handleEditorChange}
        theme={isDarkMode ? 'vs-dark' : 'light'}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          automaticLayout: true,
          tabSize: indentation,
        }}
      />
    </div>
  );
}
