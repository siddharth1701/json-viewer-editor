import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './stores/useAppStore';
import { useJsonActions } from './hooks/useJsonActions';
import Navbar from './components/Layout/Navbar';
import LeftSidebar from './components/Layout/LeftSidebar';
import RightSidebar from './components/Layout/RightSidebar';
import MainContent from './components/Layout/MainContent';
import StatusBar from './components/Layout/StatusBar';
import ErrorBoundary from './components/ErrorBoundary';
import GuidedTourModal from './components/Modals/GuidedTourModal';
import CodeGenerationModal from './components/Modals/CodeGenerationModal';

function App() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const tabs = useAppStore((state) => state.tabs);
  const addTab = useAppStore((state) => state.addTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const showCodeGenerationModal = useAppStore((state) => state.showCodeGenerationModal);
  const setShowCodeGenerationModal = useAppStore((state) => state.setShowCodeGenerationModal);
  const { downloadJson } = useJsonActions();
  const [showGuidedTour, setShowGuidedTour] = useState(false);

  // Initialize active tab on mount and show tour if first time
  useEffect(() => {
    if (tabs.length > 0 && !useAppStore.getState().activeTabId) {
      setActiveTab(tabs[0].id);
    } else if (tabs.length === 0) {
      addTab();
    }

    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('json-viewer-seen-tour') === 'true';
    if (!hasSeenTour) {
      // Show tour after a short delay to let UI render
      const timer = setTimeout(() => setShowGuidedTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useAppStore.getState().undo();
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        useAppStore.getState().redo();
      }

      // Ctrl/Cmd + S for save (prevent default browser save and download JSON)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        downloadJson();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Navbar />
        <div className="flex-1 flex overflow-hidden">
          <LeftSidebar />
          <MainContent />
          <RightSidebar />
        </div>
        <StatusBar />
        <GuidedTourModal isOpen={showGuidedTour} onClose={() => setShowGuidedTour(false)} />
        <CodeGenerationModal
          isOpen={showCodeGenerationModal}
          onClose={() => setShowCodeGenerationModal(false)}
        />
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            style: {
              borderRadius: '8px',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
            },
            success: {
              style: {
                background: '#10b981',
                color: '#fff',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: '#fff',
              },
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
