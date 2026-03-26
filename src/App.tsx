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
import SearchModal from './components/Modals/SearchModal';

function App() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const tabs = useAppStore((state) => state.tabs);
  const addTab = useAppStore((state) => state.addTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const { downloadJson } = useJsonActions();
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Initialize active tab on mount and show tour if first time
  useEffect(() => {
    try {
      // Ensure tabs is defined and is an array (fixes hydration issue on some browsers)
      if (!Array.isArray(tabs) || tabs.length === 0) {
        addTab();
      } else if (tabs.length > 0 && !useAppStore.getState().activeTabId) {
        setActiveTab(tabs[0].id);
      }

      // Check if user has seen the tour
      try {
        const hasSeenTour = localStorage.getItem('json-viewer-seen-tour') === 'true';
        if (!hasSeenTour) {
          // Show tour after a short delay to let UI render
          const timer = setTimeout(() => setShowGuidedTour(true), 500);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.warn('localStorage access error:', e);
      }
    } catch (e) {
      console.error('App initialization error:', e);
    }
  }, [tabs, addTab, setActiveTab]);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Keyboard shortcuts (don't intercept when typing in inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

      // Don't intercept shortcuts when user is typing in input fields
      // Exception: allow Ctrl+Z/Ctrl+Y/Ctrl+S even in inputs since they have well-defined meanings
      if (isInput && e.key === 'f') {
        return; // Allow browser's native search in inputs
      }

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

      // Ctrl/Cmd + F for search (only when not in input field)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !isInput) {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [downloadJson]);

  return (
    <ErrorBoundary>
      <div id="app-root" className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Navbar />
        <div className="flex-1 flex overflow-hidden">
          <LeftSidebar />
          <MainContent />
          <RightSidebar />
        </div>
        <StatusBar />
        <GuidedTourModal isOpen={showGuidedTour} onClose={() => setShowGuidedTour(false)} />
        <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
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
