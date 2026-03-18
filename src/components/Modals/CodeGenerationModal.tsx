import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import {
  generateTypeScript,
  generateJavaScript,
  generatePython,
  generateJava,
  generateCSharp,
  generateGo,
} from '@/utils/codeGenerator';
import type { CodeLanguage } from '@/types';
import { X, Copy, Download } from 'lucide-react';

interface CodeGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CodeGenerationModal({ isOpen, onClose }: CodeGenerationModalProps) {
  const tabs = useAppStore((state) => state.tabs);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('typescript');
  const [className, setClassName] = useState('DataModel');

  const languages: { lang: CodeLanguage; name: string; className: string }[] = [
    { lang: 'typescript', name: 'TypeScript', className: 'Interface' },
    { lang: 'javascript', name: 'JavaScript', className: 'Class' },
    { lang: 'python', name: 'Python', className: 'Class' },
    { lang: 'java', name: 'Java', className: 'Class' },
    { lang: 'csharp', name: 'C#', className: 'Class' },
    { lang: 'go', name: 'Go', className: 'Struct' },
  ];

  if (!isOpen) return null;

  const generateCode = (): string => {
    if (!activeTab?.content) return '';

    try {
      switch (selectedLanguage) {
        case 'typescript':
          return generateTypeScript(activeTab.content, className);
        case 'javascript':
          return generateJavaScript(activeTab.content, className);
        case 'python':
          return generatePython(activeTab.content, className);
        case 'java':
          return generateJava(activeTab.content, className);
        case 'csharp':
          return generateCSharp(activeTab.content, className);
        case 'go':
          return generateGo(activeTab.content, className);
        default:
          return '';
      }
    } catch (error) {
      return `Error generating code: ${(error as Error).message}`;
    }
  };

  const code = generateCode();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showSuccessToast('Code copied to clipboard!');
    } catch {
      showErrorToast('Failed to copy code');
    }
  };

  const downloadCode = () => {
    const extensions: Record<CodeLanguage, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      java: 'java',
      csharp: 'cs',
      go: 'go',
    };

    const ext = extensions[selectedLanguage];
    const filename = `${className}.${ext}`;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccessToast(`Code downloaded as ${filename}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Code</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left panel: Settings */}
          <div className="w-full md:w-64 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as CodeLanguage)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.lang} value={lang.lang}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {languages.find((l) => l.lang === selectedLanguage)?.className || 'Name'}
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g., DataModel, User, Config"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
              >
                <Copy size={16} />
                Copy
              </button>
              <button
                onClick={downloadCode}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>

          {/* Right panel: Code output */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
            <pre className="font-mono text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
              {code || 'No code generated. Check your JSON data.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
