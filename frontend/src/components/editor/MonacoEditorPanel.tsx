import React from 'react';
import Editor from '@monaco-editor/react';
import { useBuilderStore } from '../../stores/builderStore';
import { ChallengeCategory } from '../../types';
import { Code, FileCode2, Braces, Database } from 'lucide-react';

export const MonacoEditorPanel: React.FC = () => {
  const activeTab = useBuilderStore((state) => state.activeTab);
  const setActiveTab = useBuilderStore((state) => state.setActiveTab);
  const challenge = useBuilderStore((state) => state.challenge);
  const htmlCode = useBuilderStore((state) => state.htmlCode);
  const cssCode = useBuilderStore((state) => state.cssCode);
  const jsCode = useBuilderStore((state) => state.jsCode);
  const sqlCode = useBuilderStore((state) => state.sqlCode);
  const setCode = useBuilderStore((state) => state.setCode);

  const isSqlChallenge = challenge?.category === ChallengeCategory.SQL;

  const getLanguage = () => {
    if (activeTab === 'html') return 'html';
    if (activeTab === 'css') return 'css';
    if (activeTab === 'sql') return 'sql';
    return 'javascript';
  };

  const getCodeValue = () => {
    if (activeTab === 'html') return htmlCode;
    if (activeTab === 'css') return cssCode;
    if (activeTab === 'sql') return sqlCode;
    return jsCode;
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(activeTab, value || '');
  };

  return (
    <div className="h-full bg-[#111827] flex flex-col overflow-hidden select-none border-x border-[#273549]">
      {/* Editor Tabs Header */}
      <div className="bg-[#0d131f] px-2 py-1.5 border-b border-[#273549] flex items-center justify-between">
        {/* SQL challenges expose a single SQL surface — no HTML/CSS/JS tabs to wander into. */}
        {isSqlChallenge ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#D9C8A3]/15 text-[#D9C8A3] border border-[#D9C8A3]/30">
              <Database className="w-3.5 h-3.5" />
              <span>query.sql</span>
            </div>
            <span className="text-[10px] text-gray-500 pr-2">
              Blank canvas — write the full query yourself
            </span>
          </div>
        ) : (
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
        )}
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
