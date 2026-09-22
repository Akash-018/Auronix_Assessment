import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Challenge, SubmissionDetail } from '../types';
import { useAuthStore } from '../stores/authStore';
import { CandidatePerformanceCard } from '../components/dashboard/CandidatePerformanceCard';
import {
  Plus,
  Code2,
  Image as ImageIcon,
  FolderKanban,
  LogOut,
  ArrowRight,
  Upload,
  CheckCircle,
  FileCode,
  Trash2,
  Eye,
  ClipboardList,
  UserCheck,
  Clock,
  Code,
  Database,
} from 'lucide-react';

type CategoryKey = 'HTML' | 'JS' | 'SQL';

const CATEGORY_META: Record<CategoryKey, { label: string; heading: string; icon: typeof Code }> = {
  HTML: { label: 'HTML & Visual Tests', heading: 'HTML & CSS Visual Layout Tests', icon: FileCode },
  JS: { label: 'JavaScript Tests', heading: 'JavaScript Method & Logic Tests', icon: Code },
  SQL: { label: 'SQL Tests', heading: 'SQL Query & Data Modelling Tests', icon: Database },
};

const DEFAULT_SQL_SCHEMA = `-- DDL + seed data for the candidate's in-browser SQLite sandbox.
CREATE TABLE example (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO example (id, name) VALUES (1, 'first row');`;

