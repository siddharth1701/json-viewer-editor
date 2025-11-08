import { useAppStore } from '@/stores/useAppStore';
import { formatJSON, minifyJSON, sortKeys } from '@/utils/jsonUtils';
import { jsonToYAML, jsonToXML, jsonToCSV, jsonToTOML, jsonToHTML } from '@/utils/converters';
import type { JSONValue, ExportFormat } from '@/types';

export function useJsonActions() {
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const updateTabContent = useAppStore((state) => state.updateTabContent);
  const updateTabLabel = useAppStore((state) => state.updateTabLabel);
  const indentation = useAppStore((state) => state.indentation);
  const pushHistory = useAppStore((state) => state.pushHistory);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const formatJson = () => {
    if (!activeTab?.content || !activeTabId) return false;

    // Force a re-render by creating new object reference
    const formatted = JSON.parse(JSON.stringify(activeTab.content));
    pushHistory(activeTab.content);
    updateTabContent(activeTabId, formatted);

    // Visual feedback
    setTimeout(() => alert('JSON formatted! (Pretty-printed with indentation)'), 100);
    return true;
  };

  const minify = () => {
    if (!activeTab?.content || !activeTabId) return false;

    // Force a re-render by creating new object reference
    const minified = JSON.parse(JSON.stringify(activeTab.content));
    pushHistory(activeTab.content);
    updateTabContent(activeTabId, minified);

    // Visual feedback
    setTimeout(() => alert('JSON minified! (Compact version - view in Raw or Code mode)'), 100);
    return true;
  };

  const sortKeysAlphabetically = (recursive: boolean = false) => {
    if (!activeTab?.content || !activeTabId) return;

    const sorted = sortKeys(activeTab.content, recursive);
    pushHistory(activeTab.content);
    updateTabContent(activeTabId, sorted);
  };

  const exportAs = (format: ExportFormat) => {
    if (!activeTab?.content) {
      alert('No JSON data to export');
      return;
    }

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = formatJSON(activeTab.content, indentation);
          filename = `${activeTab.label || 'data'}.json`;
          mimeType = 'application/json';
          break;
        case 'yaml':
          content = jsonToYAML(activeTab.content);
          filename = `${activeTab.label || 'data'}.yaml`;
          mimeType = 'text/yaml';
          break;
        case 'xml':
          content = jsonToXML(activeTab.content);
          filename = `${activeTab.label || 'data'}.xml`;
          mimeType = 'application/xml';
          break;
        case 'csv':
          content = jsonToCSV(activeTab.content);
          filename = `${activeTab.label || 'data'}.csv`;
          mimeType = 'text/csv';
          break;
        case 'toml':
          content = jsonToTOML(activeTab.content);
          filename = `${activeTab.label || 'data'}.toml`;
          mimeType = 'text/toml';
          break;
        case 'html':
          content = jsonToHTML(activeTab.content, activeTab.label);
          filename = `${activeTab.label || 'data'}.html`;
          mimeType = 'text/html';
          break;
        default:
          content = formatJSON(activeTab.content, indentation);
          filename = `${activeTab.label || 'data'}.json`;
          mimeType = 'application/json';
      }

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Export failed: ${(error as Error).message}`);
    }
  };

  const copyToClipboard = async (formatted: boolean = true) => {
    if (!activeTab?.content) {
      alert('No JSON data to copy');
      return;
    }

    try {
      const text = formatted
        ? formatJSON(activeTab.content, indentation)
        : minifyJSON(activeTab.content);
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log('Copied to clipboard');
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  const downloadJson = () => {
    exportAs('json');
  };

  return {
    formatJson,
    minify,
    sortKeysAlphabetically,
    exportAs,
    copyToClipboard,
    downloadJson,
    hasContent: !!activeTab?.content,
  };
}
