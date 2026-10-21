'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  User,
  Trash2,
  RefreshCw,
  Plus,
  X,
  BookOpen,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '@/services/api';

export interface DoubtsChatSectionProps {
  role: 'student' | 'admin' | 'superadmin';
  subjects?: any[];
  currentUser?: any;
  activeCourseId?: string | null;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function DoubtsChatSection({
  role,
  subjects = [],
  currentUser,
  activeCourseId = null,
  showToast = () => {},
}: DoubtsChatSectionProps) {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    answeredCount: 0,
    resolvedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedDoubt, setSelectedDoubt] = useState<any | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Answered' | 'Resolved'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply Form State
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'Answered' | 'Pending' | 'Resolved'>('Answered');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Student Post Doubt State
  const [showPostModal, setShowPostModal] = useState(false);
  const [newDoubtTitle, setNewDoubtTitle] = useState('');
  const [newDoubtDescription, setNewDoubtDescription] = useState('');
  const [newDoubtSubjectId, setNewDoubtSubjectId] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Delete Confirm
  const [deletingDoubt, setDeletingDoubt] = useState<any | null>(null);

  // Auto-scroll messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedDoubt) {
      scrollToBottom();
    }
  }, [selectedDoubt?.replies]);

  // Fetch Doubts from Backend API
  const fetchDoubts = async () => {
    setLoading(true);
    try {
      if (role === 'student') {
        const subId = subjectFilter !== 'all' ? subjectFilter : undefined;
        const res = await api.getStudentDoubts(subId);
        const list = res.doubts || [];
        setDoubts(list);
        setStats({
          totalCount: list.length,
          pendingCount: list.filter((d: any) => d.status === 'Pending').length,
          answeredCount: list.filter((d: any) => d.status === 'Answered').length,
          resolvedCount: list.filter((d: any) => d.status === 'Resolved').length,
        });
        if (list.length > 0 && !selectedDoubt) {
          setSelectedDoubt(list[0]);
        }
      } else {
        const params: any = {};
        if (subjectFilter !== 'all') params.subjectId = subjectFilter;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await api.getDoubts(role, params);
        const list = res.doubts || [];
        setDoubts(list);
        if (res.stats) {
          setStats(res.stats);
        } else {
          setStats({
            totalCount: list.length,
            pendingCount: list.filter((d: any) => d.status === 'Pending').length,
            answeredCount: list.filter((d: any) => d.status === 'Answered').length,
            resolvedCount: list.filter((d: any) => d.status === 'Resolved').length,
          });
        }

        // Keep selected doubt updated or default to first
        if (selectedDoubt) {
          const updated = list.find((d: any) => d._id === selectedDoubt._id);
          if (updated) setSelectedDoubt(updated);
        } else if (list.length > 0) {
          setSelectedDoubt(list[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load doubts:', err);
      showToast('Failed to load doubts thread.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [role, statusFilter, subjectFilter]);

  // Handle Post New Doubt (Student)
  const handlePostDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubtTitle.trim()) {
      showToast('Please enter your question.', 'error');
      return;
    }

    setPostSubmitting(true);
    try {
      const selectedSub = subjects.find((s: any) => s._id === newDoubtSubjectId);
      const res = await api.postStudentDoubt({
        title: newDoubtTitle.trim(),
        description: newDoubtDescription.trim(),
        subjectId: newDoubtSubjectId || undefined,
        subjectName: selectedSub?.title || 'General Curriculum',
      });

      showToast('Your doubt has been submitted to your mentors!', 'success');
      setNewDoubtTitle('');
      setNewDoubtDescription('');
      setShowPostModal(false);
      await fetchDoubts();
      if (res?.doubt) {
        setSelectedDoubt(res.doubt);
      }
    } catch (err: any) {
      console.error('Failed to submit doubt:', err);
      showToast(err.message || 'Failed to submit doubt.', 'error');
    } finally {
      setPostSubmitting(false);
    }
  };

  // Handle Send Reply (Admin, SuperAdmin or Student)
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedDoubt) return;

    setReplySubmitting(true);
    try {
      if (role === 'student') {
        const res = await api.replyStudentDoubt(selectedDoubt._id, replyText.trim());
        showToast('Reply posted!', 'success');
        if (res?.doubt) {
          setSelectedDoubt(res.doubt);
        }
      } else {
        const res = await api.replyDoubt(selectedDoubt._id, replyText.trim(), role, replyStatus);
        showToast('Reply dispatched to student!', 'success');
        if (res?.doubt) {
          setSelectedDoubt(res.doubt);
        }
      }
      setReplyText('');
      await fetchDoubts();
    } catch (err: any) {
      console.error('Failed to post reply:', err);
      showToast(err.message || 'Failed to send reply.', 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Quick Status Change (Admin & SuperAdmin)
  const handleUpdateStatus = async (doubtId: string, newStatus: string) => {
    try {
      const res = await api.updateDoubtStatus(doubtId, newStatus, role);
      showToast(`Doubt marked as ${newStatus}!`, 'success');
      if (selectedDoubt?._id === doubtId && res?.doubt) {
        setSelectedDoubt(res.doubt);
      }
      await fetchDoubts();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      showToast('Failed to update doubt status.', 'error');
    }
  };

  // Delete Doubt Thread
  const handleDeleteDoubt = async () => {
    if (!deletingDoubt) return;
    try {
      await api.deleteDoubt(deletingDoubt._id, role);
      showToast('Doubt thread deleted successfully!', 'success');
      if (selectedDoubt?._id === deletingDoubt._id) {
        setSelectedDoubt(null);
      }
      setDeletingDoubt(null);
      await fetchDoubts();
    } catch (err: any) {
      console.error('Failed to delete doubt:', err);
      showToast('Failed to delete doubt.', 'error');
    }
  };

  // Filtered Doubts for local client-side search query
  const filteredDoubts = useMemo(() => {
    if (!searchQuery.trim()) return doubts;
    const q = searchQuery.toLowerCase();
    return doubts.filter((d) => {
      const titleMatch = (d.title || '').toLowerCase().includes(q);
      const descMatch = (d.description || '').toLowerCase().includes(q);
      const studentMatch = (d.studentName || '').toLowerCase().includes(q);
      const emailMatch = (d.studentEmail || '').toLowerCase().includes(q);
      const subMatch = (d.subjectName || d.subjectId?.title || '').toLowerCase().includes(q);
      return titleMatch || descMatch || studentMatch || emailMatch || subMatch;
    });
  }, [doubts, searchQuery]);

  // Format Helper for timestamps
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Role Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#0a2540]">
              {role === 'student' ? 'Doubts Chat & Mentor Help' : 'Student Doubts Chat & Help Desk'}
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Q&A
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {role === 'student'
              ? 'Post technical doubts, syntax errors, and concept inquiries directly to trainers and get real-time clarification.'
              : 'Review and answer all questions asked by students across your curriculum and maintain student support.'}
          </p>
        </div>

        {/* Student Post Doubt Button or Admin Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDoubts}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#2563eb] hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh doubts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2563eb]' : ''}`} />
          </button>

          {role === 'student' && (
            <button
              onClick={() => {
                setNewDoubtSubjectId(subjects[0]?._id || '');
                setShowPostModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Ask a Doubt</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-blue-50/80 border-blue-200 ring-2 ring-[#2563eb]/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Doubts
            </span>
            <MessageSquare className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#0a2540]">{stats.totalCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('Pending')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-amber-50/80 border-amber-200 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              Pending Reply
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-700">{stats.pendingCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('Answered')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Answered'
              ? 'bg-blue-50/80 border-blue-200 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              Answered
            </span>
            <MessageCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-700">{stats.answeredCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('Resolved')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Resolved'
              ? 'bg-emerald-50/80 border-emerald-200 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Resolved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700">{stats.resolvedCount}</div>
        </div>
      </div>

      {/* 3. Main Chat & Doubts Panel (Two-Column Layout) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column: Doubts Feed List (4 cols) */}
        <div className="lg:col-span-5 border-r border-slate-200/80 flex flex-col bg-slate-50/40">
          {/* Search & Subject Filter Bar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200/80 bg-white space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, question, or keyword..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Subject Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Course:</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="flex-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Curriculum Courses</option>
                {subjects.map((s: any) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doubts Items Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[600px] lg:max-h-[680px]">
            {loading && doubts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading doubts feed...
              </div>
            ) : filteredDoubts.length > 0 ? (
              filteredDoubts.map((doubt) => {
                const isSelected = selectedDoubt?._id === doubt._id;
                const statusColor =
                  doubt.status === 'Resolved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : doubt.status === 'Answered'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <div
                    key={doubt._id}
                    onClick={() => setSelectedDoubt(doubt)}
                    className={`p-4 transition-all cursor-pointer text-left relative ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-l-[#2563eb]'
                        : 'hover:bg-white bg-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0a2540] to-[#2563eb] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {(doubt.studentName || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0a2540] truncate leading-tight">
                            {doubt.studentName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate leading-tight">
                            {doubt.subjectName || doubt.subjectId?.title || 'General'}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusColor}`}>
                        {doubt.status}
                      </span>
                    </div>

                    {/* Question Title */}
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-snug mb-1">
                      {doubt.title}
                    </h4>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(doubt.createdAt)}
                      </span>
                      <span className="flex items-center gap-1 text-[#2563eb] font-semibold">
                        <MessageSquare className="w-3 h-3" />
                        {(doubt.replies?.length || 0)} {doubt.replies?.length === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-slate-400">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Doubts Found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {role === 'student'
                    ? 'You have not asked any doubts yet. Click "Ask a Doubt" above.'
                    : 'No student questions match the selected filter.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Conversation Thread (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white h-[600px] lg:h-[680px]">
          {selectedDoubt ? (
            <>
              {/* Selected Doubt Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-white flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {selectedDoubt.subjectName || selectedDoubt.subjectId?.title || 'General Curriculum'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        selectedDoubt.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedDoubt.status === 'Answered'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {selectedDoubt.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0a2540] truncate max-w-md sm:max-w-lg">
                    {selectedDoubt.title}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Asked by <span className="font-semibold text-slate-700">{selectedDoubt.studentName}</span> ({selectedDoubt.studentEmail}) • {formatTime(selectedDoubt.createdAt)}
                  </p>
                </div>

                {/* Status Switcher & Delete Action for Admin */}
                {role !== 'student' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Quick status dropdown */}
                    <select
                      value={selectedDoubt.status}
                      onChange={(e) => handleUpdateStatus(selectedDoubt._id, e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer hover:bg-white"
                      title="Update status"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Answered">Answered</option>
                      <option value="Resolved">Resolved</option>
                    </select>

                    <button
                      onClick={() => setDeletingDoubt(selectedDoubt)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete thread"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Messages Timeline */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
                {/* 1. Student Original Question Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#2563eb]" />
                      <span>{selectedDoubt.studentName} (Student Inquiry)</span>
                    </span>
                    <span>{formatTime(selectedDoubt.createdAt)}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                    {selectedDoubt.title}
                  </p>

                  {selectedDoubt.description && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-mono whitespace-pre-wrap">
                      {selectedDoubt.description}
                    </div>
                  )}
                </div>

                {/* 2. Replies Conversation Timeline */}
                {selectedDoubt.replies && selectedDoubt.replies.length > 0 ? (
                  selectedDoubt.replies.map((reply: any, idx: number) => {
                    const isMentor = reply.userRole === 'admin' || reply.userRole === 'superadmin';

                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 ${isMentor ? 'justify-start' : 'justify-end'}`}
                      >
                        {isMentor && (
                          <div className="w-8 h-8 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] rounded-2xl p-4 shadow-xs text-xs sm:text-sm space-y-1.5 ${
                            isMentor
                              ? 'bg-white border border-blue-100 text-slate-800'
                              : 'bg-[#2563eb] text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] font-semibold">
                            <span className={isMentor ? 'text-[#2563eb] font-bold' : 'text-blue-100'}>
                              {reply.userName} {isMentor && '• Course Mentor'}
                            </span>
                            <span className={isMentor ? 'text-slate-400' : 'text-blue-200'}>
                              {formatTime(reply.createdAt)}
                            </span>
                          </div>

                          <p className="whitespace-pre-wrap leading-relaxed">
                            {reply.message}
                          </p>
                        </div>

                        {!isMentor && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center text-xs font-bold shrink-0">
                            {(reply.userName || 'S').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No replies yet. Type an answer below to respond to the student.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Reply Input Bar */}
              <form onSubmit={handleSendReply} className="p-3 sm:p-4 bg-white border-t border-slate-200/80">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          handleSendReply(e);
                        }
                      }}
                      placeholder={
                        role === 'student'
                          ? 'Type your follow-up reply or clarification...'
                          : 'Type your explanation, solution code, or feedback (Ctrl+Enter to send)...'
                      }
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-xs sm:text-sm resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    {/* Status update selector on reply for Admin/SuperAdmin */}
                    {role !== 'student' && (
                      <select
                        value={replyStatus}
                        onChange={(e: any) => setReplyStatus(e.target.value)}
                        className="text-xs font-semibold px-2.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
                        title="Status on reply"
                      >
                        <option value="Answered">Mark Answered</option>
                        <option value="Resolved">Mark Resolved</option>
                        <option value="Pending">Keep Pending</option>
                      </select>
                    )}

                    <button
                      type="submit"
                      disabled={!replyText.trim() || replySubmitting}
                      className="px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            /* No Doubt Selected State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#0a2540]">Select a Doubt Thread</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Choose a student question from the left panel to review questions, code snippets, and post mentor answers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Student Ask a Doubt Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0a2540] to-[#1e3a8a] text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg sm:text-xl">Ask a Question / Post Doubt</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Your question will be dispatched directly to your course instructors
                </p>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handlePostDoubt} className="p-5 sm:p-6 space-y-4">
              {/* Subject */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Subject / Topic
                </label>
                <select
                  value={newDoubtSubjectId}
                  onChange={(e) => setNewDoubtSubjectId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-xs sm:text-sm cursor-pointer"
                >
                  <option value="">General Course Curriculum</option>
                  {subjects.map((s: any) => (
                    <option key={s._id} value={s._id}>
                      {s.title} ({s.code || 'CRS'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title / Question */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Question / Error Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDoubtTitle}
                  onChange={(e) => setNewDoubtTitle(e.target.value)}
                  placeholder="e.g. Cannot read property 'map' of undefined in React state"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-xs sm:text-sm"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Code Snippet / Detailed Description
                </label>
                <textarea
                  rows={5}
                  value={newDoubtDescription}
                  onChange={(e) => setNewDoubtDescription(e.target.value)}
                  placeholder="Paste your code snippet or describe what step you are stuck on..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-xs sm:text-sm font-mono resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postSubmitting || !newDoubtTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Question</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal (Admin & SuperAdmin) */}
      {deletingDoubt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Delete Doubt Thread?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Are you sure you want to delete the thread for <span className="font-semibold text-slate-800">"{deletingDoubt.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingDoubt(null)}
                className="w-1/2 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDoubt}
                className="w-1/2 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
