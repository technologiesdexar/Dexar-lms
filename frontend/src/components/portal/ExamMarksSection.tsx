'use client';

import React, { useState, useMemo } from 'react';
import {
  Award,
  FileText,
  Code2,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Pencil,
  Trash2,
  ShieldAlert,
  Users,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export interface ExamMarksSectionProps {
  role: 'admin' | 'superadmin';
  assessments: any[];
  codingExams: any[];
  subjects?: any[];
  marks: {
    assessmentSubmissions: any[];
    codingSubmissions: any[];
  };
  currentUser?: any;
  onEditScore: (item: { type: 'mcq' | 'coding'; data: any }) => void;
  onAllowRetake: (submissionId: string, type: 'mcq' | 'coding') => void;
  onDeleteSubmission: (submissionId: string, type: 'mcq' | 'coding', studentName: string, examTitle: string) => void;
  onDownloadOverallReport?: () => void;
}

export function ExamMarksSection({
  role,
  assessments = [],
  codingExams = [],
  subjects = [],
  marks = { assessmentSubmissions: [], codingSubmissions: [] },
  currentUser,
  onEditScore,
  onAllowRetake,
  onDeleteSubmission,
  onDownloadOverallReport,
}: ExamMarksSectionProps) {
  // Filter States
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mcq' | 'coding'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'submissions' | 'avgScore' | 'recent'>('submissions');
  const [expandedExams, setExpandedExams] = useState<Record<string, boolean>>({});

  // Group all submissions according to Exam Name
  const examGroups = useMemo(() => {
    const groupsMap = new Map<string, any>();

    // 1. Initialize groups from known assessments (MCQ)
    assessments.forEach((ast) => {
      const key = `mcq_${ast._id}`;
      groupsMap.set(key, {
        id: key,
        rawId: ast._id,
        title: ast.title || 'Untitled Assessment',
        type: 'mcq',
        totalMarks: ast.totalMarks || 100,
        subjectId: ast.subjectId?._id || ast.subjectId,
        subjectTitle: ast.subjectId?.title || 'General Curriculum',
        subjectCode: ast.subjectId?.code || '',
        isLockdown: ast.isLockdown !== false,
        submissions: [] as any[],
      });
    });

    // 2. Initialize groups from known coding exams
    codingExams.forEach((cexam) => {
      const key = `coding_${cexam._id}`;
      groupsMap.set(key, {
        id: key,
        rawId: cexam._id,
        title: cexam.title || 'Untitled Coding Exam',
        type: 'coding',
        totalMarks: cexam.totalPoints || 100,
        subjectId: cexam.subjectId?._id || cexam.subjectId,
        subjectTitle: cexam.subjectId?.title || 'General Curriculum',
        subjectCode: cexam.subjectId?.code || '',
        isLockdown: cexam.isLockdown !== false,
        submissions: [] as any[],
      });
    });

    // 3. Map MCQ Submissions into their corresponding exam group
    (marks.assessmentSubmissions || []).forEach((sub) => {
      const astId = sub.assessmentId?._id || sub.assessmentId;
      const key = astId ? `mcq_${astId}` : `mcq_title_${sub.assessmentId?.title || 'Unknown'}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          id: key,
          rawId: astId || key,
          title: sub.assessmentId?.title || 'Online Assessment',
          type: 'mcq',
          totalMarks: sub.totalMarks || sub.assessmentId?.totalMarks || 100,
          subjectId: sub.assessmentId?.subjectId?._id || sub.assessmentId?.subjectId,
          subjectTitle: sub.assessmentId?.subjectId?.title || 'General Curriculum',
          subjectCode: sub.assessmentId?.subjectId?.code || '',
          isLockdown: sub.assessmentId?.isLockdown !== false,
          submissions: [],
        });
      }
      groupsMap.get(key).submissions.push(sub);
    });

    // 4. Map Coding Submissions into their corresponding exam group
    (marks.codingSubmissions || []).forEach((csub) => {
      const exId = csub.examId?._id || csub.examId;
      const key = exId ? `coding_${exId}` : `coding_title_${csub.examId?.title || 'Unknown'}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          id: key,
          rawId: exId || key,
          title: csub.examId?.title || 'Coding Challenge',
          type: 'coding',
          totalMarks: csub.examId?.totalPoints || 100,
          subjectId: csub.examId?.subjectId?._id || csub.examId?.subjectId,
          subjectTitle: csub.examId?.subjectId?.title || 'General Curriculum',
          subjectCode: csub.examId?.subjectId?.code || '',
          isLockdown: csub.examId?.isLockdown !== false,
          submissions: [],
        });
      }
      groupsMap.get(key).submissions.push(csub);
    });

    // 5. Compute statistics per exam
    const list = Array.from(groupsMap.values()).map((group) => {
      const subs = group.submissions;
      const count = subs.length;

      let avgScore = 0;
      let highestScore = 0;
      let lowestScore = count > 0 ? Number.MAX_SAFE_INTEGER : 0;
      let passCount = 0;
      let totalViolations = 0;

      if (count > 0) {
        const total = subs.reduce((acc: number, cur: any) => {
          const s = Number(cur.score) || 0;
          if (s > highestScore) highestScore = s;
          if (s < lowestScore) lowestScore = s;
          if (group.type === 'mcq') {
            const pct = (s / (group.totalMarks || 100)) * 100;
            if (pct >= 50) passCount++;
          } else {
            if (cur.passedTests !== undefined && cur.totalTests !== undefined) {
              if (cur.passedTests === cur.totalTests && cur.totalTests > 0) passCount++;
            } else if (s >= (group.totalMarks || 100) * 0.5) {
              passCount++;
            }
          }
          totalViolations += Number(cur.violationsCount) || 0;
          return acc + s;
        }, 0);

        avgScore = Math.round((total / count) * 10) / 10;
      } else {
        lowestScore = 0;
      }

      const passRate = count > 0 ? Math.round((passCount / count) * 100) : 0;

      return {
        ...group,
        stats: {
          count,
          avgScore,
          avgPercent: group.totalMarks > 0 ? Math.round((avgScore / group.totalMarks) * 100) : 0,
          highestScore,
          lowestScore,
          passCount,
          passRate,
          totalViolations,
        },
      };
    });

    return list;
  }, [assessments, codingExams, marks]);

  // Filter and sort the exam groups
  const filteredExamGroups = useMemo(() => {
    return examGroups
      .filter((exam) => {
        // Specific Exam Filter
        if (selectedExamId !== 'all' && exam.id !== selectedExamId) return false;

        // Type filter
        if (typeFilter !== 'all' && exam.type !== typeFilter) return false;

        // Subject filter
        if (subjectFilter !== 'all') {
          const examSubId = String(exam.subjectId || '');
          if (examSubId !== String(subjectFilter)) return false;
        }

        // Student search filter: if search is typed, keep exam only if it contains matching student
        if (searchStudent.trim()) {
          const term = searchStudent.toLowerCase();
          const hasMatchingStudent = exam.submissions.some((s: any) => {
            const name = s.studentId?.name?.toLowerCase() || '';
            const email = s.studentId?.email?.toLowerCase() || '';
            return name.includes(term) || email.includes(term);
          });
          if (!hasMatchingStudent) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        if (sortBy === 'submissions') return b.stats.count - a.stats.count;
        if (sortBy === 'avgScore') return b.stats.avgPercent - a.stats.avgPercent;
        if (sortBy === 'recent') {
          const aRecent = a.submissions[0]?.submittedAt ? new Date(a.submissions[0].submittedAt).getTime() : 0;
          const bRecent = b.submissions[0]?.submittedAt ? new Date(b.submissions[0].submittedAt).getTime() : 0;
          return bRecent - aRecent;
        }
        return 0;
      });
  }, [examGroups, selectedExamId, typeFilter, subjectFilter, searchStudent, sortBy]);

  // Overall Aggregates
  const totalSubmissions = useMemo(() => {
    return examGroups.reduce((acc, g) => acc + g.stats.count, 0);
  }, [examGroups]);

  const totalExams = examGroups.length;

  const toggleExpand = (id: string) => {
    setExpandedExams((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id], // Default is open, toggle closes it
    }));
  };

  const isExpanded = (id: string) => {
    return expandedExams[id] === undefined ? true : expandedExams[id];
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    examGroups.forEach((g) => (next[g.id] = true));
    setExpandedExams(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    examGroups.forEach((g) => (next[g.id] = false));
    setExpandedExams(next);
  };

  // CSV Export according to exam name
  const handleExportCSV = () => {
    const headers = [
      'Exam Name',
      'Exam Type',
      'Subject',
      'Student Name',
      'Student Email',
      'Score',
      'Total Marks/Points',
      'Percentage',
      'Status',
      'Tab Switch Violations',
      'Date Submitted',
    ];

    const rows: string[][] = [];

    filteredExamGroups.forEach((exam) => {
      exam.submissions.forEach((sub: any) => {
        const studentName = sub.studentId?.name || 'Student';
        const studentEmail = sub.studentId?.email || '';
        const score = sub.score !== undefined ? sub.score : 0;
        const total = exam.totalMarks || 100;
        const pct = Math.round((score / total) * 100);
        const status = sub.status || (pct >= 50 ? 'Passed' : 'Needs Retake');
        const violations = sub.violationsCount || 0;
        const date = sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—';

        rows.push([
          `"${exam.title.replace(/"/g, '""')}"`,
          exam.type === 'mcq' ? 'Quiz Assessment (MCQ)' : 'Coding Exam',
          `"${(exam.subjectTitle || '').replace(/"/g, '""')}"`,
          `"${studentName.replace(/"/g, '""')}"`,
          `"${studentEmail.replace(/"/g, '""')}"`,
          String(score),
          String(total),
          `${pct}%`,
          status,
          String(violations),
          date,
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dexar_Student_Marks_by_Exam_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Title & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">
              Student Marks According to Exam Name
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
              {role === 'superadmin' ? 'Super Admin Oversight' : 'Trainer Classroom'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse examination results, student scores, percentages, and anti-cheat lockdown violations grouped by exam name.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 shadow-none transition-colors cursor-pointer"
            title="Download CSV of student marks grouped by exam"
          >
            <Download className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>Export Marks CSV</span>
          </button>

          {role === 'superadmin' && onDownloadOverallReport && (
            <button
              type="button"
              onClick={onDownloadOverallReport}
              className="px-4 py-2 rounded-xl bg-[#0a2540] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-transform hover:scale-105 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-blue-300" />
              <span>Download Overall Official Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-none">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Exams Conducted</span>
            <BookOpen className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="text-2xl font-bold text-[#0a2540] mt-1">{totalExams}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">MCQ Quizzes & Coding Arenas</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-none">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Student Submissions</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{totalSubmissions}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total Evaluated Attempts</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-none">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Filtered Exams</span>
            <Filter className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{filteredExamGroups.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Currently in View</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-none">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Exams with Submissions</span>
            <GraduationCap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {examGroups.filter((g) => g.stats.count > 0).length} / {totalExams}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active Student Participation</div>
        </div>
      </div>

      {/* Control Toolbar: Exam Selector Dropdown, Search, Type Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-none space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Exam Name Dropdown Selector */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Exam Name:
            </label>
            <div className="relative">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] cursor-pointer"
              >
                <option value="all">All Exams ({examGroups.length} Total Exams)</option>

                {/* MCQ Assessments Group */}
                <optgroup label="── Quiz Assessments (MCQ) ──">
                  {examGroups
                    .filter((g) => g.type === 'mcq')
                    .map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} ({exam.stats.count} {exam.stats.count === 1 ? 'submission' : 'submissions'})
                      </option>
                    ))}
                </optgroup>

                {/* Coding Challenges Group */}
                <optgroup label="── Coding Exam Arenas ──">
                  {examGroups
                    .filter((g) => g.type === 'coding')
                    .map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} ({exam.stats.count} {exam.stats.count === 1 ? 'submission' : 'submissions'})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Student Search within Exam */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Search Student:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Search by student name or email..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]"
              />
              {searchStudent && (
                <button
                  type="button"
                  onClick={() => setSearchStudent('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Sort By Selector */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sort Exams By:
            </label>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 cursor-pointer"
            >
              <option value="submissions">Most Submissions First</option>
              <option value="name">Exam Name (A-Z)</option>
              <option value="avgScore">Highest Average Score</option>
              <option value="recent">Most Recent Activity</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Type Pills & Subject Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Exam Type:</span>
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-[#0a2540] text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Types ({examGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('mcq')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                typeFilter === 'mcq'
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-blue-50 text-[#2563eb] hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>MCQ Assessments ({examGroups.filter((g) => g.type === 'mcq').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('coding')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                typeFilter === 'coding'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Coding Arenas ({examGroups.filter((g) => g.type === 'coding').length})</span>
            </button>
          </div>

          {/* Subject Filter (for superadmin or multi-subject) */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Subject:</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Subjects</option>
                {subjects.map((sub: any) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.title} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Expand/Collapse All */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="text-[11px] font-semibold text-[#2563eb] hover:underline cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-slate-300">&bull;</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Exam-by-Exam Display Sections */}
      {filteredExamGroups.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#0a2540]">No exams matching your filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try resetting your search query or selecting &ldquo;All Exams&rdquo; from the dropdown.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedExamId('all');
              setTypeFilter('all');
              setSubjectFilter('all');
              setSearchStudent('');
            }}
            className="mt-3 px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredExamGroups.map((exam) => {
            const open = isExpanded(exam.id);

            // Filter submissions of this exam if student search is active
            const displayedSubmissions = searchStudent.trim()
              ? exam.submissions.filter((s: any) => {
                  const term = searchStudent.toLowerCase();
                  const name = s.studentId?.name?.toLowerCase() || '';
                  const email = s.studentId?.email?.toLowerCase() || '';
                  return name.includes(term) || email.includes(term);
                })
              : exam.submissions;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-none overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Exam Header Banner (Collapsible Trigger) */}
                <div
                  onClick={() => toggleExpand(exam.id)}
                  className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 border-b border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        exam.type === 'mcq'
                          ? 'bg-blue-50 text-[#2563eb] border-blue-200/60'
                          : 'bg-purple-50 text-purple-700 border-purple-200/60'
                      }`}
                    >
                      {exam.type === 'mcq' ? <FileText className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            exam.type === 'mcq'
                              ? 'bg-blue-50 text-[#2563eb] border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {exam.type === 'mcq' ? 'Quiz Assessment (MCQ)' : 'Coding Exam Arena'}
                        </span>

                        {exam.subjectTitle && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {exam.subjectTitle} {exam.subjectCode ? `(${exam.subjectCode})` : ''}
                          </span>
                        )}

                        {exam.isLockdown && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <ShieldAlert className="w-3 h-3" />
                            Lockdown
                          </span>
                        )}
                      </div>

                      {/* Prominent Exam Name */}
                      <h3 className="text-base sm:text-lg font-bold text-[#0a2540] flex items-center gap-2">
                        <span>{exam.title}</span>
                        <span className="text-xs font-normal text-slate-500">
                          &bull; Max {exam.totalMarks} {exam.type === 'mcq' ? 'Marks' : 'Pts'}
                        </span>
                      </h3>
                    </div>
                  </div>

                  {/* Right Header Stats & Accordion Toggle */}
                  <div className="flex items-center gap-3 self-end md:self-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Submissions count pill */}
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {exam.stats.count} {exam.stats.count === 1 ? 'Student' : 'Students'}
                        </span>
                      </span>

                      {/* Class Average */}
                      {exam.stats.count > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Avg: {exam.stats.avgScore} ({exam.stats.avgPercent}%)</span>
                        </span>
                      )}

                      {/* Violations Flag */}
                      {exam.stats.totalViolations > 0 && (
                        <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{exam.stats.totalViolations} Switches</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(exam.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={open ? 'Collapse Exam' : 'Expand Exam'}
                    >
                      {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submissions Table Inside Exam Card */}
                {open && (
                  <div>
                    {displayedSubmissions.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs bg-slate-50/40">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No student submissions recorded for this exam</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Enrolled students who attend and submit this exam will appear here automatically with their marks.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#f8fafc] text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                            <tr>
                              <th className="py-3 px-4 sm:px-6">Student</th>
                              <th className="py-3 px-4">Score / Marks</th>
                              <th className="py-3 px-4">Percentage</th>
                              <th className="py-3 px-4">
                                {exam.type === 'mcq' ? 'Academic Standing' : 'Test Cases Passed'}
                              </th>
                              <th className="py-3 px-4">Lockdown Violations</th>
                              <th className="py-3 px-4">Date Submitted</th>
                              <th className="py-3 px-4 text-center">Action / Retake</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {displayedSubmissions.map((sub: any) => {
                              const score = Number(sub.score) || 0;
                              const total = exam.totalMarks || 100;
                              const pct = Math.round((score / total) * 100);

                              const studentName = sub.studentId?.name || 'Student';
                              const studentEmail = sub.studentId?.email || '—';
                              const violations = sub.violationsCount || 0;

                              return (
                                <tr key={sub._id} className="hover:bg-slate-50/80 transition-colors">
                                  {/* Student Name & Email */}
                                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#0a2540]">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-slate-100 text-[#0a2540] font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                                        {studentName[0] || 'S'}
                                      </div>
                                      <div>
                                        <div className="font-bold text-[#0a2540]">{studentName}</div>
                                        <div className="text-[11px] text-slate-400 font-mono font-normal">
                                          {studentEmail}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Marks / Score */}
                                  <td className="py-3.5 px-4 font-bold text-base text-[#2563eb]">
                                    <span>{score}</span>
                                    <span className="text-xs font-normal text-slate-400"> / {total}</span>
                                  </td>

                                  {/* Percentage */}
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                          pct >= 85
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : pct >= 50
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {pct}%
                                      </span>
                                    </div>
                                  </td>

                                  {/* Standing / Tests Passed */}
                                  <td className="py-3.5 px-4">
                                    {exam.type === 'mcq' ? (
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                          pct >= 85
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : pct >= 50
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}
                                      >
                                        {pct >= 85 ? 'Distinction' : pct >= 50 ? 'Passed' : 'Needs Retake'}
                                      </span>
                                    ) : (
                                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                                        <span className="text-emerald-600 font-bold">
                                          {sub.passedTests !== undefined ? sub.passedTests : '—'} /{' '}
                                          {sub.totalTests !== undefined ? sub.totalTests : '—'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">Passed</span>
                                      </div>
                                    )}
                                  </td>

                                  {/* Lockdown Violations */}
                                  <td className="py-3.5 px-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                        violations > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {violations} Tab {violations === 1 ? 'Switch' : 'Switches'}
                                    </span>
                                  </td>

                                  {/* Date */}
                                  <td className="py-3.5 px-4 text-slate-500 font-normal">
                                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
                                  </td>

                                  {/* Action Buttons */}
                                  <td className="py-3.5 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onEditScore({
                                            type: exam.type,
                                            data: {
                                              ...sub,
                                              ...(exam.type === 'mcq'
                                                ? { assessmentId: { _id: exam.rawId, title: exam.title, totalMarks: total } }
                                                : { examId: { _id: exam.rawId, title: exam.title, totalPoints: total } }),
                                            },
                                          })
                                        }
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#2563eb] text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                                        title="Edit Score / Marks"
                                      >
                                        <Pencil className="w-3 h-3" />
                                        <span>Edit</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => onAllowRetake(sub._id, exam.type)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all hover:scale-105 cursor-pointer shadow-none ${
                                          exam.type === 'mcq'
                                            ? 'bg-blue-50 hover:bg-blue-100 text-[#2563eb] border-blue-200/80'
                                            : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                                        }`}
                                        title="Allow student to retake and rewrite this exam"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Allow Rewrite</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          onDeleteSubmission(sub._id, exam.type, studentName, exam.title)
                                        }
                                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Delete Submission"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
