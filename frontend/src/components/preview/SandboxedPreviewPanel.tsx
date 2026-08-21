import React, { useMemo } from 'react';
import { useBuilderStore, ViewportMode } from '../../stores/builderStore';
import { Monitor, Tablet, Smartphone, Maximize, RotateCcw, AlertTriangle, Terminal } from 'lucide-react';

export const SandboxedPreviewPanel: React.FC = () => {
  const htmlCode = useBuilderStore((state) => state.htmlCode);
  const cssCode = useBuilderStore((state) => state.cssCode);
  const jsCode = useBuilderStore((state) => state.jsCode);
  
  const viewportMode = useBuilderStore((state) => state.viewportMode);
  const viewportWidth = useBuilderStore((state) => state.viewportWidth);
  const viewportHeight = useBuilderStore((state) => state.viewportHeight);
  const setViewport = useBuilderStore((state) => state.setViewport);
  
  const consoleErrors = useBuilderStore((state) => state.consoleErrors);
  const setConsoleErrors = useBuilderStore((state) => state.setConsoleErrors);
  const clearConsoleErrors = useBuilderStore((state) => state.clearConsoleErrors);

  // Sandboxed document generator with window.postMessage error capturing
  const srcDoc = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            ${cssCode}
          </style>
          <script>
            window.onerror = function(msg, url, lineNo, columnNo, error) {
              window.parent.postMessage({ type: 'PREVIEW_ERROR', message: msg + ' (Line ' + lineNo + ')' }, '*');
              return false;
            };
            console.error = function(...args) {
              window.parent.postMessage({ type: 'PREVIEW_ERROR', message: args.join(' ') }, '*');
            };
          </script>
        </head>
        <body>
          ${htmlCode}
          <script>
            try {
              ${jsCode}
            } catch(e) {
              console.error(e.message);
            }
          </script>
        </body>
      </html>
    `;
  }, [htmlCode, cssCode, jsCode]);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PREVIEW_ERROR') {
        setConsoleErrors([...consoleErrors, event.data.message]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [consoleErrors, setConsoleErrors]);

  return (
    <div className="h-full bg-[#090d16] flex flex-col overflow-hidden select-none">
      {/* Viewport Header Controls */}
      <div className="bg-[#111827] px-4 py-2 border-b border-[#273549] flex items-center justify-between text-xs">
        {/* Presets */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              viewportMode === 'desktop' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              viewportMode === 'tablet' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>

          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              viewportMode === 'mobile' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>

          <button
            onClick={() => setViewport('match')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              viewportMode === 'match'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-[#161e2e] text-blue-400 hover:bg-blue-600/20 border border-[#273549]'
            }`}
          >
            Match Reference
          </button>
        </div>

        {/* Viewport Dimension Indicator */}
        <div className="flex items-center space-x-2 text-gray-400 font-mono text-[11px]">
          <span className="bg-[#161e2e] px-2 py-0.5 rounded border border-[#273549]">
            {viewportWidth} × {viewportHeight} px
          </span>
        </div>
      </div>

      {/* Sandboxed iframe Preview Stage */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#090d16] relative">
        <div
          style={{ width: `${viewportWidth}px`, height: `${viewportHeight}px` }}
          className="bg-white rounded-lg shadow-2xl overflow-hidden border border-[#273549] max-w-full max-h-full transition-all duration-200"
        >
          <iframe
            srcDoc={srcDoc}
            title="Live Sandboxed Render Preview"
            sandbox="allow-scripts"
            className="w-full h-full border-0 block"
          />
        </div>
      </div>

      {/* Bottom Console Error Bar */}
      {consoleErrors.length > 0 && (
        <div className="bg-[#111827] border-t border-[#273549] p-3 max-h-32 overflow-auto text-xs font-mono text-red-400 flex flex-col space-y-1">
          <div className="flex items-center justify-between border-b border-red-500/20 pb-1 text-red-300 font-sans font-semibold">
            <span className="flex items-center space-x-1">
              <Terminal className="w-4 h-4 text-red-400" />
              <span>Console Errors ({consoleErrors.length})</span>
            </span>
            <button onClick={clearConsoleErrors} className="text-[10px] hover:underline text-gray-400">
              Clear
            </button>
          </div>
          {consoleErrors.map((err, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="break-all">{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
