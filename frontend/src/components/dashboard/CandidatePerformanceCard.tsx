import React, { useState, useEffect } from 'react';
import { getNextAffirmation } from '../../constants/affirmations';
import { Sparkles, Trophy, Flame, RefreshCw, CheckCircle2, Award } from 'lucide-react';
import { SubmissionDetail, Challenge } from '../../types';

interface CandidatePerformanceCardProps {
  submissions: SubmissionDetail[];
  challenges: Challenge[];
}

export const CandidatePerformanceCard: React.FC<CandidatePerformanceCardProps> = ({
  submissions,
  challenges,
}) => {
  const [affirmation, setAffirmation] = useState<string>('');

  const refreshSentence = () => {
    setAffirmation(getNextAffirmation());
  };

  useEffect(() => {
    refreshSentence();

    // Rotate affirmation every 10 minutes (600,000 ms)
    const interval = setInterval(() => {
      refreshSentence();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [submissions.length]);

  // Secret performance calculations
  const totalCompleted = submissions.filter((s) => s.status === 'COMPLETED').length;
  const totalAvailable = challenges.filter((c) => c.status === 'ACTIVE').length;
  const completionRate = totalAvailable > 0 ? Math.min(Math.round((totalCompleted / totalAvailable) * 100), 100) : 100;

  // Secret score tier titles (purely positive)
  const getPerformanceTier = () => {
    if (totalCompleted >= 5 || completionRate >= 80) return 'Frontend Engineering Master';
    if (totalCompleted >= 3 || completionRate >= 50) return 'Advanced Code Craftsman';
    if (totalCompleted >= 1) return 'Rising Star Developer';
    return 'Promising Tech Talent';
  };

  return (
    <div className="bg-gradient-to-r from-[#1B2328] via-[#232D33] to-[#1B2328] border border-[#D9C8A3]/40 rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
      {/* Glow highlight background blur */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D9C8A3]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#34414A] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#D9C8A3]/15 text-[#D9C8A3] rounded-xl border border-[#D9C8A3]/30 shadow-inner">
            <Trophy className="w-6 h-6 text-[#D9C8A3]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#D9C8A3] uppercase tracking-wider">Candidate Performance Profile</span>
              <span className="bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                Active Assessment Standing
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#F7F5F2]">{getPerformanceTier()}</h3>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center space-x-3">
          <div className="bg-[#13191D] border border-[#34414A] px-3.5 py-1.5 rounded-xl flex items-center space-x-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
            <span className="text-[#8D9498]">Completed:</span>
            <span className="font-bold text-[#F7F5F2]">{totalCompleted} / {challenges.length}</span>
          </div>

          <div className="bg-[#13191D] border border-[#34414A] px-3.5 py-1.5 rounded-xl flex items-center space-x-2 text-xs">
            <Flame className="w-4 h-4 text-[#FF9F43]" />
            <span className="text-[#8D9498]">Status:</span>
            <span className="font-bold text-[#4ADE80]">Top Standing</span>
          </div>
        </div>
      </div>

      {/* Dynamic Affirmation Banner */}
      <div className="bg-[#13191D]/80 border border-[#D9C8A3]/20 rounded-xl p-4 flex items-start justify-between space-x-3 shadow-inner">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-[#D9C8A3] flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9C8A3] block mb-1">
              Personalized Encouragement & Feedback
            </span>
            <p className="text-sm font-medium text-[#F7F5F2] leading-relaxed italic">
              "{affirmation}"
            </p>
          </div>
        </div>

        <button
          onClick={refreshSentence}
          title="Inspire me with another statement"
          className="p-1.5 text-[#8D9498] hover:text-[#D9C8A3] hover:bg-[#232D33] rounded-lg border border-transparent hover:border-[#34414A] transition flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
