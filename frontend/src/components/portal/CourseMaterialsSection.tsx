'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Trash2,
  Pencil,
  Eye,
  CheckCircle2,
  Loader2,
  X,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '@/services/api';
import { DocumentViewerModal } from './DocumentViewerModal';
import { getDriveDownloadUrl, getFormatBadge, extractDriveFileId } from '@/utils/googleDrive';

export interface CourseMaterialsSectionProps {
  role: 'student' | 'admin' | 'superadmin';
  subjects?: any[];
  activeCourseId?: string | null;
  currentUser?: any;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function CourseMaterialsSection({
  role,
  subjects = [],
  activeCourseId = null,
  currentUser,
  showToast = () => {},
}: CourseMaterialsSectionProps) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeCourseId || 'all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<any | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<any | null>(null);

  // Form State for Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDriveUrl, setFormDriveUrl] = useState('');
  const [formFileFormat, setFormFileFormat] = useState<'pdf' | 'doc' | 'docx' | 'ppt' | 'other'>('pdf');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Sync selectedSubjectId with activeCourseId if changed from sidebar
  useEffect(() => {
    if (role === 'student' && activeCourseId) {
      setSelectedSubjectId(activeCourseId);
    }
  }, [activeCourseId, role]);

  // Fetch materials
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      if (role === 'student') {
        const subId = selectedSubjectId !== 'all' ? selectedSubjectId : undefined;
        const res = await api.getStudentCourseMaterials(subId);
        setMaterials(res.materials || []);
      } else {
        const subId = selectedSubjectId !== 'all' ? selectedSubjectId : undefined;
        const res = await api.getCourseMaterials(role, subId);
        setMaterials(res.materials || []);
      }
    } catch (err: any) {
      console.error('Failed to load course materials:', err);
      showToast('Failed to load course materials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [role, selectedSubjectId]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormTitle('');
    setFormDriveUrl('');
    setFormFileFormat('pdf');
    setFormSubjectId(subjects[0]?._id || '');
    setFormDescription('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (mat: any) => {
    setEditingMaterial(mat);
    setFormTitle(mat.title || '');
    setFormDriveUrl(mat.driveUrl || '');
    setFormFileFormat(mat.fileFormat || 'pdf');
    setFormSubjectId(mat.subjectId?._id || mat.subjectId || '');
    setFormDescription(mat.description || '');
    setShowAddModal(true);
  };

  // Submit Add / Edit
  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please enter a material title.', 'error');
      return;
    }
    if (!formDriveUrl.trim()) {
      showToast('Please enter the Google Drive link.', 'error');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        driveUrl: formDriveUrl.trim(),
        fileFormat: formFileFormat,
        subjectId: formSubjectId && formSubjectId !== 'all' ? formSubjectId : null,
        description: formDescription.trim(),
      };

      if (editingMaterial) {
        await api.updateCourseMaterial(editingMaterial._id, payload, role);
        showToast('Course material updated successfully!', 'success');
      } else {
        await api.addCourseMaterial(payload, role);
        showToast('Course material added successfully!', 'success');
      }

      setShowAddModal(false);
      setEditingMaterial(null);
      await fetchMaterials();
    } catch (err: any) {
      console.error('Failed to save material:', err);
      showToast(err.message || 'Failed to save course material.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Material
  const handleDeleteMaterial = async () => {
    if (!deletingMaterial) return;
    try {
      await api.deleteCourseMaterial(deletingMaterial._id, role);
      showToast('Course material deleted successfully!', 'success');
      setDeletingMaterial(null);
      await fetchMaterials();
    } catch (err: any) {
      console.error('Failed to delete material:', err);
      showToast(err.message || 'Failed to delete course material.', 'error');
    }
  };

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      // Format filter
      if (selectedFormat !== 'all') {
        const matFormat = (mat.fileFormat || 'pdf').toLowerCase();
        if (selectedFormat === 'doc' && !matFormat.includes('doc')) return false;
        if (selectedFormat === 'pdf' && matFormat !== 'pdf') return false;
        if (selectedFormat === 'ppt' && !matFormat.includes('ppt')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (mat.title || '').toLowerCase().includes(q);
        const descMatch = (mat.description || '').toLowerCase().includes(q);
        const subMatch = (mat.subjectId?.title || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !subMatch) return false;
      }

      return true;
    });
  }, [materials, selectedFormat, searchQuery]);

  // Form URL auto format detector
  const handleDriveUrlChange = (val: string) => {
    setFormDriveUrl(val);
    const lower = val.toLowerCase();
    if (lower.includes('docs.google.com/document') || lower.includes('.doc')) {
      setFormFileFormat('docx');
    } else if (lower.includes('docs.google.com/presentation') || lower.includes('.ppt')) {
      setFormFileFormat('ppt');
    } else if (lower.includes('.pdf') || lower.includes('/file/d/')) {
      setFormFileFormat('pdf');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#0a2540]">
              Course Materials & Digital Study Drives
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200">
              {filteredMaterials.length} Documents
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {role === 'student'
              ? 'Access official study notes, PDF reference guides, and Google Docs directly in-app or download offline.'
              : 'Publish and manage Google Drive course materials in PDF or Word/Doc format for enrolled students.'}
          </p>
        </div>

        {/* Admin / SuperAdmin Action Button */}
        {role !== 'student' && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course Material</span>
          </button>
        )}
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search materials by title, subject, or keywords..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
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

        {/* Filter by Subject / Course */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Subject:</span>
          </div>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 outline-none cursor-pointer focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20"
          >
            <option value="all">All Subjects / Courses</option>
            {subjects.map((sub: any) => (
              <option key={sub._id} value={sub._id}>
                {sub.title} ({sub.code || 'CRS'})
              </option>
            ))}
          </select>

          {/* Filter by Format */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedFormat('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFormat === 'all'
                  ? 'bg-white text-[#0a2540] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFormat('pdf')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFormat === 'pdf'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PDFs
            </button>
            <button
              onClick={() => setSelectedFormat('doc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFormat === 'doc'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DOC / Word
            </button>
          </div>
        </div>
      </div>

      {/* 3. Materials Grid */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
          <p className="text-sm font-semibold text-slate-700">Loading course materials...</p>
        </div>
      ) : filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => {
            const badge = getFormatBadge(mat.fileFormat);
            const downloadUrl = getDriveDownloadUrl(mat.driveUrl, mat.fileFormat);
            const subjectTitle = mat.subjectId?.title || 'General Curriculum';
            const uploadedAt = mat.createdAt ? new Date(mat.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

            return (
              <div
                key={mat._id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-[#2563eb]/30"
              >
                <div>
                  {/* Top Badges & Options */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.colorClass} ${badge.bgClass}`}>
                      <FileText className="w-3 h-3" />
                      {badge.label}
                    </span>

                    {/* Admin / SuperAdmin Edit & Delete */}
                    {role !== 'student' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(mat)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit Material"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingMaterial(mat)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete Material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Material Title */}
                  <h3 className="font-semibold text-base text-[#0a2540] group-hover:text-[#2563eb] transition-colors leading-snug mb-2 line-clamp-2">
                    {mat.title}
                  </h3>

                  {/* Subject Badge */}
                  <div className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 mb-3">
                    {subjectTitle}
                  </div>

                  {/* Description */}
                  {mat.description && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>
                  )}
                </div>

                {/* Footer Info & Actions */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Uploaded: {uploadedAt}</span>
                    <span className="truncate max-w-[120px]">{mat.uploadedByName || 'Trainer'}</span>
                  </div>

                  {/* Buttons Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* View / Read Button */}
                    <button
                      onClick={() => setViewingMaterial(mat)}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Read inside portal"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Online</span>
                    </button>

                    {/* Direct Download Button */}
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="py-2.5 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Download file to device"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 sm:p-16 text-center bg-white rounded-2xl border border-slate-200/80">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#0a2540]">
            No Course Materials Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {role === 'student'
              ? 'No study materials or Google Drive links have been uploaded for this course track yet.'
              : 'You have not uploaded any Google Drive PDF or DOC materials yet. Add your first study resource now.'}
          </p>
          {role !== 'student' && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Course Material</span>
            </button>
          )}
        </div>
      )}

      {/* 4. Document Viewer Modal */}
      {viewingMaterial && (
        <DocumentViewerModal
          isOpen={!!viewingMaterial}
          title={viewingMaterial.title}
          driveUrl={viewingMaterial.driveUrl}
          fileFormat={viewingMaterial.fileFormat}
          subjectName={viewingMaterial.subjectId?.title}
          onClose={() => setViewingMaterial(null)}
        />
      )}

      {/* 5. Add / Edit Material Modal (Admin & SuperAdmin) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0a2540] to-[#1e3a8a] text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg sm:text-xl">
                  {editingMaterial ? 'Edit Course Material' : 'Add Course Material'}
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Paste a Google Drive share link for PDF or Word/Doc file
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMaterial(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitMaterial} className="p-5 sm:p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Material Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Complete React & Node.js Reference Handout"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-xs sm:text-sm"
                />
              </div>

              {/* Google Drive Link */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Google Drive URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formDriveUrl}
                  onChange={(e) => handleDriveUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view or docs.google.com/..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-xs sm:text-sm font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tip: In Google Drive, click Share &gt; Anyone with the link can view &gt; Copy Link.
                </p>
              </div>

              {/* Format & Subject in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* File Format */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    File Format
                  </label>
                  <select
                    value={formFileFormat}
                    onChange={(e: any) => setFormFileFormat(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-xs sm:text-sm cursor-pointer"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="doc">Word / Doc (.doc)</option>
                    <option value="docx">Word / Docx (.docx)</option>
                    <option value="ppt">Presentation (.ppt / .pptx)</option>
                    <option value="other">Other Digital Format</option>
                  </select>
                </div>

                {/* Subject / Course */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Course / Curriculum
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-xs sm:text-sm cursor-pointer"
                  >
                    <option value="">All Courses (General)</option>
                    {subjects.map((sub: any) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Brief Description or Study Notes
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Chapter 1 to 5 lecture notes covering data structures, code templates, and interview questions..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-xs sm:text-sm resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMaterial(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingMaterial ? 'Save Changes' : 'Publish Material'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deletingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Delete Material?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{deletingMaterial.title}"</span>? Students will no longer be able to view or download it.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeletingMaterial(null)}
                className="w-1/2 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMaterial}
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
