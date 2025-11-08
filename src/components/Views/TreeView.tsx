import { useState, memo } from 'react';
import { ChevronRight, ChevronDown, Edit, Copy, FileText } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { JSONValue } from '@/types';
import { getValueType } from '@/utils/jsonUtils';

interface TreeNodeProps {
  nodeKey: string;
  value: JSONValue;
  path: string[];
  depth: number;
}

const TreeNode = memo(({ nodeKey, value, path, depth }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(depth < 3);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const updateTabContent = useAppStore((state) => state.updateTabContent);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const type = getValueType(value);
  const isExpandable = type === 'object' || type === 'array';

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleCopyValue = () => {
    const valueStr = JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(valueStr);
    alert('Value copied to clipboard!');
  };

  const handleCopyKeyValue = () => {
    const keyValueStr = `"${nodeKey}": ${JSON.stringify(value, null, 2)}`;
    navigator.clipboard.writeText(keyValueStr);
    alert('Key and value copied to clipboard!');
  };

  const handleEdit = () => {
    if (isExpandable) {
      alert('Cannot edit objects or arrays inline. Please use the Code view for complex edits.');
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
          alert('Invalid number format');
          return;
        }
      } else if (type === 'boolean') {
        if (editValue.toLowerCase() === 'true') {
          newValue = true;
        } else if (editValue.toLowerCase() === 'false') {
          newValue = false;
        } else {
          alert('Boolean must be "true" or "false"');
          return;
        }
      } else if (type === 'null') {
        if (editValue.toLowerCase() !== 'null') {
          alert('Null value must be "null"');
          return;
        }
        newValue = null;
      } else {
        newValue = JSON.parse(editValue);
      }

      // Update the value in the JSON tree
      const updateNestedValue = (obj: any, pathArray: string[], newVal: JSONValue): any => {
        if (pathArray.length === 0) return newVal;

        const [current, ...rest] = pathArray;

        if (Array.isArray(obj)) {
          const index = parseInt(current);
          const newArr = [...obj];
          newArr[index] = rest.length === 0 ? newVal : updateNestedValue(obj[index], rest, newVal);
          return newArr;
        } else {
          return {
            ...obj,
            [current]: rest.length === 0 ? newVal : updateNestedValue(obj[current], rest, newVal),
          };
        }
      };

      const updatedContent = updateNestedValue(activeTab.content, path, newValue);
      updateTabContent(activeTabId, updatedContent);
      setIsEditing(false);
      alert('Value updated successfully!');
    } catch (err) {
      alert(`Invalid value: ${(err as Error).message}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
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
    if (type === 'string')
      return <span className={`${getTypeColor(type)} break-words`}>"{String(value)}"</span>;
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
            </div>
          </>
        )}
      </div>

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
