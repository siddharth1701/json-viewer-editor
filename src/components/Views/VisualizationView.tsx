import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { JSONValue } from '@/types';

interface TreeNode {
  name: string;
  value?: any;
  type: string;
  children?: TreeNode[];
  _collapsed?: boolean;
  _id?: string;
  _depth?: number;
}

export default function VisualizationView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<any>(null);
  const initialTransformRef = useRef<any>(null);
  const currentTransformRef = useRef<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const treeDataRef = useRef<TreeNode | null>(null);
  const nodeIdCounterRef = useRef(0);
  const initialCollapseRef = useRef<Set<string> | null>(null);
  const isInitialLoadRef = useRef(true);

  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const jsonData = activeTab?.content;

  // Find node in original tree by ID
  const findNodeInTree = (node: TreeNode | null, nodeId: string): TreeNode | null => {
    if (!node) return null;
    if (node._id === nodeId) return node;
    if (!node.children) return null;
    for (const child of node.children) {
      const found = findNodeInTree(child, nodeId);
      if (found) return found;
    }
    return null;
  };

  // Toggle node collapsed state
  const toggleNodeCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Convert JSON to tree structure with unique IDs and depth tracking
  const convertToTree = (data: JSONValue, key: string = 'root', depth: number = 0): TreeNode => {
    const id = `node_${nodeIdCounterRef.current++}`;

    if (data === null) {
      return { name: key, value: null, type: 'null', _id: id, _depth: depth };
    }

    if (Array.isArray(data)) {
      const node: TreeNode = {
        name: `${key} (${data.length})`,
        type: 'array',
        _id: id,
        _depth: depth,
        children: data.map((item, index) => convertToTree(item, `[${index}]`, depth + 1)),
      };

      // Auto-collapse nodes at depth > 2
      if (depth > 1 && initialCollapseRef.current) {
        initialCollapseRef.current.add(id);
      }

      return node;
    }

    if (typeof data === 'object') {
      const node: TreeNode = {
        name: `${key} {${Object.keys(data).length}}`,
        type: 'object',
        _id: id,
        _depth: depth,
        children: Object.entries(data).map(([k, v]) => convertToTree(v, k, depth + 1)),
      };

      // Auto-collapse nodes at depth > 2
      if (depth > 1 && initialCollapseRef.current) {
        initialCollapseRef.current.add(id);
      }

      return node;
    }

    // Primitive values
    return {
      name: key,
      value: data,
      type: typeof data,
      _id: id,
      _depth: depth,
    };
  };

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !initialTransformRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(zoomBehaviorRef.current.transform, initialTransformRef.current);
  };

  const handleDownload = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'json-visualization.svg';
    link.click();
    URL.revokeObjectURL(url);
  };


  // Function to filter tree based on collapsed nodes
  const filterCollapsedTree = (node: TreeNode): TreeNode => {
    const nodeId = node._id || '';
    const isCollapsed = collapsedNodes.has(nodeId);

    const filteredNode: TreeNode = {
      ...node,
      children: isCollapsed ? [] : (node.children?.map(filterCollapsedTree) || []),
    };

    return filteredNode;
  };

  useEffect(() => {
    if (!jsonData || !svgRef.current || !containerRef.current) return;

    // Reset node counter for fresh ID assignment
    nodeIdCounterRef.current = 0;

    // Initialize smart collapse set for first load
    if (initialCollapseRef.current === null) {
      initialCollapseRef.current = new Set();
    } else {
      initialCollapseRef.current.clear();
    }

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Convert JSON to tree structure with auto-collapse at depth > 2
    const treeData = convertToTree(jsonData);
    treeDataRef.current = treeData;

    // Set initial collapsed nodes on first load
    if (collapsedNodes.size === 0 && initialCollapseRef.current.size > 0) {
      setCollapsedNodes(new Set(initialCollapseRef.current));
      return; // Let the effect run again with collapsed nodes
    }

    // Filter tree based on collapsed nodes
    const filteredTreeData = filterCollapsedTree(treeData);

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('font-family', 'ui-monospace, monospace')
      .style('shape-rendering', 'crispEdges');

    // Create group for zoom
    const g = svg.append('g');

    // Setup zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
        // Store current transform to preserve on collapse/expand
        currentTransformRef.current = event.transform;

        // Inverse-scale text and nodes to keep them readable at all zoom levels
        // When viewport is zoomed 4x, we scale text DOWN by 1/4 to compensate
        const inverseScale = 1 / event.transform.k;

        // Apply inverse scale to text elements
        g.selectAll('text.node-label')
          .style('font-size', `${12 * inverseScale}px`);
        g.selectAll('text.node-label-stroke')
          .style('font-size', `${12 * inverseScale}px`);
        g.selectAll('text.collapse-indicator')
          .style('font-size', `${16 * inverseScale}px`);

        // Inverse scale node circles
        const baseRadius = 6;
        g.selectAll('circle.node-circle')
          .attr('r', baseRadius * inverseScale);
      });

    // Store zoom behavior in ref for button controls
    zoomBehaviorRef.current = zoom;

    svg.call(zoom as any);

    // Create tree layout
    const treeLayout = d3.tree<TreeNode>().size([height - 100, width - 200]);

    // Convert data to hierarchy
    const root = d3.hierarchy(filteredTreeData);

    // Generate tree
    treeLayout(root);

    // Add links (lines between nodes)
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d',
        d3
          .linkHorizontal<any, any>()
          .x((d) => d.y)
          .y((d) => d.x)
      );

    // Add nodes
    const nodes = g
      .selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.y},${d.x})`);

    // Add circles for nodes with visual hierarchy
    nodes
      .append('circle')
      .attr('r', (d) => {
        // Larger circles for container nodes, smaller for leaf nodes
        const type = d.data.type;
        if (type === 'object' || type === 'array') return 7;
        return 5;
      })
      .attr('class', 'node-circle')
      .attr('fill', (d) => {
        const type = d.data.type;
        if (type === 'object') return '#3b82f6';
        if (type === 'array') return '#10b981';
        if (type === 'string') return '#f59e0b';
        if (type === 'number') return '#8b5cf6';
        if (type === 'boolean') return '#ec4899';
        return '#6b7280';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        const baseR = (d.data.type === 'object' || d.data.type === 'array') ? 7 : 5;
        d3.select(this).transition().duration(150).attr('r', baseR + 3);
      })
      .on('mouseout', function (event, d) {
        const baseR = (d.data.type === 'object' || d.data.type === 'array') ? 7 : 5;
        d3.select(this).transition().duration(150).attr('r', baseR);
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        const nodeId = d.data._id;
        // Check original tree to see if node has children
        const originalNode = findNodeInTree(treeDataRef.current, nodeId || '');
        if (nodeId && originalNode && (originalNode.children?.length ?? 0) > 0) {
          toggleNodeCollapse(nodeId);
        }
      });

    // Add text labels with stroke for better readability (no backgrounds)
    // Add stroke version first (background effect)
    nodes
      .append('text')
      .attr('class', 'node-label-stroke')
      .attr('dy', -9)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('dominant-baseline', 'middle')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .text((d) => {
        if (d.data.value !== undefined) {
          const valueStr = JSON.stringify(d.data.value);
          const displayValue = valueStr.length > 16 ? valueStr.substring(0, 16) + '…' : valueStr;
          return `${d.data.name}: ${displayValue}`;
        }
        return d.data.name;
      });

    // Add main text (foreground)
    nodes
      .append('text')
      .attr('class', 'node-label')
      .attr('dy', -9)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#0f172a')
      .attr('dominant-baseline', 'middle')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .text((d) => {
        if (d.data.value !== undefined) {
          const valueStr = JSON.stringify(d.data.value);
          const displayValue = valueStr.length > 16 ? valueStr.substring(0, 16) + '…' : valueStr;
          return `${d.data.name}: ${displayValue}`;
        }
        return d.data.name;
      });

    // Add collapse/expand indicator for nodes with children
    nodes
      .append('text')
      .attr('class', 'collapse-indicator')
      .attr('x', 14)
      .attr('y', 3)
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', '#404040')
      .attr('user-select', 'none')
      .style('pointer-events', 'none')
      .style('cursor', 'pointer')
      .text((d) => {
        const nodeId = d.data._id;
        // Check original tree to see if node has children
        const originalNode = findNodeInTree(treeDataRef.current, nodeId || '');
        const hasChildren = (originalNode?.children?.length ?? 0) > 0;
        if (!hasChildren) return '';
        return collapsedNodes.has(nodeId || '') ? '+' : '−';
      });

    // Add interactive tooltips with enhanced information
    nodes.append('title').text((d) => {
      const type = d.data.type;
      let info = `Type: ${type}`;
      const nodeId = d.data._id;

      if (d.data.value !== undefined) {
        info = `${d.data.name}\nValue: ${JSON.stringify(d.data.value)}\n${info}`;
      } else {
        info = `${d.data.name}\n${info}`;
      }

      // Check original tree for children count
      const originalNode = findNodeInTree(treeDataRef.current, nodeId || '');
      const childrenCount = originalNode?.children?.length ?? 0;
      if (childrenCount > 0) {
        info += `\nChildren: ${childrenCount}`;
        const isCollapsed = collapsedNodes.has(nodeId || '');
        info += `\n(Click to ${isCollapsed ? 'expand' : 'collapse'})`;
      }
      return info;
    });

    // Only reset view on initial load or when data changes
    // Preserve zoom/pan when only collapsing/expanding
    const shouldResetView = isInitialLoadRef.current || !currentTransformRef.current;

    if (shouldResetView) {
      // Center the tree on initial load
      const bounds = g.node()?.getBBox();
      if (bounds) {
        const fullWidth = bounds.width;
        const fullHeight = bounds.height;
        const midX = bounds.x + fullWidth / 2;
        const midY = bounds.y + fullHeight / 2;

        const scale = Math.min(
          width / fullWidth,
          height / fullHeight,
          1
        ) * 0.9;

        const translateX = width / 2 - scale * midX;
        const translateY = height / 2 - scale * midY;

        const initialTransform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);

        // Store initial transform for reset button
        initialTransformRef.current = initialTransform;
        currentTransformRef.current = initialTransform;

        svg.call(
          zoom.transform as any,
          initialTransform
        );

        isInitialLoadRef.current = false;
      }
    } else {
      // Preserve current zoom/pan when collapsing/expanding
      svg.call(
        zoom.transform as any,
        currentTransformRef.current
      );
    }
  }, [jsonData, collapsedNodes]);

  if (!jsonData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="mb-2 text-lg">No Data to Visualize</p>
          <p className="text-sm">Load JSON data to see the tree visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-white dark:bg-gray-900">
      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
        <button
          onClick={handleDownload}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Download as SVG"
        >
          <Download className="w-5 h-5" />
        </button>
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Legend
        </h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Object</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Array</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>String</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Number</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            <span>Boolean</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Null</span>
          </div>
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-gray-900/80 dark:bg-gray-800/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
        Drag to pan • Scroll to zoom • Click nodes to collapse/expand • Hover for details
      </div>

      {/* SVG Canvas */}
      <div ref={containerRef} className="h-full w-full">
        <svg
          ref={svgRef}
          className="w-full h-full text-gray-900 dark:text-gray-100"
        />
      </div>
    </div>
  );
}
