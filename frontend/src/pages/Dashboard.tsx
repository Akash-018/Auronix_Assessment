import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Challenge, SubmissionDetail } from '../types';
import { useAuthStore } from '../stores/authStore';
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
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDetail[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'submissions'>('tests');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form state for challenge creation
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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

        {/* Stats Row for Admin */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1B2328] border border-[#34414A] rounded-xl p-5 flex items-center space-x-4">
              <div className="p-3 bg-[#D9C8A3]/10 text-[#D9C8A3] rounded-lg">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-[#8D9498] uppercase font-semibold">Total Tests</div>
                <div className="text-2xl font-bold text-[#F7F5F2]">{challenges.length}</div>
              </div>
            </div>
            <div className="bg-[#1B2328] border border-[#34414A] rounded-xl p-5 flex items-center space-x-4">
              <div className="p-3 bg-[#4ADE80]/10 text-[#4ADE80] rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-[#8D9498] uppercase font-semibold">Published (Active)</div>
                <div className="text-2xl font-bold text-[#F7F5F2]">{activeCount}</div>
              </div>
            </div>
            <div className="bg-[#1B2328] border border-[#34414A] rounded-xl p-5 flex items-center space-x-4">
              <div className="p-3 bg-[#B89C5E]/10 text-[#B89C5E] rounded-lg">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-[#8D9498] uppercase font-semibold">Candidate Submissions</div>
                <div className="text-2xl font-bold text-[#F7F5F2]">{submissions.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation for Admin */}
        {isAdmin && (
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
              <span>Managed Tests ({challenges.length})</span>
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
              <span>Candidate Submissions ({submissions.length})</span>
            </button>
          </div>
        )}

        {/* Section View */}
        {isAdmin && activeTab === 'submissions' ? (
          <div>
            <h3 className="text-lg font-semibold text-[#F7F5F2] mb-4">Candidate Test Results & Code</h3>
            {submissions.length === 0 ? (
              <div className="bg-[#1B2328] border border-dashed border-[#34414A] rounded-2xl p-12 text-center text-[#8D9498] text-sm">
                <ClipboardList className="w-12 h-12 mx-auto text-[#8D9498] mb-3" />
                No candidate submissions received yet.
              </div>
            ) : (
              <div className="bg-[#1B2328] border border-[#34414A] rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-[#C9C7C3]">
                  <thead className="bg-[#232D33] text-xs uppercase text-[#8D9498] border-b border-[#34414A]">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold">Candidate Email</th>
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
                            <span>View Submitted Code</span>
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
          /* Challenge Cards Grid */
          <div>
            <h3 className="text-lg font-semibold text-[#F7F5F2] mb-4">
              {isAdmin ? 'All Managed Tests' : 'Published Assessments'}
            </h3>

          {isLoading ? (
            <div className="text-center py-12 text-[#8D9498] text-sm">Loading assessments...</div>
          ) : challenges.length === 0 ? (
            <div className="bg-[#1B2328] border border-dashed border-[#34414A] rounded-2xl p-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-[#8D9498] mb-3" />
              <h4 className="text-lg font-medium text-[#F7F5F2] mb-1">
                {isAdmin ? 'No tests created yet' : 'No tests currently available'}
              </h4>
              <p className="text-sm text-[#C9C7C3] mb-4">
                {isAdmin
                  ? 'Get started by creating your first assessment test.'
                  : 'Please check back later once an admin publishes a test.'}
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-[#D9C8A3] hover:bg-[#B8FF4F] text-[#13191D] font-bold px-4 py-2 rounded-lg text-sm transition"
                >
                  Create Test
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((item) => (
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

                    <h4 className="text-lg font-bold text-[#F7F5F2] group-hover:text-[#D9C8A3] transition mb-1 line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-[#C9C7C3] line-clamp-2 mb-4">
                      {item.description || 'No description provided.'}
                    </p>

                    {item.reference_image_url ? (
                      <div className="bg-[#13191D] border border-[#34414A] rounded-lg p-2 flex items-center space-x-3 text-xs text-[#C9C7C3]">
                        <ImageIcon className="w-4 h-4 text-[#D9C8A3] flex-shrink-0" />
                        <span className="truncate">
                          {item.reference_width}x{item.reference_height} px (Ratio: {item.reference_aspect_ratio})
                        </span>
                      </div>
                    ) : (
                      <div className="bg-[#13191D] border border-dashed border-[#34414A] rounded-lg p-2 text-center text-xs text-[#8D9498]">
                        No reference image uploaded
                      </div>
                    )}
                  </div>

                  <div className="bg-[#232D33] px-5 py-3 border-t border-[#34414A] flex items-center justify-between text-xs text-[#C9C7C3] group-hover:bg-[#D9C8A3]/10 transition">
                    <div className="flex items-center space-x-2">
                      <span>Open Workspace</span>
                      {submissions.some(
                        (sub) =>
                          (sub.challenge_id && sub.challenge_id.trim() === item.id.trim()) ||
                          (sub.challenge_title && sub.challenge_title.trim().toLowerCase() === item.title.trim().toLowerCase())
                      ) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30">
                          Submitted ✓
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#D9C8A3] group-hover:translate-x-1 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
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
            </div>
          </div>
        </div>
      )}

      {/* Modal for Challenge Creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1B2328] border border-[#34414A] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#F7F5F2] mb-4">Create New Challenge</h3>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#C9C7C3] uppercase tracking-wider mb-2">
                  Upload Reference Image
                </label>
                <label className="border-2 border-dashed border-[#34414A] hover:border-[#D9C8A3] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#232D33] transition">
                  <Upload className="w-8 h-8 text-[#D9C8A3] mb-2" />
                  <span className="text-xs text-[#F7F5F2] font-medium">
                    {file ? file.name : 'Click to select screenshot (PNG, JPG, WEBP)'}
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
                  Challenge Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hero Section Card"
                  className="w-full bg-[#232D33] border border-[#34414A] focus:border-[#D9C8A3] rounded-lg px-3 py-2 text-[#F7F5F2] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C9C7C3] uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions for rebuilding this reference UI..."
                  className="w-full bg-[#232D33] border border-[#34414A] focus:border-[#D9C8A3] rounded-lg px-3 py-2 text-[#F7F5F2] text-sm outline-none resize-none"
                />
              </div>

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
