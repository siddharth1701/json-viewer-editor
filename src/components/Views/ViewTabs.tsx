import { useState } from 'react';
import {
  TreePine,
  Code2,
  FileText,
  Network,
  Wand2,
  Download,
  Search,
  ChevronDown,
  ArrowDownAZ,
  Copy,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useJsonActions } from '@/hooks/useJsonActions';
import SearchModal from '../Modals/SearchModal';
import type { ViewMode, ExportFormat } from '@/types';

export default function ViewTabs() {
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const { formatJson, minify, exportAs, sortKeysAlphabetically, copyToClipboard, hasContent } = useJsonActions();

  const viewOptions: Array<{ mode: ViewMode; icon: typeof TreePine; label: string }> = [
    { mode: 'tree', icon: TreePine, label: 'Tree' },
    { mode: 'code', icon: Code2, label: 'Code' },
    { mode: 'raw', icon: FileText, label: 'Raw' },
    { mode: 'visualization', icon: Network, label: 'Visualize' },
  ];

  const exportFormats: Array<{ format: ExportFormat; label: string }> = [
    { format: 'json', label: 'JSON' },
    { format: 'yaml', label: 'YAML' },
    { format: 'xml', label: 'XML' },
    { format: 'csv', label: 'CSV' },
    { format: 'toml', label: 'TOML' },
    { format: 'html', label: 'HTML' },
  ];

  const handleExport = (format: ExportFormat) => {
    exportAs(format);
    setShowExportMenu(false);
  };

  return (
    <div className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      {/* View Mode Tabs */}
      <div className="flex items-center gap-1">
        {viewOptions.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors ${
              viewMode === mode
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            aria-label={`Switch to ${label} view`}
            aria-pressed={viewMode === mode}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={formatJson}
          disabled={!hasContent}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-colors"
          title="Format JSON (prettify)"
        >
          <Wand2 className="w-4 h-4" />
          <span className="hidden sm:inline">Format</span>
        </button>
        <button
          onClick={minify}
          disabled={!hasContent}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          title="Minify JSON"
        >
          <span>Minify</span>
        </button>
        <button
          onClick={() => {
            sortKeysAlphabetically(true);
            setTimeout(() => alert('JSON keys sorted alphabetically!'), 100);
          }}
          disabled={!hasContent}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-colors"
          title="Sort keys alphabetically"
        >
          <ArrowDownAZ className="w-4 h-4" />
          <span className="hidden sm:inline">Sort Keys</span>
        </button>
        <button
          onClick={async () => {
            await copyToClipboard(true);
            alert('JSON copied to clipboard!');
          }}
          disabled={!hasContent}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-colors"
          title="Copy JSON to clipboard"
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Copy</span>
        </button>
        <button
          onClick={() => setShowSearchModal(true)}
          disabled={!hasContent}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-colors"
          title="Search in JSON"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={!hasContent}
            className="px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1">
                {exportFormats.map(({ format, label }) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Export as {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </div>
  );
}
