import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { api } from '../services/api';
import { Challenge, ChallengeCategory, Project } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useBuilderStore as useProjectStore } from '../stores/builderStore';
import { ReferencePanel } from '../components/reference/ReferencePanel';
import { MonacoEditorPanel } from '../components/editor/MonacoEditorPanel';
import { SandboxedPreviewPanel } from '../components/preview/SandboxedPreviewPanel';
import { SqlBriefPanel } from '../components/sql/SqlBriefPanel';
import { SqlResultPanel } from '../components/sql/SqlResultPanel';
import {
  Code2,
  Save,
  RotateCcw,
  Play,
  ArrowLeft,
  Check,
  CloudOff,
  RefreshCw,
  AlertCircle,
  FileCode,
} from 'lucide-react';

export const ChallengeBuilder: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();

  const setChallenge = useProjectStore((state) => state.setChallenge);
  const setProject = useProjectStore((state) => state.setProject);
  const challenge = useProjectStore((state) => state.challenge);
  const project = useProjectStore((state) => state.project);
  
  const htmlCode = useProjectStore((state) => state.htmlCode);
  const cssCode = useProjectStore((state) => state.cssCode);
  const jsCode = useProjectStore((state) => state.jsCode);
  const sqlCode = useProjectStore((state) => state.sqlCode);

  const isDirty = useProjectStore((state) => state.isDirty);
  const saveStatus = useProjectStore((state) => state.saveStatus);
  const setSaveStatus = useProjectStore((state) => state.setSaveStatus);
  const resetCode = useProjectStore((state) => state.resetCode);

  const [isLoading, setIsLoading] = React.useState(true);
  const [showRestoreNotice, setShowRestoreNotice] = React.useState(false);

  // Load Challenge and Project from Backend
  useEffect(() => {
    if (!challengeId) return;

    const loadWorkspace = async () => {
      try {
        const cRes = await api.get<Challenge>(`/challenges/${challengeId}`);
        setChallenge(cRes.data);

        // Focus the tab matching the challenge type. Set explicitly in every branch:
        // the store outlives navigation, so an unset tab would strand the editor on
        // the previous challenge's language.
        const tabForCategory = {
          [ChallengeCategory.JS]: 'js',
          [ChallengeCategory.SQL]: 'sql',
          [ChallengeCategory.HTML]: 'html',
        } as const;
        useProjectStore
          .getState()
          .setActiveTab(tabForCategory[cRes.data.category] ?? 'html');

        // Fetch or create user project
        const pRes = await api.post<Project>('/projects', { challenge_id: challengeId });
        setProject(pRes.data);

        // Check local recovery fallback
        const localKey = `pixeltest_draft_${pRes.data.id}`;
        const savedDraft = localStorage.getItem(localKey);
        if (savedDraft) {
          setShowRestoreNotice(true);
        }
      } catch (err) {
        console.error('Failed to load workspace data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspace();
  }, [challengeId, setChallenge, setProject]);

  // Save Project Handler
  const handleSave = useCallback(async () => {
    if (!project) return;
    setSaveStatus('saving');
    try {
      await api.post(`/projects/${project.id}/save`, {
        html_code: htmlCode,
        css_code: cssCode,
        js_code: jsCode,
        sql_code: sqlCode,
      });
      setSaveStatus('saved');
      // Clear local backup once saved to backend
      localStorage.removeItem(`pixeltest_draft_${project.id}`);
    } catch (err) {
      setSaveStatus('offline');
      // Save to localStorage as offline recovery fallback
      localStorage.setItem(
        `pixeltest_draft_${project.id}`,
        JSON.stringify({ htmlCode, cssCode, jsCode, sqlCode, timestamp: Date.now() })
      );
    }
  }, [project, htmlCode, cssCode, jsCode, sqlCode, setSaveStatus]);

  // Debounced Autosave (5 seconds)
  useEffect(() => {
    if (!isDirty || !project) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isDirty, project, handleSave]);

  const handleRestoreLocal = () => {
    if (!project) return;
    const localKey = `pixeltest_draft_${project.id}`;
    const savedDraft = localStorage.getItem(localKey);
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      useProjectStore
        .getState()
        .restoreFromLocal(parsed.htmlCode, parsed.cssCode, parsed.jsCode, parsed.sqlCode);
    }
    setShowRestoreNotice(false);
  };

  const handleDiscardLocal = () => {
    if (project) {
      localStorage.removeItem(`pixeltest_draft_${project.id}`);
    }
    setShowRestoreNotice(false);
  };

  const isSqlChallenge = challenge?.category === ChallengeCategory.SQL;

  const handleReset = () => {
    const message = isSqlChallenge
      ? 'Clear the SQL editor completely? Your query will be erased.'
      : 'Reset code to default template? Reference image will NOT be deleted.';
    if (confirm(message)) {
      resetCode();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#090d16] flex items-center justify-center text-gray-400 text-sm">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-3" />
        Loading Builder Workspace...
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#13191D] text-[#F7F5F2] flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-[#1B2328] border-b border-[#34414A] px-4 py-2 flex items-center justify-between select-none">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 hover:bg-[#232D33] rounded-lg text-[#C9C7C3] hover:text-[#F7F5F2] border border-transparent hover:border-[#34414A] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-[#D9C8A3]" />
            <h1 className="text-sm font-bold text-[#F7F5F2] tracking-wide truncate max-w-xs">
              {challenge?.title || 'PixelTest Builder'}
            </h1>
          </div>
        </div>

        {/* Action Controls & Save Status */}
        <div className="flex items-center space-x-3">
          {/* Status Indicator */}
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#232D33] border border-[#34414A] rounded-lg text-xs">
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span className="text-[#C9C7C3]">Autosaved</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-[#D9C8A3] animate-spin" />
                <span className="text-[#D9C8A3]">Saving...</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <span className="w-2 h-2 rounded-full bg-[#FFC857] animate-pulse"></span>
                <span className="text-[#FFC857]">Unsaved changes</span>
              </>
            )}
            {saveStatus === 'offline' && (
              <>
                <CloudOff className="w-3.5 h-3.5 text-[#FF5F5F]" />
                <span className="text-[#FF5F5F]">Offline — saved locally</span>
              </>
            )}
          </div>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 bg-[#D9C8A3] hover:bg-[#B8FF4F] text-[#13191D] font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {project && (
            <button
              onClick={async () => {
                if (confirm('Are you ready to submit this test attempt?')) {
                  try {
                    await handleSave();
                    await api.post(`/projects/${project.id}/submit`);
                    alert('Test submitted successfully!');
                    navigate('/dashboard');
                  } catch (err) {
                    alert('Failed to submit test.');
                  }
                }
              }}
              className="flex items-center space-x-1.5 bg-[#4ADE80] hover:bg-[#B8FF4F] text-[#13191D] font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 bg-[#232D33] hover:bg-[#34414A] text-[#C9C7C3] px-3 py-1.5 rounded-lg text-xs border border-[#34414A] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Code</span>
          </button>
        </div>
      </header>

      {/* Local Recovery Alert Bar */}
      {showRestoreNotice && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Unsaved local changes detected from a previous offline session.</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRestoreLocal}
              className="bg-amber-500 text-black px-2.5 py-1 rounded font-semibold text-[11px] hover:bg-amber-400 transition"
            >
              Restore Unsaved Changes
            </button>
            <button
              onClick={handleDiscardLocal}
              className="text-gray-400 hover:text-white px-2 py-1 text-[11px]"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* 3-Panel Resizable Workspace */}
      <div className="flex-1 overflow-hidden relative">
        <PanelGroup direction="horizontal">
          {/* Left: reference screenshot for visual tests, question brief + schema for SQL */}
          <Panel defaultSize={isSqlChallenge ? 32 : 25} minSize={15} maxSize={50}>
            {isSqlChallenge ? (
              <SqlBriefPanel challenge={challenge} />
            ) : (
              <ReferencePanel challenge={challenge} />
            )}
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#273549] hover:bg-blue-500 transition duration-150 cursor-col-resize" />

          {/* Monaco Editor Panel */}
          <Panel defaultSize={isSqlChallenge ? 34 : 35} minSize={20} maxSize={60}>
            <MonacoEditorPanel />
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#273549] hover:bg-blue-500 transition duration-150 cursor-col-resize" />

          {/* Right: live render for visual tests, query result grid for SQL */}
          <Panel defaultSize={isSqlChallenge ? 34 : 40} minSize={20}>
            {isSqlChallenge ? <SqlResultPanel /> : <SandboxedPreviewPanel />}
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};
