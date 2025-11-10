import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Tab,
  ViewMode,
  SyntaxTheme,
  RecentFile,
  JSONValue,
} from '@/types';

interface AppState {
  // Theme & UI
  isDarkMode: boolean;
  syntaxTheme: SyntaxTheme;
  toggleDarkMode: () => void;
  setSyntaxTheme: (theme: SyntaxTheme) => void;

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

  // Undo/Redo
  history: JSONValue[][];
  historyIndex: number;
  pushHistory: (content: JSONValue) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Recent Files
  recentFiles: RecentFile[];
  addRecentFile: (name: string, content: JSONValue) => void;
  loadRecentFile: (id: string) => void;

  // Comparison Mode
  comparisonMode: boolean;
  comparisonJsonA: JSONValue | null;
  comparisonJsonB: JSONValue | null;
  setComparisonMode: (enabled: boolean) => void;
  setComparisonJsonA: (json: JSONValue) => void;
  setComparisonJsonB: (json: JSONValue) => void;

  // Settings
  indentation: 2 | 4;
  setIndentation: (indent: 2 | 4) => void;
  maskSensitiveData: boolean;
  toggleMaskSensitiveData: () => void;

  // Clear all data
  clearAllData: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme & UI
      isDarkMode: false,
      syntaxTheme: 'github',
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setSyntaxTheme: (theme) => set({ syntaxTheme: theme }),

      // Tabs
      tabs: [
        {
          id: generateId(),
          label: 'Untitled',
          content: null,
          isDirty: false,
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
          };
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
          }));
        }
      },

      // View Mode
      viewMode: 'tree',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Sidebar States
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () =>
        set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

      // Undo/Redo
      history: [[]],
      historyIndex: 0,
      pushHistory: (content) => {
        set((state) => {
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push([content]);
          return {
            history: newHistory.slice(-50), // Keep last 50 states
            historyIndex: Math.min(newHistory.length - 1, 49),
          };
        });
      },
      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          const content = state.history[newIndex][0];
          set({ historyIndex: newIndex });
          if (state.activeTabId) {
            state.updateTabContent(state.activeTabId, content);
          }
        }
      },
      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          const content = state.history[newIndex][0];
          set({ historyIndex: newIndex });
          if (state.activeTabId) {
            state.updateTabContent(state.activeTabId, content);
          }
        }
      },
      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

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
      comparisonMode: false,
      comparisonJsonA: null,
      comparisonJsonB: null,
      setComparisonMode: (enabled) => set({ comparisonMode: enabled }),
      setComparisonJsonA: (json) => set({ comparisonJsonA: json }),
      setComparisonJsonB: (json) => set({ comparisonJsonB: json }),

      // Settings
      indentation: 2,
      setIndentation: (indent) => set({ indentation: indent }),
      maskSensitiveData: false,
      toggleMaskSensitiveData: () =>
        set((state) => ({ maskSensitiveData: !state.maskSensitiveData })),

      // Clear all data
      clearAllData: () => {
        localStorage.clear();
        window.location.reload();
      },
    }),
    {
      name: 'json-viewer-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        syntaxTheme: state.syntaxTheme,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        recentFiles: state.recentFiles,
        indentation: state.indentation,
        maskSensitiveData: state.maskSensitiveData,
      }),
    }
  )
);