export const Dashboard: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDetail[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'submissions'>('tests');
  const [categoryTab, setCategoryTab] = useState<CategoryKey>('HTML');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form state for challenge creation
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryKey>('HTML');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [starterJs, setStarterJs] = useState('// Define the starter function stub for candidates\nfunction solveProblem(input) {\n  // TODO: Implement solution\n  return input;\n}');
  const [sqlSchema, setSqlSchema] = useState(DEFAULT_SQL_SCHEMA);
  const [file, setFile] = useState<File | null>(null);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const fetchChallenges = async () => {
    try {
      const res = await api.get<Challenge[]>('/challenges');
      setChallenges(res.data);
    } catch (err) {
      console.error('Failed to fetch challenges', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await api.get<SubmissionDetail[]>('/submissions');
      setSubmissions(res.data);
    } catch (err) {
      console.error('Failed to fetch submissions', err);
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchSubmissions();
  }, [user]);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // 1. Create challenge
      const createRes = await api.post<Challenge>('/challenges', {
        title: title || undefined,
        description: description || undefined,
        category,
        starter_js: category === 'JS' ? starterJs : undefined,
        // SQL tests ship a sandbox dataset but deliberately no starter query.
        sql_schema: category === 'SQL' ? sqlSchema : undefined,
        difficulty: category === 'SQL' ? difficulty : undefined,
      });

      const newChallenge = createRes.data;

      // 2. Upload reference image if selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/challenges/${newChallenge.id}/reference-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Redirect directly to builder
      navigate(`/builder/${newChallenge.id}`);
    } catch (err) {
      alert('Failed to create challenge. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteChallenge = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this challenge?')) {
      try {
        await api.delete(`/challenges/${id}`);
        fetchChallenges();
      } catch (err) {
        alert('Failed to delete challenge.');
      }
    }
  };

  const handleTogglePublish = async (e: React.MouseEvent, challenge: Challenge) => {
    e.stopPropagation();
    const newStatus = challenge.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      await api.put(`/challenges/${challenge.id}`, { status: newStatus });
      fetchChallenges();
    } catch (err) {
      alert('Failed to update challenge status.');
    }
  };

  const activeCount = challenges.filter((c) => c.status === 'ACTIVE').length;
  const draftCount = challenges.filter((c) => c.status === 'DRAFT').length;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <div className="h-screen bg-[#13191D] text-[#F7F5F2] flex flex-col overflow-y-auto">
      {/* Top Bar */}
      <header className="bg-[#1B2328] border-b border-[#34414A] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#D9C8A3]/10 text-[#D9C8A3] rounded-lg border border-[#D9C8A3]/30">
            <Code2 className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-[#F7F5F2]">
            {isAdmin ? 'PixelTest Admin' : 'PixelTest Candidate Portal'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-[#C9C7C3] bg-[#232D33] px-3 py-1.5 rounded-full border border-[#34414A]">
            {user?.email} ({user?.role})
          </span>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center space-x-1.5 text-xs text-[#C9C7C3] hover:text-[#FF5F5F] px-3 py-1.5 bg-[#232D33] border border-[#34414A] hover:border-[#FF5F5F]/50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4 text-[#FF5F5F]" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">
        {/* Banner Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-[#B89C5E]/20 via-[#1B2328] to-[#1B2328] border border-[#34414A] p-6 rounded-2xl shadow-xl">
          <div>
            <h2 className="text-2xl font-bold text-[#F7F5F2] mb-1">
              {isAdmin ? 'Frontend Challenges & Tests' : 'Available Tests & Assessments'}
            </h2>
            <p className="text-sm text-[#C9C7C3]">
              {isAdmin
                ? 'Create, edit, publish, unpublish, and manage coding tests and candidate submissions.'
                : 'Select an assessment below to inspect requirements, code live solutions, and submit your attempt.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 sm:mt-0 flex items-center space-x-2 bg-[#D9C8A3] hover:bg-[#B8FF4F] text-[#13191D] font-bold px-5 py-2.5 rounded-xl transition shadow-lg text-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Create Test</span>
            </button>
          )}
        </div>

        {/* Candidate Performance Dashboard Widget */}
        {!isAdmin && (
          <CandidatePerformanceCard submissions={submissions} challenges={challenges} />
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#34414A] space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('tests')}
            className={`pb-3 font-semibold transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'tests'
                ? 'border-[#D9C8A3] text-[#D9C8A3]'
                : 'border-transparent text-[#8D9498] hover:text-[#F7F5F2]'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>{isAdmin ? `Managed Tests (${challenges.length})` : `Available Assessments (${challenges.length})`}</span>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-3 font-semibold transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'submissions'
                ? 'border-[#D9C8A3] text-[#D9C8A3]'
                : 'border-transparent text-[#8D9498] hover:text-[#F7F5F2]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>{isAdmin ? `Candidate Submissions (${submissions.length})` : `My Submitted Tests (${submissions.length})`}</span>
          </button>
        </div>

        {/* Section View */}
        {activeTab === 'submissions' ? (
          <div>
            <h3 className="text-lg font-semibold text-[#F7F5F2] mb-4">
              {isAdmin ? 'Candidate Test Results & Code' : 'My Completed Submissions & Code'}
            </h3>
            {submissions.length === 0 ? (
              <div className="bg-[#1B2328] border border-dashed border-[#34414A] rounded-2xl p-12 text-center text-[#8D9498] text-sm">
                <ClipboardList className="w-12 h-12 mx-auto text-[#8D9498] mb-3" />
                {isAdmin ? 'No candidate submissions received yet.' : 'You have not submitted any test attempts yet.'}
              </div>
            ) : (
              <div className="bg-[#1B2328] border border-[#34414A] rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-[#C9C7C3]">
                  <thead className="bg-[#232D33] text-xs uppercase text-[#8D9498] border-b border-[#34414A]">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">{isAdmin ? 'Candidate Email' : 'Account Email'}</th>
                      <th className="px-6 py-3.5 font-semibold">Test Title</th>
                      <th className="px-6 py-3.5 font-semibold">Submitted At</th>
                      <th className="px-6 py-3.5 font-semibold">Status</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#34414A]">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#232D33]/50 transition">
                        <td className="px-6 py-4 font-medium text-[#F7F5F2]">{sub.candidate_email}</td>
                        <td className="px-6 py-4 text-[#D9C8A3] font-semibold">{sub.challenge_title}</td>
                        <td className="px-6 py-4 text-xs text-[#8D9498]">
                          {new Date(sub.submitted_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/30">
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="inline-flex items-center space-x-1 bg-[#D9C8A3]/10 hover:bg-[#D9C8A3] text-[#D9C8A3] hover:text-[#13191D] px-3 py-1.5 rounded-lg text-xs font-bold border border-[#D9C8A3]/30 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Solution Code</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Challenge Cards Grid with Category Sidebar */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Category Sidebar Navigation */}
            <aside className="lg:col-span-1 bg-[#1B2328] border border-[#34414A] rounded-2xl p-5 h-fit space-y-3 shadow-xl">
              <h3 className="text-xs font-bold text-[#8D9498] uppercase tracking-wider px-3 mb-2">
                Test Categories
              </h3>
              {(Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => {
                const meta = CATEGORY_META[key];
                const Icon = meta.icon;
                const isActive = categoryTab === key;
                const count = challenges.filter((c) => (c.category || 'HTML') === key).length;

                return (
                  <button
                    key={key}
                    onClick={() => setCategoryTab(key)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[#D9C8A3] text-[#13191D] shadow-md'
                        : 'bg-[#232D33] text-[#C9C7C3] hover:text-[#F7F5F2] hover:bg-[#2D3941] border border-[#34414A]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{meta.label}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                        isActive ? 'bg-[#13191D]/20 text-[#13191D]' : 'bg-[#13191D] text-[#8D9498]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </aside>

            {/* Test Cards List */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#F7F5F2]">
                  {CATEGORY_META[categoryTab].heading}
                </h3>
                <span className="text-xs text-[#8D9498]">
                  Showing {challenges.filter((c) => (c.category || 'HTML') === categoryTab).length} tests
                </span>
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-[#8D9498] text-sm">Loading assessments...</div>
              ) : challenges.filter((c) => (c.category || 'HTML') === categoryTab).length === 0 ? (
                <div className="bg-[#1B2328] border border-dashed border-[#34414A] rounded-2xl p-12 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-[#8D9498] mb-3" />
                  <h4 className="text-lg font-medium text-[#F7F5F2] mb-1">
                    No {categoryTab} tests available
                  </h4>
                  <p className="text-sm text-[#C9C7C3] mb-4">
                    {isAdmin
                      ? `Create your first ${categoryTab} assessment test.`
                      : `No ${categoryTab} tests published currently.`}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setCategory(categoryTab);
                        setShowModal(true);
                      }}
                      className="bg-[#D9C8A3] hover:bg-[#B8FF4F] text-[#13191D] font-bold px-4 py-2 rounded-lg text-sm transition"
                    >
                      Create {categoryTab} Test
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {challenges
                    .filter((item) => (item.category || 'HTML') === categoryTab)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/builder/${item.id}`)}
                        className="group bg-[#1B2328] border border-[#34414A] hover:border-[#D9C8A3]/50 rounded-xl overflow-hidden shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                item.status === 'ACTIVE'
                                  ? 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/30'
                                  : 'bg-[#FFC857]/10 text-[#FFC857] border-[#FFC857]/30'
                              }`}
                            >
                              {item.status === 'ACTIVE' ? 'Published' : 'Draft'}
                            </span>
                            {isAdmin && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => handleTogglePublish(e, item)}
                                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition ${
                                    item.status === 'ACTIVE'
                                      ? 'bg-[#FFC857]/20 hover:bg-[#FFC857]/30 text-[#FFC857] border-[#FFC857]/40'
                                      : 'bg-[#4ADE80] hover:bg-[#B8FF4F] text-[#13191D] border-[#4ADE80]'
                                  }`}
                                >
                                  {item.status === 'ACTIVE' ? 'Unpublish' : 'Publish Test'}
                                </button>
                                <button
                                  onClick={(e) => handleDeleteChallenge(e, item.id)}
                                  title="Delete test"
                                  className="text-[#8D9498] hover:text-[#FF5F5F] p-1 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-lg font-bold text-[#F7F5F2] group-hover:text-[#D9C8A3] transition">
                              {item.title}
                            </h3>
                            {item.difficulty && (
                              <span className="flex-shrink-0 mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B89C5E]/15 text-[#D9C8A3] border border-[#D9C8A3]/30">
                                {item.difficulty}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#C9C7C3] line-clamp-2 mb-4">
                            {/* Briefs are markdown; strip the syntax so the card preview stays readable. */}
                            {item.description
                              ? item.description
                                  .replace(/[*_`#>|]/g, '')
                                  .replace(/\s+/g, ' ')
                                  .trim()
                              : 'No description provided.'}
                          </p>

                          {/* Reference Preview or Category Badge */}
                          {item.reference_image_url ? (
                            <div className="relative h-32 bg-[#13191D] rounded-lg overflow-hidden border border-[#34414A]">
                              <img
                                src={item.reference_image_url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-80 group-hover:opacity-100"
                              />
                            </div>
                          ) : (
                            <div className="h-32 bg-[#13191D] rounded-lg border border-[#34414A] flex flex-col items-center justify-center text-[#8D9498] text-xs">
                              {item.category === 'SQL' ? (
                                <>
                                  <Database className="w-8 h-8 mb-1 text-[#D9C8A3]" />
                                  <span>Live SQL Query Sandbox</span>
                                </>
                              ) : item.category === 'JS' ? (
                                <>
                                  <Code className="w-8 h-8 mb-1 text-[#D9C8A3]" />
                                  <span>JS Solution Code Test</span>
                                </>
                              ) : (
                                <>
                                  <FileCode className="w-8 h-8 mb-1 text-[#D9C8A3]" />
                                  <span>Visual Mockup Reference</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="bg-[#232D33] px-5 py-3 border-t border-[#34414A] flex items-center justify-between text-xs text-[#C9C7C3]">
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center text-[#D9C8A3] font-semibold group-hover:translate-x-1 transition">
                            <span>Open Assessment</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Submission Code Inspection Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-[#1B2328] border border-[#34414A] rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-[#232D33] px-6 py-4 border-b border-[#34414A] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#F7F5F2]">
                  Submission Details — {selectedSubmission.challenge_title}
                </h3>
                <p className="text-xs text-[#C9C7C3]">
                  Candidate: <strong className="text-[#D9C8A3]">{selectedSubmission.candidate_email}</strong> • Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-[#C9C7C3] hover:text-[#F7F5F2] px-3 py-1 bg-[#1B2328] border border-[#34414A] rounded-lg text-xs"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* SQL submissions are answered entirely in the SQL editor — show that first. */}
              {selectedSubmission.category === 'SQL' && (
                <div>
                  <h4 className="text-xs font-semibold text-[#8D9498] uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <Database className="w-4 h-4 text-[#D9C8A3]" />
                    <span>Submitted SQL Query</span>
                  </h4>
                  <pre className="bg-[#13191D] border border-[#34414A] p-4 rounded-xl text-xs font-mono text-[#D9C8A3] overflow-x-auto whitespace-pre-wrap">
                    {selectedSubmission.sql_code?.trim() || '-- Candidate submitted an empty query'}
                  </pre>
                </div>
              )}

              {selectedSubmission.category !== 'SQL' && (
              <>
              <div>
                <h4 className="text-xs font-semibold text-[#8D9498] uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <Code className="w-4 h-4 text-[#D9C8A3]" />
                  <span>HTML Code</span>
                </h4>
                <pre className="bg-[#13191D] border border-[#34414A] p-4 rounded-xl text-xs font-mono text-[#4ADE80] overflow-x-auto">
                  {selectedSubmission.html_code || '<!-- No HTML code -->'}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#8D9498] uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <Code className="w-4 h-4 text-[#B89C5E]" />
                  <span>CSS Code</span>
                </h4>
                <pre className="bg-[#13191D] border border-[#34414A] p-4 rounded-xl text-xs font-mono text-[#D9C8A3] overflow-x-auto">
                  {selectedSubmission.css_code || '/* No CSS code */'}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#8D9498] uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <Code className="w-4 h-4 text-[#B8FF4F]" />
                  <span>JS Code</span>
                </h4>
                <pre className="bg-[#13191D] border border-[#34414A] p-4 rounded-xl text-xs font-mono text-[#B8FF4F] overflow-x-auto">
                  {selectedSubmission.js_code || '// No JS code'}
                </pre>
              </div>
              </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Challenge Creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1B2328] border border-[#34414A] rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#F7F5F2] mb-4">Create New Assessment Test</h3>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#C9C7C3] uppercase tracking-wider mb-2">
                  Test Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('HTML')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center space-x-1.5 ${
                      category === 'HTML'
                        ? 'bg-[#D9C8A3] text-[#13191D] border-[#D9C8A3]'
                        : 'bg-[#232D33] text-[#C9C7C3] border-[#34414A]'
                    }`}
                  >
                    <FileCode className="w-4 h-4 flex-shrink-0" />
                    <span>HTML / Visual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('JS')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center space-x-1.5 ${
                      category === 'JS'
                        ? 'bg-[#D9C8A3] text-[#13191D] border-[#D9C8A3]'
                        : 'bg-[#232D33] text-[#C9C7C3] border-[#34414A]'
                    }`}
                  >
                    <Code className="w-4 h-4 flex-shrink-0" />
                    <span>JS / Logic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('SQL')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition flex items-center justify-center space-x-1.5 ${
                      category === 'SQL'
                        ? 'bg-[#D9C8A3] text-[#13191D] border-[#D9C8A3]'
                        : 'bg-[#232D33] text-[#C9C7C3] border-[#34414A]'
                    }`}
                  >
                    <Database className="w-4 h-4 flex-shrink-0" />
                    <span>SQL / Query</span>
                  </button>
                </div>
              </div>

              {category === 'SQL' && (
                <div>
                  <label className="block text-xs font-semibold text-[#C9C7C3] uppercase tracking-wider mb-2">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Beginner', 'Beginner+', 'Intermediate', 'Advanced'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition ${
                          difficulty === level
                            ? 'bg-[#B89C5E]/25 text-[#D9C8A3] border-[#D9C8A3]/50'
                            : 'bg-[#232D33] text-[#8D9498] border-[#34414A] hover:text-[#C9C7C3]'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#C9C7C3] uppercase tracking-wider mb-2">
                  Upload Reference Image / Diagram (Optional)
                </label>
                <label className="border-2 border-dashed border-[#34414A] hover:border-[#D9C8A3] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#232D33] transition">
                  <Upload className="w-8 h-8 text-[#D9C8A3] mb-2" />
                  <span className="text-xs text-[#F7F5F2] font-medium">
                    {file ? file.name : 'Click to select screenshot/diagram (PNG, JPG, WEBP)'}
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C9C7C3] uppercase tracking-wider mb-1">
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === 'JS'
                      ? 'e.g. Array Flattening Function'
                      : category === 'SQL'
                      ? 'e.g. Top Earners per Department'
                      : 'e.g. Hero Section Card'
                  }
                  className="w-full bg-[#232D33] border border-[#34414A] focus:border-[#D9C8A3] rounded-lg px-3 py-2 text-[#F7F5F2] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C9C7C3] uppercase tracking-wider mb-1">
                  Question Description & Instructions
                </label>
                <textarea
                  rows={category === 'SQL' ? 6 : 3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    category === 'SQL'
                      ? 'Full question brief — Markdown supported (headings, tables, code blocks). Describe the schema, the task, the exact output columns and the ordering rules.'
                      : 'Detailed instructions for candidate on what method to complete...'
                  }
                  className="w-full bg-[#232D33] border border-[#34414A] focus:border-[#D9C8A3] rounded-lg px-3 py-2 text-[#F7F5F2] text-sm outline-none resize-none"
                />
                {category === 'SQL' && (
                  <p className="text-[10px] text-[#8D9498] mt-1">
                    Rendered as Markdown in the candidate's Question panel.
                  </p>
                )}
              </div>

              {category === 'SQL' && (
                <div>
                  <label className="block text-xs font-semibold text-[#D9C8A3] uppercase tracking-wider mb-1">
                    Sandbox Dataset — DDL &amp; Seed Rows
                  </label>
                  <textarea
                    rows={6}
                    value={sqlSchema}
                    onChange={(e) => setSqlSchema(e.target.value)}
                    className="w-full bg-[#13191D] border border-[#34414A] focus:border-[#D9C8A3] rounded-lg px-3 py-2 text-[#B8FF4F] font-mono text-xs outline-none resize-none"
                  />
                  <p className="text-[10px] text-[#8D9498] mt-1">
                    Runs in the candidate's browser to build the database they query. The SQL editor
                    itself stays empty — candidates write every line of the answer themselves.
                  </p>
                </div>
              )}

              {category === 'JS' && (
                <div>
                  <label className="block text-xs font-semibold text-[#D9C8A3] uppercase tracking-wider mb-1">
                    Starter JavaScript Code / Method Stub (Admin Pre-filled)
                  </label>
                  <textarea
                    rows={4}
                    value={starterJs}
                    onChange={(e) => setStarterJs(e.target.value)}
                    className="w-full bg-[#13191D] border border-[#34414A] focus:border-[#D9C8A3] rounded-lg px-3 py-2 text-[#B8FF4F] font-mono text-xs outline-none resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#34414A]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#C9C7C3] hover:text-[#F7F5F2] bg-[#232D33] border border-[#34414A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-lg text-sm text-[#13191D] bg-[#D9C8A3] hover:bg-[#B8FF4F] font-bold shadow-lg disabled:opacity-50"
                >
                  {isCreating ? 'Creating & Launching...' : 'Create & Open Builder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
