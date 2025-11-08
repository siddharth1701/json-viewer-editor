import { useRef, useState } from 'react';
import {
  Moon, Sun, Upload, Download, Copy, Trash2,
  Undo2, Redo2, Search, Code2, FileJson,
  GitCompare, Settings, HelpCircle
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useJsonActions } from '@/hooks/useJsonActions';
import { validateJSON } from '@/utils/jsonUtils';
import SearchModal from '@/components/Modals/SearchModal';

export default function Navbar() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);
  const canUndo = useAppStore((state) => state.canUndo());
  const canRedo = useAppStore((state) => state.canRedo());
  const undo = useAppStore((state) => state.undo);
  const redo = useAppStore((state) => state.redo);
  const addTab = useAppStore((state) => state.addTab);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const setComparisonJsonA = useAppStore((state) => state.setComparisonJsonA);
  const updateTabContent = useAppStore((state) => state.updateTabContent);
  const addRecentFile = useAppStore((state) => state.addRecentFile);

  const [showHelp, setShowHelp] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { copyToClipboard, downloadJson, hasContent } = useJsonActions();

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleStartComparison = () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    // Only create comparison tab if there's content to compare
    if (activeTab?.content) {
      setComparisonJsonA(activeTab.content);
      // Create a new comparison tab
      addTab({ label: 'Compare JSON', content: { _comparison: true } as any });
    } else {
      alert('Please load some JSON data first before comparing.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = validateJSON(content);

        if (result.valid && result.data && activeTabId) {
          updateTabContent(activeTabId, result.data);
          addRecentFile(file.name, result.data);
        } else {
          alert('Invalid JSON file');
        }
      } catch {
        alert('Failed to read file');
      }
    };

    reader.onerror = () => {
      alert('Failed to read file');
    };

    reader.readAsText(file);
  };

  const handleCopy = async () => {
    if (hasContent) {
      await copyToClipboard(true);
      alert('JSON copied to clipboard!');
    }
  };

  return (
    <nav className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 no-print">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <FileJson className="w-6 h-6 text-primary-500" />
        <span className="font-bold text-lg hidden sm:inline">JSON Viewer</span>
      </div>

      {/* Main Actions */}
      <div className="flex items-center gap-2 flex-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo2 className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          onClick={handleStartComparison}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Compare JSON (opens new comparison tab)"
          aria-label="Start JSON comparison"
        >
          <GitCompare className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowSearchModal(true)}
          disabled={!hasContent}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Search (Ctrl+F)"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Generate Code"
          aria-label="Generate code"
        >
          <Code2 className="w-5 h-5" />
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Upload JSON file"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!activeTabId}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Upload JSON file"
          aria-label="Upload file"
        >
          <Upload className="w-5 h-5" />
        </button>

        <button
          onClick={downloadJson}
          disabled={!hasContent}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Download JSON"
          aria-label="Download file"
        >
          <Download className="w-5 h-5" />
        </button>

        <button
          onClick={handleCopy}
          disabled={!hasContent}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Copy to Clipboard"
          aria-label="Copy to clipboard"
        >
          <Copy className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Help & Shortcuts"
          aria-label="Show help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Toggle Theme"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowHelp(false)}
          />
          <div className="fixed top-20 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Undo</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Z</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Redo</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Y</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Search</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+F</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Save</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+S</kbd>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                All processing happens client-side. Your data never leaves your browser.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Search Modal */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </nav>
  );
}
