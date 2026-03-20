import { useAppStore } from '@/stores/useAppStore';
import { formatJSON, minifyJSON, sortKeys } from '@/utils/jsonUtils';
import { jsonToYAML, jsonToXML, jsonToCSV, jsonToTOML, jsonToHTML } from '@/utils/converters';
import type { JSONValue, ExportFormat } from '@/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast } from '@/utils/toast';
import { validateJSONSize, validateFileSize, safeStringify, formatBytes } from '@/utils/validation';

export function useJsonActions() {
  const activeTabId = useAppStore((state) => state.activeTabId);
  const tabs = useAppStore((state) => state.tabs);
  const updateTabContent = useAppStore((state) => state.updateTabContent);
  const updateTabLabel = useAppStore((state) => state.updateTabLabel);
  const indentation = useAppStore((state) => state.indentation);
  const pushHistory = useAppStore((state) => state.pushHistory);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const formatJson = () => {
    if (!activeTab?.content || !activeTabId) return false;

    // Check if content has actually changed
    const formattedString = formatJSON(activeTab.content, indentation);
    const reparsed = JSON.parse(formattedString);
    const hasChanged = JSON.stringify(activeTab.content) !== JSON.stringify(reparsed);

    if (!hasChanged) {
      showSuccessToast('Already formatted!');
      return false;
    }

    pushHistory(activeTabId, activeTab.content);
    updateTabContent(activeTabId, reparsed);
    showSuccessToast('JSON formatted!');
    return true;
  };

  const minify = () => {
    if (!activeTab?.content || !activeTabId) return false;

    // Check if content has actually changed
    const minifiedString = minifyJSON(activeTab.content);
    const reparsed = JSON.parse(minifiedString);
    const hasChanged = JSON.stringify(activeTab.content) !== JSON.stringify(reparsed);

    if (!hasChanged) {
      showSuccessToast('Already minified!');
      return false;
    }

    pushHistory(activeTabId, activeTab.content);
    updateTabContent(activeTabId, reparsed);
    showSuccessToast('JSON minified!');
    return true;
  };

  const sortKeysAlphabetically = (recursive: boolean = false) => {
    if (!activeTab?.content || !activeTabId) return;

    const sorted = sortKeys(activeTab.content, recursive);
    const hasChanged = JSON.stringify(activeTab.content) !== JSON.stringify(sorted);

    if (!hasChanged) {
      showSuccessToast('Already sorted!');
      return;
    }

    pushHistory(activeTabId, activeTab.content);
    updateTabContent(activeTabId, sorted);
    showSuccessToast('Keys sorted!');
  };

  const exportAs = (format: ExportFormat) => {
    if (!activeTab?.content) {
      showErrorToast('No JSON data to export');
      return;
    }

    // Validate size before export
    const sizeValidation = validateJSONSize(activeTab.content);
    if (!sizeValidation.valid) {
      showErrorToast(`Export failed: ${sizeValidation.message}`);
      return;
    }

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = formatJSON(activeTab.content, indentation);
          filename = `${activeTab.label || 'data'}.json`;
          mimeType = 'application/json';
          break;
        case 'yaml':
          content = jsonToYAML(activeTab.content);
          filename = `${activeTab.label || 'data'}.yaml`;
          mimeType = 'text/yaml';
          break;
        case 'xml':
          content = jsonToXML(activeTab.content);
          filename = `${activeTab.label || 'data'}.xml`;
          mimeType = 'application/xml';
          break;
        case 'csv':
          content = jsonToCSV(activeTab.content);
          filename = `${activeTab.label || 'data'}.csv`;
          mimeType = 'text/csv';
          break;
        case 'toml':
          content = jsonToTOML(activeTab.content);
          filename = `${activeTab.label || 'data'}.toml`;
          mimeType = 'text/toml';
          break;
        case 'html':
          content = jsonToHTML(activeTab.content, activeTab.label);
          filename = `${activeTab.label || 'data'}.html`;
          mimeType = 'text/html';
          break;
        case 'pdf':
          // Generate PDF from HTML
          generatePDF(activeTab.content, activeTab.label || 'data');
          return;
        default:
          content = formatJSON(activeTab.content, indentation);
          filename = `${activeTab.label || 'data'}.json`;
          mimeType = 'application/json';
      }

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      showErrorToast(`Export failed: ${(error as Error).message}`);
    }
  };

  const copyToClipboard = async (formatted: boolean = true) => {
    if (!activeTab?.content) {
      showErrorToast('No JSON data to copy');
      return;
    }

    try {
      const text = formatted
        ? formatJSON(activeTab.content, indentation)
        : minifyJSON(activeTab.content);
      await navigator.clipboard.writeText(text);
      showSuccessToast('Copied to clipboard!');
    } catch (error) {
      showErrorToast('Failed to copy to clipboard');
    }
  };

  const downloadJson = () => {
    exportAs('json');
  };

  const generatePDF = async (data: JSONValue, label: string) => {
    const toastId = showLoadingToast('Generating PDF...');

    try {
      // Validate size before PDF generation
      const sizeValidation = validateJSONSize(data);
      if (!sizeValidation.valid) {
        dismissToast(toastId);
        showErrorToast(`PDF generation failed: ${sizeValidation.message}`);
        return;
      }

      // Format JSON with a limit for very large documents
      const jsonString = formatJSON(data, 2);
      const truncatedJson = jsonString.length > 100000
        ? jsonString.slice(0, 100000) + '\n\n... [JSON truncated for PDF]'
        : jsonString;

      // Create an HTML container for the JSON
      const container = document.createElement('div');
      container.style.padding = '20px';
      container.style.fontFamily = 'monospace';
      container.style.fontSize = '11px';
      container.style.backgroundColor = '#fff';
      container.style.width = '800px';
      container.innerHTML = `
        <h1 style="margin-top: 0; font-size: 24px; margin-bottom: 10px;">JSON Export: ${label}</h1>
        <p style="color: #666; font-size: 10px; margin: 5px 0;">Size: ${formatBytes(new Blob([jsonString]).size)} | Generated: ${new Date().toLocaleString()}</p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">
${truncatedJson}
        </pre>
      `;
      document.body.appendChild(container);

      try {
        // Convert to canvas
        const canvas = await html2canvas(container, {
          scale: 1,
          useCORS: true,
          logging: false,
        });

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let yPosition = 10;
        let heightLeft = imgHeight;

        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;

        while (heightLeft > 0) {
          yPosition = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
          heightLeft -= pdfHeight - 20;
        }

        pdf.save(`${label}.pdf`);
        dismissToast(toastId);
        showSuccessToast('PDF exported successfully!');
      } finally {
        // Clean up
        document.body.removeChild(container);
      }
    } catch (error) {
      dismissToast(toastId);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast(`PDF export failed: ${errorMsg}`);
    }
  };

  return {
    formatJson,
    minify,
    sortKeysAlphabetically,
    exportAs,
    copyToClipboard,
    downloadJson,
    hasContent: !!activeTab?.content,
  };
}
