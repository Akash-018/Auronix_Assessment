import React from 'react';
import Editor from '@monaco-editor/react';
import { useBuilderStore } from '../../stores/builderStore';
import { Code, FileCode2, Braces } from 'lucide-react';

export const MonacoEditorPanel: React.FC = () => {
  const activeTab = useBuilderStore((state) => state.activeTab);
  const setActiveTab = useBuilderStore((state) => state.setActiveTab);
  const htmlCode = useBuilderStore((state) => state.htmlCode);
  const cssCode = useBuilderStore((state) => state.cssCode);
  const jsCode = useBuilderStore((state) => state.jsCode);
  const setCode = useBuilderStore((state) => state.setCode);

  const getLanguage = () => {
    if (activeTab === 'html') return 'html';
    if (activeTab === 'css') return 'css';
    return 'javascript';
  };

  const getCodeValue = () => {
    if (activeTab === 'html') return htmlCode;
    if (activeTab === 'css') return cssCode;
    return jsCode;
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(activeTab, value || '');
  };

  return (
    <div className="h-full bg-[#111827] flex flex-col overflow-hidden select-none border-x border-[#273549]">
      {/* Editor Tabs Header */}
      <div className="bg-[#0d131f] px-2 py-1.5 border-b border-[#273549] flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('html')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'html'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-[#161e2e]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML</span>
          </button>
          <button
            onClick={() => setActiveTab('css')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'css'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-[#161e2e]'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>CSS</span>
          </button>
          <button
            onClick={() => setActiveTab('js')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'js'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-[#161e2e]'
            }`}
          >
            <Braces className="w-3.5 h-3.5" />
            <span>JS <span className="text-[10px] opacity-60">(Optional)</span></span>
          </button>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          language={getLanguage()}
          theme="vs-dark"
          value={getCodeValue()}
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            tabSize: 2,
            bracketPairColorization: { enabled: true },
            folding: true,
          }}
        />
      </div>
    </div>
  );
};
