import { useState } from 'react';
import {
  ChevronRight,
  FileText,
  Code2,
  Wand2
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useJsonActions } from '@/hooks/useJsonActions';

type ToolTab = 'convert' | 'generate' | 'transform';
type ConvertFormat = 'yaml' | 'xml' | 'csv' | 'toml';
type GenerateLanguage = 'typescript' | 'javascript' | 'python' | 'java' | 'csharp' | 'go';

export default function RightSidebar() {
  const rightSidebarOpen = useAppStore((state) => state.rightSidebarOpen);
  const toggleRightSidebar = useAppStore((state) => state.toggleRightSidebar);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const updateTabContent = useAppStore((state) => state.updateTabContent);

  const [activeToolTab, setActiveToolTab] = useState<ToolTab>('convert');

  const { exportAs, hasContent } = useJsonActions();
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleConvert = async (format: ConvertFormat) => {
    if (!hasContent) {
      alert('Please load some JSON first');
      return;
    }

    try {
      await exportAs(format);
      alert(`Exported as ${format.toUpperCase()}! Check your downloads.`);
    } catch (err) {
      alert(`Failed to convert: ${(err as Error).message}`);
    }
  };

  const handleGenerate = async (language: GenerateLanguage) => {
    if (!hasContent) {
      alert('Please load some JSON first');
      return;
    }

    try {
      await exportAs(language as any);
      alert(`Generated ${language} code! Check your downloads.`);
    } catch (err) {
      alert(`Failed to generate: ${(err as Error).message}`);
    }
  };

  const handleFlattenStructure = () => {
    if (!activeTab?.content || !activeTabId) {
      alert('Please load some JSON first');
      return;
    }

    try {
      const flatten = (obj: any, prefix = ''): any => {
        return Object.keys(obj).reduce((acc: any, key: string) => {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(acc, flatten(obj[key], newKey));
          } else {
            acc[newKey] = obj[key];
          }
          return acc;
        }, {});
      };

      const flattened = flatten(activeTab.content);
      updateTabContent(activeTabId, flattened);
      alert('JSON structure flattened!');
    } catch (err) {
      alert(`Failed to flatten: ${(err as Error).message}`);
    }
  };

  const handleUnflattenStructure = () => {
    if (!activeTab?.content || !activeTabId) {
      alert('Please load some JSON first');
      return;
    }

    try {
      const unflatten = (data: any): any => {
        const result: any = {};
        for (const key in data) {
          const keys = key.split('.');
          keys.reduce((acc, k, i) => {
            if (i === keys.length - 1) {
              acc[k] = data[key];
            } else {
              acc[k] = acc[k] || {};
            }
            return acc[k];
          }, result);
        }
        return result;
      };

      const unflattened = unflatten(activeTab.content);
      updateTabContent(activeTabId, unflattened);
      alert('JSON structure unflattened!');
    } catch (err) {
      alert(`Failed to unflatten: ${(err as Error).message}`);
    }
  };


  if (!rightSidebarOpen) {
    return (
      <button
        onClick={toggleRightSidebar}
        className="w-8 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center justify-center"
        aria-label="Open right sidebar"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
      </button>
    );
  }

  return (
    <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-sm">Advanced Tools</h2>
        <button
          onClick={toggleRightSidebar}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="Close right sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tool Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveToolTab('convert')}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
            activeToolTab === 'convert'
              ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
        >
          <FileText className="w-4 h-4" />
          Convert
        </button>
        <button
          onClick={() => setActiveToolTab('generate')}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
            activeToolTab === 'generate'
              ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Generate
        </button>
        <button
          onClick={() => setActiveToolTab('transform')}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
            activeToolTab === 'transform'
              ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Transform
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Convert Tab */}
        {activeToolTab === 'convert' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Convert JSON to different formats
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleConvert('yaml')}
                disabled={!hasContent}
                className="px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                To YAML
              </button>
              <button
                onClick={() => handleConvert('xml')}
                disabled={!hasContent}
                className="px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                To XML
              </button>
              <button
                onClick={() => handleConvert('csv')}
                disabled={!hasContent}
                className="px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                To CSV
              </button>
              <button
                onClick={() => handleConvert('toml')}
                disabled={!hasContent}
                className="px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                To TOML
              </button>
            </div>
          </div>
        )}

        {/* Generate Tab */}
        {activeToolTab === 'generate' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Generate code from JSON
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleGenerate('typescript')}
                disabled={!hasContent}
                className="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-left"
              >
                TypeScript Interfaces
              </button>
              <button
                onClick={() => handleGenerate('javascript')}
                disabled={!hasContent}
                className="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-left"
              >
                JavaScript Classes
              </button>
              <button
                onClick={() => handleGenerate('python')}
                disabled={!hasContent}
                className="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-left"
              >
                Python Dataclasses
              </button>
              <button
                onClick={() => handleGenerate('java')}
                disabled={!hasContent}
                className="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-left"
              >
                Java Classes
              </button>
              <button
                onClick={() => handleGenerate('csharp')}
                disabled={!hasContent}
                className="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-left"
              >
                C# Classes
              </button>
              <button
                onClick={() => handleGenerate('go')}
                disabled={!hasContent}
                className="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-left"
              >
                Go Structs
              </button>
            </div>
          </div>
        )}

        {/* Transform Tab */}
        {activeToolTab === 'transform' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Transform JSON structure
            </p>
            <button
              onClick={handleFlattenStructure}
              disabled={!hasContent}
              className="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-left flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Flatten Structure
            </button>
            <button
              onClick={handleUnflattenStructure}
              disabled={!hasContent}
              className="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-left flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h4" />
              </svg>
              Unflatten Structure
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <p className="mb-2"><strong>Flatten:</strong> Converts nested objects to dot notation</p>
              <p><strong>Unflatten:</strong> Converts dot notation back to nested structure</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
