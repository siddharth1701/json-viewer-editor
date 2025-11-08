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
}

export default function VisualizationView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const jsonData = activeTab?.content;

  // Convert JSON to tree structure
  const convertToTree = (data: JSONValue, key: string = 'root'): TreeNode => {
    if (data === null) {
      return { name: key, value: null, type: 'null' };
    }

    if (Array.isArray(data)) {
      return {
        name: `${key} (${data.length})`,
        type: 'array',
        children: data.map((item, index) => convertToTree(item, `[${index}]`)),
      };
    }

    if (typeof data === 'object') {
      return {
        name: `${key} {${Object.keys(data).length}}`,
        type: 'object',
        children: Object.entries(data).map(([k, v]) => convertToTree(v, k)),
      };
    }

    // Primitive values
    return {
      name: key,
      value: data,
      type: typeof data,
    };
  };

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([0.1, 4]);
    svg.transition().call(zoom.scaleBy as any, 1.3);
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([0.1, 4]);
    svg.transition().call(zoom.scaleBy as any, 0.7);
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([0.1, 4]);
    svg.transition().call(zoom.transform as any, d3.zoomIdentity);
    setZoomLevel(1);
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

  useEffect(() => {
    if (!jsonData || !svgRef.current || !containerRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Convert JSON to tree structure
    const treeData = convertToTree(jsonData);

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('font-family', 'ui-monospace, monospace');

    // Create group for zoom
    const g = svg.append('g');

    // Setup zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom as any);

    // Create tree layout
    const treeLayout = d3.tree<TreeNode>().size([height - 100, width - 200]);

    // Convert data to hierarchy
    const root = d3.hierarchy(treeData);

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

    // Add circles for nodes
    nodes
      .append('circle')
      .attr('r', 6)
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
      .on('mouseover', function () {
        d3.select(this).attr('r', 8);
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', 6);
      });

    // Add text labels
    nodes
      .append('text')
      .attr('dy', -12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'currentColor')
      .text((d) => {
        if (d.data.value !== undefined) {
          const valueStr = JSON.stringify(d.data.value);
          return `${d.data.name}: ${valueStr.length > 20 ? valueStr.substring(0, 20) + '...' : valueStr}`;
        }
        return d.data.name;
      })
      .style('pointer-events', 'none');

    // Add tooltips
    nodes.append('title').text((d) => {
      if (d.data.value !== undefined) {
        return `${d.data.name}: ${JSON.stringify(d.data.value)} (${d.data.type})`;
      }
      return `${d.data.name} (${d.data.type})`;
    });

    // Center the tree
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

      svg.call(
        zoom.transform as any,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
    }
  }, [jsonData]);

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
        Drag to pan • Scroll to zoom • Hover nodes for details
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
