import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from 'react';
import { Upload, Link as LinkIcon, ChevronUp, ChevronDown, Settings2, FileText } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { validateJSON } from '@/utils/jsonUtils';
import { showSuccessToast, showErrorToast, showInfoToast, showLoadingToast, dismissToast } from '@/utils/toast';
import { validateFileSize, validateJSONSize } from '@/utils/validation';
import type { JSONValue } from '@/types';

// ============ Types ============

type DiffOp =
  | { kind: 'unchanged'; lineA: number; lineB: number; content: string }
  | { kind: 'removed'; lineA: number; content: string }
  | { kind: 'added'; lineB: number; content: string }
  | { kind: 'modified'; lineA: number; lineB: number; contentA: string; contentB: string };

type AlignedRow =
  | { kind: 'unchanged'; lineNum: number; content: string }
  | { kind: 'removed'; lineNum: number; content: string; spans?: CharSpan[] }
  | { kind: 'added'; lineNum: number; content: string; spans?: CharSpan[] }
  | { kind: 'modified'; lineNum: number; content: string; spans?: CharSpan[] }
  | { kind: 'gap' };

type CharSpan = { start: number; end: number };

type HunkHeader = {
  rowIndex: number;
  rangeA: string;
  rangeB: string;
  pathA?: string;
  pathB?: string;
};

// ============ Constants ============

const DIAGONAL_STRIPE =
  'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(100, 100, 100, 0.1) 4px, rgba(100, 100, 100, 0.1) 8px)';

// ============ Pure Algorithm Functions ============

