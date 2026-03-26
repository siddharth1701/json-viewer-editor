import { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: string;
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to JSON Viewer & Editor',
    description: 'This guide will help you get started with the application. You can skip at any time by pressing Escape or clicking the close button.',
    icon: '👋'
  },
  {
    title: 'Load JSON Data',
    description: 'Start by loading JSON data. You can paste JSON directly, upload a file, load from a URL, or drag and drop a JSON file into the application.',
    icon: '📄'
  },
  {
    title: 'Multiple View Modes',
    description: 'Switch between different views: Tree View for hierarchical exploration, Code View with syntax highlighting, Raw View for plain text, and Visualization for interactive diagrams.',
    icon: '👁️'
  },
  {
    title: 'Search & Filter',
    description: 'Use the Search feature (Ctrl+F) to find text in your JSON. Support for regex patterns and find & replace functionality makes searching powerful.',
    icon: '🔍'
  },
  {
    title: 'Query & Transform',
    description: 'Use JSONPath queries to extract specific data. Generate JSON Schema from your data to validate structure and create documentation.',
    icon: '🔄'
  },
  {
    title: 'Format & Transform Tools',
    description: 'Convert JSON to other formats (YAML, XML, CSV, TOML). Sort keys, flatten/unflatten structures, and more in the right sidebar.',
    icon: '⚙️'
  },
  {
    title: 'Compare JSON',
    description: 'Compare two JSON files side-by-side with visual highlighting of differences. Navigate between changes and export diff reports.',
    icon: '🔀'
  },
  {
    title: 'Performance Monitoring',
    description: 'Monitor rendering performance with the Performance Monitor. Track render time, memory usage, node count, and depth of your JSON structures.',
    icon: '📊'
  },
  {
    title: 'Undo & Redo',
    description: 'Made changes? Use Ctrl+Z to undo or Ctrl+Y to redo. The application maintains a history of your last 50 changes.',
    icon: '↩️'
  },
  {
    title: 'Data Protection',
    description: 'All processing happens client-side. Your JSON data never leaves your browser. Enable sensitive data masking to hide passwords, API keys, emails, and tokens.',
    icon: '🔒'
  },
  {
    title: 'Code Generation',
    description: 'Generate code from JSON in multiple languages: TypeScript, JavaScript, Python, Java, C#, Go, and Rust. Perfect for creating type definitions.',
    icon: '💻'
  },
  {
    title: 'Analysis & Statistics',
    description: 'View comprehensive statistics about your JSON: file size, key count, nesting depth, data type distribution, and circular reference detection.',
    icon: '📈'
  },
  {
    title: 'You\'re all set!',
    description: 'You\'re now ready to use JSON Viewer & Editor. For more help, click the ? button in the toolbar to see keyboard shortcuts.',
    icon: '🎉'
  }
];

export default function GuidedTourModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    try {
      return localStorage.getItem('json-viewer-seen-tour') === 'true';
    } catch {
      // localStorage not available in private browsing or some environments
      return false;
    }
  });

  const step = tourSteps[currentStep];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('json-viewer-seen-tour', 'true');
    } catch {
      // Silently fail if localStorage not available
    }
    setHasSeenTour(true);
    onClose();
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('json-viewer-seen-tour', 'true');
    } catch {
      // Silently fail if localStorage not available
    }
    setHasSeenTour(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-96 flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{step.icon}</span>
            <h2 className="font-bold text-lg">{step.title}</h2>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Close tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <p className="text-lg text-gray-700 dark:text-gray-300 text-center max-w-xl">
            {step.description}
          </p>
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
              {currentStep + 1} / {tourSteps.length}
            </span>
            <div className="flex gap-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-primary-500'
                      : index < currentStep
                      ? 'bg-primary-300 dark:bg-primary-700'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium text-sm transition-colors"
            >
              Skip Tour
            </button>

            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-medium text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              {currentStep !== tourSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
