'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  BookOpen,
  Users,
  GraduationCap,
  CreditCard,
  Video,
  Play,
  FileText,
  Code2,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  ShieldAlert,
  Plus,
} from 'lucide-react';
import { api } from '@/services/api';

// ============================================================================
// 1. DELETE CONFIRMATION MODAL
// ============================================================================
interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemTitle?: string;
  isDeleting?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  message,
  itemTitle,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
      >
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0a2540]">{title}</h3>
            <p className="text-xs text-gray-500">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mb-4">
          {message}
        </p>

        {itemTitle && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-5 text-xs">
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Item:</span>
            <span className="font-semibold text-[#0a2540] break-words">{itemTitle}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-none flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 2. CREATE SUBJECT MODAL (SUPER ADMIN)
// ============================================================================
export function CreateSubjectModal({
  isOpen,
  onClose,
  onSuccess,
  showToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSubject?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [data, setData] = useState({ title: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createSubject(data);
      showToast(`Subject "${data.title}" created successfully!`, 'success');
      setData({ title: '', code: '', description: '' });
      onSuccess(res?.subject || data);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to create subject.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a2540]">Create New Subject</h3>
              <p className="text-[11px] text-gray-500">Add course to the curriculum</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Subject Title *</label>
            <input
              type="text"
              required
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="e.g. Full Stack Web Development"
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Subject Code *</label>
            <input
              type="text"
              required
              value={data.code}
              onChange={(e) => setData({ ...data, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CS-FSW-101"
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs font-mono font-bold text-[#0a2540]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Description</label>
            <textarea
              rows={3}
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="Overview of curriculum syllabus, technologies taught, and outcomes."
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Create Subject</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 3. EDIT SUBJECT MODAL (SUPER ADMIN)
// ============================================================================
export function EditSubjectModal({
  subject,
  trainers,
  onClose,
  onSuccess,
  showToast,
}: {
  subject: any | null;
  trainers: any[];
  onClose: () => void;
  onSuccess: (updatedSubject?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [data, setData] = useState({ title: '', code: '', description: '', trainerId: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (subject) {
      setData({
        title: subject.title || '',
        code: subject.code || '',
        description: subject.description || '',
        trainerId: subject.trainerId?._id || subject.trainerId || '',
      });
    }
  }, [subject]);

  if (!subject) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.updateSubject(subject._id, data);
      showToast(`Subject "${data.title}" updated successfully!`, 'success');
      onSuccess(res?.subject || { ...subject, ...data });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update subject.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a2540]">Edit Subject</h3>
              <p className="text-[11px] text-gray-500">Update curriculum code, title, and trainer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Subject Title *</label>
            <input
              type="text"
              required
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Subject Code *</label>
            <input
              type="text"
              required
              value={data.code}
              onChange={(e) => setData({ ...data, code: e.target.value.toUpperCase() })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs font-mono font-bold text-[#0a2540]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Assigned Admin Trainer</label>
            <select
              value={data.trainerId}
              onChange={(e) => setData({ ...data, trainerId: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            >
              <option value="">No trainer assigned</option>
              {trainers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Description</label>
            <textarea
              rows={3}
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 4. EDIT TRAINER MODAL (SUPER ADMIN)
// ============================================================================
export function EditTrainerModal({
  trainer,
  subjects,
  onClose,
  onSuccess,
  showToast,
}: {
  trainer: any | null;
  subjects: any[];
  onClose: () => void;
  onSuccess: (updatedTrainer?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [data, setData] = useState({ name: '', email: '', password: '', subjectId: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (trainer) {
      setData({
        name: trainer.name || '',
        email: trainer.email || '',
        password: '',
        subjectId: trainer.subjectId?._id || trainer.subjectId || '',
      });
    }
  }, [trainer]);

  if (!trainer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        email: data.email,
        subjectId: data.subjectId,
      };
      if (data.password && data.password.trim()) {
        payload.password = data.password.trim();
      }
      const res = await api.updateTrainer(trainer._id, payload);
      showToast(`Admin ${data.name} updated successfully!`, 'success');
      const selectedSubject = subjects.find((s) => s._id === data.subjectId);
      const resolvedTrainer = res?.trainer
        ? { ...res.trainer, subjectId: selectedSubject || res.trainer.subjectId }
        : { ...trainer, ...payload, subjectId: selectedSubject || trainer.subjectId };
      onSuccess(resolvedTrainer);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update trainer.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a2540]">Edit Admin Trainer</h3>
              <p className="text-[11px] text-gray-500">Update credentials and curriculum assignment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Change Password (leave blank to keep current)</label>
            <input
              type="password"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              placeholder="Enter new password if changing..."
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Assigned Subject</label>
            <select
              value={data.subjectId}
              onChange={(e) => setData({ ...data, subjectId: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            >
              <option value="">No subject assigned</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.title} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 5. EDIT STUDENT MODAL (SUPER ADMIN & TRAINER)
// ============================================================================
export function EditStudentModal({
  student,
  subjects,
  role = 'superadmin',
  onClose,
  onSuccess,
  showToast,
}: {
  student: any | null;
  subjects: any[];
  role?: string;
  onClose: () => void;
  onSuccess: (updatedStudent?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
    subjectId: '',
    subjectIds: [] as string[],
    planType: 'monthly',
    amount: '499',
    startDate: '',
    endDate: '',
    paymentStatus: 'paid',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      let initialSubjectIds: string[] = [];
      if (Array.isArray(student.subjectIds) && student.subjectIds.length > 0) {
        initialSubjectIds = student.subjectIds.map((s: any) => String(s?._id || s));
      } else if (student.subjectId) {
        initialSubjectIds = [String(student.subjectId?._id || student.subjectId)];
      }

      setData({
        name: student.name || '',
        email: student.email || '',
        password: '',
        subjectId: (student.subjectId?._id || student.subjectId || initialSubjectIds[0] || '').toString(),
        subjectIds: initialSubjectIds,
        planType: student.planType || 'monthly',
        amount: String(student.amount || (student.planType === 'course_wise' ? 1499 : 499)),
        startDate: student.planType === 'course_wise' ? '' : (student.startDate ? new Date(student.startDate).toISOString().split('T')[0] : ''),
        endDate: student.planType === 'course_wise' ? '' : (student.endDate ? new Date(student.endDate).toISOString().split('T')[0] : ''),
        paymentStatus: student.paymentStatus || 'paid',
      });
    }
  }, [student]);

  if (!student) return null;

  const handleToggleCourse = (subId: string) => {
    const idStr = String(subId);
    setData((prev) => {
      const currentIds = (prev.subjectIds || []).map(String);
      const exists = currentIds.includes(idStr);
      const nextIds = exists ? currentIds.filter((id) => id !== idStr) : [...currentIds, idStr];
      return {
        ...prev,
        subjectIds: nextIds,
        subjectId: nextIds[0] || '',
      };
    });
  };

  const handleSelectAllCourses = () => {
    const allIds = subjects.map((s) => String(s._id));
    setData((prev) => ({
      ...prev,
      subjectIds: allIds,
      subjectId: allIds[0] || '',
    }));
  };

  const handleClearAllCourses = () => {
    setData((prev) => ({
      ...prev,
      subjectIds: [],
      subjectId: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'superadmin' && data.subjectIds.length === 0) {
      showToast('Please select at least one course for the student.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        email: data.email,
        paymentStatus: data.paymentStatus,
      };

      if (data.password && data.password.trim()) {
        payload.password = data.password.trim();
      }

      if (role === 'superadmin') {
        payload.subjectIds = data.subjectIds.map(String);
        payload.subjectId = data.subjectIds[0] ? String(data.subjectIds[0]) : null;
        payload.planType = data.planType;
        payload.amount = Number(data.amount);
        if (data.planType === 'course_wise') {
          payload.startDate = null;
          payload.endDate = null;
        }
      }

      const res = await api.updateStudent(student._id, payload, role);
      showToast(`Student ${data.name} updated successfully!`, 'success');
      const resolvedStudent = res?.student
        ? res.student
        : { ...student, ...payload };
      onSuccess(resolvedStudent);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update student.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a2540]">Edit Student Credentials</h3>
              <p className="text-[11px] text-gray-500">Update account details, multi-course allocation, and subscription</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Email (Login ID) *</label>
              <input
                type="email"
                required
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Change Password (leave blank to retain existing)</label>
            <input
              type="text"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              placeholder="Enter new password if updating..."
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs font-mono text-[#0a2540]"
            />
          </div>

          {role === 'superadmin' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#0a2540]">
                    Allocate Courses (Multi-Select) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCourses}
                      className="text-[11px] text-[#2563eb] hover:underline font-semibold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300 text-xs">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllCourses}
                      className="text-[11px] text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#2563eb] text-[10px] font-bold border border-blue-200">
                      {data.subjectIds.length} Selected
                    </span>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto p-2 bg-[#f8fafc] rounded-xl border border-gray-200 space-y-1.5">
                  {subjects.map((sub) => {
                    const isSelected = (data.subjectIds || []).map(String).includes(String(sub._id));
                    return (
                      <div
                        key={sub._id}
                        onClick={() => handleToggleCourse(sub._id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-300 text-[#0a2540]'
                            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div onClick
                            className="w-4 h-4 text-[#2563eb] rounded border-gray-300 cursor-pointer"
                          />
                          <span className="font-semibold">{sub.title}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-white text-[#2563eb] border border-blue-200 text-[10px] font-mono font-bold">
                          {sub.code}
                        </span>
                      </div>
                    );
                  })}
                  {subjects.length === 0 && (
                    <div className="py-4 text-center text-xs text-gray-400">No subjects created yet.</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] mb-1">Subscription Plan</label>
                  <select
                    value={data.planType}
                    onChange={(e) => setData({ ...data, planType: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                  >
                    <option value="monthly">Monthly Pack (30 Days)</option>
                    <option value="course_wise">Course Wise Full Pack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] mb-1">Fee Amount (₹)</label>
                  <input
                    type="number"
                    value={data.amount}
                    onChange={(e) => setData({ ...data, amount: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                  />
                </div>
              </div>

              {data.planType === 'course_wise' ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-xs text-emerald-800 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Permanent Access: No start date or end date required. Student will have lifetime portal access.</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2563eb] shrink-0" />
                  <span>Monthly Pack is automatically valid for 30 days from subscription.</span>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Payment Status</label>
            <select
              value={data.paymentStatus}
              onChange={(e) => setData({ ...data, paymentStatus: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            >
              <option value="paid">Paid & Active (Immediate Dashboard Access)</option>
              <option value="pending">Payment Pending (Must Pay First to Unlock Dashboard)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 6. EDIT TRANSACTION MODAL (SUPER ADMIN)
// ============================================================================
export function EditTransactionModal({
  transaction,
  onClose,
  onSuccess,
  showToast,
}: {
  transaction: any | null;
  onClose: () => void;
  onSuccess: (updatedTx?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [data, setData] = useState({
    amount: '499',
    planType: 'monthly',
    status: 'completed',
    paymentMethod: 'Credit Card / UPI',
    transactionId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setData({
        amount: String(transaction.amount || 499),
        planType: transaction.planType || 'monthly',
        status: transaction.status || 'completed',
        paymentMethod: transaction.paymentMethod || 'Credit Card / UPI',
        transactionId: transaction.transactionId || '',
      });
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.updateTransaction(transaction._id, {
        amount: Number(data.amount),
        planType: data.planType,
        status: data.status,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
      });
      showToast('Transaction updated successfully!', 'success');
      onSuccess(res?.transaction || { ...transaction, ...data, amount: Number(data.amount) });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update transaction.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a2540]">Edit Transaction</h3>
              <p className="text-[11px] text-gray-500">Student: {transaction.studentId?.name || 'Student'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Transaction ID *</label>
            <input
              type="text"
              required
              value={data.transactionId}
              onChange={(e) => setData({ ...data, transactionId: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs font-mono font-semibold text-[#2563eb]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                value={data.amount}
                onChange={(e) => setData({ ...data, amount: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Status</label>
              <select
                value={data.status}
                onChange={(e) => setData({ ...data, status: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Plan Enrolled</label>
            <select
              value={data.planType}
              onChange={(e) => setData({ ...data, planType: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            >
              <option value="monthly">Monthly Pack</option>
              <option value="course_wise">Course Wise Pack</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Payment Method</label>
            <input
              type="text"
              value={data.paymentMethod}
              onChange={(e) => setData({ ...data, paymentMethod: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 7. EDIT LIVE CLASS MODAL (ADMIN & SUPER ADMIN)
// ============================================================================
export function EditLiveClassModal({
  liveClass,
  role = 'admin',
  onClose,
  onSuccess,
  showToast,
}: {
  liveClass: any | null;
  role?: string;
  onClose: () => void;
  onSuccess: (updatedLive?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [data, setData] = useState({
    title: '',
    link: '',
    date: '',
    time: '',
    status: 'upcoming',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (liveClass) {
      setData({
        title: liveClass.title || '',
        link: liveClass.link || '',
        date: liveClass.date || '',
        time: liveClass.time || '',
        status: liveClass.status || 'upcoming',
        description: liveClass.description || '',
      });
    }
  }, [liveClass]);

  if (!liveClass) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.updateLiveClass(liveClass._id, data, role);
      showToast('Live class session updated successfully!', 'success');
      onSuccess(res?.liveClass || { ...liveClass, ...data });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update live class.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a2540]">Edit Live Class</h3>
              <p className="text-[11px] text-gray-500">Update meeting link, schedule time, and details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Session Title *</label>
            <input
              type="text"
              required
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Meeting Link (Google Meet / Zoom) *</label>
            <input
              type="url"
              required
              value={data.link}
              onChange={(e) => setData({ ...data, link: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Date *</label>
              <input
                type="date"
                required
                value={data.date}
                onChange={(e) => setData({ ...data, date: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Time *</label>
              <input
                type="text"
                required
                value={data.time}
                onChange={(e) => setData({ ...data, time: e.target.value })}
                placeholder="06:30 PM EST"
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Status</label>
            <select
              value={data.status}
              onChange={(e) => setData({ ...data, status: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            >
              <option value="upcoming">Upcoming</option>
              <option value="live">Live Now</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Description</label>
            <textarea
              rows={3}
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-none flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 8. EDIT RECORDED CLASS MODAL (ADMIN & SUPER ADMIN)
// ============================================================================
export function EditRecordedClassModal({
  recordedClass,
  role = 'admin',
  onClose,
  onSuccess,
  showToast,
}: {
  recordedClass: any | null;
  role?: string;
  onClose: () => void;
  onSuccess: (updatedRec?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [data, setData] = useState({
    title: '',
    videoUrl: '',
    notesUrl: '',
    duration: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (recordedClass) {
      setData({
        title: recordedClass.title || '',
        videoUrl: recordedClass.videoUrl || '',
        notesUrl: recordedClass.notesUrl || '',
        duration: recordedClass.duration || '45 mins',
        description: recordedClass.description || '',
      });
    }
  }, [recordedClass]);

  if (!recordedClass) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.updateRecordedClass(recordedClass._id, data, role);
      showToast('Recorded lecture updated successfully!', 'success');
      onSuccess(res?.recordedClass || { ...recordedClass, ...data });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update lecture.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-200">
              <Play className="w-5 h-5 fill-current text-[#2563eb]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a2540]">Edit Recorded Lecture</h3>
              <p className="text-[11px] text-gray-500">Update video URL, duration, and notes link</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Lecture Title *</label>
            <input
              type="text"
              required
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Video Stream / Embed URL *</label>
            <input
              type="url"
              required
              value={data.videoUrl}
              onChange={(e) => setData({ ...data, videoUrl: e.target.value })}
              placeholder="Google Drive link, YouTube, or direct MP4/Cloud URL..."
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Duration</label>
              <input
                type="text"
                value={data.duration}
                onChange={(e) => setData({ ...data, duration: e.target.value })}
                placeholder="45 mins"
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Digital Notes URL (PDF)</label>
              <input
                type="text"
                value={data.notesUrl}
                onChange={(e) => setData({ ...data, notesUrl: e.target.value })}
                placeholder="https://..."
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Description</label>
            <textarea
              rows={3}
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 9. EDIT ASSESSMENT MODAL (ADMIN & SUPER ADMIN)
// ============================================================================
export function EditAssessmentModal({
  assessment,
  role = 'admin',
  onClose,
  onSuccess,
  showToast,
}: {
  assessment: any | null;
  role?: string;
  onClose: () => void;
  onSuccess: (updatedAst?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [data, setData] = useState({
    title: '',
    dueDate: '',
    totalMarks: 100,
    durationMinutes: 45,
    accessPassword: 'DEXAR2026',
    isLockdown: true,
    maxViolations: 3,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (assessment) {
      setData({
        title: assessment.title || '',
        dueDate: assessment.dueDate || '',
        totalMarks: assessment.totalMarks || 100,
        durationMinutes: assessment.durationMinutes || 45,
        accessPassword: assessment.accessPassword || 'DEXAR2026',
        isLockdown: assessment.isLockdown !== false,
        maxViolations: assessment.maxViolations || 3,
      });
    }
  }, [assessment]);

  if (!assessment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.updateAssessment(assessment._id, data, role);
      showToast('Assessment updated successfully!', 'success');
      onSuccess(res?.assessment || { ...assessment, ...data });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update assessment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a2540]">Edit Assessment</h3>
              <p className="text-[11px] text-gray-500">{assessment.questions?.length || 0} Questions configured</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Assessment Title *</label>
            <input
              type="text"
              required
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Due Date</label>
              <input
                type="date"
                value={data.dueDate}
                onChange={(e) => setData({ ...data, dueDate: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Total Marks</label>
              <input
                type="number"
                value={data.totalMarks}
                onChange={(e) => setData({ ...data, totalMarks: Number(e.target.value) })}
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={data.durationMinutes}
                onChange={(e) => setData({ ...data, durationMinutes: Number(e.target.value) })}
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Access Password</label>
              <input
                type="text"
                value={data.accessPassword}
                onChange={(e) => setData({ ...data, accessPassword: e.target.value })}
                placeholder="DEXAR2026"
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs font-mono font-bold text-[#0a2540]"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Lockdown Anti-Cheat Enforced</span>
            </div>
            <input
              type="checkbox"
              checked={data.isLockdown}
              onChange={(e) => setData({ ...data, isLockdown: e.target.checked })}
              className="w-4 h-4 accent-[#2563eb]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 10. EDIT CODING EXAM MODAL (ADMIN & SUPER ADMIN)
// ============================================================================
export function EditCodingExamModal({
  exam,
  role = 'admin',
  onClose,
  onSuccess,
  showToast,
}: {
  exam: any | null;
  role?: string;
  onClose: () => void;
  onSuccess: (updatedExam?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [data, setData] = useState({
    title: '',
    dueDate: '',
    totalPoints: 100,
    durationMinutes: 60,
    accessPassword: 'DEXAR2026',
    isLockdown: true,
    maxViolations: 3,
  });

  const [questions, setQuestions] = useState<
    Array<{
      title: string;
      problemStatement: string;
      starterCode: string;
      points: number;
      testCases: Array<{ input: string; output: string; explanation?: string }>;
    }>
  >([]);
  const [activeTab, setActiveTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (exam) {
      const initialQuestions =
        Array.isArray(exam.questions) && exam.questions.length > 0
          ? exam.questions.map((q: any, idx: number) => ({
              title: q.title || `Problem ${idx + 1}`,
              problemStatement: q.problemStatement || '',
              starterCode: q.starterCode || '// Solution in JavaScript\nfunction solution(input) {\n  return input;\n}',
              points: Number(q.points) || 50,
              testCases:
                Array.isArray(q.testCases) && q.testCases.length > 0
                  ? q.testCases.map((tc: any) => ({
                      input: tc.input || '',
                      output: tc.output || '',
                      explanation: tc.explanation || '',
                    }))
                  : [{ input: '', output: '', explanation: '' }],
            }))
          : [
              {
                title: exam.title || 'Problem 1',
                problemStatement: exam.problemStatement || '',
                starterCode: exam.starterCode || '// Solution in JavaScript\nfunction solution(input) {\n  return input;\n}',
                points: exam.totalPoints || 100,
                testCases:
                  Array.isArray(exam.testCases) && exam.testCases.length > 0
                    ? exam.testCases.map((tc: any) => ({
                        input: tc.input || '',
                        output: tc.output || '',
                        explanation: tc.explanation || '',
                      }))
                    : [{ input: '', output: '', explanation: '' }],
              },
            ];

      setQuestions(initialQuestions);
      setActiveTab(0);
      const calculatedPoints = initialQuestions.reduce((s: number, q: any) => s + (Number(q.points) || 0), 0);
      setData({
        title: exam.title || '',
        dueDate: exam.dueDate || '',
        totalPoints: exam.totalPoints || calculatedPoints || 100,
        durationMinutes: exam.durationMinutes || 60,
        accessPassword: exam.accessPassword || 'DEXAR2026',
        isLockdown: exam.isLockdown !== false,
        maxViolations: exam.maxViolations || 3,
      });
    }
  }, [exam]);

  if (!exam) return null;

  const currentQ = questions[activeTab] || questions[0] || {
    title: 'Problem 1',
    problemStatement: '',
    starterCode: '',
    points: 50,
    testCases: [{ input: '', output: '', explanation: '' }],
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => {
      const nextNum = prev.length + 1;
      const newQ = {
        title: `Problem ${nextNum}`,
        problemStatement: '',
        starterCode: 'function solution(input) {\n  // Write your logic here\n  return input;\n}',
        points: 50,
        testCases: [{ input: '', output: '', explanation: '' }],
      };
      const updated = [...prev, newQ];
      const sumPts = updated.reduce((s, q) => s + (Number(q.points) || 0), 0);
      setData((d) => ({ ...d, totalPoints: sumPts }));
      return updated;
    });
    setActiveTab(questions.length);
  };

  const handleRemoveQuestion = (idxToRemove: number) => {
    if (questions.length <= 1) {
      showToast('Exam must contain at least one problem.', 'error');
      return;
    }
    setQuestions((prev) => {
      const updated = prev.filter((_, idx) => idx !== idxToRemove);
      const sumPts = updated.reduce((s, q) => s + (Number(q.points) || 0), 0);
      setData((d) => ({ ...d, totalPoints: sumPts }));
      return updated;
    });
    if (activeTab >= idxToRemove && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const handleUpdateQuestion = (field: string, val: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[activeTab] = { ...updated[activeTab], [field]: val };
      if (field === 'points') {
        const sumPts = updated.reduce((s, q) => s + (Number(q.points) || 0), 0);
        setData((d) => ({ ...d, totalPoints: sumPts }));
      }
      return updated;
    });
  };

  const handleAddTestCase = () => {
    setQuestions((prev) => {
      const updated = [...prev];
      const cur = updated[activeTab];
      const updatedTcs = [...(cur.testCases || []), { input: '', output: '', explanation: '' }];
      updated[activeTab] = { ...cur, testCases: updatedTcs };
      return updated;
    });
  };

  const handleRemoveTestCase = (tcIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const cur = updated[activeTab];
      if (cur.testCases && cur.testCases.length <= 1) {
        showToast('At least one test case is required per problem.', 'error');
        return prev;
      }
      const updatedTcs = cur.testCases.filter((_, idx) => idx !== tcIdx);
      updated[activeTab] = { ...cur, testCases: updatedTcs };
      return updated;
    });
  };

  const handleUpdateTestCase = (tcIdx: number, field: string, val: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const cur = updated[activeTab];
      const updatedTcs = [...(cur.testCases || [])];
      updatedTcs[tcIdx] = { ...updatedTcs[tcIdx], [field]: val };
      updated[activeTab] = { ...cur, testCases: updatedTcs };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) {
      showToast('Please add at least one problem.', 'error');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].title?.trim()) {
        showToast(`Problem ${i + 1} is missing a title.`, 'error');
        return;
      }
      if (!questions[i].problemStatement?.trim()) {
        showToast(`Problem ${i + 1} is missing a problem statement.`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const sumPts = questions.reduce((s, q) => s + (Number(q.points) || 0), 0);
      const payload = {
        ...data,
        totalPoints: sumPts > 0 ? sumPts : data.totalPoints,
        questions,
        problemStatement: questions[0]?.problemStatement,
        starterCode: questions[0]?.starterCode,
        testCases: questions[0]?.testCases,
      };

      const res = await api.updateCodingExam(exam._id, payload, role);
      showToast('Coding challenge updated successfully with multiple problems!', 'success');
      onSuccess(res?.codingExam || { ...exam, ...payload });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update coding challenge.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a2540]">Edit Coding Challenge</h3>
              <p className="text-[11px] text-gray-500">
                Manage multiple coding problems, starter codes, and automated test cases
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General Assessment Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Challenge / Exam Title *</label>
              <input
                type="text"
                required
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                placeholder="e.g. Data Structures & Algorithms Midterm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Due Date</label>
              <input
                type="date"
                value={data.dueDate}
                onChange={(e) => setData({ ...data, dueDate: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                value={data.durationMinutes}
                onChange={(e) => setData({ ...data, durationMinutes: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">
                Total Exam Points (Auto calculated)
              </label>
              <input
                type="number"
                value={data.totalPoints}
                onChange={(e) => setData({ ...data, totalPoints: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] font-bold text-[#2563eb]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Access Password</label>
              <input
                type="text"
                value={data.accessPassword}
                onChange={(e) => setData({ ...data, accessPassword: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs font-mono font-bold text-[#0a2540]"
              />
            </div>
          </div>

          {/* Multiple Coding Questions Manager Header */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0a2540]">
                  Coding Problems ({questions.length})
                </span>
                <span className="text-[11px] text-gray-500">
                  Switch tabs to configure each question
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Question</span>
              </button>
            </div>

            {/* Question Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors border ${
                    activeTab === idx
                      ? 'bg-[#0a2540] text-white border-[#0a2540]'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className="cursor-pointer max-w-[140px] truncate"
                  >
                    Q{idx + 1}: {q.title || `Problem ${idx + 1}`}
                  </button>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      activeTab === idx ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {q.points || 50} pts
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveQuestion(idx);
                      }}
                      className={`p-0.5 rounded hover:bg-red-500 hover:text-white transition-colors cursor-pointer ${
                        activeTab === idx ? 'text-white/70' : 'text-gray-400'
                      }`}
                      title="Delete this question"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Active Question Editor Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-xs font-bold text-slate-800">
                  Editing Question #{activeTab + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(activeTab)}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Question</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-[#0a2540] mb-1">
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={currentQ.title}
                    onChange={(e) => handleUpdateQuestion('title', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs text-[#0a2540]"
                    placeholder="e.g. Problem 1: Two Sum / String Reversal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0a2540] mb-1">
                    Points / Marks *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={currentQ.points || 50}
                    onChange={(e) => handleUpdateQuestion('points', Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs text-[#0a2540] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0a2540] mb-1">
                  Problem Statement & Instructions *
                </label>
                <textarea
                  rows={3}
                  required
                  value={currentQ.problemStatement}
                  onChange={(e) => handleUpdateQuestion('problemStatement', e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-gray-200 text-xs text-[#0a2540]"
                  placeholder="Describe the problem, input format, constraints, and return value..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0a2540] mb-1">
                  Starter Code Template
                </label>
                <textarea
                  rows={4}
                  value={currentQ.starterCode}
                  onChange={(e) => handleUpdateQuestion('starterCode', e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs border border-gray-700"
                  placeholder="function solution(input) {\n  // Write logic here\n  return input;\n}"
                />
              </div>

              {/* Test Cases for Active Question */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Test Cases ({currentQ.testCases?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTestCase}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Test Case</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {currentQ.testCases?.map((tc, tcIdx) => (
                    <div
                      key={tcIdx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold text-[11px]">
                            Test Case #{tcIdx + 1}
                          </span>
                          {tc.input && tc.input.split('\n').filter(Boolean).length > 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                              {tc.input.split('\n').filter(Boolean).length} Inputs (Multi-line)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = tc.input || '';
                              handleUpdateTestCase(tcIdx, 'input', cur ? cur + '\n' : '');
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                            title="Add another input line for 2+ inputs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Input Line</span>
                          </button>
                          {(currentQ.testCases?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTestCase(tcIdx)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove test case"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Multi-line Inputs Textarea */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Inputs (Multi-line / 2+ Inputs)
                            </label>
                            <span className="text-[10px] text-gray-500">1 line per parameter</span>
                          </div>
                          <textarea
                            rows={3}
                            required
                            value={tc.input}
                            onChange={(e) => handleUpdateTestCase(tcIdx, 'input', e.target.value)}
                            placeholder={"Line 1: Input 1 (e.g. [2, 7, 11, 15])\nLine 2: Input 2 (e.g. 9)"}
                            className="w-full p-2.5 rounded-lg bg-white border border-gray-200 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-y leading-relaxed text-[#0a2540]"
                          />
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Tip: For two inputs (like nums & target), give each input on its own line.
                          </p>
                        </div>

                        {/* Expected Output Textarea */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Expected Output
                            </label>
                            <span className="text-[10px] text-gray-500">Return value / stdout</span>
                          </div>
                          <textarea
                            rows={3}
                            required
                            value={tc.output}
                            onChange={(e) => handleUpdateTestCase(tcIdx, 'output', e.target.value)}
                            placeholder={"e.g. [0, 1] or true"}
                            className="w-full p-2.5 rounded-lg bg-white border border-gray-200 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-y leading-relaxed text-[#0a2540]"
                          />
                        </div>
                      </div>

                      {/* Optional Explanation */}
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Explanation (Optional)
                        </label>
                        <input
                          type="text"
                          value={tc.explanation || ''}
                          onChange={(e) => handleUpdateTestCase(tcIdx, 'explanation', e.target.value)}
                          placeholder="e.g. Because nums[0] + nums[1] == 9, we return [0, 1]"
                          className="w-full p-2 rounded-lg bg-white border border-gray-200 text-xs text-[#0a2540]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Lockdown Anti-Cheat Enforced</span>
            </div>
            <input
              type="checkbox"
              checked={data.isLockdown}
              onChange={(e) => setData({ ...data, isLockdown: e.target.checked })}
              className="w-4 h-4 accent-[#2563eb]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#0a2540] hover:bg-black text-white text-xs font-semibold shadow-none flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 11. EDIT SCORE / MARKS MODAL (SUPER ADMIN & TRAINER)
// ============================================================================
export function EditScoreModal({
  submissionItem,
  role = 'admin',
  onClose,
  onSuccess,
  showToast,
}: {
  submissionItem: { type: 'mcq' | 'coding'; data: any } | null;
  role?: string;
  onClose: () => void;
  onSuccess: (updatedScore?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [score, setScore] = useState<number>(0);
  const [passedTests, setPassedTests] = useState<number>(0);
  const [status, setStatus] = useState<string>('completed');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (submissionItem) {
      setScore(submissionItem.data.score || 0);
      setPassedTests(submissionItem.data.passedTests || 0);
      setStatus(submissionItem.data.status || 'completed');
    }
  }, [submissionItem]);

  if (!submissionItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (submissionItem.type === 'mcq') {
        await api.updateAssessmentSubmission(submissionItem.data._id, { score, status }, role);
      } else {
        await api.updateCodingSubmission(submissionItem.data._id, { score, passedTests, status }, role);
      }
      showToast('Student score and marks updated successfully!', 'success');
      onSuccess({
        _id: submissionItem.data._id,
        score,
        passedTests,
        status,
        type: submissionItem.type,
      });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update score.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const studentName = submissionItem.data.studentId?.name || 'Student';
  const examTitle = submissionItem.data.assessmentId?.title || submissionItem.data.examId?.title || 'Exam';

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0a2540]">Update Student Score</h3>
              <p className="text-[11px] text-gray-500 truncate max-w-[200px]">{studentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Assessment:</span>
            <span className="font-semibold text-[#0a2540]">{examTitle}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Score / Points Awarded *</label>
            <input
              type="number"
              required
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-sm font-bold text-[#2563eb]"
            />
          </div>

          {submissionItem.type === 'coding' && (
            <div>
              <label className="block text-xs font-semibold text-[#0a2540] mb-1">Passed Test Cases</label>
              <input
                type="number"
                value={passedTests}
                onChange={(e) => setPassedTests(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">Submission Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
            >
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed & Graded</option>
              <option value="pending">Pending Review</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Marks</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