function computeLCS(a: string[], b: string[]): number[][] {
  // Guard for large files
  if (a.length * b.length > 2_250_000) {
    return [];
  }

  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

function buildDiffOps(linesA: string[], linesB: string[]): DiffOp[] {
  const dps = computeLCS(linesA, linesB);

  // If LCS failed due to size, fall back to positional
  if (dps.length === 0) {
    const ops: DiffOp[] = [];
    const maxLen = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < maxLen; i++) {
      const a = linesA[i];
      const b = linesB[i];
      if (a === undefined) {
        ops.push({ kind: 'added', lineB: i, content: b });
      } else if (b === undefined) {
        ops.push({ kind: 'removed', lineA: i, content: a });
      } else if (a === b) {
        ops.push({ kind: 'unchanged', lineA: i, lineB: i, content: a });
      } else {
        ops.push({ kind: 'modified', lineA: i, lineB: i, contentA: a, contentB: b });
      }
    }
    return ops;
  }

  // Backtrack LCS to get matched indices
  const matched = new Set<number>(); // indices in A that are matched
  const matchedB = new Set<number>(); // indices in B that are matched
  let i = linesA.length;
  let j = linesB.length;

  while (i > 0 && j > 0) {
    if (linesA[i - 1] === linesB[j - 1]) {
      matched.add(i - 1);
      matchedB.add(j - 1);
      i--;
      j--;
    } else if (dps[i - 1][j] > dps[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  // Build ops from matched pairs
  const ops: DiffOp[] = [];
  const aIndex: number[] = [];
  const bIndex: number[] = [];

  for (let idx = 0; idx < linesA.length; idx++) {
    if (matched.has(idx)) {
      aIndex.push(idx);
    }
  }

  for (let idx = 0; idx < linesB.length; idx++) {
    if (matchedB.has(idx)) {
      bIndex.push(idx);
    }
  }

  // Two-pointer merge to produce ops
  let aPtr = 0;
  let bPtr = 0;

  while (aPtr < aIndex.length || bPtr < bIndex.length) {
    const aIdx = aPtr < aIndex.length ? aIndex[aPtr] : Infinity;
    const bIdx = bPtr < bIndex.length ? bIndex[bPtr] : Infinity;

    if (aIdx < bIdx) {
      // Line removed from A
      ops.push({ kind: 'removed', lineA: aIdx, content: linesA[aIdx] });
      aPtr++;
    } else if (bIdx < aIdx) {
      // Line added to B
      ops.push({ kind: 'added', lineB: bIdx, content: linesB[bIdx] });
      bPtr++;
    } else {
      // Matched pair
      ops.push({ kind: 'unchanged', lineA: aIdx, lineB: bIdx, content: linesA[aIdx] });
      aPtr++;
      bPtr++;
    }
  }

  // Post-process: collapse single adjacent remove+add → modified
  const collapsed: DiffOp[] = [];
  for (let idx = 0; idx < ops.length; idx++) {
    const curr = ops[idx];
    const next = ops[idx + 1];

    if (
      curr.kind === 'removed' &&
      next &&
      next.kind === 'added'
    ) {
      collapsed.push({
        kind: 'modified',
        lineA: curr.lineA,
        lineB: next.lineB,
        contentA: curr.content,
        contentB: next.content
      });
      idx++; // skip next
    } else {
      collapsed.push(curr);
    }
  }

  return collapsed;
}

function buildAlignedRows(ops: DiffOp[]): { rowsA: AlignedRow[]; rowsB: AlignedRow[] } {
  const rowsA: AlignedRow[] = [];
  const rowsB: AlignedRow[] = [];

  for (const op of ops) {
    switch (op.kind) {
      case 'unchanged':
        rowsA.push({ kind: 'unchanged', lineNum: op.lineA + 1, content: op.content });
        rowsB.push({ kind: 'unchanged', lineNum: op.lineB + 1, content: op.content });
        break;

      case 'removed':
        rowsA.push({ kind: 'removed', lineNum: op.lineA + 1, content: op.content });
        rowsB.push({ kind: 'gap' });
        break;

      case 'added':
        rowsA.push({ kind: 'gap' });
        rowsB.push({ kind: 'added', lineNum: op.lineB + 1, content: op.content });
        break;

      case 'modified': {
        const spansA = tokenDiff(op.contentA, op.contentB).spansA;
        const spansB = tokenDiff(op.contentA, op.contentB).spansB;
        rowsA.push({ kind: 'modified', lineNum: op.lineA + 1, content: op.contentA, spans: spansA });
        rowsB.push({ kind: 'modified', lineNum: op.lineB + 1, content: op.contentB, spans: spansB });
        break;
      }
    }
  }

  return { rowsA, rowsB };
}

function tokenDiff(strA: string, strB: string): { spansA: CharSpan[]; spansB: CharSpan[] } {
  // Split on JSON tokens: { } [ ] " : , and whitespace
  const tokenRegex = /(\{|\}|\[|\]|"|:|,|\s+)/g;

  const tokensA = strA.split(tokenRegex).filter(t => t !== '');
  const tokensB = strB.split(tokenRegex).filter(t => t !== '');

  // LCS on tokens
  const dps = computeLCS(tokensA, tokensB);
  if (dps.length === 0) {
    return { spansA: [{ start: 0, end: strA.length }], spansB: [{ start: 0, end: strB.length }] };
  }

  // Backtrack to find matched tokens
  const matchedA = new Set<number>();
  const matchedB = new Set<number>();

  let i = tokensA.length;
  let j = tokensB.length;

  while (i > 0 && j > 0) {
    if (tokensA[i - 1] === tokensB[j - 1]) {
      matchedA.add(i - 1);
      matchedB.add(j - 1);
      i--;
      j--;
    } else if (dps[i - 1][j] > dps[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  // Convert token indices to character spans
  const getSpans = (tokens: string[], matched: Set<number>): CharSpan[] => {
    let charPos = 0;
    const spans: CharSpan[] = [];
    let inSpan = false;
    let spanStart = 0;

    for (let idx = 0; idx < tokens.length; idx++) {
      const token = tokens[idx];
      const isMatched = matched.has(idx);

      if (!isMatched) {
        if (!inSpan) {
          spanStart = charPos;
          inSpan = true;
        }
      } else {
        if (inSpan) {
          spans.push({ start: spanStart, end: charPos });
          inSpan = false;
        }
      }

      charPos += token.length;
    }

    if (inSpan) {
      spans.push({ start: spanStart, end: charPos });
    }

    return spans;
  };

  return {
    spansA: getSpans(tokensA, matchedA),
    spansB: getSpans(tokensB, matchedB)
  };
}

function buildHunkHeaders(ops: DiffOp[], rowsA: AlignedRow[]): HunkHeader[] {
  const headers: HunkHeader[] = [];
  let inHunk = false;
  let hunkStartRow = 0;
  let hunkStartLineA = 0;
  let hunkStartLineB = 0;
  let hunkLastLineA = 0;
  let hunkLastLineB = 0;

  for (let row = 0; row < rowsA.length; row++) {
    const row_a = rowsA[row];
    const isChanged = row_a.kind !== 'unchanged';

    if (isChanged && !inHunk) {
      inHunk = true;
      hunkStartRow = row;
      hunkStartLineA = row_a.kind !== 'gap' ? (row_a as any).lineNum : hunkStartLineA;
      hunkStartLineB = row < rowsA.length ? ((rowsA[row] as any)?.lineNum ?? 0) : 0;
      hunkLastLineA = hunkStartLineA;
      hunkLastLineB = hunkStartLineB;
    } else if (isChanged && inHunk) {
      if (row_a.kind !== 'gap') {
        hunkLastLineA = (row_a as any).lineNum;
      }
    } else if (!isChanged && inHunk) {
      // End of hunk
      const numLinesA = hunkLastLineA - hunkStartLineA + 1;
      const numLinesB = hunkLastLineB - hunkStartLineB + 1;

      headers.push({
        rowIndex: hunkStartRow,
        rangeA: `-${hunkStartLineA},${numLinesA}`,
        rangeB: `+${hunkStartLineB},${numLinesB}`,
        pathA: undefined,
        pathB: undefined
      });

      inHunk = false;
    }
  }

  if (inHunk) {
    const numLinesA = hunkLastLineA - hunkStartLineA + 1;
    const numLinesB = hunkLastLineB - hunkStartLineB + 1;
    headers.push({
      rowIndex: hunkStartRow,
      rangeA: `-${hunkStartLineA},${numLinesA}`,
      rangeB: `+${hunkStartLineB},${numLinesB}`,
      pathA: undefined,
      pathB: undefined
    });
  }

  return headers;
}

// ============ Sub-Components ============

function HighlightedContent({ content, spans }: { content: string; spans?: CharSpan[] }) {
  if (!spans || spans.length === 0) {
    return <span>{content}</span>;
  }

  const parts = [];
  let lastEnd = 0;

  for (const span of spans) {
    if (lastEnd < span.start) {
      parts.push({ type: 'normal', text: content.slice(lastEnd, span.start) });
    }
    parts.push({ type: 'changed', text: content.slice(span.start, span.end) });
    lastEnd = span.end;
  }

  if (lastEnd < content.length) {
    parts.push({ type: 'normal', text: content.slice(lastEnd) });
  }

  return (
    <>
      {parts.map((part, idx) =>
        part.type === 'changed' ? (
          <span key={idx} className="bg-red-600/60 rounded px-0.5">
            {part.text}
          </span>
        ) : (
          <span key={idx}>{part.text}</span>
        )
      )}
    </>
  );
}

function HighlightedContentB({ content, spans }: { content: string; spans?: CharSpan[] }) {
  if (!spans || spans.length === 0) {
    return <span>{content}</span>;
  }

  const parts = [];
  let lastEnd = 0;

  for (const span of spans) {
    if (lastEnd < span.start) {
      parts.push({ type: 'normal', text: content.slice(lastEnd, span.start) });
    }
    parts.push({ type: 'changed', text: content.slice(span.start, span.end) });
    lastEnd = span.end;
  }

  if (lastEnd < content.length) {
    parts.push({ type: 'normal', text: content.slice(lastEnd) });
  }

  return (
    <>
      {parts.map((part, idx) =>
        part.type === 'changed' ? (
          <span key={idx} className="bg-green-600/60 rounded px-0.5">
            {part.text}
          </span>
        ) : (
          <span key={idx}>{part.text}</span>
        )
      )}
    </>
  );
}

function HunkHeaderRow({ header }: { header: HunkHeader }) {
  return (
    <div className="flex items-center bg-gray-800 dark:bg-gray-850 border-y border-gray-600 dark:border-gray-700 text-xs font-mono px-3 py-1 text-gray-400 sticky top-0 z-10">
      <span className="text-red-400">{header.rangeA}</span>
      {header.pathA && <span className="ml-2 text-gray-500">🔗 {header.pathA}</span>}
      <span className="mx-4 text-gray-600">⚙</span>
      <span className="text-green-400">{header.rangeB}</span>
      {header.pathB && <span className="ml-2 text-gray-500">🔗 {header.pathB}</span>}
    </div>
  );
}

// ============ Main Component ============

export default function ComparisonView() {
  const [jsonTextA, setJsonTextA] = useState('');
  const [jsonTextB, setJsonTextB] = useState('');
  const [parsedJsonA, setParsedJsonA] = useState<any>(null);
  const [parsedJsonB, setParsedJsonB] = useState<any>(null);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);
  const [diffOps, setDiffOps] = useState<DiffOp[]>([]);
  const [hasCompared, setHasCompared] = useState(false);
  const [showLoadMenuA, setShowLoadMenuA] = useState(false);
  const [showLoadMenuB, setShowLoadMenuB] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [currentDiffIndex, setCurrentDiffIndex] = useState(0);
  const [ignoreKeyOrder, setIgnoreKeyOrder] = useState(false);
  const [showDiffOptions, setShowDiffOptions] = useState(false);

  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelARef = useRef<HTMLDivElement>(null);
  const panelBRef = useRef<HTMLDivElement>(null);
  const diffLineRefsA = useRef<(HTMLDivElement | null)[]>([]);
  const diffLineRefsB = useRef<(HTMLDivElement | null)[]>([]);
  const dropdownRefA = useRef<HTMLDivElement>(null);
  const dropdownRefB = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const comparisonJsonA = useAppStore((state) => state.comparisonJsonA);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);

  // Validate and parse JSON
  const validateAndParseA = useCallback((json: string) => {
    const { valid, data, error } = validateJSON(json);
    if (valid && data) {
      setParsedJsonA(data);
      setErrorA(null);
    } else {
      setParsedJsonA(null);
      setErrorA(error ? error.message : 'Invalid JSON');
    }
  }, []);

  const validateAndParseB = useCallback((json: string) => {
    const { valid, data, error } = validateJSON(json);
    if (valid && data) {
      setParsedJsonB(data);
      setErrorB(null);
    } else {
      setParsedJsonB(null);
      setErrorB(error ? error.message : 'Invalid JSON');
    }
  }, []);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRefA.current && !dropdownRefA.current.contains(e.target as Node)) {
        setShowLoadMenuA(false);
      }
      if (dropdownRefB.current && !dropdownRefB.current.contains(e.target as Node)) {
        setShowLoadMenuB(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Debounced diff calculation
  useEffect(() => {
    if (!hasCompared || !parsedJsonA || !parsedJsonB) return;

    const timer = setTimeout(() => {
      try {
        let dataA = parsedJsonA;
        let dataB = parsedJsonB;

        if (ignoreKeyOrder) {
          const sortKeys = (obj: any): any => {
            if (Array.isArray(obj)) return obj.map(sortKeys);
            if (obj && typeof obj === 'object') {
              const sorted: any = {};
              Object.keys(obj)
                .sort()
                .forEach((key) => {
                  sorted[key] = sortKeys(obj[key]);
                });
              return sorted;
            }
            return obj;
          };
          dataA = sortKeys(dataA);
          dataB = sortKeys(dataB);
        }

        const strA = JSON.stringify(dataA, null, 2);
        const strB = JSON.stringify(dataB, null, 2);

        if (ignoreKeyOrder && strA === strB) {
          showInfoToast('JSON objects are identical (ignoring key order)');
          setDiffOps([]);
          return;
        }

        const linesA = strA.split('\n');
        const linesB = strB.split('\n');
        const ops = buildDiffOps(linesA, linesB);
        setDiffOps(ops);
      } catch (err) {
        showErrorToast('Failed to compute diff');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [hasCompared, parsedJsonA, parsedJsonB, ignoreKeyOrder]);

  // Resize handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

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

  // Load from open tab
  const handleLoadFromOpenTab = useCallback(
    (side: 'A' | 'B', tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        const jsonStr = typeof tab.content === 'string' ? tab.content : JSON.stringify(tab.content, null, 2);
        if (side === 'A') {
          setJsonTextA(jsonStr);
          validateAndParseA(jsonStr);
        } else {
          setJsonTextB(jsonStr);
          validateAndParseB(jsonStr);
        }
      }
    },
    [tabs, validateAndParseA, validateAndParseB]
  );

  // Load from URL
  const handleLoadFromURL = useCallback(
    async (side: 'A' | 'B') => {
      const url = prompt(`Enter JSON ${side} URL:`);
      if (!url) return;

      const loadingId = showLoadingToast(`Loading JSON ${side}...`);

      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json') && !contentType.includes('text')) {
          throw new Error('Invalid MIME type');
        }

        const jsonStr = await response.text();
        dismissToast(loadingId);

        if (side === 'A') {
          setJsonTextA(jsonStr);
          validateAndParseA(jsonStr);
        } else {
          setJsonTextB(jsonStr);
          validateAndParseB(jsonStr);
        }

        showSuccessToast(`JSON ${side} loaded`);
      } catch (err) {
        dismissToast(loadingId);
        showErrorToast(`Failed to load JSON ${side}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    [validateAndParseA, validateAndParseB]
  );

  // File upload
  const handleFileUpload = useCallback(
    async (side: 'A' | 'B', e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const sizeValidation = validateFileSize(file);
      if (!sizeValidation.valid) {
        showErrorToast(sizeValidation.message || 'File too large');
        return;
      }

      try {
        const text = await file.text();
        const jsonValidation = validateJSONSize(text);
        if (!jsonValidation.valid) {
          showErrorToast(jsonValidation.message || 'JSON too large');
          return;
        }

        if (side === 'A') {
          setJsonTextA(text);
          validateAndParseA(text);
        } else {
          setJsonTextB(text);
          validateAndParseB(text);
        }

        showSuccessToast(`JSON ${side} loaded from file`);
      } catch (err) {
        showErrorToast(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    [validateAndParseA, validateAndParseB]
  );

  // Derived values
  const { rowsA, rowsB } = useMemo(() => buildAlignedRows(diffOps), [diffOps]);
  const hunkHeaders = useMemo(() => buildHunkHeaders(diffOps, rowsA), [diffOps, rowsA]);

  const diffSummary = useMemo(
    () => ({
      added: diffOps.filter((o) => o.kind === 'added').length,
      removed: diffOps.filter((o) => o.kind === 'removed').length,
      modified: diffOps.filter((o) => o.kind === 'modified').length
    }),
    [diffOps]
  );

  const diffOpIndices = useMemo(
    () => rowsA.map((r, i) => (r.kind !== 'unchanged' ? i : -1)).filter((i) => i !== -1),
    [rowsA]
  );

  const hasDifferences = diffSummary.added + diffSummary.removed + diffSummary.modified > 0;

  // Navigation
  const scrollToDiff = useCallback(
    (rowIndex: number) => {
      const elA = diffLineRefsA.current[rowIndex];
      const elB = diffLineRefsB.current[rowIndex];
      if (elA) elA.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (elB) elB.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    []
  );

  const handleNextDiff = useCallback(() => {
    if (currentDiffIndex < diffOpIndices.length - 1) {
      const nextIndex = currentDiffIndex + 1;
      setCurrentDiffIndex(nextIndex);
      scrollToDiff(diffOpIndices[nextIndex]);
    }
  }, [currentDiffIndex, diffOpIndices, scrollToDiff]);

  const handlePrevDiff = useCallback(() => {
    if (currentDiffIndex > 0) {
      const prevIndex = currentDiffIndex - 1;
      setCurrentDiffIndex(prevIndex);
      scrollToDiff(diffOpIndices[prevIndex]);
    }
  }, [currentDiffIndex, diffOpIndices, scrollToDiff]);

  // Scroll sync
  const handleScrollA = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingRef.current || !panelBRef.current) return;
    isSyncingRef.current = true;
    panelBRef.current.scrollTop = e.currentTarget.scrollTop;
    isSyncingRef.current = false;
  }, []);

  const handleScrollB = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingRef.current || !panelARef.current) return;
    isSyncingRef.current = true;
    panelARef.current.scrollTop = e.currentTarget.scrollTop;
    isSyncingRef.current = false;
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-gray-700 px-4 flex items-center justify-between flex-shrink-0">
        <h2 className="font-bold text-lg">JSON Comparison</h2>

        <div className="flex items-center gap-2">
          {hasCompared && (
            <>
              <div className="flex items-center gap-1 text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                <span>{diffSummary.added}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-2"></span>
                <span>{diffSummary.removed}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2"></span>
                <span>{diffSummary.modified}</span>
              </div>

              <div className="flex items-center gap-1 border-l border-gray-700 pl-2 ml-2">
                <button
                  onClick={handlePrevDiff}
                  disabled={currentDiffIndex <= 0}
                  className="p-1 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-400">
                  {diffOpIndices.length > 0 ? currentDiffIndex + 1 : 0}/{diffOpIndices.length}
                </span>
                <button
                  onClick={handleNextDiff}
                  disabled={currentDiffIndex >= diffOpIndices.length - 1}
                  className="p-1 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setShowDiffOptions(!showDiffOptions)}
            className="ml-auto p-1 hover:bg-gray-700 rounded"
            title="Options"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (!parsedJsonA || !parsedJsonB) {
                showErrorToast('Both JSON inputs must be valid');
                return;
              }
              setHasCompared(!hasCompared);
              if (!hasCompared) {
                setCurrentDiffIndex(0);
              }
            }}
            className="px-3 py-1 bg-primary-500 hover:bg-primary-600 rounded text-sm font-medium transition-colors"
          >
            {hasCompared ? 'Edit' : 'Compare'}
          </button>
        </div>
      </div>

      {/* Options Panel */}
      {showDiffOptions && (
        <div className="h-10 border-b border-gray-700 px-4 flex items-center gap-4 bg-gray-800/50 flex-shrink-0">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={ignoreKeyOrder}
              onChange={(e) => setIgnoreKeyOrder(e.target.checked)}
              className="w-4 h-4"
            />
            Ignore Key Order
          </label>
        </div>
      )}

      {/* Main Content */}
      {!hasCompared ? (
        <div ref={containerRef} className="flex-1 flex overflow-hidden">
          {/* JSON A Input */}
          <div className="flex-1 flex flex-col border-r border-gray-700">
            <div className="h-10 bg-gray-800 border-b border-gray-700 px-3 flex items-center justify-between">
              <span className="text-xs font-semibold">JSON A</span>
              <div ref={dropdownRefA} className="relative">
                <button
                  onClick={() => setShowLoadMenuA(!showLoadMenuA)}
                  className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  Load
                </button>
                {showLoadMenuA && (
                  <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-32">
                    <button
                      onClick={() => {
                        fileInputRefA.current?.click();
                        setShowLoadMenuA(false);
                      }}
                      className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-700"
                    >
                      File
                    </button>
                    <button
                      onClick={() => {
                        handleLoadFromURL('A');
                        setShowLoadMenuA(false);
                      }}
                      className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-700"
                    >
                      URL
                    </button>
                    {tabs.length > 0 && <div className="border-t border-gray-700 my-1"></div>}
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          handleLoadFromOpenTab('A', tab.id);
                          setShowLoadMenuA(false);
                        }}
                        className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-700 truncate"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRefA}
                type="file"
                accept=".json,application/json"
                onChange={(e) => handleFileUpload('A', e)}
                className="hidden"
              />
            </div>

            <textarea
              value={jsonTextA}
              onChange={(e) => {
                setJsonTextA(e.target.value);
                validateAndParseA(e.target.value);
              }}
              placeholder='Paste JSON A here... { "key": "value" }'
              className="flex-1 p-4 bg-gray-950 font-mono text-sm resize-none focus:outline-none border-none text-gray-100"
            />

            {errorA && (
              <div className="p-3 bg-red-900/30 border-t border-red-800 text-red-300 text-xs">
                <div className="font-semibold mb-1">❌ Invalid JSON A:</div>
                {errorA}
              </div>
            )}
            {!errorA && parsedJsonA && (
              <div className="p-3 bg-green-900/30 border-t border-green-800 text-green-300 text-xs">
                ✓ Valid JSON
              </div>
            )}
          </div>

          {/* Resizer */}
          <div
            onMouseDown={handleMouseDown}
            className="w-1 bg-gray-700 hover:bg-primary-500 cursor-col-resize transition-colors flex-shrink-0 relative group"
            title="Drag to resize panels"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>

          {/* JSON B Input */}
          <div className="flex-1 flex flex-col">
            <div className="h-10 bg-gray-800 border-b border-gray-700 px-3 flex items-center justify-between">
              <span className="text-xs font-semibold">JSON B</span>
              <div ref={dropdownRefB} className="relative">
                <button
                  onClick={() => setShowLoadMenuB(!showLoadMenuB)}
                  className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  Load
                </button>
                {showLoadMenuB && (
                  <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-32">
                    <button
                      onClick={() => {
                        fileInputRefB.current?.click();
                        setShowLoadMenuB(false);
                      }}
                      className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-700"
                    >
                      File
                    </button>
                    <button
                      onClick={() => {
                        handleLoadFromURL('B');
                        setShowLoadMenuB(false);
                      }}
                      className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-700"
                    >
                      URL
                    </button>
                    {tabs.length > 0 && <div className="border-t border-gray-700 my-1"></div>}
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          handleLoadFromOpenTab('B', tab.id);
                          setShowLoadMenuB(false);
                        }}
                        className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-700 truncate"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRefB}
                type="file"
                accept=".json,application/json"
                onChange={(e) => handleFileUpload('B', e)}
                className="hidden"
              />
            </div>

            <textarea
              value={jsonTextB}
              onChange={(e) => {
                setJsonTextB(e.target.value);
                validateAndParseB(e.target.value);
              }}
              placeholder='Paste JSON B here... { "key": "value" }'
              className="flex-1 p-4 bg-gray-950 font-mono text-sm resize-none focus:outline-none border-none text-gray-100"
            />

            {errorB && (
              <div className="p-3 bg-red-900/30 border-t border-red-800 text-red-300 text-xs">
                <div className="font-semibold mb-1">❌ Invalid JSON B:</div>
                {errorB}
              </div>
            )}
            {!errorB && parsedJsonB && (
              <div className="p-3 bg-green-900/30 border-t border-green-800 text-green-300 text-xs">
                ✓ Valid JSON
              </div>
            )}
          </div>
        </div>
      ) : (
        // Diff View
        <div ref={containerRef} className="flex-1 flex overflow-hidden">
          {/* Panel A */}
          <div
            ref={panelARef}
            onScroll={handleScrollA}
            className="flex flex-col border-r border-gray-700"
            style={{ width: `${leftWidth}%` }}
          >
            <div className="h-10 bg-gray-800 border-b border-gray-700 px-3 flex items-center text-xs font-semibold flex-shrink-0">
              JSON A
            </div>

            <div className="flex-1 overflow-auto">
              {rowsA.map((row, index) => {
                const hunk = hunkHeaders.find((h) => h.rowIndex === index);
                const getRowBg = () => {
                  switch (row.kind) {
                    case 'unchanged':
                      return 'bg-gray-950';
                    case 'removed':
                      return 'bg-red-900/40';
                    case 'added':
                      return 'bg-gray-950';
                    case 'modified':
                      return 'bg-amber-900/30';
                    case 'gap':
                      return 'bg-gray-800/50';
                    default:
                      return 'bg-gray-950';
                  }
                };

                return (
                  <Fragment key={index}>
                    {hunk && <HunkHeaderRow header={hunk} />}
                    <div
                      ref={(el) => {
                        diffLineRefsA.current[index] = el;
                      }}
                      className={`flex font-mono text-xs leading-5 ${getRowBg()}`}
                      style={row.kind === 'gap' ? { backgroundImage: DIAGONAL_STRIPE } : undefined}
                    >
                      <span className="w-10 flex-shrink-0 text-right pr-2 text-gray-600 select-none border-r border-gray-700">
                        {row.kind !== 'gap' ? row.lineNum : ''}
                      </span>
                      <span className="flex-1 pl-3 whitespace-pre overflow-x-hidden text-gray-300">
                        {row.kind !== 'gap' && (
                          <HighlightedContent content={row.content} spans={(row as any).spans} />
                        )}
                      </span>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>

          {/* Resizer */}
          <div
            onMouseDown={handleMouseDown}
            className="w-1 bg-gray-700 hover:bg-primary-500 cursor-col-resize transition-colors flex-shrink-0"
            title="Drag to resize panels"
          />

          {/* Panel B */}
          <div
            ref={panelBRef}
            onScroll={handleScrollB}
            className="flex-1 flex flex-col border-l border-gray-700"
          >
            <div className="h-10 bg-gray-800 border-b border-gray-700 px-3 flex items-center text-xs font-semibold flex-shrink-0">
              JSON B
            </div>

            <div className="flex-1 overflow-auto">
              {rowsB.map((row, index) => {
                const getRowBg = () => {
                  switch (row.kind) {
                    case 'unchanged':
                      return 'bg-gray-950';
                    case 'removed':
                      return 'bg-gray-800/50';
                    case 'added':
                      return 'bg-green-900/40';
                    case 'modified':
                      return 'bg-amber-900/30';
                    case 'gap':
                      return 'bg-gray-800/50';
                    default:
                      return 'bg-gray-950';
                  }
                };

                return (
                  <div
                    key={index}
                    ref={(el) => {
                      diffLineRefsB.current[index] = el;
                    }}
                    className={`flex font-mono text-xs leading-5 ${getRowBg()}`}
                    style={row.kind === 'gap' ? { backgroundImage: DIAGONAL_STRIPE } : undefined}
                  >
                    <span className="w-10 flex-shrink-0 text-right pr-2 text-gray-600 select-none border-r border-gray-700">
                      {row.kind !== 'gap' ? row.lineNum : ''}
                    </span>
                    <span className="flex-1 pl-3 whitespace-pre overflow-x-hidden text-gray-300">
                      {row.kind !== 'gap' && row.kind === 'modified' ? (
                        <HighlightedContentB content={row.content} spans={row.spans} />
                      ) : row.kind !== 'gap' ? (
                        row.content
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      {hasCompared && parsedJsonA && parsedJsonB && (
        <div
          className={`h-12 border-t-2 flex items-center justify-center ${
            hasDifferences
              ? 'border-amber-500 bg-amber-900/20'
              : 'border-green-500 bg-green-900/20'
          }`}
        >
          <p
            className={`font-medium ${
              hasDifferences ? 'text-amber-300' : 'text-green-300'
            }`}
          >
            {hasDifferences
              ? `Found ${diffSummary.added + diffSummary.removed + diffSummary.modified} differences`
              : 'No differences found - JSON objects are identical'}
          </p>
        </div>
      )}
    </div>
  );
}
