import { useState, memo, useEffect } from 'react';
import { ChevronRight, ChevronDown, Edit, Copy, FileText, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { JSONValue } from '@/types';
import { getValueType } from '@/utils/jsonUtils';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

// Memoized regex patterns for sensitive data detection
const SENSITIVE_KEY_PATTERNS = [
  'password', 'passwd', 'pwd', 'pass',
  'secret', 'token', 'apikey', 'api_key', 'api-key',
  'auth', 'authorization', 'bearer',
  'credential', 'credentials',
  'key', 'private_key', 'privatekey',
  'access_token', 'refresh_token',
  'session', 'sessionid', 'session_id',
  'jwt', 'oauth',
  'ssn', 'social_security',
  'cc', 'credit_card', 'creditcard',
  'cvv', 'cvc', 'pin'
];

const SENSITIVE_VALUE_PATTERNS = [
  /^[A-Za-z0-9\-._~+/]+=*$/, // Base64-like
  /^[A-Za-z0-9]{32,}$/, // Long hex/alphanumeric (API keys)
  /^sk_[a-z0-9]+$/, // Stripe-like keys
  /^pk_[a-z0-9]+$/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /^Bearer\s+[A-Za-z0-9\-._~+/]+=*$/, // Bearer token
];

interface TreeNodeProps {
  nodeKey: string;
  value: JSONValue;
  path: string[];
  depth: number;
}

const TreeNode = memo(({ nodeKey, value, path, depth }: TreeNodeProps) => {
  const expandLevel = useAppStore((state) => state.expandLevel);
  const defaultExpanded = expandLevel === null ? depth < 3 : depth < expandLevel;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemKey, setNewItemKey] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const updateTabContent = useAppStore((state) => state.updateTabContent);
  const pushHistory = useAppStore((state) => state.pushHistory);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const maskSensitiveData = useAppStore((state) => state.maskSensitiveData);
  const type = getValueType(value);
  const isExpandable = type === 'object' || type === 'array';

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Update expansion state when expandLevel changes
  useEffect(() => {
    let shouldBeExpanded = depth < 3; // Default

    if (expandLevel === 0) {
      // Collapse All
      shouldBeExpanded = false;
    } else if (expandLevel !== null && expandLevel > 0) {
      // Specific level (1-6 or 999)
      shouldBeExpanded = depth < expandLevel;
    }
    // else expandLevel === null: use default (depth < 3)

    setIsExpanded(shouldBeExpanded);
  }, [expandLevel, depth]);

  // Detect sensitive data patterns using memoized patterns
  const isSensitiveKey = (key: string): boolean => {
    return SENSITIVE_KEY_PATTERNS.some(keyword => key.toLowerCase().includes(keyword));
  };

  const isSensitiveValue = (val: JSONValue): boolean => {
    if (typeof val !== 'string') return false;
    return SENSITIVE_VALUE_PATTERNS.some(pattern => pattern.test(val));
  };

  const handleCopyValue = () => {
    const valueStr = JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(valueStr);
    showSuccessToast('Value copied to clipboard!');
  };

  const handleCopyKeyValue = () => {
    const keyValueStr = `"${nodeKey}": ${JSON.stringify(value, null, 2)}`;
    navigator.clipboard.writeText(keyValueStr);
    showSuccessToast('Key and value copied to clipboard!');
  };

  const handleEdit = () => {
    if (isExpandable) {
      showErrorToast('Cannot edit objects or arrays inline. Please use the Code view for complex edits.');
      return;
    }
    setEditValue(type === 'string' ? String(value) : JSON.stringify(value));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!activeTab?.content || !activeTabId) return;

    try {
      let newValue: JSONValue;

      // Parse the new value based on type
      if (type === 'string') {
        newValue = editValue;
      } else if (type === 'number') {
        newValue = parseFloat(editValue);
        if (isNaN(newValue)) {
          showErrorToast('Invalid number format');
          return;
        }
      } else if (type === 'boolean') {
        if (editValue.toLowerCase() === 'true') {
          newValue = true;
        } else if (editValue.toLowerCase() === 'false') {
          newValue = false;
        } else {
          showErrorToast('Boolean must be "true" or "false"');
          return;
        }
      } else if (type === 'null') {
        if (editValue.toLowerCase() !== 'null') {
          showErrorToast('Null value must be "null"');
          return;
        }
        newValue = null;
      } else {
        newValue = JSON.parse(editValue);
      }

      // Update the value in the JSON tree
      const updateNestedValue = (obj: JSONValue, pathArray: string[], newVal: JSONValue): JSONValue => {
        if (pathArray.length === 0) return newVal;

        const [current, ...rest] = pathArray;

        if (Array.isArray(obj)) {
          const index = parseInt(current);
          const newArr = [...obj];
          newArr[index] = rest.length === 0 ? newVal : updateNestedValue(obj[index], rest, newVal);
          return newArr;
        } else if (typeof obj === 'object' && obj !== null) {
          return {
            ...obj,
            [current]: rest.length === 0 ? newVal : updateNestedValue((obj as Record<string, JSONValue>)[current], rest, newVal),
          };
        }
        return obj;
      };

      const updatedContent = updateNestedValue(activeTab.content, path, newValue);
      pushHistory(activeTabId, activeTab.content);
      updateTabContent(activeTabId, updatedContent);
      setIsEditing(false);
      showSuccessToast('Value updated successfully!');
    } catch (err) {
      showErrorToast(`Invalid value: ${(err as Error).message}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleDeleteNode = () => {
    if (!activeTab?.content || !activeTabId || path.length === 0) return;

    const confirmed = window.confirm(`Delete "${nodeKey}"?`);
    if (!confirmed) return;

    const deleteNestedValue = (obj: JSONValue, pathArray: string[]): JSONValue => {
      if (pathArray.length === 0) return obj;
      if (pathArray.length === 1) {
        const [key] = pathArray;
        if (Array.isArray(obj)) {
          const index = parseInt(key);
          return obj.filter((_, i) => i !== index);
        } else if (typeof obj === 'object' && obj !== null) {
          const newObj = { ...obj };
          delete (newObj as Record<string, JSONValue>)[key];
          return newObj;
        }
        return obj;
      }

      const [current, ...rest] = pathArray;
      if (Array.isArray(obj)) {
        const index = parseInt(current);
        const newArr = [...obj];
        newArr[index] = deleteNestedValue(obj[index], rest);
        return newArr;
      } else if (typeof obj === 'object' && obj !== null) {
        return {
          ...obj,
          [current]: deleteNestedValue((obj as Record<string, JSONValue>)[current], rest),
        };
      }
      return obj;
    };

    try {
      const updatedContent = deleteNestedValue(activeTab.content, path);
      pushHistory(activeTabId, activeTab.content);
      updateTabContent(activeTabId, updatedContent);
      showSuccessToast(`Deleted "${nodeKey}"`);
    } catch (err) {
      showErrorToast(`Delete failed: ${(err as Error).message}`);
    }
  };

  const handleAddItem = () => {
    if (!isExpandable) {
      showErrorToast('Can only add items to objects or arrays');
      return;
    }
    setIsAddingItem(true);
    setNewItemKey(Array.isArray(value) ? '' : '');
    setNewItemValue('null');
  };

  const handleSaveAddItem = () => {
    if (!activeTab?.content || !activeTabId) return;

    try {
      if (!Array.isArray(value) && typeof value === 'object' && value !== null) {
        if (!newItemKey.trim()) {
          showErrorToast('Key cannot be empty');
          return;
        }
      }

      let newValue: JSONValue;
      try {
        newValue = JSON.parse(newItemValue);
      } catch {
        newValue = newItemValue; // Treat as string if not valid JSON
      }

      const addNestedValue = (obj: JSONValue, pathArray: string[], key: string, val: JSONValue): JSONValue => {
        if (pathArray.length === 0) {
          if (Array.isArray(obj)) {
            return [...obj, val];
          } else if (typeof obj === 'object' && obj !== null) {
            return { ...obj, [key]: val };
          }
          return obj;
        }

        const [current, ...rest] = pathArray;
        if (Array.isArray(obj)) {
          const index = parseInt(current);
          const newArr = [...obj];
          newArr[index] = addNestedValue(obj[index], rest, key, val);
          return newArr;
        } else if (typeof obj === 'object' && obj !== null) {
          return {
            ...obj,
            [current]: addNestedValue((obj as Record<string, JSONValue>)[current], rest, key, val),
          };
        }
        return obj;
      };

      const key = Array.isArray(value) ? '' : newItemKey.trim();
      const updatedContent = addNestedValue(activeTab.content, path, key, newValue);
      pushHistory(activeTabId, activeTab.content);
      updateTabContent(activeTabId, updatedContent);
      setIsAddingItem(false);
      setNewItemKey('');
      setNewItemValue('');
      showSuccessToast('Item added successfully!');
      setIsExpanded(true); // Auto-expand to show the new item
    } catch (err) {
      showErrorToast(`Add failed: ${(err as Error).message}`);
    }
  };

  const handleCancelAddItem = () => {
    setIsAddingItem(false);
    setNewItemKey('');
    setNewItemValue('');
  };

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'string':
        return 'text-green-600 dark:text-green-400';
      case 'number':
        return 'text-purple-600 dark:text-purple-400';
      case 'boolean':
        return 'text-red-600 dark:text-red-400';
      case 'null':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getTypeBadge = (t: string) => {
    const colors = {
      string: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      number: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
      boolean: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
      null: 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300',
      array: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      object: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    };
    return colors[t as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-900';
  };

  const renderValue = () => {
    const shouldMask = maskSensitiveData && (isSensitiveKey(nodeKey) || isSensitiveValue(value));

    if (type === 'string') {
      const displayValue = shouldMask ? '•••••••' : String(value);
      return <span className={`${getTypeColor(type)} break-words`}>"{displayValue}"</span>;
    }
    if (type === 'number' || type === 'boolean')
      return <span className={`${getTypeColor(type)} break-words`}>{String(value)}</span>;
    if (type === 'null') return <span className={`${getTypeColor(type)} break-words`}>null</span>;
    if (type === 'array') {
      const arr = value as any[];
      return (
        <span className="text-gray-600 dark:text-gray-400 break-words">
          Array[{arr.length}]
        </span>
      );
    }
    if (type === 'object') {
      const obj = value as object;
      const keyCount = Object.keys(obj).length;
      return (
        <span className="text-gray-600 dark:text-gray-400 break-words">
          Object{'{'}
          {keyCount}
          {'}'}
        </span>
      );
    }
  };

  const renderAddItemForm = () => {
    if (!isAddingItem || !isExpandable) return null;

    const isArray = Array.isArray(value);

    return (
      <div
        className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded group"
        style={{ paddingLeft: `${(depth + 1) * 20 + 8}px` }}
      >
        <div className="w-5" />
        {!isArray && (
          <input
            type="text"
            value={newItemKey}
            onChange={(e) => setNewItemKey(e.target.value)}
            placeholder="Key"
            className="w-24 px-2 py-1 text-xs border border-primary-500 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
        )}
        <span className="text-blue-600 dark:text-blue-400">:</span>
        <input
          type="text"
          value={newItemValue}
          onChange={(e) => setNewItemValue(e.target.value)}
          placeholder='Value (JSON)'
          className="flex-1 px-2 py-1 text-xs border border-primary-500 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={handleSaveAddItem}
          className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
        >
          Add
        </button>
        <button
          onClick={handleCancelAddItem}
          className="px-2 py-1 text-xs bg-gray-400 hover:bg-gray-500 text-white rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  };

  const renderChildren = () => {
    if (!isExpanded || !isExpandable) return null;

    if (Array.isArray(value)) {
      return value.map((item, index) => (
        <TreeNode
          key={index}
          nodeKey={String(index)}
          value={item}
          path={[...path, String(index)]}
          depth={depth + 1}
        />
      ));
    }

    if (typeof value === 'object' && value !== null) {
      return Object.entries(value).map(([key, val]) => (
        <TreeNode
          key={key}
          nodeKey={key}
          value={val}
          path={[...path, key]}
          depth={depth + 1}
        />
      ));
    }
  };

  return (
    <div className="tree-node">
      <div
        className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {isExpandable ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        <span className="font-semibold text-blue-600 dark:text-blue-400">
          {nodeKey}:
        </span>

        <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${getTypeBadge(type)}`}>
          {type}
        </span>

        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-primary-500 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <button
              onClick={handleSaveEdit}
              className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-2 py-1 text-xs bg-gray-400 hover:bg-gray-500 text-white rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 min-w-0 break-words overflow-wrap-anywhere">{renderValue()}</span>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Copy value"
                aria-label="Copy value"
                onClick={handleCopyValue}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Copy key and value"
                aria-label="Copy key and value"
                onClick={handleCopyKeyValue}
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Edit value"
                aria-label="Edit value"
                onClick={handleEdit}
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              {isExpandable && (
                <button
                  className="p-1 hover:bg-green-200 dark:hover:bg-green-700 rounded text-green-600 dark:text-green-400"
                  title="Add item"
                  aria-label="Add item"
                  onClick={handleAddItem}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
              {path.length > 0 && (
                <button
                  className="p-1 hover:bg-red-200 dark:hover:bg-red-700 rounded text-red-600 dark:text-red-400"
                  title="Delete item"
                  aria-label="Delete item"
                  onClick={handleDeleteNode}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {renderAddItemForm()}
      {renderChildren()}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export default function TreeView() {
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  if (!activeTab?.content) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No JSON data to display
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white dark:bg-gray-900 p-4">
      <TreeNode nodeKey="root" value={activeTab.content} path={[]} depth={0} />
    </div>
  );
}
