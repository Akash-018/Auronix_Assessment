import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { api } from '../services/api';
import { Challenge, Project } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useBuilderStore as useProjectStore } from '../stores/builderStore';
import { ReferencePanel } from '../components/reference/ReferencePanel';
import { MonacoEditorPanel } from '../components/editor/MonacoEditorPanel';
import { SandboxedPreviewPanel } from '../components/preview/SandboxedPreviewPanel';
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
      });
      setSaveStatus('saved');
      // Clear local backup once saved to backend
      localStorage.removeItem(`pixeltest_draft_${project.id}`);
    } catch (err) {
      setSaveStatus('offline');
      // Save to localStorage as offline recovery fallback
      localStorage.setItem(
        `pixeltest_draft_${project.id}`,
        JSON.stringify({ htmlCode, cssCode, jsCode, timestamp: Date.now() })
      );
    }
  }, [project, htmlCode, cssCode, jsCode, setSaveStatus]);

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
      useProjectStore.getState().restoreFromLocal(parsed.htmlCode, parsed.cssCode, parsed.jsCode);
    }
    setShowRestoreNotice(false);
  };

  const handleDiscardLocal = () => {
    if (project) {
      localStorage.removeItem(`pixeltest_draft_${project.id}`);
    }
    setShowRestoreNotice(false);
  };

  const handleReset = () => {
    if (confirm('Reset code to default template? Reference image will NOT be deleted.')) {
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
    <div className="h-screen bg-[#090d16] text-gray-200 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-[#111827] border-b border-[#273549] px-4 py-2 flex items-center justify-between select-none">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 hover:bg-[#161e2e] rounded-lg text-gray-400 hover:text-white border border-transparent hover:border-[#273549] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-blue-500" />
            <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-xs">
              {challenge?.title || 'PixelTest Builder'}
            </h1>
          </div>
        </div>

        {/* Action Controls & Save Status */}
        <div className="flex items-center space-x-3">
          {/* Status Indicator */}
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#161e2e] border border-[#273549] rounded-lg text-xs">
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-gray-400">Autosaved</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span className="text-blue-400">Saving...</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-amber-400">Unsaved changes</span>
              </>
            )}
            {saveStatus === 'offline' && (
              <>
                <CloudOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400">Offline — saved locally</span>
              </>
            )}
          </div>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition shadow-md shadow-blue-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 bg-[#161e2e] hover:bg-[#273549] text-gray-300 px-3 py-1.5 rounded-lg text-xs border border-[#273549] transition"
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
          {/* Reference Image Panel (Default 25%) */}
          <Panel defaultSize={25} minSize={15} maxSize={45}>
            <ReferencePanel challenge={challenge} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#273549] hover:bg-blue-500 transition duration-150 cursor-col-resize" />

          {/* Monaco Editor Panel (Default 35%) */}
          <Panel defaultSize={35} minSize={20} maxSize={60}>
            <MonacoEditorPanel />
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#273549] hover:bg-blue-500 transition duration-150 cursor-col-resize" />

          {/* Live Sandboxed Preview Panel (Default 40%) */}
          <Panel defaultSize={40} minSize={20}>
            <SandboxedPreviewPanel />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};
