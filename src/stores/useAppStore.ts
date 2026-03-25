import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Tab,
  ViewMode,
  RecentFile,
  JSONValue,
} from '@/types';

interface AppState {
  // Theme & UI
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (tab?: Partial<Tab>) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: JSONValue) => void;
  updateTabLabel: (id: string, label: string) => void;
  loadOrSwitchToTab: (label: string, content: JSONValue) => void;

  // View Mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Sidebar States
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  // Per-Tab Undo/Redo
  pushHistory: (tabId: string, content: JSONValue) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Recent Files
  recentFiles: RecentFile[];
  addRecentFile: (name: string, content: JSONValue) => void;
  loadRecentFile: (id: string) => void;

  // Comparison Mode - Used only for comparison tab detection
  comparisonJsonA: JSONValue | null;
  setComparisonJsonA: (json: JSONValue) => void;

  // Settings
  indentation: 2 | 4;
  setIndentation: (indent: 2 | 4) => void;
  maskSensitiveData: boolean;
  toggleMaskSensitiveData: () => void;
  expandLevel: number | null; // null = default (3), number = specific depth level
  setExpandLevel: (level: number | null) => void;

  // Ephemeral Editor Buffer (NOT persisted)
  rawEditBuffer: string | null;
  setRawEditBuffer: (raw: string | null) => void;

  // Clear all data
  clearAllData: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme & UI
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // View Mode
      viewMode: 'tree',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Tabs
      tabs: [
        {
          id: generateId(),
          label: 'Untitled',
          content: null,
          isDirty: false,
          history: [],
          historyIndex: -1,
        },
      ],
      activeTabId: null,
      addTab: (tabData) => {
        const newTab: Tab = {
          id: generateId(),
          label: tabData?.label || 'Untitled',
          content: tabData?.content || null,
          isDirty: false,
          filePath: tabData?.filePath,
          history: [],
          historyIndex: -1,
        };
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
      },
      closeTab: (id) => {
        set((state) => {
          const newTabs = state.tabs.filter((tab) => tab.id !== id);
          if (newTabs.length === 0) {
            newTabs.push({
              id: generateId(),
              label: 'Untitled',
              content: null,
              isDirty: false,
              history: [],
              historyIndex: -1,
            });
          }
          const newActiveId =
            state.activeTabId === id ? newTabs[0].id : state.activeTabId;
          return { tabs: newTabs, activeTabId: newActiveId };
        });
      },
      setActiveTab: (id) => set({ activeTabId: id }),
      updateTabContent: (id, content) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, content, isDirty: true } : tab
          ),
        }));
      },
      updateTabLabel: (id, label) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, label } : tab
          ),
        }));
      },
      loadOrSwitchToTab: (label, content) => {
        const state = get();
        // Check if a tab with this label already exists
        const existingTab = state.tabs.find((tab) => tab.label === label);

        if (existingTab) {
          // If content matches, just switch to it
          if (JSON.stringify(existingTab.content) === JSON.stringify(content)) {
            set({ activeTabId: existingTab.id });
            return;
          }
          // If content is different, create a new tab
          const newTab: Tab = {
            id: generateId(),
            label,
            content,
            isDirty: false,
            history: [],
            historyIndex: -1,
          };
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
          }));
        } else {
          // No existing tab with this label, create new one
          const newTab: Tab = {
            id: generateId(),
            label,
            content,
            isDirty: false,
            history: [],
            historyIndex: -1,
          };
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
          }));
        }
      },

      // Sidebar States
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () =>
        set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

      // Per-Tab Undo/Redo
      pushHistory: (tabId, content) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (tab.id === tabId) {
              // Keep only history up to current position, then add new entry
              const newHistory = tab.history.slice(0, tab.historyIndex + 1);
              newHistory.push(content);
              // Keep last 50 entries
              const trimmedHistory = newHistory.slice(-50);
              return {
                ...tab,
                history: trimmedHistory,
                historyIndex: trimmedHistory.length - 1,
              };
            }
            return tab;
          }),
        }));
      },
      undo: () => {
        const state = get();
        if (!state.activeTabId) return;

        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (tab.id === state.activeTabId && tab.historyIndex > 0) {
              const newIndex = tab.historyIndex - 1;
              return {
                ...tab,
                content: tab.history[newIndex],
                historyIndex: newIndex,
                isDirty: true,
              };
            }
            return tab;
          }),
        }));
      },
      redo: () => {
        const state = get();
        if (!state.activeTabId) return;

        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (
              tab.id === state.activeTabId &&
              tab.historyIndex < tab.history.length - 1
            ) {
              const newIndex = tab.historyIndex + 1;
              return {
                ...tab,
                content: tab.history[newIndex],
                historyIndex: newIndex,
                isDirty: true,
              };
            }
            return tab;
          }),
        }));
      },
      canUndo: () => {
        const state = get();
        const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
        return activeTab ? activeTab.historyIndex > 0 : false;
      },
      canRedo: () => {
        const state = get();
        const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
        return activeTab
          ? activeTab.historyIndex < activeTab.history.length - 1
          : false;
      },

      // Recent Files
      recentFiles: [],
      addRecentFile: (name, content) => {
        const file: RecentFile = {
          id: generateId(),
          name,
          content,
          timestamp: Date.now(),
        };
        set((state) => ({
          recentFiles: [file, ...state.recentFiles.slice(0, 9)], // Keep last 10
        }));
      },
      loadRecentFile: (id) => {
        const state = get();
        const file = state.recentFiles.find((f) => f.id === id);
        if (file) {
          state.loadOrSwitchToTab(file.name, file.content);
        }
      },

      // Comparison Mode
      comparisonJsonA: null,
      setComparisonJsonA: (json) => set({ comparisonJsonA: json }),

      // Settings
      indentation: 2,
      setIndentation: (indent) => set({ indentation: indent }),
      maskSensitiveData: false,
      toggleMaskSensitiveData: () =>
        set((state) => ({ maskSensitiveData: !state.maskSensitiveData })),
      expandLevel: null,
      setExpandLevel: (level) => set({ expandLevel: level }),

      // Ephemeral Editor Buffer (NOT persisted to localStorage)
      rawEditBuffer: null,
      setRawEditBuffer: (raw) => set({ rawEditBuffer: raw }),

      // Clear all data
      clearAllData: () => {
        localStorage.removeItem('json-viewer-storage');
        window.location.reload();
      },
    }),
    {
      name: 'json-viewer-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        recentFiles: state.recentFiles,
        indentation: state.indentation,
        maskSensitiveData: state.maskSensitiveData,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate store:', error);
          // Clear corrupted data and reload
          localStorage.removeItem('json-viewer-storage');
          window.location.reload();
        } else if (state) {
          // Validate tabs structure after hydration
          if (!Array.isArray(state.tabs)) {
            state.tabs = [];
          }
          // Ensure all tabs have required fields
          state.tabs = state.tabs.map(tab => ({
            id: tab.id || Math.random().toString(36).substr(2, 9),
            label: tab.label || 'Untitled',
            content: tab.content ?? null,
            isDirty: tab.isDirty || false,
            history: Array.isArray(tab.history) ? tab.history : [],
            historyIndex: typeof tab.historyIndex === 'number' ? tab.historyIndex : -1,
            filePath: tab.filePath,
          }));
        }
      },
    }
  )
);
