import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { yamlToJSON, xmlToJSON, csvToJSON } from '@/utils/converters';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import type { JSONValue } from '@/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [format, setFormat] = useState<'yaml' | 'xml' | 'csv'>('yaml');
  const [importText, setImportText] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const updateTabContent = useAppStore((state) => state.updateTabContent);
  const addRecentFile = useAppStore((state) => state.addRecentFile);
  const pushHistory = useAppStore((state) => state.pushHistory);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!importText.trim()) {
      showErrorToast('Please enter or upload data to import');
      return;
    }

    setLoading(true);

    try {
      let jsonData: JSONValue;

      switch (format) {
        case 'yaml':
          jsonData = yamlToJSON(importText);
          break;
        case 'xml':
          jsonData = xmlToJSON(importText);
          break;
        case 'csv':
          jsonData = csvToJSON(importText);
          break;
        default:
          throw new Error('Unsupported format');
      }

      if (activeTabId) {
        pushHistory(activeTabId, null);
        updateTabContent(activeTabId, jsonData);
        addRecentFile(`Imported from ${format.toUpperCase()}`, jsonData);
        showSuccessToast(`Successfully imported from ${format.toUpperCase()}`);
        onClose();
        setImportText('');
      }
    } catch (error) {
      showErrorToast(`Import failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setImportText(content);
        showSuccessToast('File loaded');
      } catch {
        showErrorToast('Failed to read file');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      showErrorToast('Failed to read file');
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const input = fileInputRef.current;
    if (input) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      handleFileUpload({ target: input } as any);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold">Import Data</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3">Select Format</label>
              <div className="flex gap-3">
                {(['yaml', 'xml', 'csv'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      format === fmt
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                aria-label={`Upload ${format.toUpperCase()} file`}
                accept={
                  format === 'yaml' ? '.yaml,.yml' :
                  format === 'xml' ? '.xml' :
                  '.csv'
                }
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="font-medium mb-1">Drop your {format.toUpperCase()} file here</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">or click to browse</p>
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-semibold mb-2">Or paste {format.toUpperCase()} directly</label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`Paste your ${format.toUpperCase()} data here...`}
                className="w-full h-64 p-4 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none font-mono text-sm resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim() || loading}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
