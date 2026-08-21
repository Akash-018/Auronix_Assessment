import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Challenge } from '../types';
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
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
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

  useEffect(() => {
    fetchChallenges();
  }, []);

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
    <div className="min-h-screen bg-[#090d16] text-gray-200 flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#111827] border-b border-[#273549] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600/20 text-blue-500 rounded-lg border border-blue-500/30">
            <Code2 className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white">
            {isAdmin ? 'PixelTest Admin' : 'PixelTest Candidate Portal'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-400 bg-[#161e2e] px-3 py-1.5 rounded-full border border-[#273549]">
            {user?.email} ({user?.role})
          </span>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-[#161e2e] border border-[#273549] hover:border-red-500/50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">
        {/* Banner Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-blue-900/20 via-[#111827] to-[#111827] border border-[#273549] p-6 rounded-2xl shadow-xl">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {isAdmin ? 'Frontend Challenges & Tests' : 'Available Tests & Assessments'}
            </h2>
            <p className="text-sm text-gray-400">
              {isAdmin
                ? 'Create, edit, publish, unpublish, and manage coding tests and candidate submissions.'
                : 'Select an assessment below to inspect requirements, code live solutions, and submit your attempt.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 sm:mt-0 flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 text-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Create Test</span>
            </button>
          )}
        </div>

        {/* Stats Row for Admin */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111827] border border-[#273549] rounded-xl p-5 flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Total Tests</div>
                <div className="text-2xl font-bold text-white">{challenges.length}</div>
              </div>
            </div>
            <div className="bg-[#111827] border border-[#273549] rounded-xl p-5 flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Published (Active)</div>
                <div className="text-2xl font-bold text-white">{activeCount}</div>
              </div>
            </div>
            <div className="bg-[#111827] border border-[#273549] rounded-xl p-5 flex items-center space-x-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase font-semibold">Drafts</div>
                <div className="text-2xl font-bold text-white">{draftCount}</div>
              </div>
            </div>
          </div>
        )}

        {/* Challenge Cards Grid */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            {isAdmin ? 'All Managed Tests' : 'Published Assessments'}
          </h3>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading assessments...</div>
          ) : challenges.length === 0 ? (
            <div className="bg-[#111827] border border-dashed border-[#273549] rounded-2xl p-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <h4 className="text-lg font-medium text-white mb-1">
                {isAdmin ? 'No tests created yet' : 'No tests currently available'}
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                {isAdmin
                  ? 'Get started by creating your first assessment test.'
                  : 'Please check back later once an admin publishes a test.'}
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
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
                  className="group bg-[#111827] border border-[#273549] hover:border-blue-500/50 rounded-xl overflow-hidden shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span
                        onClick={(e) => isAdmin && handleTogglePublish(e, item)}
                        title={isAdmin ? "Click to toggle Publish / Unpublish" : undefined}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {item.status === 'ACTIVE' ? 'Published' : 'Draft'}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteChallenge(e, item.id)}
                          title="Delete test"
                          className="text-gray-500 hover:text-red-400 p-1 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition mb-1 line-clamp-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-gray-400 line-clamp-2 mb-4">
                      {item.description || 'No description provided.'}
                    </p>

                    {item.reference_image_url ? (
                      <div className="bg-[#090d16] border border-[#273549] rounded-lg p-2 flex items-center space-x-3 text-xs text-gray-400">
                        <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="truncate">
                          {item.reference_width}x{item.reference_height} px (Ratio: {item.reference_aspect_ratio})
                        </span>
                      </div>
                    ) : (
                      <div className="bg-[#090d16] border border-dashed border-[#273549] rounded-lg p-2 text-center text-xs text-gray-500">
                        No reference image uploaded
                      </div>
                    )}
                  </div>

                  <div className="bg-[#161e2e] px-5 py-3 border-t border-[#273549] flex items-center justify-between text-xs text-gray-400 group-hover:bg-blue-600/10 transition">
                    <span>Open Workspace</span>
                    <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal for Challenge Creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#273549] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Create New Challenge</h3>

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Upload Reference Image
                </label>
                <label className="border-2 border-dashed border-[#273549] hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#161e2e] transition">
                  <Upload className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-xs text-gray-300 font-medium">
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
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Challenge Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hero Section Card"
                  className="w-full bg-[#161e2e] border border-[#273549] focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions for rebuilding this reference UI..."
                  className="w-full bg-[#161e2e] border border-[#273549] focus:border-blue-500 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#273549]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white bg-[#161e2e] border border-[#273549]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-500 font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50"
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
