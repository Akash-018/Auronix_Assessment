import { create } from 'zustand';
import { Challenge, ChallengeCategory, Project } from '../types';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile' | 'custom' | 'match';
export type EditorTab = 'html' | 'css' | 'js' | 'sql';

interface BuilderState {
  challenge: Challenge | null;
  project: Project | null;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  sqlCode: string;

  viewportMode: ViewportMode;
  viewportWidth: number;
  viewportHeight: number;
  
  activeTab: EditorTab;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'offline';
  lastSavedAt: string | null;
  hasUnsavedLocalChanges: boolean;
  
  consoleErrors: string[];

  setChallenge: (challenge: Challenge) => void;
  setProject: (project: Project) => void;
  setCode: (type: EditorTab, code: string) => void;
  setActiveTab: (tab: EditorTab) => void;
  setViewport: (mode: ViewportMode, width?: number, height?: number) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved' | 'offline') => void;
  setConsoleErrors: (errors: string[]) => void;
  clearConsoleErrors: () => void;
  resetCode: () => void;
  restoreFromLocal: (html: string, css: string, js: string, sql?: string) => void;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  challenge: null,
  project: null,
  htmlCode: '',
  cssCode: '',
  jsCode: '',
  sqlCode: '',

  viewportMode: 'desktop',
  viewportWidth: 1440,
  viewportHeight: 900,
  
  activeTab: 'html',
  isDirty: false,
  saveStatus: 'saved',
  lastSavedAt: null,
  hasUnsavedLocalChanges: false,
  
  consoleErrors: [],

  setChallenge: (challenge) => {
    const isMatch = get().viewportMode === 'match';
    const width = isMatch && challenge.reference_width ? challenge.reference_width : get().viewportWidth;
    const height = isMatch && challenge.reference_height ? challenge.reference_height : get().viewportHeight;
    set({ challenge, viewportWidth: width, viewportHeight: height });
  },

  setProject: (project) => {
    set({
      project,
      htmlCode: project.html_code,
      cssCode: project.css_code,
      jsCode: project.js_code,
      sqlCode: project.sql_code ?? '',
      isDirty: false,
      saveStatus: 'saved',
      lastSavedAt: project.last_saved_at,
    });
  },

  setCode: (type, code) => {
    const changes: Partial<BuilderState> = { isDirty: true, saveStatus: 'unsaved' };
    if (type === 'html') changes.htmlCode = code;
    if (type === 'css') changes.cssCode = code;
    if (type === 'js') changes.jsCode = code;
    if (type === 'sql') changes.sqlCode = code;
    set(changes);
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  setViewport: (mode, width, height) => {
    const challenge = get().challenge;
    let w = width || 1440;
    let h = height || 900;

    if (mode === 'desktop') { w = 1440; h = 900; }
    else if (mode === 'tablet') { w = 768; h = 1024; }
    else if (mode === 'mobile') { w = 390; h = 844; }
    else if (mode === 'match' && challenge?.reference_width && challenge?.reference_height) {
      w = challenge.reference_width;
      h = challenge.reference_height;
    }

    set({ viewportMode: mode, viewportWidth: w, viewportHeight: h });
  },

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  setConsoleErrors: (errors) => set({ consoleErrors: errors }),

  clearConsoleErrors: () => set({ consoleErrors: [] }),

  resetCode: () => {
    // SQL challenges have no starter content at all — resetting clears the editor
    // back to a blank canvas rather than to a boilerplate template.
    if (get().challenge?.category === ChallengeCategory.SQL) {
      set({ sqlCode: '', isDirty: true, saveStatus: 'unsaved' });
      return;
    }

    set({
      htmlCode: '<div class="page">\n  <h1>Hello PixelTest</h1>\n</div>',
      cssCode: 'body {\n  margin: 0;\n  padding: 1rem;\n  font-family: system-ui, sans-serif;\n}',
      jsCode: '// Optional JavaScript code',
      isDirty: true,
      saveStatus: 'unsaved',
    });
  },

  restoreFromLocal: (html, css, js, sql) => {
    set({
      htmlCode: html,
      cssCode: css,
      jsCode: js,
      sqlCode: sql ?? get().sqlCode,
      isDirty: true,
      saveStatus: 'unsaved',
      hasUnsavedLocalChanges: false,
    });
  },
}));
