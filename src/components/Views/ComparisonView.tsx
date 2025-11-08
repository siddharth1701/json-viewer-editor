import { useState, useEffect, useRef } from 'react';
import { Upload, Link as LinkIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { validateJSON } from '@/utils/jsonUtils';

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  lineNumber: number;
  content: string;
  pair?: number;
}

export default function ComparisonView() {
  const [jsonTextA, setJsonTextA] = useState('');
  const [jsonTextB, setJsonTextB] = useState('');
  const [parsedJsonA, setParsedJsonA] = useState<any>(null);
  const [parsedJsonB, setParsedJsonB] = useState<any>(null);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);
  const [diffLinesA, setDiffLinesA] = useState<DiffLine[]>([]);
  const [diffLinesB, setDiffLinesB] = useState<DiffLine[]>([]);
  const [hasCompared, setHasCompared] = useState(false);
  const [showLoadMenuA, setShowLoadMenuA] = useState(false);
  const [showLoadMenuB, setShowLoadMenuB] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50); // 50% default
  const [isResizing, setIsResizing] = useState(false);
  const [currentDiffIndex, setCurrentDiffIndex] = useState(0);
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const diffLineRefsA = useRef<(HTMLDivElement | null)[]>([]);
  const diffLineRefsB = useRef<(HTMLDivElement | null)[]>([]);

  const comparisonJsonA = useAppStore((state) => state.comparisonJsonA);

  // Pre-fill JSON A from store if available
  useEffect(() => {
    if (comparisonJsonA && !jsonTextA) {
      const formatted = JSON.stringify(comparisonJsonA, null, 2);
      setJsonTextA(formatted);
      setParsedJsonA(comparisonJsonA);
    }
  }, [comparisonJsonA]);

  const validateAndParseA = () => {
    if (!jsonTextA.trim()) {
      setErrorA('JSON A is empty');
      setParsedJsonA(null);
      return false;
    }

    const result = validateJSON(jsonTextA);
    if (result.valid && result.data) {
      setParsedJsonA(result.data);
      setErrorA(null);
      return true;
    } else if (result.error) {
      setErrorA(`Line ${result.error.line}, Column ${result.error.column}: ${result.error.message}`);
      setParsedJsonA(null);
      return false;
    }
    return false;
  };

  const validateAndParseB = () => {
    if (!jsonTextB.trim()) {
      setErrorB('JSON B is empty');
      setParsedJsonB(null);
      return false;
    }

    const result = validateJSON(jsonTextB);
    if (result.valid && result.data) {
      setParsedJsonB(result.data);
      setErrorB(null);
      return true;
    } else if (result.error) {
      setErrorB(`Line ${result.error.line}, Column ${result.error.column}: ${result.error.message}`);
      setParsedJsonB(null);
      return false;
    }
    return false;
  };

  const handleCompare = () => {
    const validA = validateAndParseA();
    const validB = validateAndParseB();

    if (!validA || !validB) {
      alert('Please fix the JSON errors before comparing');
      return;
    }

    setHasCompared(true);
    setCurrentDiffIndex(0);
    calculateDiff();
  };

  const calculateDiff = () => {
    if (!parsedJsonA || !parsedJsonB) return;

    const stringA = JSON.stringify(parsedJsonA, null, 2);
    const stringB = JSON.stringify(parsedJsonB, null, 2);
    const linesA = stringA.split('\n');
    const linesB = stringB.split('\n');

    const maxLines = Math.max(linesA.length, linesB.length);
    const newDiffLinesA: DiffLine[] = [];
    const newDiffLinesB: DiffLine[] = [];

    for (let i = 0; i < maxLines; i++) {
      const lineA = linesA[i];
      const lineB = linesB[i];

      if (lineA === undefined) {
        newDiffLinesA.push({
          type: 'removed',
          lineNumber: i + 1,
          content: '',
          pair: i,
        });
        newDiffLinesB.push({
          type: 'added',
          lineNumber: i + 1,
          content: lineB,
          pair: i,
        });
      } else if (lineB === undefined) {
        newDiffLinesA.push({
          type: 'removed',
          lineNumber: i + 1,
          content: lineA,
          pair: i,
        });
        newDiffLinesB.push({
          type: 'added',
          lineNumber: i + 1,
          content: '',
          pair: i,
        });
      } else if (lineA === lineB) {
        newDiffLinesA.push({
          type: 'unchanged',
          lineNumber: i + 1,
          content: lineA,
          pair: i,
        });
        newDiffLinesB.push({
          type: 'unchanged',
          lineNumber: i + 1,
          content: lineB,
          pair: i,
        });
      } else {
        newDiffLinesA.push({
          type: 'modified',
          lineNumber: i + 1,
          content: lineA,
          pair: i,
        });
        newDiffLinesB.push({
          type: 'modified',
          lineNumber: i + 1,
          content: lineB,
          pair: i,
        });
      }
    }

    setDiffLinesA(newDiffLinesA);
    setDiffLinesB(newDiffLinesB);
  };

  // Auto-validate as user types
  useEffect(() => {
    if (jsonTextA.trim()) {
      validateAndParseA();
    } else {
      setErrorA(null);
      setParsedJsonA(null);
    }
  }, [jsonTextA]);

  useEffect(() => {
    if (jsonTextB.trim()) {
      validateAndParseB();
    } else {
      setErrorB(null);
      setParsedJsonB(null);
    }
  }, [jsonTextB]);

  // Re-calculate diff when user edits after initial comparison
  useEffect(() => {
    if (hasCompared && parsedJsonA && parsedJsonB) {
      calculateDiff();
    }
  }, [parsedJsonA, parsedJsonB, hasCompared]);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain between 20% and 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleLoadFromURL = async (side: 'A' | 'B') => {
    const url = prompt('Enter JSON URL:');
    if (!url) return;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const formatted = JSON.stringify(data, null, 2);

      if (side === 'A') {
        setJsonTextA(formatted);
        setParsedJsonA(data);
        setErrorA(null);
        setShowLoadMenuA(false);
      } else {
        setJsonTextB(formatted);
        setParsedJsonB(data);
        setErrorB(null);
        setShowLoadMenuB(false);
      }
    } catch (err) {
      alert(`Failed to load JSON from URL: ${(err as Error).message}`);
    }
  };

  const handleFileUpload = (side: 'A' | 'B', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = validateJSON(content);

        if (result.valid && result.data) {
          const formatted = JSON.stringify(result.data, null, 2);

          if (side === 'A') {
            setJsonTextA(formatted);
            setParsedJsonA(result.data);
            setErrorA(null);
            setShowLoadMenuA(false);
          } else {
            setJsonTextB(formatted);
            setParsedJsonB(result.data);
            setErrorB(null);
            setShowLoadMenuB(false);
          }
        } else {
          alert('Invalid JSON file');
        }
      } catch {
        alert('Failed to read file');
      }
    };

    reader.readAsText(file);
  };

  const getLineStyle = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500';
      case 'removed':
        return 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500';
      case 'modified':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500';
      default:
        return 'bg-white dark:bg-gray-900';
    }
  };

  const getLinePrefix = (type: DiffLine['type'], side: 'A' | 'B') => {
    if (type === 'unchanged') return '  ';
    if (type === 'added') return side === 'B' ? '+ ' : '  ';
    if (type === 'removed') return side === 'A' ? '- ' : '  ';
    if (type === 'modified') return side === 'A' ? '- ' : '+ ';
    return '  ';
  };

  const hasDifferences = diffLinesA.some(line => line.type !== 'unchanged');
  const canCompare = jsonTextA.trim() && jsonTextB.trim() && parsedJsonA && parsedJsonB && !errorA && !errorB;

  // Get indices of all differences
  const diffIndices = diffLinesA
    .map((line, index) => line.type !== 'unchanged' ? index : -1)
    .filter(index => index !== -1);

  const totalDifferences = diffIndices.length;

  const scrollToDiff = (diffIndex: number) => {
    if (diffIndex < 0 || diffIndex >= diffIndices.length) return;

    const actualLineIndex = diffIndices[diffIndex];

    // Scroll both panels to the difference
    if (diffLineRefsA.current[actualLineIndex]) {
      diffLineRefsA.current[actualLineIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
    if (diffLineRefsB.current[actualLineIndex]) {
      diffLineRefsB.current[actualLineIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }

    setCurrentDiffIndex(diffIndex);
  };

  const handleNextDiff = () => {
    if (currentDiffIndex < totalDifferences - 1) {
      scrollToDiff(currentDiffIndex + 1);
    }
  };

  const handlePrevDiff = () => {
    if (currentDiffIndex > 0) {
      scrollToDiff(currentDiffIndex - 1);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between">
        <h3 className="font-semibold">JSON Comparison</h3>
        <div className="flex items-center gap-4">
          {hasCompared && hasDifferences && (
            <>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Added</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Removed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Modified</span>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2 border-l pl-4 border-gray-300 dark:border-gray-600">
                <button
                  onClick={handlePrevDiff}
                  disabled={currentDiffIndex === 0}
                  className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                  title="Previous difference"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                  {totalDifferences > 0 ? `${currentDiffIndex + 1}/${totalDifferences}` : '0/0'}
                </span>
                <button
                  onClick={handleNextDiff}
                  disabled={currentDiffIndex >= totalDifferences - 1}
                  className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                  title="Next difference"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          <button
            onClick={handleCompare}
            disabled={!canCompare}
            className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
            title={!canCompare ? 'Fix JSON errors before comparing' : 'Compare JSON A and B'}
          >
            {hasCompared ? 'Re-Compare' : 'Compare'}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* JSON A */}
        <div
          className="flex flex-col border-r border-gray-200 dark:border-gray-700"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between">
            <span className="font-medium text-sm">JSON A</span>
            <div className="relative">
              <button
                onClick={() => setShowLoadMenuA(!showLoadMenuA)}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors flex items-center gap-1"
              >
                Load <span className="ml-1">▼</span>
              </button>
              {showLoadMenuA && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1">
                  <button
                    onClick={() => handleLoadFromURL('A')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Load from URL
                  </button>
                  <button
                    onClick={() => fileInputRefA.current?.click()}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                </div>
              )}
              <input
                ref={fileInputRefA}
                type="file"
                accept=".json,application/json"
                onChange={(e) => handleFileUpload('A', e)}
                className="hidden"
              />
            </div>
          </div>

          {!hasCompared ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <textarea
                value={jsonTextA}
                onChange={(e) => setJsonTextA(e.target.value)}
                placeholder='Paste JSON A here... { "key": "value" }'
                className="flex-1 p-4 bg-white dark:bg-gray-900 font-mono text-sm resize-none focus:outline-none border-none"
              />
              {errorA && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                  <div className="font-semibold mb-1">❌ Invalid JSON A:</div>
                  {errorA}
                </div>
              )}
              {!errorA && parsedJsonA && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs">
                  ✓ Valid JSON
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {diffLinesA.map((line, index) => (
                <div
                  key={index}
                  ref={(el) => { diffLineRefsA.current[index] = el; }}
                  className={`flex font-mono text-xs leading-relaxed ${getLineStyle(line.type)}`}
                >
                  <span className="w-12 flex-shrink-0 text-right pr-2 text-gray-500 dark:text-gray-400 select-none border-r border-gray-300 dark:border-gray-600">
                    {line.content ? line.lineNumber : ''}
                  </span>
                  <span className="w-6 flex-shrink-0 text-center font-bold select-none">
                    {getLinePrefix(line.type, 'A')}
                  </span>
                  <span className="flex-1 px-2 whitespace-nowrap overflow-x-auto">
                    {line.content || '\u00A0'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resizer */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1 bg-gray-300 dark:bg-gray-600 hover:bg-primary-500 dark:hover:bg-primary-500 cursor-col-resize transition-colors flex-shrink-0 relative group"
          title="Drag to resize panels"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* JSON B */}
        <div className="flex-1 flex flex-col">
          <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between">
            <span className="font-medium text-sm">JSON B</span>
            <div className="relative">
              <button
                onClick={() => setShowLoadMenuB(!showLoadMenuB)}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors flex items-center gap-1"
              >
                Load <span className="ml-1">▼</span>
              </button>
              {showLoadMenuB && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1">
                  <button
                    onClick={() => handleLoadFromURL('B')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Load from URL
                  </button>
                  <button
                    onClick={() => fileInputRefB.current?.click()}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                </div>
              )}
              <input
                ref={fileInputRefB}
                type="file"
                accept=".json,application/json"
                onChange={(e) => handleFileUpload('B', e)}
                className="hidden"
              />
            </div>
          </div>

          {!hasCompared ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <textarea
                value={jsonTextB}
                onChange={(e) => setJsonTextB(e.target.value)}
                placeholder='Paste JSON B here... { "key": "value" }'
                className="flex-1 p-4 bg-white dark:bg-gray-900 font-mono text-sm resize-none focus:outline-none border-none"
              />
              {errorB && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                  <div className="font-semibold mb-1">❌ Invalid JSON B:</div>
                  {errorB}
                </div>
              )}
              {!errorB && parsedJsonB && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs">
                  ✓ Valid JSON
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {diffLinesB.map((line, index) => (
                <div
                  key={index}
                  ref={(el) => { diffLineRefsB.current[index] = el; }}
                  className={`flex font-mono text-xs leading-relaxed ${getLineStyle(line.type)}`}
                >
                  <span className="w-12 flex-shrink-0 text-right pr-2 text-gray-500 dark:text-gray-400 select-none border-r border-gray-300 dark:border-gray-600">
                    {line.content ? line.lineNumber : ''}
                  </span>
                  <span className="w-6 flex-shrink-0 text-center font-bold select-none">
                    {getLinePrefix(line.type, 'B')}
                  </span>
                  <span className="flex-1 px-2 whitespace-nowrap overflow-x-auto">
                    {line.content || '\u00A0'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      {hasCompared && parsedJsonA && parsedJsonB && (
        <div className={`h-12 border-t-2 flex items-center justify-center ${
          hasDifferences
            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
            : 'border-green-500 bg-green-50 dark:bg-green-900/20'
        }`}>
          <p className={`font-medium ${
            hasDifferences
              ? 'text-yellow-700 dark:text-yellow-300'
              : 'text-green-700 dark:text-green-300'
          }`}>
            {hasDifferences
              ? `Found ${diffLinesA.filter(l => l.type !== 'unchanged').length} differences`
              : 'No differences found - JSON objects are identical'}
          </p>
        </div>
      )}

      {/* Edit Mode Hint */}
      {hasCompared && (
        <div className="h-10 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 flex items-center justify-center gap-4">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 Want to edit? Click "Edit Mode" to modify the JSON
          </p>
          <button
            onClick={() => setHasCompared(false)}
            className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-medium"
          >
            Edit Mode
          </button>
        </div>
      )}
    </div>
  );
}
