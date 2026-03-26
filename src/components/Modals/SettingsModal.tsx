import { X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);
  const indentation = useAppStore((state) => state.indentation);
  const setIndentation = useAppStore((state) => state.setIndentation);
  const maskSensitiveData = useAppStore((state) => state.maskSensitiveData);
  const toggleMaskSensitiveData = useAppStore((state) => state.toggleMaskSensitiveData);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold">Settings</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Theme Setting */}
            <div>
              <label className="block text-sm font-semibold mb-3">Theme</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </span>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDarkMode
                      ? 'bg-primary-500'
                      : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={isDarkMode}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Indentation Setting */}
            <div>
              <label className="block text-sm font-semibold mb-3">Indentation</label>
              <div className="flex gap-2">
                {[2, 4].map((spaces) => (
                  <button
                    key={spaces}
                    onClick={() => setIndentation(spaces as 2 | 4)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      indentation === spaces
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {spaces} Spaces
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Sets the number of spaces used for indentation when formatting JSON
              </p>
            </div>

            {/* Sensitive Data Masking */}
            <div>
              <label className="block text-sm font-semibold mb-3">Security</label>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mask Sensitive Data
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Hide passwords, tokens, and keys in the tree view
                  </p>
                </div>
                <button
                  onClick={toggleMaskSensitiveData}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    maskSensitiveData
                      ? 'bg-primary-500'
                      : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={maskSensitiveData}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      maskSensitiveData ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Info Section */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>💡 Tip:</strong> All settings are automatically saved to your browser's local storage. Your data is never sent to any server.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
