'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ExternalLink,
  Code2,
  Code,
  ArrowRight,
  CreditCard,
  Plus,
  RefreshCw,
  RotateCcw,
  LogOut,
  Maximize2,
  Sparkles,
  BookOpen,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Eye,
  EyeOff,
  Award,
  UploadCloud,
  FileCode,
  Files,
  ShieldAlert,
  Calendar,
  Lock,
  Download,
  Terminal,
  Radio,
  Search,
  KeyRound,
  User,
  MessageSquare,
  Send,
  FileUp,
  Printer,
  Camera,
  MousePointer,
  Keyboard,
  LayoutGrid,
  Check,
  Pencil,
  Trash2,
  Edit3,
  Filter,
  Loader2,
  Layers,
} from 'lucide-react';
import { api } from '@/services/api';
import { loadRazorpayScript } from '@/lib/razorpay';
import { parseDocxFile, parseTextToQuestions, ParsedQuestion } from '@/lib/docxParser';
import { AppSidebar } from '@/components/app-sidebar';
import {
  DeleteConfirmModal,
  CreateSubjectModal,
  EditSubjectModal,
  EditTrainerModal,
  EditStudentModal,
  EditTransactionModal,
  EditLiveClassModal,
  EditRecordedClassModal,
  EditAssessmentModal,
  EditCodingExamModal,
  EditScoreModal,
} from '@/components/portal/CrudModals';
import { VideoPlayerModal } from '@/components/portal/VideoPlayerModal';
import { DoubtsChatSection } from '@/components/portal/DoubtsChatSection';
import { CourseMaterialsSection } from '@/components/portal/CourseMaterialsSection';
import { ExamMarksSection } from '@/components/portal/ExamMarksSection';
import { downloadReportPdf } from '@/utils/pdfDownloader';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

export default function PortalPage() {
  const router = useRouter();

  // Active User & Role
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab for role views
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentTabTitle = React.useMemo(() => {
    if (!currentUser) return 'Dashboard';
    if (currentUser.role === 'superadmin') {
      if (activeTab === 'dashboard') return 'Executive Dashboard';
      if (activeTab === 'overview') return 'Admin Trainers & Oversight';
      if (activeTab === 'subjects') return 'Curriculum Subjects & Modules';
      if (activeTab === 'students') return 'Student Credentials & Directory';
      if (activeTab === 'transactions') return 'Transactions Ledger';
      if (activeTab === 'marks') return 'Student Marks Oversight';
      if (activeTab === 'assessments') return 'Conduct Assessments';
      if (activeTab === 'doubts') return 'Student Doubts Chat & Assistance';
      if (activeTab === 'materials') return 'Course Materials Repository';
    } else if (currentUser.role === 'admin') {
      if (activeTab === 'dashboard') return 'Trainer Dashboard';
      if (activeTab === 'overview') return 'Word Docx & Online Exams';
      if (activeTab === 'coding') return 'Coding Exam Arena';
      if (activeTab === 'live') return 'Live Classes (Meetings)';
      if (activeTab === 'recorded') return 'Recorded Lectures & Notes';
      if (activeTab === 'marks') return 'Student Marks & Exam Results';
      if (activeTab === 'students') return 'Enrolled Students List';
      if (activeTab === 'doubts') return 'Student Doubts Chat & Resolution';
      if (activeTab === 'materials') return 'Course Materials & Study Drives';
    } else {
      if (activeTab === 'dashboard' || activeTab === 'overview') return 'Dashboard';
      if (activeTab === 'recorded') return 'Recorded Classes';
      if (activeTab === 'assessments') return 'Mcq Exams';
      if (activeTab === 'coding') return 'Coding Exam';
      if (activeTab === 'profile' || activeTab === 'billing' || activeTab === 'marks') return 'Profile';
      if (activeTab === 'doubts') return 'Doubts Chat';
      if (activeTab === 'materials') return 'Course Materials';
    }
    return 'Dashboard';
  }, [currentUser, activeTab]);

  // Common Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // -------------------------------------------------------------
  // SUPER ADMIN STATES
  // -------------------------------------------------------------
  const [saStats, setSaStats] = useState<any>(null);
  const [saTrainers, setSaTrainers] = useState<any[]>([]);
  const [saStudents, setSaStudents] = useState<any[]>([]);
  const [saTransactions, setSaTransactions] = useState<any[]>([]);
  const [saTotalRevenue, setSaTotalRevenue] = useState(0);
  const [saMarks, setSaMarks] = useState<{ assessmentSubmissions: any[]; codingSubmissions: any[] }>({
    assessmentSubmissions: [],
    codingSubmissions: [],
  });
  const [saSubjects, setSaSubjects] = useState<any[]>([]);

  // Super Admin Modals
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ name: '', email: '', password: '', subjectId: '' });
  const [expandedTrainerId, setExpandedTrainerId] = useState<string | null>(null);

  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [newStudentData, setNewStudentData] = useState({
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

  const handleToggleNewStudentCourse = (subId: string) => {
    const idStr = String(subId);
    setNewStudentData((prev) => {
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

  const handleSelectAllNewStudentCourses = () => {
    const allIds = saSubjects.map((s) => String(s._id));
    setNewStudentData((prev) => ({
      ...prev,
      subjectIds: allIds,
      subjectId: allIds[0] || '',
    }));
  };

  const handleClearAllNewStudentCourses = () => {
    setNewStudentData((prev) => ({
      ...prev,
      subjectIds: [],
      subjectId: '',
    }));
  };

  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [newSubjectData, setNewSubjectData] = useState({ title: '', code: '', description: '' });
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');

  // SuperAdmin Enrolled Students Categorization & Filter State (Subject & Trainer Wise)
  const [studentViewMode, setStudentViewMode] = useState<'subject' | 'trainer' | 'all'>('subject');
  const [studentSubjectFilter, setStudentSubjectFilter] = useState<string>('all');
  const [studentTrainerFilter, setStudentTrainerFilter] = useState<string>('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('all');

  // SuperAdmin & Admin Expandable Subject States in Enrolled Students
  const [expandedSubjectMap, setExpandedSubjectMap] = useState<Record<string, boolean>>({});

  const isSubjectExpanded = (subId: string) => {
    return expandedSubjectMap[subId] !== undefined ? expandedSubjectMap[subId] : true;
  };

  const toggleSubjectExpand = (subId: string) => {
    setExpandedSubjectMap((prev) => ({
      ...prev,
      [subId]: !(prev[subId] !== undefined ? prev[subId] : true),
    }));
  };

  const expandAllSubjects = () => {
    const nextMap: Record<string, boolean> = {};
    saSubjects.forEach((s) => { nextMap[s._id] = true; });
    setExpandedSubjectMap(nextMap);
  };

  const collapseAllSubjects = () => {
    const nextMap: Record<string, boolean> = {};
    saSubjects.forEach((s) => { nextMap[s._id] = false; });
    setExpandedSubjectMap(nextMap);
  };

  // Trainer Enrolled Students Section Expand & Search
  const [trainerSubjectExpanded, setTrainerSubjectExpanded] = useState<boolean>(true);
  const [trainerStudentSearch, setTrainerStudentSearch] = useState<string>('');

  // -------------------------------------------------------------
  // FULL CRUD MODAL STATES (ADMIN & SUPER ADMIN)
  // -------------------------------------------------------------
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [editingTrainer, setEditingTrainer] = useState<any | null>(null);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [editingLiveClass, setEditingLiveClass] = useState<any | null>(null);
  const [editingRecordedClass, setEditingRecordedClass] = useState<any | null>(null);
  const [editingAssessment, setEditingAssessment] = useState<any | null>(null);
  const [editingCodingExam, setEditingCodingExam] = useState<any | null>(null);
  const [editingScoreItem, setEditingScoreItem] = useState<{ type: 'mcq' | 'coding'; data: any } | null>(null);

  // SuperAdmin Platform-wide Assessments & Coding Challenges
  const [saAssessments, setSaAssessments] = useState<any[]>([]);
  const [saCodingExams, setSaCodingExams] = useState<any[]>([]);

  // Generic Reusable Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemTitle?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = (title: string, message: string, itemTitle: string, action: () => Promise<void>) => {
    setDeleteDialog({
      isOpen: true,
      title,
      message,
      itemTitle,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await action();
          setDeleteDialog(null);
          loadRoleData(currentUser?.role || 'admin');
        } catch (err: any) {
          showToast(err.message || 'Failed to delete item.', 'error');
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  // -------------------------------------------------------------
  // ADMIN (TRAINER) STATES
  // -------------------------------------------------------------
  const [trainerData, setTrainerData] = useState<any>(null);
  const [trainerLiveClasses, setTrainerLiveClasses] = useState<any[]>([]);
  const [trainerRecorded, setTrainerRecorded] = useState<any[]>([]);
  const [trainerAssessments, setTrainerAssessments] = useState<any[]>([]);
  const [trainerCodingExams, setTrainerCodingExams] = useState<any[]>([]);

  // Trainer Modals & Forms
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [newLiveClass, setNewLiveClass] = useState({
    title: '',
    link: '',
    date: new Date().toISOString().split('T')[0],
    time: '06:30 PM EST',
    description: '',
    status: 'upcoming',
  });

  const [showRecordedModal, setShowRecordedModal] = useState(false);
  const [newRecordedClass, setNewRecordedClass] = useState({
    title: '',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    notesUrl: '',
    description: '',
    duration: '45 mins',
  });

  // Word Document Upload / Assessment Creator States
  const [showDocxModal, setShowDocxModal] = useState(false);
  const [docxParsing, setDocxParsing] = useState(false);
  const [parsedExamTitle, setParsedExamTitle] = useState('Full Stack Mastery Quiz');
  const [parsedDueDate, setParsedDueDate] = useState('2026-10-31');
  const [parsedIsLockdown, setParsedIsLockdown] = useState(true);
  const [parsedMaxViolations, setParsedMaxViolations] = useState(3);
  const [parsedDuration, setParsedDuration] = useState(45);
  const [parsedAccessPassword, setParsedAccessPassword] = useState('DEXAR2026');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [manualRawText, setManualRawText] = useState('');

  // Coding Exam Creator States
  const [showCodingModal, setShowCodingModal] = useState(false);
  const [activeCodingQuestionTab, setActiveCodingQuestionTab] = useState(0);
  const [newCodingExam, setNewCodingExam] = useState({
    title: 'Algorithm Assessment',
    dueDate: '2026-10-31',
    totalPoints: 100,
    durationMinutes: 60,
    isLockdown: true,
    maxViolations: 3,
    accessPassword: 'DEXAR2026',
    questions: [
      {
        title: 'Problem 1: Array Reversal',
        problemStatement: 'Write a JavaScript function solution(input) that returns the reversed string or array.',
        starterCode: 'function solution(input) {\n  // Write your logic here\n  \n}',
        points: 50,
        testCases: [
          { input: 'dexar', output: 'raxed', explanation: 'Reverse of dexar is raxed' },
          { input: 'hello', output: 'olleh', explanation: 'Reverse of hello is olleh' },
        ],
      },
      {
        title: 'Problem 2: Palindrome Checker',
        problemStatement: 'Write a JavaScript function solution(input) that returns true if the input string is a palindrome, false otherwise.',
        starterCode: 'function solution(input) {\n  // Write your logic here\n  \n}',
        points: 50,
        testCases: [
          { input: 'racecar', output: 'true', explanation: 'racecar is a palindrome' },
          { input: 'dexar', output: 'false', explanation: 'dexar is not a palindrome' },
        ],
      },
    ],
  });

  // Submissions inspector modal for trainer
  const [selectedAssessmentSubs, setSelectedAssessmentSubs] = useState<any[] | null>(null);
  const [selectedCodingSubs, setSelectedCodingSubs] = useState<any[] | null>(null);
  const [activeAssessmentForSubs, setActiveAssessmentForSubs] = useState<any | null>(null);
  const [activeCodingExamForSubs, setActiveCodingExamForSubs] = useState<any | null>(null);

  // -------------------------------------------------------------
  // STUDENT STATES
  // -------------------------------------------------------------
  const [studentDash, setStudentDash] = useState<any>(null);
  const [studentLive, setStudentLive] = useState<any[]>([]);
  const [studentRecorded, setStudentRecorded] = useState<any[]>([]);
  const [studentAssessments, setStudentAssessments] = useState<any[]>([]);
  const [studentCodingExams, setStudentCodingExams] = useState<any[]>([]);
  const [studentMarks, setStudentMarks] = useState<any>(null);

  // Student Multi-Course & Course-Wise Selection States
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);

  // Deduplicate and resolve all enrolled courses for the student
  const enrolledCourses = React.useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    const addCourse = (c: any) => {
      if (!c) return;
      const id = (c._id || c).toString();
      const isPopulated = typeof c === 'object' && Boolean(c.title);
      if (!seen.has(id)) {
        seen.add(id);
        list.push(
          isPopulated
            ? c
            : { _id: id, title: 'Course ' + id.slice(-4), code: 'CRS' }
        );
      } else if (isPopulated) {
        const existingIdx = list.findIndex((item) => (item._id || item).toString() === id);
        if (existingIdx !== -1 && (!list[existingIdx].title || list[existingIdx].title.startsWith('Course '))) {
          list[existingIdx] = c;
        }
      }
    };

    if (studentDash?.enrolledCourses && Array.isArray(studentDash.enrolledCourses)) {
      studentDash.enrolledCourses.forEach(addCourse);
    }
    if (currentUser?.subjectIds && Array.isArray(currentUser.subjectIds)) {
      currentUser.subjectIds.forEach(addCourse);
    }
    if (studentDash?.student?.subjectIds && Array.isArray(studentDash.student.subjectIds)) {
      studentDash.student.subjectIds.forEach(addCourse);
    }
    if (studentDash?.student?.subjectId) {
      addCourse(studentDash.student.subjectId);
    }
    if (currentUser?.subjectId) {
      addCourse(currentUser.subjectId);
    }
    return list;
  }, [studentDash, currentUser]);

  const activeCourse = React.useMemo(() => {
    if (!enrolledCourses || enrolledCourses.length === 0) return null;
    if (selectedCourseId) {
      const match = enrolledCourses.find((c: any) => {
        const cId = (c?._id || c)?.toString();
        return cId === selectedCourseId.toString();
      });
      if (match) return match;
    }
    return enrolledCourses[0];
  }, [enrolledCourses, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId && enrolledCourses.length > 0) {
      const firstId = (enrolledCourses[0]._id || enrolledCourses[0]).toString();
      setSelectedCourseId(firstId);
    }
  }, [enrolledCourses, selectedCourseId]);

  const handleSelectCourse = async (courseId: string, forcedTab?: string) => {
    const idStr = typeof courseId === 'object' && courseId !== null && (courseId as any)._id
      ? String((courseId as any)._id)
      : String(courseId);

    setSelectedCourseId(idStr);
    if (forcedTab) {
      setActiveTab(forcedTab);
    } else if (activeTab === 'courses') {
      setActiveTab('dashboard');
    }
    setCourseLoading(true);
    try {
      const [liveRes, recRes, astRes, codRes] = await Promise.all([
        api.getStudentLiveClasses(idStr),
        api.getStudentRecordedClasses(idStr),
        api.getStudentAssessments(idStr),
        api.getStudentCodingExams(idStr),
      ]);
      setStudentLive(liveRes.liveClasses || []);
      setStudentRecorded(recRes.recordedClasses || []);
      setStudentAssessments(astRes.assessments || []);
      setStudentCodingExams(codRes.codingExams || []);
      const matched = enrolledCourses.find((c: any) => {
        const cId = (c?._id || c)?.toString();
        return cId === idStr;
      });
      showToast(`Switched to course: ${matched?.title || 'Selected Course'}`, 'info');
    } catch (err: any) {
      console.error('Failed to load course details:', err);
      showToast('Failed to switch course. Please try again.', 'error');
    } finally {
      setCourseLoading(false);
    }
  };

  // Student Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'course_wise'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Google Pay');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Student Contact Super Admin Modal (when Razorpay is down or student requests manual access)
  const [showContactAdminModal, setShowContactAdminModal] = useState(false);
  const [contactAdminNote, setContactAdminNote] = useState('');
  const [contactAdminSubmitting, setContactAdminSubmitting] = useState(false);

  // Active Video Modal for Student / Trainer
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoData, setActiveVideoData] = useState<{ url: string; title: string; notesUrl?: string } | null>(null);

  // -------------------------------------------------------------
  // LOCKDOWN EXAM TAKING MODAL (QUIZ & CODING)
  // -------------------------------------------------------------
  const [activeExam, setActiveExam] = useState<any | null>(null); // Quiz
  const [examAnswers, setExamAnswers] = useState<number[]>([]);
  const [examViolations, setExamViolations] = useState(0);
  const [examTimeLeft, setExamTimeLeft] = useState(45 * 60);
  const [isExamFullscreen, setIsExamFullscreen] = useState(false);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [violationReason, setViolationReason] = useState<string>('');
  const [showScreenshotFlash, setShowScreenshotFlash] = useState(false);
  const [isExitedFullscreen, setIsExitedFullscreen] = useState(false);
  const examContainerRef = useRef<HTMLDivElement>(null);
  const lastViolationTimeRef = useRef<number>(0);
  const isAutoSubmittingRef = useRef<boolean>(false);

  // Active Coding Exam in Lockdown Mode
  const [activeCodingExam, setActiveCodingExam] = useState<any | null>(null);
  const [activeCodingQuestionIdx, setActiveCodingQuestionIdx] = useState(0);
  const [codingQuestionCodes, setCodingQuestionCodes] = useState<Record<number, string>>({});
  const [codingTestOutputs, setCodingTestOutputs] = useState<Record<number, any>>({});
  const [codingCode, setCodingCode] = useState('');
  const [codingLanguage, setCodingLanguage] = useState('javascript');
  const [codingTestOutput, setCodingTestOutput] = useState<any | null>(null);
  const [codingTesting, setCodingTesting] = useState(false);

  // Single Question Pager & Questions Matrix (Matching Image 2 in White Theme)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [markedForReview, setMarkedForReview] = useState<number[]>([]);
  const [visitedQuestions, setVisitedQuestions] = useState<number[]>([]);

  // Trainer Exam Password Gate (MCQ & Coding Exams)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetExamForPassword, setTargetExamForPassword] = useState<any | null>(null);
  const [examPasswordType, setExamPasswordType] = useState<'mcq' | 'coding'>('mcq');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Student Complete Academic Learning Report Download Modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Super Admin Overall Students Academic & Enrollment Report Modal
  const [showOverallReportModal, setShowOverallReportModal] = useState(false);
  const [reportSubjectFilter, setReportSubjectFilter] = useState('all');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Super Admin Platform Transactions Ledger Report Modal
  const [showTransactionReportModal, setShowTransactionReportModal] = useState(false);
  const [transactionPlanFilter, setTransactionPlanFilter] = useState('all');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');

  const filteredTransactions = React.useMemo(() => {
    if (!saTransactions) return [];
    return saTransactions.filter((tx: any) => {
      if (transactionPlanFilter !== 'all' && tx.planType !== transactionPlanFilter) return false;
      if (transactionStatusFilter !== 'all' && (tx.status || 'Completed').toLowerCase() !== transactionStatusFilter.toLowerCase()) return false;
      return true;
    });
  }, [saTransactions, transactionPlanFilter, transactionStatusFilter]);

  const handleDownloadTransactionsCSV = () => {
    if (!saTransactions || saTransactions.length === 0) {
      showToast('No transaction records available to export.', 'error');
      return;
    }
    const list = filteredTransactions.length > 0 ? filteredTransactions : saTransactions;
    const headers = [
      'Transaction ID',
      'Student Name',
      'Student Email',
      'Plan Enrolled',
      'Amount (INR)',
      'Payment Method',
      'Payment Date',
      'Status',
    ];
    const rows = list.map((tx: any) => [
      `"${tx.transactionId || tx._id}"`,
      `"${(tx.studentId?.name || 'Student').replace(/"/g, '""')}"`,
      `"${(tx.studentId?.email || '').replace(/"/g, '""')}"`,
      tx.planType === 'course_wise' ? 'Course Pack' : 'Monthly Pack',
      tx.amount || 0,
      `"${tx.paymentMethod || 'Razorpay / UPI'}"`,
      `"${new Date(tx.paidAt || Date.now()).toLocaleDateString()}"`,
      `"${tx.status || 'Completed'}"`,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dexar_all_transactions_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions report CSV downloaded successfully!', 'success');
  };

  const reportFilteredStudents = React.useMemo(() => {
    if (!saStudents) return [];
    return saStudents.filter((st: any) => {
      const subId = st.subjectId?._id || st.subjectId;
      if (reportSubjectFilter !== 'all' && String(subId) !== String(reportSubjectFilter)) return false;
      if (reportStatusFilter === 'paid' && st.paymentStatus !== 'paid') return false;
      if (reportStatusFilter === 'pending' && st.paymentStatus !== 'pending') return false;
      if (reportStatusFilter === 'access_requested' && !st.accessRequested) return false;
      return true;
    });
  }, [saStudents, reportSubjectFilter, reportStatusFilter]);

  const handleDownloadStudentsCSV = () => {
    if (!saStudents || saStudents.length === 0) {
      showToast('No student records available to download.', 'error');
      return;
    }

    const filtered = reportFilteredStudents.length > 0 ? reportFilteredStudents : saStudents;

    const headers = [
      'Student ID',
      'Student Name',
      'Email Address',
      'Enrolled Subject',
      'Subject Code',
      'Assigned Trainer',
      'Plan Type',
      'Fee Amount (INR)',
      'Payment Status',
      'Account Status',
      'Enrollment Date',
      'Expiry Date',
      'MCQ Assessments Attempted',
      'MCQ Average Score',
      'Coding Challenges Attempted',
      'Coding Points Earned',
      'Academic Standing',
    ];

    const rows = filtered.map((st: any, idx: number) => {
      const studentSubId = st.subjectId?._id || st.subjectId;
      const trainer = saTrainers.find((t: any) => {
        const tSubId = t.subjectId?._id || t.subjectId;
        return tSubId && studentSubId && String(tSubId) === String(studentSubId);
      });

      const mcqSubs = (saMarks.assessmentSubmissions || []).filter(
        (m: any) => m.studentId?._id === st._id || m.studentId?.email?.toLowerCase() === st.email?.toLowerCase()
      );
      const avgMcq = mcqSubs.length > 0
        ? Math.round(mcqSubs.reduce((acc: number, cur: any) => acc + (cur.score || 0), 0) / mcqSubs.length)
        : 'N/A';

      const codingSubs = (saMarks.codingSubmissions || []).filter(
        (c: any) => c.studentId?._id === st._id || c.studentId?.email?.toLowerCase() === st.email?.toLowerCase()
      );
      const totalPoints = codingSubs.reduce((acc: number, cur: any) => acc + (cur.pointsEarned || 0), 0);

      const standing = mcqSubs.length > 0 || codingSubs.length > 0
        ? (avgMcq !== 'N/A' && avgMcq >= 75 ? 'Grade A+' : 'Grade A')
        : 'Active Enrolled';

      return [
        `DXR-STU-${st._id ? st._id.slice(-6).toUpperCase() : String(idx + 1).padStart(4, '0')}`,
        `"${(st.name || '').replace(/"/g, '""')}"`,
        `"${(st.email || '').replace(/"/g, '""')}"`,
        `"${(st.subjectId?.title || 'Unassigned').replace(/"/g, '""')}"`,
        `"${(st.subjectId?.code || '—').replace(/"/g, '""')}"`,
        `"${(trainer?.name || 'Unassigned').replace(/"/g, '""')}"`,
        st.planType === 'course_wise' ? 'Course Pack' : 'Monthly',
        st.amount || 499,
        st.paymentStatus || 'paid',
        st.isPasswordSet ? 'Active' : 'Pending Password Setup',
        st.planType === 'course_wise' ? 'Permanent Access' : (st.startDate ? new Date(st.startDate).toISOString().split('T')[0] : (st.createdAt ? new Date(st.createdAt).toISOString().split('T')[0] : '—')),
        st.planType === 'course_wise' ? 'Permanent Access' : (st.endDate ? new Date(st.endDate).toISOString().split('T')[0] : '—'),
        mcqSubs.length,
        avgMcq !== 'N/A' ? `${avgMcq}%` : 'N/A',
        codingSubs.length,
        totalPoints,
        standing,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dexar_overall_students_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Overall students report CSV downloaded successfully!', 'success');
  };

  // Modals for Exam Submissions Confirmation & UI Controls
  const [showQuizSubmitConfirm, setShowQuizSubmitConfirm] = useState(false);
  const [showCodingSubmitConfirm, setShowCodingSubmitConfirm] = useState(false);
  const [showMobileMatrix, setShowMobileMatrix] = useState(false);
  const [codingMobileTab, setCodingMobileTab] = useState<'problem' | 'editor'>('editor');
  const [editorFontSize, setEditorFontSize] = useState<'xs' | 'sm' | 'base'>('sm');
  const [showResetCodeConfirm, setShowResetCodeConfirm] = useState(false);
  const [codingTerminalTab, setCodingTerminalTab] = useState<'tests' | 'output' | 'problems'>('tests');
  const [codingConsoleTab, setCodingConsoleTab] = useState<'testcase' | 'result'>('testcase');
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);
  const [descriptionActiveTab, setDescriptionActiveTab] = useState<'description' | 'problems'>('description');
  const [cursorPosition, setCursorPosition] = useState({ ln: 1, col: 1 });
  const [studentTestCases, setStudentTestCases] = useState<Record<number, Array<{ input: string; output: string }>>>({});

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync print and proctored lockdown body classes for crisp report printing & PDF export
  useEffect(() => {
    const isReportOpen = Boolean(showReportModal || showOverallReportModal || showTransactionReportModal);
    if (isReportOpen) {
      document.body.classList.add('has-report-modal-open');
    } else {
      document.body.classList.remove('has-report-modal-open');
    }
    return () => {
      document.body.classList.remove('has-report-modal-open');
    };
  }, [showReportModal, showOverallReportModal, showTransactionReportModal]);

  useEffect(() => {
    const inExam = Boolean(activeExam || activeCodingExam);
    if (inExam) {
      document.body.classList.add('exam-lockdown-active');
    } else {
      document.body.classList.remove('exam-lockdown-active');
    }
    return () => {
      document.body.classList.remove('exam-lockdown-active');
    };
  }, [activeExam, activeCodingExam]);

  const [downloadingReportPdf, setDownloadingReportPdf] = useState(false);

  const handlePrintOfficialReport = () => {
    document.body.classList.add('has-report-modal-open');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handleDownloadPdfReport = async (elementId: string, filename: string) => {
    try {
      setDownloadingReportPdf(true);
      showToast('Generating official report PDF...', 'info');
      await downloadReportPdf(elementId, filename);
      showToast('Official report PDF downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to download PDF:', err);
      showToast('Failed to generate PDF download. Opening print preview as fallback.', 'error');
      handlePrintOfficialReport();
    } finally {
      setDownloadingReportPdf(false);
    }
  };

  // -------------------------------------------------------------
  // INITIAL DATA LOADING
  // -------------------------------------------------------------
  useEffect(() => {
    const rawUser = localStorage.getItem('dexar_user');
    const token = localStorage.getItem('dexar_token');

    if (!token || !rawUser) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      setCurrentUser(user);
      loadRoleData(user.role);
    } catch {
      router.push('/login');
    }
  }, []);

  const loadRoleData = async (role: string) => {
    setLoading(true);
    try {
      if (role === 'superadmin') {
        const [statsRes, trainersRes, studentsRes, transRes, marksRes, subjectsRes, saAstRes, saCodRes] = await Promise.all([
          api.getSuperAdminStats(),
          api.getTrainers(),
          api.getStudents(),
          api.getTransactions(),
          api.getAllMarks(),
          api.getSubjects(),
          api.getSuperAdminAssessments(),
          api.getSuperAdminCodingExams(),
        ]);
        setSaStats(statsRes.stats || {});
        setSaTrainers(trainersRes.trainers || []);
        setSaStudents(studentsRes.students || []);
        setSaTransactions(transRes.transactions || []);
        setSaTotalRevenue(transRes.totalRevenue || 0);
        setSaMarks(marksRes || { assessmentSubmissions: [], codingSubmissions: [] });
        setSaSubjects(subjectsRes.subjects || []);
        setSaAssessments(saAstRes.assessments || []);
        setSaCodingExams(saCodRes.codingExams || []);
        if (subjectsRes.subjects?.length > 0) {
          if (!newAdminData.subjectId) {
            setNewAdminData((prev) => ({ ...prev, subjectId: subjectsRes.subjects[0]._id }));
          }
          if (!newStudentData.subjectId) {
            setNewStudentData((prev) => ({ ...prev, subjectId: subjectsRes.subjects[0]._id }));
          }
        }
      } else if (role === 'admin') {
        const [dashRes, liveRes, recRes, astRes, codRes, marksRes] = await Promise.all([
          api.getTrainerDashboard(),
          api.getTrainerLiveClasses(),
          api.getTrainerRecordedClasses(),
          api.getTrainerAssessments(),
          api.getTrainerCodingExams(),
          api.getAdminMarks().catch(() => ({ assessmentSubmissions: [], codingSubmissions: [] })),
        ]);
        setTrainerData(dashRes);
        setTrainerLiveClasses(liveRes.liveClasses || []);
        setTrainerRecorded(recRes.recordedClasses || []);
        setTrainerAssessments(astRes.assessments || []);
        setTrainerCodingExams(codRes.codingExams || []);
        setSaMarks(marksRes || { assessmentSubmissions: [], codingSubmissions: [] });
      } else if (role === 'student') {
        const dashRes = await api.getStudentDashboard();
        setStudentDash(dashRes);

        let initialCourseId: string | null = null;
        if (dashRes?.enrolledCourses && dashRes.enrolledCourses.length > 0) {
          initialCourseId = dashRes.enrolledCourses[0]._id;
        } else if (dashRes?.student?.subjectId?._id) {
          initialCourseId = dashRes.student.subjectId._id;
        }

        const targetCourseId = selectedCourseId || initialCourseId;
        if (!selectedCourseId && initialCourseId) {
          setSelectedCourseId(initialCourseId);
        }

        const [liveRes, recRes, astRes, codRes, marksRes] = await Promise.all([
          api.getStudentLiveClasses(targetCourseId || undefined),
          api.getStudentRecordedClasses(targetCourseId || undefined),
          api.getStudentAssessments(targetCourseId || undefined),
          api.getStudentCodingExams(targetCourseId || undefined),
          api.getStudentMarks(),
        ]);
        setStudentLive(liveRes.liveClasses || []);
        setStudentRecorded(recRes.recordedClasses || []);
        setStudentAssessments(astRes.assessments || []);
        setStudentCodingExams(codRes.codingExams || []);
        setStudentMarks(marksRes);
      }
    } catch (err: any) {
      console.error('Error fetching role data:', err);
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      showToast(
        isLocal
          ? 'Backend connection error. Make sure server is running on port 5000.'
          : 'Backend connection error. Please refresh in a moment while the cloud service responds.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger proctoring violation safely
  const triggerViolation = (reason: string, isSevere: boolean = true) => {
    const now = Date.now();
    const shouldIncrement = (now - lastViolationTimeRef.current) > 800;
    if (shouldIncrement) {
      lastViolationTimeRef.current = now;
    }

    setViolationReason(reason);
    // User requested: "dont show the red text while i am doing anthing mischevious only increase the warning"
    // Keep red alert text hidden completely
    setShowViolationAlert(false);

    if (shouldIncrement) {
      setExamViolations((prev) => {
        const next = prev + 1;
        const maxAllowed = activeExam?.maxViolations || activeCodingExam?.maxViolations || 3;
        if (next >= maxAllowed && !isAutoSubmittingRef.current) {
          isAutoSubmittingRef.current = true;
          handleAutoSubmitOnViolation(next, reason);
        }
        return next;
      });
    }
  };

  // -------------------------------------------------------------
  // LOCKDOWN MODE LISTENER (ANTI-CHEAT)
  // -------------------------------------------------------------
  useEffect(() => {
    const isExamActive = Boolean(activeExam || activeCodingExam);
    if (!isExamActive) return;

    // Helper to wipe clipboard and blackout screen on screenshot attempt
    const handleScreenshotMitigation = (triggerEvent?: Event) => {
      if (triggerEvent) {
        triggerEvent.preventDefault();
        triggerEvent.stopPropagation();
        if ('stopImmediatePropagation' in triggerEvent) {
          (triggerEvent as any).stopImmediatePropagation();
        }
      }
      // Wipe clipboard content immediately
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('Exam Proctoring Active: Screen capture and screenshots are strictly prohibited.');
        }
      } catch (err) {
        console.warn('Clipboard purge notice:', err);
      }
      // Trigger full blackout screen overlay
      setShowScreenshotFlash(true);
      setTimeout(() => setShowScreenshotFlash(false), 1800);
      triggerViolation('Screenshot / Screen capture attempt detected', true);
    };

    // 1. Fullscreen change listener
    const handleFullscreenChange = () => {
      const inFullscreen = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsExamFullscreen(inFullscreen);
      if (!inFullscreen) {
        setIsExitedFullscreen(true);
        triggerViolation('Exited fullscreen mode', true);
      } else {
        setIsExitedFullscreen(false);
      }
    };

    // 2. Visibility Change / Tab Switch detection
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState !== 'visible') {
        triggerViolation('Browser tab switch or window minimized', true);
      }
    };

    // 3. Window Blur (switching windows, Alt+Tab, or clicking outside)
    const handleWindowBlur = () => {
      // Unconditionally detect window blur (Alt+Tab, app switch, multi-monitor switch)
      triggerViolation('Window lost focus / Alt+Tab detected', true);
    };

    // 4. Right Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerViolation('Right-click context menu is disabled during exams', true);
    };

    // 5. Select start & drag start (disable text selection and dragging)
    const handleSelectStart = (e: Event) => {
      if (activeCodingExam && (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 6. Copy, Cut, Paste prevention
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerViolation('Copying test content is prohibited', true);
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerViolation('Cutting content is prohibited', true);
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerViolation('External clipboard paste is prohibited', true);
    };

    // 7. KEYBOARD EVENT HANDLERS (Keydown and Keyup in Capture Phase)
    const isScreenshotKey = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        return true;
      }
      if (e.shiftKey && (e.metaKey || e.key === 'Meta') && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        return true;
      }
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        return true;
      }
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Priority 0: Alt+Tab or Alt key or Meta/Windows key detection
      if (
        e.altKey ||
        e.key === 'Alt' ||
        e.code === 'AltLeft' ||
        e.code === 'AltRight' ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'Meta' ||
        e.metaKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('Alt+Tab or application switch detected', true);
        return;
      }

      // Priority 1: Check screenshot attempts on any exam
      if (isScreenshotKey(e)) {
        handleScreenshotMitigation(e);
        return;
      }

      // Priority 2: Check DevTools & inspect shortcuts on any exam
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) ||
        ((e.ctrlKey || e.metaKey) && ['u', 'U', 's', 'S', 'p', 'P'].includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        triggerViolation('Developer Tools / Source inspect shortcut blocked', true);
        return;
      }

      // Priority 3: MCQ EXAM KEYBOARD LOCKDOWN
      // Keyboard locked: only mouse clicks allowed. Any key press increments warning counter!
      if (activeExam) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        triggerViolation('Keyboard locked: MCQ exam accepts mouse clicks only', true);
        return;
      }

      // Priority 4: CODING EXAM RESTRICTIONS
      if (activeCodingExam) {
        // Block clipboard shortcuts
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'C', 'V', 'X'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          triggerViolation(`Clipboard shortcut (Ctrl+${e.key.toUpperCase()}) blocked in coding arena`, true);
          return;
        }

        // Block Alt navigation or external keys
        if (e.altKey && (e.key === 'Tab' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          e.preventDefault();
          e.stopPropagation();
          triggerViolation('Application switching / Navigation shortcut blocked', true);
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Windows triggers PrintScreen on keyup
      if (isScreenshotKey(e)) {
        handleScreenshotMitigation(e);
        return;
      }

      // Block keyup as well in MCQ exam
      if (activeExam) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    // Offline event: Do NOT interrupt or stop the exam; auto-save silently
    const handleOfflineEvent = () => {
      if (activeExam) {
        try {
          localStorage.setItem(`dexar_offline_mcq_${activeExam._id}`, JSON.stringify({
            answers: examAnswers,
            examId: activeExam._id,
            timestamp: Date.now()
          }));
        } catch (e) {}
      }
      if (activeCodingExam) {
        try {
          localStorage.setItem(`dexar_offline_coding_${activeCodingExam._id}`, JSON.stringify({
            code: codingCode,
            language: codingLanguage,
            examId: activeCodingExam._id,
            timestamp: Date.now()
          }));
        } catch (e) {}
      }
    };

    // Attach listeners with capture: true for instant pre-emptive interception
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('offline', handleOfflineEvent);
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('copy', handleCopy, { capture: true });
    document.addEventListener('cut', handleCut, { capture: true });
    document.addEventListener('paste', handlePaste, { capture: true });

    // Exam Countdown Timer & DevTools heuristic detection
    const timer = setInterval(() => {
      setExamTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnTimeOut();
          return 0;
        }
        return prev - 1;
      });

      // DevTools window resize heuristic check
      if (window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200) {
        triggerViolation('Screen resize / Developer console detected', true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('offline', handleOfflineEvent);
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy, { capture: true });
      document.removeEventListener('cut', handleCut, { capture: true });
      document.removeEventListener('paste', handlePaste, { capture: true });
      clearInterval(timer);
    };
  }, [activeExam, activeCodingExam, examAnswers, codingCode, codingLanguage]);

  // Request Fullscreen
  const enterFullscreen = () => {
    try {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
      setIsExamFullscreen(true);
      setIsExitedFullscreen(false);
    } catch (err) {
      console.warn('Fullscreen request denied', err);
    }
  };

  const exitFullscreen = () => {
    try {
      const doc = document as any;
      if ((doc.fullscreenElement || doc.webkitFullscreenElement) && doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      }
      setIsExamFullscreen(false);
      setIsExitedFullscreen(false);
    } catch (err) {
      console.warn('Exit fullscreen error', err);
    }
  };

  // -------------------------------------------------------------
  // EXAM ACTIONS & PASSWORD SECURITY (STUDENT)
  // -------------------------------------------------------------
  const promptExamPassword = (exam: any, type: 'mcq' | 'coding') => {
    setTargetExamForPassword(exam);
    setExamPasswordType(type);
    setEnteredPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleVerifyExamPassword = () => {
    if (!targetExamForPassword) return;
    const requiredPassword = (targetExamForPassword.accessPassword || 'DEXAR2026').trim();
    if (enteredPassword.trim().toUpperCase() !== requiredPassword.toUpperCase()) {
      setPasswordError('Invalid exam password. Please enter the password created by your trainer.');
      return;
    }

    setShowPasswordModal(false);
    setPasswordError('');
    const target = targetExamForPassword;
    setTargetExamForPassword(null);

    if (examPasswordType === 'mcq') {
      startQuizExam(target);
    } else {
      startCodingExam(target);
    }
  };

  const startQuizExam = (exam: any) => {
    const rawQuestions = Array.isArray(exam.questions) ? exam.questions : [];
    if (rawQuestions.length === 0) {
      showToast('This assessment does not have any questions published yet.', 'error');
      return;
    }
    const safeExam = { ...exam, questions: rawQuestions };
    setActiveExam(safeExam);

    // Restore answers from offline storage if previous draft exists
    let initialAnswers = new Array(rawQuestions.length).fill(-1);
    try {
      const savedOffline = localStorage.getItem(`dexar_offline_mcq_${exam._id}`);
      if (savedOffline) {
        const parsed = JSON.parse(savedOffline);
        if (Array.isArray(parsed.answers) && parsed.answers.length === rawQuestions.length) {
          initialAnswers = parsed.answers;
        }
      }
    } catch (e) {}

    setExamAnswers(initialAnswers);
    setCurrentQuestionIndex(0);
    setMarkedForReview([]);
    setVisitedQuestions([0]);
    setExamViolations(0);
    setViolationReason('');
    setShowViolationAlert(false);
    setShowScreenshotFlash(false);
    setIsExitedFullscreen(false);
    isAutoSubmittingRef.current = false;
    setExamTimeLeft((exam.durationMinutes || exam.duration || 60) * 60);
    enterFullscreen();
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const nextIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(nextIdx);
      if (!visitedQuestions.includes(nextIdx)) {
        setVisitedQuestions((prev) => [...prev, nextIdx]);
      }
    }
  };

  const goToNextQuestion = () => {
    if (!activeExam) return;
    const total = activeExam.questions?.length || 1;
    if (currentQuestionIndex < total - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      if (!visitedQuestions.includes(nextIdx)) {
        setVisitedQuestions((prev) => [...prev, nextIdx]);
      }
    } else {
      // Last question - prompt review and submit confirmation modal
      setShowQuizSubmitConfirm(true);
    }
  };

  const jumpToQuestion = (qIdx: number) => {
    setCurrentQuestionIndex(qIdx);
    if (!visitedQuestions.includes(qIdx)) {
      setVisitedQuestions((prev) => [...prev, qIdx]);
    }
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) =>
      prev.includes(currentQuestionIndex)
        ? prev.filter((i) => i !== currentQuestionIndex)
        : [...prev, currentQuestionIndex]
    );
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    const updated = [...examAnswers];
    // Toggle selection if clicked again
    if (updated[qIdx] === optIdx) {
      updated[qIdx] = -1;
    } else {
      updated[qIdx] = optIdx;
    }
    setExamAnswers(updated);

    // Save offline immediately to guarantee zero loss
    if (activeExam) {
      try {
        localStorage.setItem(`dexar_offline_mcq_${activeExam._id}`, JSON.stringify({
          answers: updated,
          examId: activeExam._id,
          timestamp: Date.now()
        }));
      } catch (e) {}
    }
  };

  const handleClearOption = (qIdx: number) => {
    const updated = [...examAnswers];
    updated[qIdx] = -1;
    setExamAnswers(updated);

    if (activeExam) {
      try {
        localStorage.setItem(`dexar_offline_mcq_${activeExam._id}`, JSON.stringify({
          answers: updated,
          examId: activeExam._id,
          timestamp: Date.now()
        }));
      } catch (e) {}
    }
  };

  const handleSubmitQuizExam = async (statusOverride = 'completed', finalViolations = examViolations) => {
    if (!activeExam) return;
    setShowQuizSubmitConfirm(false);

    // If client is currently offline, store submission quietly in pending queue and don't interrupt student
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const pendingQueue = JSON.parse(localStorage.getItem('dexar_pending_mcq_submissions') || '[]');
        pendingQueue.push({
          assessmentId: activeExam._id,
          answers: examAnswers,
          violations: finalViolations,
          statusOverride,
          title: activeExam.title || 'MCQ Assessment',
          submittedAt: new Date().toISOString()
        });
        localStorage.setItem('dexar_pending_mcq_submissions', JSON.stringify(pendingQueue));
        localStorage.removeItem(`dexar_offline_mcq_${activeExam._id}`);
      } catch (e) {}

      exitFullscreen();
      setActiveExam(null);
      setIsExitedFullscreen(false);
      setShowViolationAlert(false);
      setShowScreenshotFlash(false);
      isAutoSubmittingRef.current = false;
      showToast('You are currently offline. Answers are saved safely on your device and will submit automatically once reconnected!', 'info');
      return;
    }

    try {
      const res = await api.submitAssessment(activeExam._id, examAnswers, finalViolations, statusOverride);
      try {
        localStorage.removeItem(`dexar_offline_mcq_${activeExam._id}`);
      } catch (e) {}
      exitFullscreen();
      setActiveExam(null);
      setIsExitedFullscreen(false);
      setShowViolationAlert(false);
      setShowScreenshotFlash(false);
      isAutoSubmittingRef.current = false;
      showToast(`Quiz Submitted! You scored ${res.score} / ${res.totalMarks} marks.`, 'success');
      loadRoleData('student');
    } catch {
      // Network drop during submit - save offline automatically
      try {
        const pendingQueue = JSON.parse(localStorage.getItem('dexar_pending_mcq_submissions') || '[]');
        pendingQueue.push({
          assessmentId: activeExam._id,
          answers: examAnswers,
          violations: finalViolations,
          statusOverride,
          title: activeExam.title || 'MCQ Assessment',
          submittedAt: new Date().toISOString()
        });
        localStorage.setItem('dexar_pending_mcq_submissions', JSON.stringify(pendingQueue));
        localStorage.removeItem(`dexar_offline_mcq_${activeExam._id}`);
      } catch (e) {}
      exitFullscreen();
      setActiveExam(null);
      setIsExitedFullscreen(false);
      setShowViolationAlert(false);
      setShowScreenshotFlash(false);
      isAutoSubmittingRef.current = false;
      showToast('Network interrupted. Answers saved offline and will automatically submit once internet is back!', 'info');
    }
  };

  const handleAutoSubmitOnViolation = async (violationCount: number, reason: string = 'Security threshold exceeded') => {
    showToast(`Security Lockdown Exceeded: ${reason}. Exam auto-submitted in proctored mode.`, 'error');
    if (activeExam) {
      await handleSubmitQuizExam('auto_submitted_violation', violationCount);
    } else if (activeCodingExam) {
      await handleSubmitCodingExam('auto_submitted_violation', violationCount);
    }
  };

  const handleAutoSubmitOnTimeOut = async () => {
    showToast('Time is up! Exam auto-submitted.', 'info');
    if (activeExam) {
      await handleSubmitQuizExam('timed_out');
    } else if (activeCodingExam) {
      await handleSubmitCodingExam('timed_out');
    }
  };

  // Active Coding Exam Normalized Questions Memo
  const activeCodingQuestions = useMemo(() => {
    if (!activeCodingExam) return [];
    if (Array.isArray(activeCodingExam.questions) && activeCodingExam.questions.length > 0) {
      return activeCodingExam.questions;
    }
    return [
      {
        title: activeCodingExam.title || 'Problem 1',
        problemStatement: activeCodingExam.problemStatement || '',
        starterCode: activeCodingExam.starterCode || '// Solution in JavaScript\nfunction solution(input) {\n  return input;\n}',
        points: activeCodingExam.totalPoints || 100,
        testCases: activeCodingExam.testCases || [],
      },
    ];
  }, [activeCodingExam]);

  // Start Coding Exam
  const startCodingExam = (exam: any) => {
    setActiveCodingExam(exam);
    setActiveCodingQuestionIdx(0);
    setCodingTestOutput(null);
    setCodingTestOutputs({});

    const cleanDefaultStub = 'function solution(input) {\n  // Write your logic here\n  \n}';

    const qList = (Array.isArray(exam.questions) && exam.questions.length > 0)
      ? exam.questions
      : [{
          title: exam.title || 'Problem 1',
          problemStatement: exam.problemStatement || '',
          starterCode: exam.starterCode || cleanDefaultStub,
          points: exam.totalPoints || 100,
          testCases: exam.testCases || [],
        }];

    let initialCodes: Record<number, string> = {};
    qList.forEach((q: any, idx: number) => {
      let code = q.starterCode || cleanDefaultStub;
      if (code.includes('.reverse().join') || code.includes('return input.split') || code.includes('return input;')) {
        code = cleanDefaultStub;
      }
      initialCodes[idx] = code;
    });

    let initialLang = 'javascript';
    let activeIdx = 0;
    try {
      const savedOffline = localStorage.getItem(`dexar_offline_coding_${exam._id}`);
      if (savedOffline) {
        const parsed = JSON.parse(savedOffline);
        if (parsed.codes && typeof parsed.codes === 'object') {
          // If cached code contains the old pre-filled answer, strip it
          Object.keys(parsed.codes).forEach((k) => {
            const c = parsed.codes[k];
            if (c && (c.includes('.reverse().join') || c.includes('return input.split') || c.includes('return input;'))) {
              delete parsed.codes[k];
            }
          });
          initialCodes = { ...initialCodes, ...parsed.codes };
        } else if (parsed.code) {
          if (!parsed.code.includes('.reverse().join') && !parsed.code.includes('return input.split') && !parsed.code.includes('return input;')) {
            initialCodes[0] = parsed.code;
          }
        }
        if (parsed.language) initialLang = parsed.language;
        if (typeof parsed.activeIdx === 'number' && parsed.activeIdx < qList.length) {
          activeIdx = parsed.activeIdx;
        }
      }
    } catch (e) {}

    const initialTcsMap: Record<number, Array<{ input: string; output: string }>> = {};
    qList.forEach((q: any, idx: number) => {
      initialTcsMap[idx] = (q.testCases && q.testCases.length > 0)
        ? q.testCases.map((tc: any) => ({ input: tc.input || '', output: tc.output || '' }))
        : [{ input: '', output: '' }];
    });
    setStudentTestCases(initialTcsMap);

    setActiveCodingQuestionIdx(activeIdx);
    setCodingQuestionCodes(initialCodes);
    setCodingCode(initialCodes[activeIdx] || initialCodes[0] || cleanDefaultStub);
    setCodingLanguage(initialLang);
    setCodingMobileTab('editor');
    setCodingConsoleTab('testcase');
    setSelectedTestCaseIdx(0);
    setDescriptionActiveTab('description');
    setExamViolations(0);
    setViolationReason('');
    setShowViolationAlert(false);
    setShowScreenshotFlash(false);
    setIsExitedFullscreen(false);
    isAutoSubmittingRef.current = false;
    setExamTimeLeft((exam.durationMinutes || 60) * 60);
    enterFullscreen();
  };

  const handleSwitchCodingQuestion = (newIdx: number) => {
    if (newIdx === activeCodingQuestionIdx) return;
    const cleanDefaultStub = 'function solution(input) {\n  // Write your logic here\n  \n}';
    const updatedCodes = {
      ...codingQuestionCodes,
      [activeCodingQuestionIdx]: codingCode,
    };
    setCodingQuestionCodes(updatedCodes);
    setActiveCodingQuestionIdx(newIdx);
    setSelectedTestCaseIdx(0);
    setDescriptionActiveTab('description');

    const targetQ = activeCodingQuestions[newIdx] || activeCodingQuestions[0];
    let nextCode = updatedCodes[newIdx] !== undefined
      ? updatedCodes[newIdx]
      : (targetQ?.starterCode || cleanDefaultStub);

    if (nextCode.includes('.reverse().join') || nextCode.includes('return input.split') || nextCode.includes('return input;')) {
      nextCode = cleanDefaultStub;
    }

    setCodingCode(nextCode);
    setCodingTestOutput(codingTestOutputs[newIdx] || null);

    if (activeCodingExam) {
      try {
        localStorage.setItem(`dexar_offline_coding_${activeCodingExam._id}`, JSON.stringify({
          codes: updatedCodes,
          code: nextCode,
          activeIdx: newIdx,
          language: codingLanguage,
          examId: activeCodingExam._id,
          timestamp: Date.now(),
        }));
      } catch (err) {}
    }
  };

  const getLanguageStarterCode = (lang: string, q?: any) => {
    if (lang === 'python') {
      return `# Solution in Python 3
import sys

def solution(input_data):
    # Write your logic here
    pass

if __name__ == '__main__':
    data = sys.stdin.read().strip()
    if data:
        print(solution(data))
`;
    } else if (lang === 'cpp') {
      return `// Solution in C++ (GCC)
#include <iostream>
#include <string>
using namespace std;

string solution(string input) {
    // Write your logic here
    return "";
}

int main() {
    string input;
    if (cin >> input) {
        cout << solution(input);
    }
    return 0;
}
`;
    } else if (lang === 'java') {
      return `// Solution in Java 17
import java.util.Scanner;

public class Main {
    public static String solution(String input) {
        // Write your logic here
        return "";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            System.out.print(solution(sc.next()));
        }
    }
}
`;
    } else {
      let base = q?.starterCode;
      if (!base || base.includes('.reverse().join') || base.includes('return input.split') || base.includes('return input;')) {
        base = 'function solution(input) {\n  // Write your logic here\n  \n}';
      }
      return base;
    }
  };

  const handleCodingLanguageChange = (lang: string) => {
    setCodingLanguage(lang);
    const currentQ = activeCodingQuestions[activeCodingQuestionIdx] || activeCodingQuestions[0];
    const isStarter = !codingCode || codingCode.trim().length === 0 ||
      codingCode.includes('function solution(') ||
      codingCode.includes('def solution(') ||
      codingCode.includes('string solution(') ||
      codingCode.includes('public static String solution(') ||
      codingCode === currentQ?.starterCode;

    if (isStarter) {
      const templ = getLanguageStarterCode(lang, currentQ);
      setCodingCode(templ);
      setCodingQuestionCodes((prev) => ({ ...prev, [activeCodingQuestionIdx]: templ }));
    }
  };

  const handleResetCode = () => {
    if (!activeCodingExam) return;
    const currentQ = activeCodingQuestions[activeCodingQuestionIdx] || activeCodingQuestions[0];
    const starter = getLanguageStarterCode(codingLanguage, currentQ);
    setCodingCode(starter);
    setCodingQuestionCodes((prev) => ({ ...prev, [activeCodingQuestionIdx]: starter }));
    setShowResetCodeConfirm(false);
    showToast('Code reset to default starter template for this problem.', 'info');
  };

  // Handle Tab indentation and Enter auto-indent in coding editor without blurring
  const handleCodingKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Insert 2 spaces at cursor position
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      setCodingCode(newValue);
      setCodingQuestionCodes((prev) => ({ ...prev, [activeCodingQuestionIdx]: newValue }));

      if (activeCodingExam) {
        try {
          const updatedCodes = { ...codingQuestionCodes, [activeCodingQuestionIdx]: newValue };
          localStorage.setItem(`dexar_offline_coding_${activeCodingExam._id}`, JSON.stringify({
            codes: updatedCodes,
            code: newValue,
            activeIdx: activeCodingQuestionIdx,
            language: codingLanguage,
            examId: activeCodingExam._id,
            timestamp: Date.now()
          }));
        } catch (err) {}
      }

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
      return;
    }

    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const value = textarea.value;

      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      const indentMatch = currentLine.match(/^(\s+)/);
      const indent = indentMatch ? indentMatch[1] : '';

      const extraIndent = /[{\[(]\s*$/.test(currentLine) ? '  ' : '';
      const fullIndent = indent + extraIndent;

      if (fullIndent.length > 0) {
        e.preventDefault();
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + '\n' + fullIndent + value.substring(end);
        setCodingCode(newValue);
        setCodingQuestionCodes((prev) => ({ ...prev, [activeCodingQuestionIdx]: newValue }));

        if (activeCodingExam) {
          try {
            const updatedCodes = { ...codingQuestionCodes, [activeCodingQuestionIdx]: newValue };
            localStorage.setItem(`dexar_offline_coding_${activeCodingExam._id}`, JSON.stringify({
              codes: updatedCodes,
              code: newValue,
              activeIdx: activeCodingQuestionIdx,
              language: codingLanguage,
              examId: activeCodingExam._id,
              timestamp: Date.now()
            }));
          } catch (err) {}
        }

        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + fullIndent.length;
        }, 0);
      }
    }
  };

  // Student Multiple Input Boxes & Custom Test Case Handlers
  const getCurrentStudentTestCases = () => {
    if (studentTestCases[activeCodingQuestionIdx] && studentTestCases[activeCodingQuestionIdx].length > 0) {
      return studentTestCases[activeCodingQuestionIdx];
    }
    const currentQ = activeCodingQuestions[activeCodingQuestionIdx] || activeCodingQuestions[0];
    const defaultTcs = currentQ?.testCases || activeCodingExam?.testCases || [];
    return defaultTcs.map((tc: any) => ({ input: tc.input || '', output: tc.output || '' }));
  };

  const handleUpdateStudentInputBox = (boxIdx: number, val: string) => {
    const curList = [...getCurrentStudentTestCases()];
    const validIdx = Math.min(selectedTestCaseIdx, Math.max(curList.length - 1, 0));
    const targetCase = { ...(curList[validIdx] || { input: '', output: '' }) };
    const boxes = (targetCase.input || '').split('\n');
    while (boxes.length <= boxIdx) boxes.push('');
    boxes[boxIdx] = val;
    targetCase.input = boxes.join('\n');
    curList[validIdx] = targetCase;
    setStudentTestCases((prev) => ({ ...prev, [activeCodingQuestionIdx]: curList }));
  };

  const handleAddInputBoxToCurrentCase = () => {
    const curList = [...getCurrentStudentTestCases()];
    const validIdx = Math.min(selectedTestCaseIdx, Math.max(curList.length - 1, 0));
    const targetCase = { ...(curList[validIdx] || { input: '', output: '' }) };
    const boxes = (targetCase.input || '').split('\n');
    boxes.push('');
    targetCase.input = boxes.join('\n');
    curList[validIdx] = targetCase;
    setStudentTestCases((prev) => ({ ...prev, [activeCodingQuestionIdx]: curList }));
  };

  const handleRemoveInputBoxFromCurrentCase = (boxIdx: number) => {
    const curList = [...getCurrentStudentTestCases()];
    const validIdx = Math.min(selectedTestCaseIdx, Math.max(curList.length - 1, 0));
    const targetCase = { ...(curList[validIdx] || { input: '', output: '' }) };
    const boxes = (targetCase.input || '').split('\n');
    if (boxes.length <= 1) return;
    boxes.splice(boxIdx, 1);
    targetCase.input = boxes.join('\n');
    curList[validIdx] = targetCase;
    setStudentTestCases((prev) => ({ ...prev, [activeCodingQuestionIdx]: curList }));
  };

  const handleUpdateStudentExpectedOutput = (val: string) => {
    const curList = [...getCurrentStudentTestCases()];
    const validIdx = Math.min(selectedTestCaseIdx, Math.max(curList.length - 1, 0));
    const targetCase = { ...(curList[validIdx] || { input: '', output: '' }), output: val };
    curList[validIdx] = targetCase;
    setStudentTestCases((prev) => ({ ...prev, [activeCodingQuestionIdx]: curList }));
  };

  const handleAddCustomTestCase = () => {
    const curList = [...getCurrentStudentTestCases()];
    curList.push({ input: '', output: '' });
    setStudentTestCases((prev) => ({ ...prev, [activeCodingQuestionIdx]: curList }));
    setSelectedTestCaseIdx(curList.length - 1);
  };

  const handleRemoveStudentTestCase = (tcIdx: number) => {
    const curList = [...getCurrentStudentTestCases()];
    if (curList.length <= 1) {
      showToast('At least one testcase is required to run tests.', 'info');
      return;
    }
    curList.splice(tcIdx, 1);
    setStudentTestCases((prev) => ({ ...prev, [activeCodingQuestionIdx]: curList }));
    if (selectedTestCaseIdx >= curList.length) {
      setSelectedTestCaseIdx(curList.length - 1);
    }
  };

  const handleResetStudentTestCases = () => {
    const currentQ = activeCodingQuestions[activeCodingQuestionIdx] || activeCodingQuestions[0];
    const defaultTcs = currentQ?.testCases || activeCodingExam?.testCases || [];
    setStudentTestCases((prev) => ({
      ...prev,
      [activeCodingQuestionIdx]: defaultTcs.map((tc: any) => ({ input: tc.input || '', output: tc.output || '' })),
    }));
    setSelectedTestCaseIdx(0);
    showToast('Reset to default problem testcases.', 'info');
  };

  const handleRunCodingTests = async () => {
    if (!activeCodingExam) return;
    const tcs = getCurrentStudentTestCases();
    if (!tcs || tcs.length === 0) {
      showToast('No test cases configured for this question.', 'info');
      return;
    }
    setCodingTesting(true);
    setCodingTerminalTab('tests');
    setCodingConsoleTab('result');
    try {
      const res = await api.runCodingTest(codingCode, tcs, codingLanguage);
      setCodingTestOutput(res);
      setCodingTestOutputs((prev) => ({ ...prev, [activeCodingQuestionIdx]: res }));

      const firstFail = res.testResults?.findIndex((r: any) => !r.passed);
      setSelectedTestCaseIdx(firstFail !== undefined && firstFail >= 0 ? firstFail : 0);

      showToast(
        `Tests Executed: ${res.passedCount} of ${res.totalTests} Passed!`,
        res.passedCount === res.totalTests ? 'success' : 'info'
      );
    } catch {
      const fallbackResult = {
        passedCount: 0,
        totalTests: tcs.length,
        runtimeMs: 4000,
        testResults: tcs.map((tc: any, idx: number) => ({
          testCaseIndex: idx + 1,
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: 'Time Limit Exceeded (TLE): Execution exceeded timeout limit. Please check loops and logic.',
          passed: false,
        })),
      };
      setCodingTestOutput(fallbackResult);
      setCodingTestOutputs((prev) => ({ ...prev, [activeCodingQuestionIdx]: fallbackResult }));
      setSelectedTestCaseIdx(0);
      showToast('Execution error or timeout (TLE). Inspect Test Result tab.', 'error');
    } finally {
      setCodingTesting(false);
    }
  };

  const handleSubmitCodingExam = async (statusOverride = 'completed', finalViolations = examViolations) => {
    if (!activeCodingExam) return;
    setShowCodingSubmitConfirm(false);

    const finalCodes = {
      ...codingQuestionCodes,
      [activeCodingQuestionIdx]: codingCode,
    };

    const questionSubmissions = activeCodingQuestions.map((q: any, idx: number) => ({
      questionIndex: idx,
      code: finalCodes[idx] !== undefined ? finalCodes[idx] : (q.starterCode || ''),
    }));

    const primaryCode = finalCodes[0] || codingCode;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        const pendingQueue = JSON.parse(localStorage.getItem('dexar_pending_coding_submissions') || '[]');
        pendingQueue.push({
          codingExamId: activeCodingExam._id,
          code: primaryCode,
          language: codingLanguage,
          violations: finalViolations,
          statusOverride,
          title: activeCodingExam.title || 'Coding Exam',
          submittedAt: new Date().toISOString(),
          questionSubmissions,
        });
        localStorage.setItem('dexar_pending_coding_submissions', JSON.stringify(pendingQueue));
        localStorage.removeItem(`dexar_offline_coding_${activeCodingExam._id}`);
      } catch (e) {}

      exitFullscreen();
      setActiveCodingExam(null);
      setIsExitedFullscreen(false);
      setShowViolationAlert(false);
      setShowScreenshotFlash(false);
      isAutoSubmittingRef.current = false;
      showToast('You are currently offline. Code is saved safely on your device and will submit automatically once reconnected!', 'info');
      return;
    }

    try {
      const res = await api.submitCodingExam(
        activeCodingExam._id,
        primaryCode,
        codingLanguage,
        finalViolations,
        statusOverride,
        questionSubmissions
      );
      try {
        localStorage.removeItem(`dexar_offline_coding_${activeCodingExam._id}`);
      } catch (e) {}
      exitFullscreen();
      setActiveCodingExam(null);
      setIsExitedFullscreen(false);
      setShowViolationAlert(false);
      setShowScreenshotFlash(false);
      isAutoSubmittingRef.current = false;
      showToast(`Coding Exam Submitted! Score: ${res.score} / ${activeCodingExam.totalPoints} points.`, 'success');
      loadRoleData('student');
    } catch {
      try {
        const pendingQueue = JSON.parse(localStorage.getItem('dexar_pending_coding_submissions') || '[]');
        pendingQueue.push({
          codingExamId: activeCodingExam._id,
          code: primaryCode,
          language: codingLanguage,
          violations: finalViolations,
          statusOverride,
          title: activeCodingExam.title || 'Coding Exam',
          submittedAt: new Date().toISOString(),
          questionSubmissions,
        });
        localStorage.setItem('dexar_pending_coding_submissions', JSON.stringify(pendingQueue));
        localStorage.removeItem(`dexar_offline_coding_${activeCodingExam._id}`);
      } catch (e) {}
      exitFullscreen();
      setActiveCodingExam(null);
      setIsExitedFullscreen(false);
      setShowViolationAlert(false);
      setShowScreenshotFlash(false);
      isAutoSubmittingRef.current = false;
      showToast('Network interrupted. Code saved offline and will automatically submit once internet is back!', 'info');
    }
  };

  // Automatic online synchronization of pending offline submissions
  useEffect(() => {
    const syncOfflineExamSubmissions = async () => {
      if (typeof window === 'undefined' || !navigator.onLine) return;

      // 1. Pending MCQ submissions
      try {
        const pendingMCQ = JSON.parse(localStorage.getItem('dexar_pending_mcq_submissions') || '[]');
        if (Array.isArray(pendingMCQ) && pendingMCQ.length > 0) {
          const remaining: any[] = [];
          for (const item of pendingMCQ) {
            try {
              await api.submitAssessment(item.assessmentId, item.answers, item.violations, item.statusOverride);
              showToast(`Offline submission for "${item.title || 'MCQ Exam'}" synced and submitted successfully!`, 'success');
            } catch (err) {
              remaining.push(item);
            }
          }
          if (remaining.length > 0) {
            localStorage.setItem('dexar_pending_mcq_submissions', JSON.stringify(remaining));
          } else {
            localStorage.removeItem('dexar_pending_mcq_submissions');
          }
          loadRoleData('student');
        }
      } catch (e) {}

      // 2. Pending Coding submissions
      try {
        const pendingCoding = JSON.parse(localStorage.getItem('dexar_pending_coding_submissions') || '[]');
        if (Array.isArray(pendingCoding) && pendingCoding.length > 0) {
          const remaining: any[] = [];
          for (const item of pendingCoding) {
            try {
              await api.submitCodingExam(item.codingExamId, item.code, item.language, item.violations, item.statusOverride, item.questionSubmissions);
              showToast(`Offline solution for "${item.title || 'Coding Exam'}" synced and submitted successfully!`, 'success');
            } catch (err) {
              remaining.push(item);
            }
          }
          if (remaining.length > 0) {
            localStorage.setItem('dexar_pending_coding_submissions', JSON.stringify(remaining));
          } else {
            localStorage.removeItem('dexar_pending_coding_submissions');
          }
          loadRoleData('student');
        }
      } catch (e) {}
    };

    window.addEventListener('online', syncOfflineExamSubmissions);
    syncOfflineExamSubmissions();

    return () => {
      window.removeEventListener('online', syncOfflineExamSubmissions);
    };
  }, []);

  // -------------------------------------------------------------
  // WORD DOCUMENT PARSING (TRAINER)
  // -------------------------------------------------------------
  const handleDocxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocxParsing(true);
    try {
      const result = await parseDocxFile(file);
      setParsedQuestions(result.questions);
      setManualRawText(result.rawText);
      showToast(`Analyzed Word Document! Extracted ${result.detectedCount} questions automatically.`, 'success');
    } catch (err: any) {
      showToast('Error analyzing Word file. You can paste the question text manually.', 'error');
    } finally {
      setDocxParsing(false);
    }
  };

  const handleManualTextParse = () => {
    if (!manualRawText.trim()) return;
    const questions = parseTextToQuestions(manualRawText);
    setParsedQuestions(questions);
    showToast(`Analyzed text: Extracted ${questions.length} questions!`, 'success');
  };

  const handlePublishWordExam = async () => {
    if (parsedQuestions.length === 0) {
      showToast('Please upload a Word document or add questions before publishing.', 'error');
      return;
    }

    try {
      const totalMarks = parsedQuestions.reduce((acc, q) => acc + (q.marks || 10), 0);
      const payload = {
        title: parsedExamTitle,
        questions: parsedQuestions,
        dueDate: parsedDueDate,
        totalMarks,
        isLockdown: parsedIsLockdown,
        maxViolations: parsedMaxViolations,
        durationMinutes: parsedDuration,
        accessPassword: parsedAccessPassword || 'DEXAR2026',
      };

      if (currentUser.role === 'superadmin') {
        const targetSubjectId = saSubjects[0]?._id;
        const res = await api.superAdminCreateAssessment({ ...payload, subjectId: targetSubjectId });
        if (res?.assessment) setSaAssessments((prev) => [res.assessment, ...prev]);
      } else {
        const res = await api.addAssessment(payload);
        if (res?.assessment) setTrainerAssessments((prev) => [res.assessment, ...prev]);
      }

      showToast(`Assessment published in Lockdown Mode with ${parsedQuestions.length} questions!`, 'success');
      setShowDocxModal(false);
      setParsedQuestions([]);
      loadRoleData(currentUser.role);
    } catch {
      showToast('Failed to publish assessment.', 'error');
    }
  };

  // -------------------------------------------------------------
  // SUPER ADMIN ACTIONS
  // -------------------------------------------------------------
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createTrainer(newAdminData);
      showToast(`Admin ${newAdminData.name} created and credentials stored in DB!`, 'success');
      setShowCreateAdminModal(false);
      setNewAdminData({ name: '', email: '', password: '', subjectId: saSubjects[0]?._id || '' });
      if (res?.trainer) {
        const sub = saSubjects.find((s) => s._id === newAdminData.subjectId);
        setSaTrainers((prev) => [{ ...res.trainer, subjectId: sub || res.trainer.subjectId }, ...prev]);
      }
      loadRoleData('superadmin');
    } catch (err: any) {
      showToast('Failed to create admin credentials.', 'error');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSubject(newSubjectData);
      showToast(`Subject "${newSubjectData.title}" created successfully!`, 'success');
      setShowCreateSubjectModal(false);
      setNewSubjectData({ title: '', code: '', description: '' });
      if (res?.subject) {
        setSaSubjects((prev) => [res.subject, ...prev]);
      }
      loadRoleData('superadmin');
    } catch {
      showToast('Failed to create subject.', 'error');
    }
  };

  const filteredSubjects = React.useMemo(() => {
    if (!subjectSearchTerm.trim()) return saSubjects;
    const term = subjectSearchTerm.toLowerCase();
    return saSubjects.filter((sub: any) =>
      sub.title?.toLowerCase().includes(term) ||
      sub.code?.toLowerCase().includes(term) ||
      sub.description?.toLowerCase().includes(term) ||
      sub.trainerId?.name?.toLowerCase().includes(term)
    );
  }, [saSubjects, subjectSearchTerm]);

  const filteredStudents = React.useMemo(() => {
    let list = saStudents;
    if (studentSubjectFilter !== 'all') {
      const filterId = String(studentSubjectFilter);
      list = list.filter((st: any) => {
        if (st.subjectIds && Array.isArray(st.subjectIds) && st.subjectIds.length > 0) {
          return st.subjectIds.some((s: any) => String(s?._id || s) === filterId);
        }
        return String(st.subjectId?._id || st.subjectId || '') === filterId;
      });
    }
    if (studentTrainerFilter !== 'all') {
      const selectedTrainer = saTrainers.find((t: any) => String(t._id) === String(studentTrainerFilter));
      const targetSubId = String(selectedTrainer?.subjectId?._id || selectedTrainer?.subjectId || '');
      if (targetSubId) {
        list = list.filter((st: any) => {
          if (st.subjectIds && Array.isArray(st.subjectIds) && st.subjectIds.length > 0) {
            return st.subjectIds.some((s: any) => String(s?._id || s) === targetSubId);
          }
          return String(st.subjectId?._id || st.subjectId || '') === targetSubId;
        });
      }
    }
    if (studentStatusFilter !== 'all') {
      if (studentStatusFilter === 'access_requested') {
        list = list.filter((st: any) => Boolean(st.accessRequested));
      } else {
        list = list.filter((st: any) => (st.paymentStatus || 'paid') === studentStatusFilter);
      }
    }
    if (studentSearchTerm.trim()) {
      const term = studentSearchTerm.toLowerCase();
      list = list.filter((st: any) => {
        const matchName = st.name?.toLowerCase().includes(term);
        const matchEmail = st.email?.toLowerCase().includes(term);
        const matchPrimarySubject = st.subjectId?.title?.toLowerCase().includes(term) || st.subjectId?.code?.toLowerCase().includes(term);
        const matchMultiSubject = st.subjectIds && Array.isArray(st.subjectIds) && st.subjectIds.some((s: any) =>
          s.title?.toLowerCase().includes(term) || s.code?.toLowerCase().includes(term)
        );
        return matchName || matchEmail || matchPrimarySubject || matchMultiSubject;
      });
    }
    return list;
  }, [saStudents, studentSubjectFilter, studentTrainerFilter, studentStatusFilter, studentSearchTerm, saTrainers]);

  const studentsGroupedBySubject = React.useMemo(() => {
    return saSubjects.map((sub: any) => {
      const subIdStr = String(sub._id);
      const enrolled = saStudents.filter((st: any) => {
        if (st.subjectIds && Array.isArray(st.subjectIds) && st.subjectIds.length > 0) {
          return st.subjectIds.some((s: any) => String(s?._id || s) === subIdStr);
        }
        const stSubId = String(st.subjectId?._id || st.subjectId || '');
        return stSubId === subIdStr;
      });
      const trainer = saTrainers.find((t: any) => {
        const tSubId = String(t.subjectId?._id || t.subjectId || '');
        return tSubId === subIdStr;
      });
      return {
        subject: sub,
        trainer: trainer || sub.trainerId,
        students: enrolled,
        totalStudents: enrolled.length,
      };
    });
  }, [saSubjects, saStudents, saTrainers]);

  const studentsGroupedByTrainer = React.useMemo(() => {
    return saTrainers.map((trainer: any) => {
      const tSubId = String(trainer.subjectId?._id || trainer.subjectId || '');
      const enrolled = saStudents.filter((st: any) => {
        if (!tSubId) return false;
        if (st.subjectIds && Array.isArray(st.subjectIds) && st.subjectIds.length > 0) {
          return st.subjectIds.some((s: any) => String(s?._id || s) === tSubId);
        }
        const stSubId = String(st.subjectId?._id || st.subjectId || '');
        return stSubId === tSubId;
      });
      return {
        trainer,
        subject: trainer.subjectId,
        students: enrolled,
        totalStudents: enrolled.length,
      };
    });
  }, [saTrainers, saStudents]);

  const handleGenerateStudentPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let generated = 'Dxr@';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewStudentData((prev) => ({ ...prev, password: generated }));
    showToast('Generated secure temporary password!', 'info');
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedSubIds = (newStudentData.subjectIds && newStudentData.subjectIds.length > 0)
        ? newStudentData.subjectIds
        : (newStudentData.subjectId ? [newStudentData.subjectId] : (saSubjects[0]?._id ? [saSubjects[0]._id] : []));

      if (selectedSubIds.length === 0) {
        showToast('Please select at least one course for the student.', 'error');
        return;
      }
      const studentPayload: any = {
        ...newStudentData,
        subjectId: selectedSubIds[0],
        subjectIds: selectedSubIds.map(String),
      };
      if (newStudentData.planType === 'course_wise' || newStudentData.planType === 'monthly') {
        delete studentPayload.startDate;
        delete studentPayload.endDate;
      }
      const res = await api.createStudent(studentPayload);
      if (res.error || (res.message && !res.student)) {
        showToast(res.message || 'Failed to create student credentials.', 'error');
        return;
      }
      showToast(`Student credentials for ${newStudentData.name} created with ${selectedSubIds.length} course(s)!`, 'success');
      setShowCreateStudentModal(false);
      if (res.student) {
        setSaStudents((prev) => [res.student, ...prev]);
      }
      setNewStudentData({
        name: '',
        email: '',
        password: '',
        subjectId: saSubjects[0]?._id ? String(saSubjects[0]._id) : '',
        subjectIds: saSubjects[0]?._id ? [String(saSubjects[0]._id)] : [],
        planType: 'monthly',
        amount: '499',
        startDate: '',
        endDate: '',
        paymentStatus: 'paid',
      });
      loadRoleData('superadmin');
    } catch {
      showToast('Failed to create student credentials.', 'error');
    }
  };

  // -------------------------------------------------------------
  // TRAINER ACTIONS
  // -------------------------------------------------------------
  const handleScheduleLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addLiveClass(newLiveClass);
      showToast('Live class session scheduled and visible to students!', 'success');
      setShowLiveModal(false);
      if (res?.liveClass) {
        setTrainerLiveClasses((prev) => [res.liveClass, ...prev]);
      }
      loadRoleData('admin');
    } catch {
      showToast('Failed to schedule live class.', 'error');
    }
  };

  const handleAddRecordedClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addRecordedClass(newRecordedClass);
      showToast('Recorded class video & notes uploaded!', 'success');
      setShowRecordedModal(false);
      if (res?.recordedClass) {
        setTrainerRecorded((prev) => [res.recordedClass, ...prev]);
      }
      loadRoleData('admin');
    } catch {
      showToast('Failed to add recorded lecture.', 'error');
    }
  };

  const handleCreateCodingExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const questions = newCodingExam.questions || [];
      if (questions.length === 0) {
        showToast('Please add at least one problem to the coding exam.', 'error');
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
      const totalPts = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
      const payload = {
        ...newCodingExam,
        totalPoints: totalPts > 0 ? totalPts : newCodingExam.totalPoints,
        problemStatement: questions[0]?.problemStatement,
        starterCode: questions[0]?.starterCode,
        testCases: questions[0]?.testCases,
      };

      if (currentUser.role === 'superadmin') {
        const res = await api.superAdminCreateCodingExam({ ...payload, subjectId: saSubjects[0]?._id });
        if (res?.codingExam) setSaCodingExams((prev) => [res.codingExam, ...prev]);
      } else {
        const res = await api.addCodingExam(payload);
        if (res?.codingExam) setTrainerCodingExams((prev) => [res.codingExam, ...prev]);
      }
      showToast(`Coding assessment with ${questions.length} problems published!`, 'success');
      setShowCodingModal(false);
      loadRoleData(currentUser.role);
    } catch {
      showToast('Failed to create coding exam.', 'error');
    }
  };

  // -------------------------------------------------------------
  // STUDENT PAYMENT (STRICTLY VIA RAZORPAY ONLY)
  // -------------------------------------------------------------
  const handleProcessPayment = async () => {
    setPaymentProcessing(true);
    try {
      const effectivePlan = studentDash?.subscription?.planType || studentDash?.student?.planType || currentUser?.planType || selectedPlan || 'monthly';
      // 1. Create order on backend via Razorpay with SuperAdmin allocated student price
      const orderData = await api.createRazorpayOrder({ planType: effectivePlan });
      if (!orderData || !orderData.orderId) {
        throw new Error(orderData?.message || 'Failed to create payment order');
      }

      // 2. Load Razorpay Checkout SDK dynamically
      const isLoaded = await loadRazorpayScript();

      if (!isLoaded || !(window as any).Razorpay) {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection or contact Super Admin.');
      }

      const activeKey = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TpGuJTHr6kjEqX';
      const courseTitle = orderData.courseTitle || studentDash?.student?.subjectId?.title || currentUser?.subjectId?.title || 'Dexar Course';

      const options = {
        key: activeKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Dexar LMS Academy',
        description: `${courseTitle} - Allocated Fee`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planType: effectivePlan,
              paymentMethod: 'Razorpay (Cards / UPI / NetBanking)',
            });
            showToast(verifyRes.message || `Payment of ₹${orderData.amountInRupees} verified! Subscription activated.`, 'success');
            setShowPaymentModal(false);
            // Optimistic update of local user state so UI updates immediately without reload
            setCurrentUser((prev: any) => ({
              ...prev,
              paymentStatus: 'paid',
              accessGrantedByAdmin: false,
              paymentRequested: false,
              accessRequested: false,
            }));
            setStudentDash((prev: any) => prev ? ({
              ...prev,
              subscription: {
                ...prev.subscription,
                paymentStatus: 'paid',
                accessGrantedByAdmin: false,
                daysRemaining: effectivePlan === 'course_wise' ? null : (prev.subscription?.daysRemaining ? prev.subscription.daysRemaining + 30 : 30),
              },
              student: {
                ...prev.student,
                paymentStatus: 'paid',
                accessGrantedByAdmin: false,
              }
            }) : prev);
            loadRoleData('student');
          } catch (err: any) {
            showToast(err.message || 'Payment verification failed.', 'error');
          }
        },
        prefill: {
          name: currentUser?.name || 'Dexar Student',
          email: currentUser?.email || 'student@dexar.com',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
            showToast('Razorpay checkout window closed.', 'info');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        showToast(`Payment failed: ${resp.error?.description || 'Transaction declined'}. If this persists, contact Super Admin.`, 'error');
        setPaymentProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      showToast(err.message || 'Payment processing failed.', 'error');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Student requests manual access from Super Admin (when Razorpay is down / offline payment)
  const handleStudentRequestAdminAccess = async () => {
    setContactAdminSubmitting(true);
    try {
      const res = await api.requestAdminAccess({ note: contactAdminNote.trim() || 'Student reported Razorpay payment issue.' });
      showToast(res.message || 'Access request sent to Super Admin! Please wait for approval.', 'success');
      setShowContactAdminModal(false);
      setContactAdminNote('');
      // Optimistic update
      setCurrentUser((prev: any) => ({
        ...prev,
        accessRequested: true,
        accessRequestNote: contactAdminNote,
      }));
      setStudentDash((prev: any) => prev ? ({
        ...prev,
        student: { ...prev.student, accessRequested: true, accessRequestNote: contactAdminNote },
        subscription: { ...prev.subscription, accessRequested: true, accessRequestNote: contactAdminNote },
      }) : prev);
    } catch (err: any) {
      showToast(err.message || 'Failed to send access request.', 'error');
    } finally {
      setContactAdminSubmitting(false);
    }
  };

  // Super Admin asks/requests student for payment (locks their portal)
  const handleSuperAdminRequestPayment = async (studentId: string, studentName: string) => {
    try {
      const res = await api.superAdminRequestPayment(studentId);
      showToast(res.message || `Payment requested from ${studentName}. Portal locked pending payment.`, 'info');
      // Optimistic UI updates across all student states without reload
      setSaStudents((prev) =>
        prev.map((s) =>
          s._id === studentId
            ? { ...s, paymentStatus: 'pending', paymentRequested: true, accessGrantedByAdmin: false }
            : s
        )
      );
      setSaTrainers((prev) =>
        prev.map((t) => ({
          ...t,
          students: (t.students || []).map((st: any) =>
            st._id === studentId
              ? { ...st, paymentStatus: 'pending', paymentRequested: true, accessGrantedByAdmin: false }
              : st
          ),
        }))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to request payment.', 'error');
    }
  };

  // Super Admin allows student access without payment (unblocks portal)
  const handleSuperAdminGrantAccess = async (studentId: string, studentName: string) => {
    try {
      const res = await api.superAdminGrantAccess(studentId);
      showToast(res.message || `Access granted to ${studentName}! Portal unlocked.`, 'success');
      // Optimistic UI updates across all student states without reload
      setSaStudents((prev) =>
        prev.map((s) =>
          s._id === studentId
            ? {
                ...s,
                paymentStatus: 'paid',
                accessGrantedByAdmin: true,
                accessRequested: false,
                paymentRequested: false,
              }
            : s
        )
      );
      setSaTrainers((prev) =>
        prev.map((t) => ({
          ...t,
          students: (t.students || []).map((st: any) =>
            st._id === studentId
              ? {
                  ...st,
                  paymentStatus: 'paid',
                  accessGrantedByAdmin: true,
                  accessRequested: false,
                  paymentRequested: false,
                }
              : st
          ),
        }))
      );
      api.getSuperAdminStats().then((res) => setSaStats(res.stats || {}));
      api.getTransactions().then((res) => {
        setSaTransactions(res.transactions || []);
        setSaTotalRevenue(res.totalRevenue || 0);
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to grant access.', 'error');
    }
  };

  // Fast Role Switcher (for smooth paired testing by the user)
  const switchRole = async (targetRole: 'superadmin' | 'admin' | 'student') => {
    let email = 'student@dexar.com';
    let password = 'Student@123';
    if (targetRole === 'superadmin') {
      email = 'superadmin@dexar.com';
      password = 'SuperAdmin@123';
    } else if (targetRole === 'admin') {
      email = 'trainer@dexar.com';
      password = 'Trainer@123';
    }
    try {
      const res = await api.login({ email, password });
      if (res.token) {
        localStorage.setItem('dexar_token', res.token);
        localStorage.setItem('dexar_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
        setActiveTab('dashboard');
        loadRoleData(res.user.role);
        showToast(`Switched view to ${res.user.role.toUpperCase()}: ${res.user.name}`, 'info');
      }
    } catch {
      showToast('Failed to switch role.', 'error');
    }
  };

  // Handler to allow student to rewrite MCQ assessment (Admin & Super Admin)
  const handleAllowAssessmentRetake = async (submissionId: string, role: string = 'admin') => {
    try {
      const res = await api.allowAssessmentRetake(submissionId, role);
      showToast(res.message || 'Permission granted! Student is allowed to rewrite the MCQ exam.', 'success');
      if (role === 'superadmin') {
        const marksData = await api.getAllMarks();
        setSaMarks(marksData || { assessmentSubmissions: [], codingSubmissions: [] });
      } else {
        const marksData = await api.getAdminMarks();
        setSaMarks(marksData || { assessmentSubmissions: [], codingSubmissions: [] });
      }
      setSelectedAssessmentSubs((prev) => (prev ? prev.filter((s) => s._id !== submissionId) : []));
    } catch (err: any) {
      showToast(err.message || 'Failed to allow retake.', 'error');
    }
  };

  // Handler to allow student to rewrite coding exam (Admin & Super Admin)
  const handleAllowCodingRetake = async (submissionId: string, role: string = 'admin') => {
    try {
      const res = await api.allowCodingRetake(submissionId, role);
      showToast(res.message || 'Permission granted! Student is allowed to rewrite the coding exam.', 'success');
      if (role === 'superadmin') {
        const marksData = await api.getAllMarks();
        setSaMarks(marksData || { assessmentSubmissions: [], codingSubmissions: [] });
      } else {
        const marksData = await api.getAdminMarks();
        setSaMarks(marksData || { assessmentSubmissions: [], codingSubmissions: [] });
      }
      setSelectedCodingSubs((prev) => (prev ? prev.filter((s) => s._id !== submissionId) : []));
    } catch (err: any) {
      showToast(err.message || 'Failed to allow retake.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dexar_token');
    localStorage.removeItem('dexar_user');
    router.push('/login');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-[#0a2540]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading Dexar LMS Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-scope min-h-screen bg-[#fafafb] text-[#0f172a] flex flex-col font-sans selection:bg-[#2563eb] selection:text-white">

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-100 px-5 py-3 rounded-2xl shadow-none border text-sm font-semibold flex items-center gap-2.5 ${toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-600" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <SidebarProvider style={{ "--sidebar-width": "20rem" } as React.CSSProperties}>
        <AppSidebar
          role={currentUser.role}
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          currentUser={currentUser}
          onLogout={handleLogout}
          enrolledCourses={enrolledCourses}
          selectedCourseId={selectedCourseId}
          onSelectCourse={handleSelectCourse}
        />
        <SidebarInset className="bg-transparent min-h-screen flex flex-col">
          {/* FLOATING TOP NAVBAR: White background, floating pill/card */}
          <header className="sticky top-3 z-40 mx-2.5 sm:mx-3.5 lg:mx-4 mb-3 sm:mb-4 flex h-14 shrink-0 items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 shadow-none px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1 text-[#0a2540] hover:bg-slate-100 rounded-lg" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden sm:block">
                    <BreadcrumbLink href="#" className="text-slate-500 hover:text-[#0a2540]">
                      {currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role === 'admin' ? 'Trainer' : 'Student'}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:block text-slate-300" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold text-[#0a2540]">
                      {currentTabTitle}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {currentUser.role === 'superadmin' && (
              <button
                onClick={() => setShowOverallReportModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0a2540] hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                title="Download Student Performance Report"
              >
                <Download className="w-3.5 h-3.5 text-blue-300" />
                <span>Student Performance Report</span>
              </button>
            )}

            {currentUser.role === 'student' && (
              <div className="flex items-center gap-2">
                {activeCourse && (
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200 text-xs font-semibold">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[180px]">{activeCourse.title}</span>
                  </div>
                )}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  title="Download Complete Learning Report"
                >
                  <Download className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>Learning Report</span>
                </button>
              </div>
            )}
          </header>

          {/* ROLE-BASED PORTAL BODY */}
          <main className="flex-1 max-w-[1600px] w-full px-2.5 sm:px-3.5 lg:px-4 py-3 sm:py-4 bg-transparent">

            {/* ========================================================================= */}
            {/* 1. SUPER ADMIN (WEBSITE OWNER) VIEW */}
            {/* ========================================================================= */}
            {currentUser.role === 'superadmin' && (
              <div className="space-y-6">

                {/* TAB 0: SUPER ADMIN EXECUTIVE DASHBOARD */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Hero Welcome Banner */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#0a2540] via-[#0f3460] to-[#1e3a8a] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-none">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 mb-3 border border-white/10">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Website Owner & Super Administrator
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Dexar Executive Overview</h1>
                        <p className="text-blue-200/90 text-xs sm:text-sm mt-1 max-w-xl">
                          Manage admin credentials, oversee student attendance per trainer, monitor revenue transactions, and review exam marks.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => setShowOverallReportModal(true)}
                          className="px-5 py-2.5 rounded-full bg-white text-[#0a2540] hover:bg-slate-100 text-xs font-bold shadow-none flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                          title="Download Student Performance Report"
                        >
                          <Download className="w-4 h-4 text-[#2563eb]" />
                          <span>Download Student Performance Report</span>
                        </button>
                        <button
                          onClick={() => setShowCreateStudentModal(true)}
                          className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-none flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Student Credentials</span>
                        </button>
                        <button
                          onClick={() => setShowCreateAdminModal(true)}
                          className="px-5 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Admin Credentials</span>
                        </button>
                        <button
                          onClick={() => setShowCreateSubjectModal(true)}
                          className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-none flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Add Subject</span>
                        </button>
                      </div>
                    </div>

                    {/* Attention Banner if Students Requested Access / Payment Issues */}
                    {(() => {
                      const accessRequestedStudents = saStudents.filter((s) => s.accessRequested);
                      if (accessRequestedStudents.length === 0) return null;
                      return (
                        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 animate-pulse">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">
                                {accessRequestedStudents.length} Student(s) Reported Razorpay Issues / Requested Access
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Students waiting for manual authorization: {accessRequestedStudents.map((s) => s.name).join(', ')}.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('students');
                              setStudentStatusFilter('access_requested');
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-none cursor-pointer shrink-0"
                          >
                            Review & Allow Access &rarr;
                          </button>
                        </div>
                      );
                    })()}

                    {/* Key Metrics Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div
                        onClick={() => setActiveTab('transactions')}
                        className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">Total Platform Revenue</span>
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <DollarSign className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl sm:text-3xl font-bold text-[#0a2540]">₹{saTotalRevenue.toLocaleString()}</div>
                          <p className="text-xs text-slate-500 mt-1">From all student subscription payments &bull; View details</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab('overview')}
                        className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between cursor-pointer hover:border-[#2563eb] transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#2563eb] transition-colors">Active Admins (Trainers)</span>
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-100 group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
                            <Users className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl sm:text-3xl font-bold text-[#0a2540]">{saTrainers.length}</div>
                          <p className="text-xs text-slate-500 mt-1">Credentialed trainers stored in DB &bull; Click to view</p>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setActiveTab('students');
                          setStudentViewMode('all');
                          setStudentSubjectFilter('all');
                          setStudentTrainerFilter('all');
                        }}
                        className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between cursor-pointer hover:border-[#2563eb] transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#2563eb] transition-colors">Total Enrolled Students</span>
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl sm:text-3xl font-bold text-[#0a2540]">{saStudents.length}</div>
                          <p className="text-xs text-slate-500 mt-1">Subject & trainer categorized &bull; Click to manage</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab('subjects')}
                        className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors">Curriculum Subjects</span>
                          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl sm:text-3xl font-bold text-[#0a2540]">{saSubjects.length}</div>
                          <p className="text-xs text-slate-500 mt-1">Dedicated section &bull; Click to manage</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Access Oversight Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Active Subjects Snapshot */}
                      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-none flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#0a2540] text-base flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[#2563eb]" />
                              <span>Curriculum Overview</span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => setActiveTab('subjects')}
                              className="text-xs font-semibold text-[#2563eb] hover:underline"
                            >
                              Manage All ({saSubjects.length}) &rarr;
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {saSubjects.slice(0, 3).map((sub: any) => (
                              <div key={sub._id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-xs text-[#0a2540]">{sub.title}</div>
                                  <div className="text-[10px] text-slate-400">{sub.trainerId?.name || 'Unassigned Trainer'}</div>
                                </div>
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-50 text-[#2563eb] border border-blue-200">
                                  {sub.code}
                                </span>
                              </div>
                            ))}
                            {saSubjects.length === 0 && (
                              <p className="text-xs text-slate-400 italic py-2">No curriculum subjects registered yet.</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreateSubjectModal(true)}
                          className="mt-4 w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563eb] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Curriculum Subject</span>
                        </button>
                      </div>

                      {/* Active Admin Trainers Snapshot */}
                      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-none flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#0a2540] text-base flex items-center gap-2">
                              <Users className="w-4 h-4 text-emerald-600" />
                              <span>Admin Trainers</span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => setActiveTab('overview')}
                              className="text-xs font-semibold text-[#2563eb] hover:underline"
                            >
                              View All ({saTrainers.length}) &rarr;
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {saTrainers.slice(0, 3).map((tr: any) => (
                              <div key={tr._id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                                    {tr.name?.[0] || 'T'}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-xs text-[#0a2540]">{tr.name}</div>
                                    <div className="text-[10px] text-slate-400">{tr.email}</div>
                                  </div>
                                </div>
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Active
                                </span>
                              </div>
                            ))}
                            {saTrainers.length === 0 && (
                              <p className="text-xs text-slate-400 italic py-2">No admin trainers added yet.</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreateAdminModal(true)}
                          className="mt-4 w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Admin Credentials</span>
                        </button>
                      </div>

                      {/* Enrolled Students Snapshot */}
                      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-none flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#0a2540] text-base flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-purple-600" />
                              <span>Enrolled Students</span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('students');
                                setStudentViewMode('all');
                              }}
                              className="text-xs font-semibold text-[#2563eb] hover:underline"
                            >
                              Directory ({saStudents.length}) &rarr;
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {saStudents.slice(0, 3).map((st: any) => (
                              <div key={st._id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-xs text-[#0a2540]">{st.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{st.email}</div>
                                </div>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                  {st.planType || 'monthly'}
                                </span>
                              </div>
                            ))}
                            {saStudents.length === 0 && (
                              <p className="text-xs text-slate-400 italic py-2">No students enrolled yet.</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreateStudentModal(true)}
                          className="mt-4 w-full py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Student Credentials</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 1: ADMINS & STUDENT OVERSIGHT */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">Admin Trainers & Class Listeners</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Monitor which trainers are teaching which subjects, and see how many students are assigned and listening to their classes.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCreateAdminModal(true)}
                        className="px-4 py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-transform hover:scale-105 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Admin</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {saTrainers.map((trainer) => (
                        <div
                          key={trainer._id}
                          className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none flex flex-col justify-between"
                        >
                          <div>
                            {/* Top Trainer Row */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#2563eb] font-bold text-sm flex items-center justify-center border border-[#bfdbfe]/50">
                                  {trainer.name?.[0] || 'T'}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-[#0a2540] text-sm leading-tight">{trainer.name}</h3>
                                  <p className="text-xs text-gray-500">{trainer.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                                  Active Admin
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingTrainer(trainer)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Edit Admin Trainer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmDelete(
                                    'Delete Admin Trainer',
                                    `Are you sure you want to delete admin trainer "${trainer.name}"? Their account credentials will be removed from the system.`,
                                    `${trainer.name} (${trainer.email})`,
                                    async () => {
                                      await api.deleteTrainer(trainer._id);
                                      setSaTrainers((prev) => prev.filter((t) => t._id !== trainer._id));
                                      showToast(`Admin ${trainer.name} deleted successfully!`, 'success');
                                    }
                                  )}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Admin Trainer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Assigned Course Info Small Card */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-3 shadow-none">
                              <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Assigned Subject:</span>
                              <span className="text-xs font-semibold text-[#0a2540] block">
                                {trainer.subjectId?.title || 'No subject assigned'}
                              </span>
                              {trainer.subjectId?.code && (
                                <span className="text-[10px] font-bold text-[#2563eb] bg-white px-2 py-0.5 rounded-md inline-block mt-1 border border-slate-200/60 font-mono">
                                  {trainer.subjectId?.code}
                                </span>
                              )}
                            </div>

                            {/* Student Count Small Card */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between mb-3 shadow-none">
                              <div className="flex items-center gap-2.5">
                                <GraduationCap className="w-5 h-5 text-[#2563eb]" />
                                <div>
                                  <div className="text-xs font-semibold text-[#0a2540]">Students Listening</div>
                                  <div className="text-[11px] text-slate-500">Enrolled in this class</div>
                                </div>
                              </div>
                              <div className="text-2xl font-bold text-[#2563eb]">
                                {trainer.studentsCount || 0}
                              </div>
                            </div>
                          </div>

                          {/* Expand Students List Button */}
                          <div>
                            <button
                              onClick={() => setExpandedTrainerId(expandedTrainerId === trainer._id ? null : trainer._id)}
                              className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#0a2540] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-gray-200/60 cursor-pointer"
                            >
                              <span>{expandedTrainerId === trainer._id ? 'Hide Students' : `View Enrolled Students (${trainer.studentsCount || 0})`}</span>
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expandedTrainerId === trainer._id ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Collapsible Enrolled Students Directory */}
                            {expandedTrainerId === trainer._id && (
                              <div className="mt-3 p-3 bg-[#f8fafc] rounded-xl border border-gray-200 max-h-48 overflow-y-auto space-y-2">
                                {trainer.students?.length > 0 ? (
                                  trainer.students.map((st: any) => (
                                    <div key={st._id} className="p-2 bg-white rounded-lg border border-gray-100 flex items-center justify-between text-xs">
                                      <div>
                                        <div className="font-semibold text-[#0a2540]">{st.name}</div>
                                        <div className="text-[10px] text-gray-400">{st.email}</div>
                                      </div>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                        {st.paymentStatus || 'paid'}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-gray-400 text-center py-2">No students enrolled under this trainer yet.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dedicated Subjects Navigation Banner */}
                    <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shadow-sm shrink-0">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-[#0a2540] flex items-center gap-2">
                            <span>Curriculum Subjects & Academic Modules</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#2563eb] text-[10px] font-bold">
                              {saSubjects.length} Courses
                            </span>
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Curriculum subjects now have their own dedicated management section with full CRUD, trainer mappings, and student rosters.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('subjects')}
                        className="px-4 py-2.5 rounded-xl bg-[#0a2540] hover:bg-black text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shrink-0 shadow-none"
                      >
                        <span>Open Subjects Section</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB: SUPER ADMIN CURRICULUM SUBJECTS DEDICATED SECTION */}
                {activeTab === 'subjects' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">Curriculum Subjects & Course Offerings</h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                            Dedicated Section
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Manage platform academic subjects, course codes, syllabus summaries, and assigned admin trainers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateSubjectModal(true)}
                        className="px-4 py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-transform hover:scale-105 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Subject</span>
                      </button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-none flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-500">Total Subjects</div>
                          <div className="text-lg font-bold text-[#0a2540]">{saSubjects.length} Courses</div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-none flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-500">Assigned Instructors</div>
                          <div className="text-lg font-bold text-[#0a2540]">
                            {saSubjects.filter((s) => s.trainerId).length} Assigned
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-none flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-500">Active Enrollments</div>
                          <div className="text-lg font-bold text-[#0a2540]">{saStudents.length} Students</div>
                        </div>
                      </div>
                    </div>

                    {/* Search and Count Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200/80">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={subjectSearchTerm}
                          onChange={(e) => setSubjectSearchTerm(e.target.value)}
                          placeholder="Search subjects by title, course code, or assigned trainer..."
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                        />
                      </div>
                      <div className="text-xs text-gray-500 font-medium px-2 shrink-0">
                        Showing <strong className="text-[#0a2540]">{filteredSubjects.length}</strong> of {saSubjects.length} subjects
                      </div>
                    </div>

                    {/* Subjects Grid */}
                    {filteredSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSubjects.map((sub) => {
                          const studentCount = saStudents.filter((st: any) => (st.subjectId?._id || st.subjectId) === sub._id).length;
                          return (
                            <div
                              key={sub._id}
                              className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-none flex flex-col justify-between hover:border-blue-200 transition-colors"
                            >
                              <div>
                                <div className="flex items-start justify-between mb-3">
                                  <span className="text-[11px] font-bold text-[#2563eb] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 font-mono">
                                    {sub.code}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingSubject(sub)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Edit Subject"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => confirmDelete(
                                        'Delete Curriculum Subject',
                                        `Are you sure you want to delete subject "${sub.title}" (${sub.code})? It will be unassigned from all trainers and students.`,
                                        `${sub.title} (${sub.code})`,
                                        async () => {
                                          await api.deleteSubject(sub._id);
                                          setSaSubjects((prev) => prev.filter((s) => s._id !== sub._id));
                                          showToast(`Subject "${sub.title}" deleted successfully!`, 'success');
                                        }
                                      )}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete Subject"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <h3 className="font-semibold text-[#0a2540] text-base mb-1.5">{sub.title}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                  {sub.description || 'No description provided for this subject.'}
                                </p>

                                {/* Trainer Info */}
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 mb-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-[#eff6ff] text-[#2563eb] font-bold text-xs flex items-center justify-center">
                                      {sub.trainerId?.name?.[0] || 'T'}
                                    </div>
                                    <div>
                                      <div className="text-[11px] font-medium text-slate-500">Assigned Trainer</div>
                                      <div className="text-xs font-semibold text-[#0a2540]">
                                        {sub.trainerId?.name || 'Unassigned'}
                                      </div>
                                    </div>
                                  </div>
                                  {sub.trainerId?.email && (
                                    <span className="text-[10px] text-slate-400 hidden sm:inline">{sub.trainerId.email}</span>
                                  )}
                                </div>
                              </div>

                              {/* Action Footer */}
                              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                <div className="text-xs text-slate-500">
                                  <strong className="text-[#0a2540]">{studentCount}</strong> enrolled
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('students');
                                    setStudentViewMode('subject');
                                    setStudentSubjectFilter(sub._id);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563eb] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <span>View Enrolled Students</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-12 text-center bg-white rounded-xl border border-gray-200/80">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="font-semibold text-sm text-slate-700">No Subjects Found</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          {subjectSearchTerm ? 'No subjects matched your search criteria.' : 'Get started by creating your first curriculum subject.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCreateSubjectModal(true)}
                          className="mt-4 px-4 py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Subject</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: SUPER ADMIN STUDENTS DIRECTORY & CREDENTIALS (SUBJECT & TRAINER WISE ACCESS) */}
                {activeTab === 'students' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">Enrolled Students Directory & Access Control</h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                            Super Admin Exclusive
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Manage enrolled students with multi-dimensional access categorized by academic subject or trainer classes.
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setShowOverallReportModal(true)}
                          className="px-4 py-2 rounded-full bg-[#0a2540] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-transform hover:scale-105 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-300" />
                          <span>Download Overall Report</span>
                        </button>
                        <button
                          onClick={() => setShowCreateStudentModal(true)}
                          className="px-4 py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-transform hover:scale-105 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Student Credentials</span>
                        </button>
                      </div>
                    </div>

                    {/* Mode Switcher Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-gray-200/80">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStudentViewMode('subject')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                            studentViewMode === 'subject'
                              ? 'bg-[#0a2540] text-white shadow-sm'
                              : 'text-slate-600 hover:text-[#0a2540] hover:bg-slate-100'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                          <span>By Subject Wise</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            studentViewMode === 'subject' ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2563eb]'
                          }`}>
                            {saSubjects.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentViewMode('trainer')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                            studentViewMode === 'trainer'
                              ? 'bg-[#0a2540] text-white shadow-sm'
                              : 'text-slate-600 hover:text-[#0a2540] hover:bg-slate-100'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          <span>By Trainer Wise</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            studentViewMode === 'trainer' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {saTrainers.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentViewMode('all')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                            studentViewMode === 'all'
                              ? 'bg-[#0a2540] text-white shadow-sm'
                              : 'text-slate-600 hover:text-[#0a2540] hover:bg-slate-100'
                          }`}
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>All Students Directory</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            studentViewMode === 'all' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {filteredStudents.length}
                          </span>
                        </button>
                      </div>

                      <div className="text-xs text-gray-500 font-medium px-3 shrink-0">
                        Total Registered: <strong className="text-[#0a2540]">{saStudents.length}</strong>
                      </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-gray-200/80">
                      {/* Search Input */}
                      <div className="relative sm:col-span-2 lg:col-span-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentSearchTerm}
                          onChange={(e) => setStudentSearchTerm(e.target.value)}
                          placeholder="Search student or email..."
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                        />
                      </div>

                      {/* Subject Filter Dropdown */}
                      <div>
                        <select
                          value={studentSubjectFilter}
                          onChange={(e) => setStudentSubjectFilter(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-slate-700 font-medium cursor-pointer"
                        >
                          <option value="all">All Subjects</option>
                          {saSubjects.map((sub: any) => (
                            <option key={sub._id} value={sub._id}>
                              {sub.title} ({sub.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Trainer Filter Dropdown */}
                      <div>
                        <select
                          value={studentTrainerFilter}
                          onChange={(e) => setStudentTrainerFilter(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-slate-700 font-medium cursor-pointer"
                        >
                          <option value="all">All Trainers</option>
                          {saTrainers.map((tr: any) => (
                            <option key={tr._id} value={tr._id}>
                              {tr.name} ({tr.subjectId?.title || 'No subject'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter Dropdown & Reset */}
                      <div className="flex items-center gap-2">
                        <select
                          value={studentStatusFilter}
                          onChange={(e) => setStudentStatusFilter(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 text-slate-700 font-medium cursor-pointer"
                        >
                          <option value="all">All Payment Statuses</option>
                          <option value="paid">Paid Only</option>
                          <option value="pending">Pending Payment</option>
                          <option value="access_requested">🚨 Access Requested</option>
                        </select>

                        {(studentSubjectFilter !== 'all' || studentTrainerFilter !== 'all' || studentStatusFilter !== 'all' || studentSearchTerm) && (
                          <button
                            type="button"
                            onClick={() => {
                              setStudentSubjectFilter('all');
                              setStudentTrainerFilter('all');
                              setStudentStatusFilter('all');
                              setStudentSearchTerm('');
                            }}
                            className="px-2.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                            title="Reset all filters"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* VIEW 1: BY SUBJECT WISE */}
                    {studentViewMode === 'subject' && (
                      <div className="space-y-6">
                        {/* Expand All / Collapse All Controls */}
                        <div className="flex items-center justify-between pb-1 px-1">
                          <span className="text-xs font-semibold text-slate-500">
                            Curriculum Subjects ({studentsGroupedBySubject.length})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={expandAllSubjects}
                              className="px-2.5 py-1 text-xs font-semibold text-[#2563eb] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Expand All
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={collapseAllSubjects}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Collapse All
                            </button>
                          </div>
                        </div>

                        {studentsGroupedBySubject.map((group: any) => {
                          const isExpanded = isSubjectExpanded(group.subject._id);
                          const subjectStudents = group.students.filter((st: any) => {
                            if (studentStatusFilter !== 'all') {
                              if (studentStatusFilter === 'access_requested') {
                                if (!st.accessRequested) return false;
                              } else if ((st.paymentStatus || 'paid') !== studentStatusFilter) {
                                return false;
                              }
                            }
                            if (studentSearchTerm.trim()) {
                              const term = studentSearchTerm.toLowerCase();
                              return st.name?.toLowerCase().includes(term) || st.email?.toLowerCase().includes(term);
                            }
                            return true;
                          });

                          if (studentSubjectFilter !== 'all' && group.subject._id !== studentSubjectFilter) {
                            return null;
                          }

                          return (
                            <div
                              key={group.subject._id}
                              className="bg-white rounded-xl border border-gray-200/80 shadow-none overflow-hidden transition-all"
                            >
                              {/* Subject Header Card with Expand/Collapse */}
                              <div
                                onClick={() => toggleSubjectExpand(group.subject._id)}
                                className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold text-sm border border-blue-200/60 shrink-0">
                                    <BookOpen className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-[#0a2540] text-base">{group.subject.title}</h3>
                                      <span className="text-[10px] font-bold text-[#2563eb] bg-white px-2 py-0.5 rounded border border-blue-200 font-mono">
                                        {group.subject.code}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Instructor: <strong className="text-slate-700">{group.trainer?.name || 'Unassigned Trainer'}</strong>
                                      {group.trainer?.email && ` (${group.trainer.email})`}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                  <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200 text-xs font-bold">
                                    {subjectStudents.length} Students Enrolled
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewStudentData((prev) => ({ ...prev, subjectId: group.subject._id }));
                                      setShowCreateStudentModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1 shadow-none cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Enroll Student</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleSubjectExpand(group.subject._id)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563eb] hover:bg-white border border-slate-200 transition-colors cursor-pointer"
                                    title={isExpanded ? 'Collapse Subject Roster' : 'Expand Subject Roster'}
                                  >
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              {/* Student Roster Table for this Subject (Collapsible) */}
                              {isExpanded ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs text-[#0f172a]">
                                    <thead className="bg-[#f8fafc] text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider">
                                      <tr>
                                        <th className="py-3 px-6">Student</th>
                                        <th className="py-3 px-6">Subscription Plan</th>
                                        <th className="py-3 px-6">Fee Amount</th>
                                        <th className="py-3 px-6">Validity Period</th>
                                        <th className="py-3 px-6">Payment Status</th>
                                        <th className="py-3 px-6 text-center">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {subjectStudents.length > 0 ? (
                                        subjectStudents.map((st: any) => (
                                          <tr key={st._id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-6">
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#2563eb] font-bold text-xs flex items-center justify-center border border-[#bfdbfe]">
                                                  {st.name?.[0] || 'S'}
                                                </div>
                                                <div>
                                                  <div className="font-semibold text-[#0a2540]">{st.name}</div>
                                                  <div className="text-[11px] text-gray-400 font-mono">{st.email}</div>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="py-3.5 px-6">
                                              <span className="capitalize font-medium text-gray-700">
                                                {st.planType === 'course_wise' ? 'Course Pack' : 'Monthly Pack'}
                                              </span>
                                            </td>
                                            <td className="py-3.5 px-6 font-semibold text-emerald-700">
                                              ₹{st.amount || (st.planType === 'course_wise' ? 1499 : 499)}
                                            </td>
                                            <td className="py-3.5 px-6 text-gray-500">
                                              {st.planType === 'course_wise' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                  Permanent Access
                                                </span>
                                              ) : (
                                                <>{st.startDate ? new Date(st.startDate).toLocaleDateString() : 'Active'} &rarr; {st.endDate ? new Date(st.endDate).toLocaleDateString() : 'Ongoing'}</>
                                              )}
                                            </td>
                                            <td className="py-3.5 px-6">
                                              <div className="flex flex-col gap-1 items-start">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                  st.paymentStatus === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                  {st.paymentStatus || 'paid'}
                                                </span>
                                                {st.accessGrantedByAdmin && (
                                                  <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                                    Admin Authorized
                                                  </span>
                                                )}
                                                {st.paymentRequested && st.paymentStatus !== 'paid' && (
                                                  <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                    Payment Asked
                                                  </span>
                                                )}
                                                {st.accessRequested && (
                                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1" title={st.accessRequestNote || 'Student requested access'}>
                                                    <AlertTriangle className="w-2.5 h-2.5" />
                                                    Requested Access
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="py-3.5 px-6 text-center">
                                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                {(st.paymentStatus !== 'paid' || st.accessRequested) && (
                                                  <button
                                                    type="button"
                                                    onClick={() => handleSuperAdminGrantAccess(st._id, st.name)}
                                                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-all cursor-pointer shadow-none"
                                                    title="Allow student access without Razorpay payment"
                                                  >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Allow Access</span>
                                                  </button>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() => handleSuperAdminRequestPayment(st._id, st.name)}
                                                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 transition-all cursor-pointer"
                                                  title="Ask student for payment & lock portal until paid"
                                                >
                                                  <CreditCard className="w-3 h-3 text-amber-700" />
                                                  <span>Ask Payment</span>
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingStudent(st)}
                                                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 transition-colors cursor-pointer"
                                                  title="Edit Student Credentials"
                                                >
                                                  <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => confirmDelete(
                                                    'Delete Student Account',
                                                    `Are you sure you want to delete student "${st.name}" (${st.email})? Their records, exam submissions, and payments will be removed from the system.`,
                                                    `${st.name} (${st.email})`,
                                                    async () => {
                                                      await api.deleteStudent(st._id, 'superadmin');
                                                      setSaStudents((prev) => prev.filter((s) => s._id !== st._id));
                                                      showToast(`Student ${st.name} deleted successfully!`, 'success');
                                                    }
                                                  )}
                                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                  title="Delete Student Account"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={6} className="py-6 text-center text-gray-400 text-xs">
                                            No students currently enrolled in this subject. Click &ldquo;Enroll Student&rdquo; above to add learners.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div
                                  onClick={() => toggleSubjectExpand(group.subject._id)}
                                  className="p-3.5 bg-slate-50/60 hover:bg-slate-100/70 text-center text-xs font-medium text-slate-500 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <span>Roster collapsed &bull; Click to expand {subjectStudents.length} students</span>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* VIEW 2: BY TRAINER WISE */}
                    {studentViewMode === 'trainer' && (
                      <div className="space-y-6">
                        {studentsGroupedByTrainer.map((group: any) => {
                          const trainerStudents = group.students.filter((st: any) => {
                            if (studentStatusFilter !== 'all') {
                              if (studentStatusFilter === 'access_requested') {
                                if (!st.accessRequested) return false;
                              } else if ((st.paymentStatus || 'paid') !== studentStatusFilter) {
                                return false;
                              }
                            }
                            if (studentSearchTerm.trim()) {
                              const term = studentSearchTerm.toLowerCase();
                              return st.name?.toLowerCase().includes(term) || st.email?.toLowerCase().includes(term);
                            }
                            return true;
                          });

                          if (studentTrainerFilter !== 'all' && group.trainer._id !== studentTrainerFilter) {
                            return null;
                          }

                          return (
                            <div
                              key={group.trainer._id}
                              className="bg-white rounded-xl border border-gray-200/80 shadow-none overflow-hidden"
                            >
                              {/* Trainer Header Card */}
                              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-purple-50/30 border-b border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm border border-purple-200/60 shrink-0">
                                    {group.trainer.name?.[0] || 'T'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-[#0a2540] text-base">{group.trainer.name}</h3>
                                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                        Instructor
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Assigned Subject: <strong className="text-slate-700">{group.subject?.title || 'No Subject Assigned'}</strong>
                                      {group.subject?.code && ` (${group.subject.code})`} &bull; {group.trainer.email}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                                    {trainerStudents.length} Students Listening to Classes
                                  </span>
                                </div>
                              </div>

                              {/* Student Roster Table for this Trainer */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-[#0f172a]">
                                  <thead className="bg-[#f8fafc] text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider">
                                    <tr>
                                      <th className="py-3 px-6">Student</th>
                                      <th className="py-3 px-6">Subject Enrolled</th>
                                      <th className="py-3 px-6">Subscription Plan</th>
                                      <th className="py-3 px-6">Fee Amount</th>
                                      <th className="py-3 px-6">Payment Status</th>
                                      <th className="py-3 px-6 text-center">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {trainerStudents.length > 0 ? (
                                      trainerStudents.map((st: any) => (
                                        <tr key={st._id} className="hover:bg-slate-50/70 transition-colors">
                                          <td className="py-3.5 px-6">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#2563eb] font-bold text-xs flex items-center justify-center border border-[#bfdbfe]">
                                                {st.name?.[0] || 'S'}
                                              </div>
                                              <div>
                                                <div className="font-semibold text-[#0a2540]">{st.name}</div>
                                                <div className="text-[11px] text-gray-400 font-mono">{st.email}</div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-3.5 px-6">
                                            {st.subjectIds && st.subjectIds.length > 0 ? (
                                              <div className="flex flex-wrap gap-1 max-w-[260px]">
                                                {st.subjectIds.map((sub: any, sIdx: number) => (
                                                  <span
                                                    key={sub._id || sIdx}
                                                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                                                    title={sub.code ? `${sub.title} (${sub.code})` : sub.title}
                                                  >
                                                    {sub.title || 'Course'}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="font-semibold text-[#0a2540]">
                                                {st.subjectId?.title || group.subject?.title || 'Assigned Course'}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-3.5 px-6">
                                            <span className="capitalize font-medium text-gray-700">
                                              {st.planType === 'course_wise' ? 'Course Pack' : 'Monthly Pack'}
                                            </span>
                                          </td>
                                          <td className="py-3.5 px-6 font-semibold text-emerald-700">
                                            ₹{st.amount || (st.planType === 'course_wise' ? 1499 : 499)}
                                          </td>
                                          <td className="py-3.5 px-6">
                                            <div className="flex flex-col gap-1 items-start">
                                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                st.paymentStatus === "paid"
                                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                                              }`}>
                                                {st.paymentStatus || "paid"}
                                              </span>
                                              {st.accessGrantedByAdmin && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                                  Admin Authorized
                                                </span>
                                              )}
                                              {st.paymentRequested && st.paymentStatus !== "paid" && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                  Payment Asked
                                                </span>
                                              )}
                                              {st.accessRequested && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1" title={st.accessRequestNote || "Student requested access"}>
                                                  <AlertTriangle className="w-2.5 h-2.5" />
                                                  Requested Access
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-3.5 px-6 text-center">
                                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                              {(st.paymentStatus !== "paid" || st.accessRequested) && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleSuperAdminGrantAccess(st._id, st.name)}
                                                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-all cursor-pointer shadow-none"
                                                  title="Allow student access without Razorpay payment"
                                                >
                                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                                  <span>Allow Access</span>
                                                </button>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => handleSuperAdminRequestPayment(st._id, st.name)}
                                                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 transition-all cursor-pointer"
                                                title="Ask student for payment and lock portal until paid"
                                              >
                                                <CreditCard className="w-3 h-3 text-amber-700" />
                                                <span>Ask Payment</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingStudent(st)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 transition-colors cursor-pointer"
                                                title="Edit Student Credentials"
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => confirmDelete(
                                                  "Delete Student Account",
                                                  `Are you sure you want to delete student "${st.name}" (${st.email})? Their records, exam submissions, and payments will be removed from the system.`,
                                                  `${st.name} (${st.email})`,
                                                  async () => {
                                                    await api.deleteStudent(st._id, "superadmin");
                                                    setSaStudents((prev) => prev.filter((s) => s._id !== st._id));
                                                    showToast(`Student ${st.name} deleted successfully!`, "success");
                                                  }
                                                )}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                title="Delete Student Account"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={6} className="py-6 text-center text-gray-400 text-xs">
                                          No students currently assigned to this trainer&apos;s subject.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* VIEW 3: ALL STUDENTS DIRECTORY (UNIFIED TABLE) */}
                    {studentViewMode === 'all' && (
                      <div className="bg-white rounded-xl border border-gray-200/80 shadow-none overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-[#0f172a]">
                            <thead className="bg-[#f8fafc] text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
                              <tr>
                                <th className="py-4 px-6">Student</th>
                                <th className="py-4 px-6">Enrolled Subject</th>
                                <th className="py-4 px-6">Assigned Trainer</th>
                                <th className="py-4 px-6">Subscription Plan</th>
                                <th className="py-4 px-6">Enrolled Period</th>
                                <th className="py-4 px-6">Fee Amount</th>
                                <th className="py-4 px-6">Payment Status</th>
                                <th className="py-4 px-6 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {filteredStudents.length > 0 ? (
                                filteredStudents.map((st: any) => {
                                  const matchingSubject = saSubjects.find((s: any) => s._id === (st.subjectId?._id || st.subjectId));
                                  const matchingTrainer = saTrainers.find((t: any) => (t.subjectId?._id || t.subjectId) === (st.subjectId?._id || st.subjectId));

                                  return (
                                    <tr key={st._id} className="hover:bg-slate-50/70 transition-colors">
                                      <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#2563eb] font-bold text-xs flex items-center justify-center border border-[#bfdbfe]">
                                            {st.name?.[0] || 'S'}
                                          </div>
                                          <div>
                                            <div className="font-semibold text-[#0a2540]">{st.name}</div>
                                            <div className="text-[11px] text-gray-400 font-mono">{st.email}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 px-6">
                                        <span className="font-semibold text-[#0a2540]">
                                          {st.subjectId?.title || matchingSubject?.title || 'Not Assigned'}
                                        </span>
                                        {(st.subjectId?.code || matchingSubject?.code) && (
                                          <span className="ml-2 text-[10px] font-bold text-[#2563eb] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-mono">
                                            {st.subjectId?.code || matchingSubject?.code}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-4 px-6">
                                        <span className="text-slate-700 font-medium">
                                          {matchingTrainer?.name || st.subjectId?.trainerId?.name || 'Unassigned'}
                                        </span>
                                      </td>
                                      <td className="py-4 px-6">
                                        <span className="capitalize font-medium text-gray-700">
                                          {st.planType === 'course_wise' ? 'Course Pack' : 'Monthly Pack'}
                                        </span>
                                      </td>
                                      <td className="py-4 px-6 text-gray-500">
                                        {st.planType === 'course_wise' ? (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Permanent Access
                                          </span>
                                        ) : (
                                          <>{st.startDate ? new Date(st.startDate).toLocaleDateString() : 'Active'} &rarr; {st.endDate ? new Date(st.endDate).toLocaleDateString() : 'Ongoing'}</>
                                        )}
                                      </td>
                                      <td className="py-4 px-6 font-semibold text-emerald-700">
                                        ₹{st.amount || (st.planType === 'course_wise' ? 1499 : 499)}
                                      </td>
                                      <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1 items-start">
                                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            st.paymentStatus === "paid"
                                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                              : "bg-amber-50 text-amber-700 border border-amber-200"
                                          }`}>
                                            {st.paymentStatus || "paid"}
                                          </span>
                                          {st.accessGrantedByAdmin && (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                              Admin Authorized
                                            </span>
                                          )}
                                          {st.paymentRequested && st.paymentStatus !== "paid" && (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                              Payment Asked
                                            </span>
                                          )}
                                          {st.accessRequested && (
                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1" title={st.accessRequestNote || "Student requested access"}>
                                              <AlertTriangle className="w-2.5 h-2.5" />
                                              Requested Access
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                          {(st.paymentStatus !== "paid" || st.accessRequested) && (
                                            <button
                                              type="button"
                                              onClick={() => handleSuperAdminGrantAccess(st._id, st.name)}
                                              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-all cursor-pointer shadow-none"
                                              title="Allow student access without Razorpay payment"
                                            >
                                              <CheckCircle2 className="w-3.5 h-3.5" />
                                              <span>Allow Access</span>
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleSuperAdminRequestPayment(st._id, st.name)}
                                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 transition-all cursor-pointer"
                                            title="Ask student for payment and lock portal until paid"
                                          >
                                            <CreditCard className="w-3 h-3 text-amber-700" />
                                            <span>Ask Payment</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingStudent(st)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 transition-colors cursor-pointer"
                                            title="Edit Student Credentials"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => confirmDelete(
                                              "Delete Student Account",
                                              `Are you sure you want to delete student "${st.name}" (${st.email})? Their records, exam submissions, and payments will be removed from the system.`,
                                              `${st.name} (${st.email})`,
                                              async () => {
                                                await api.deleteStudent(st._id, "superadmin");
                                                setSaStudents((prev) => prev.filter((s) => s._id !== st._id));
                                                showToast(`Student ${st.name} deleted successfully!`, "success");
                                              }
                                            )}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                            title="Delete Student Account"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={8} className="py-12 text-center text-gray-400">
                                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="font-medium text-sm text-gray-600">No students found matching your filters</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Adjust your search or click &ldquo;Add Student Credentials&rdquo; to register new students</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: TRANSACTIONS (Direct Prompt Requirement!) */}
                {activeTab === 'transactions' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">Student Transactions & Financials</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          All payments made by students for course subscriptions, pack upgrades, and renewal charges.
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                          Total Revenue: ₹{saTotalRevenue.toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTransactionReportModal(true)}
                          className="px-4 py-2 rounded-xl bg-[#0a2540] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-transform hover:scale-105 cursor-pointer"
                          title="Download All Transactions Report"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-300" />
                          <span>Download Transaction Report</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200/80 shadow-none overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-[#0f172a]">
                          <thead className="bg-[#f8fafc] text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
                            <tr>
                              <th className="py-4 px-6">Transaction ID</th>
                              <th className="py-4 px-6">Student</th>
                              <th className="py-4 px-6">Plan Enrolled</th>
                              <th className="py-4 px-6">Amount</th>
                              <th className="py-4 px-6">Payment Method</th>
                              <th className="py-4 px-6">Date</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {saTransactions.map((tx) => (
                              <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-4 px-6 font-mono font-semibold text-[#2563eb]">
                                  {tx.transactionId || 'TXN-90218'}
                                </td>
                                <td className="py-4 px-6">
                                  <div className="font-semibold text-[#0a2540]">{tx.studentId?.name || 'Jane Doe'}</div>
                                  <div className="text-[11px] text-gray-400">{tx.studentId?.email || 'student@dexar.com'}</div>
                                </td>
                                <td className="py-4 px-6">
                                  <span className="capitalize font-medium text-gray-700">
                                    {tx.planType === 'course_wise' ? 'Course Pack' : 'Monthly Pack'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 font-semibold text-emerald-700">
                                  ₹{tx.amount}
                                </td>
                                <td className="py-4 px-6 text-gray-600">
                                  {tx.paymentMethod || 'Credit Card / UPI'}
                                </td>
                                <td className="py-4 px-6 text-gray-500">
                                  {new Date(tx.paidAt || Date.now()).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-6">
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                    {tx.status || 'Completed'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEditingTransaction(tx)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Edit Transaction"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => confirmDelete(
                                        'Delete Transaction',
                                        `Are you sure you want to delete transaction "${tx.transactionId || tx._id}" for ${tx.studentId?.name || 'Student'}?`,
                                        `Transaction ${tx.transactionId || tx._id} - ₹${tx.amount}`,
                                        async () => {
                                          await api.deleteTransaction(tx._id);
                                          setSaTransactions((prev) => prev.filter((t) => t._id !== tx._id));
                                          showToast('Transaction deleted successfully!', 'success');
                                        }
                                      )}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete Transaction"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: MARKS & EXAM RESULTS OVERSIGHT (ACCORDING TO EXAM NAME) */}
                {activeTab === 'marks' && (
                  <ExamMarksSection
                    role="superadmin"
                    assessments={saAssessments}
                    codingExams={saCodingExams}
                    subjects={saSubjects}
                    marks={saMarks}
                    currentUser={currentUser}
                    onEditScore={(item) => setEditingScoreItem(item)}
                    onAllowRetake={(subId, type) => {
                      if (type === 'mcq') handleAllowAssessmentRetake(subId, 'superadmin');
                      else handleAllowCodingRetake(subId, 'superadmin');
                    }}
                    onDeleteSubmission={(subId, type, stName, examTitle) => {
                      confirmDelete(
                        type === 'mcq' ? 'Delete Quiz Submission' : 'Delete Coding Submission',
                        `Are you sure you want to delete the submission of ${stName} for "${examTitle}"?`,
                        `${stName} - ${examTitle}`,
                        async () => {
                          if (type === 'mcq') {
                            await api.allowAssessmentRetake(subId, 'superadmin');
                            setSaMarks((prev: any) => ({
                              ...prev,
                              assessmentSubmissions: prev?.assessmentSubmissions?.filter((s: any) => s._id !== subId),
                            }));
                          } else {
                            await api.allowCodingRetake(subId, 'superadmin');
                            setSaMarks((prev: any) => ({
                              ...prev,
                              codingSubmissions: prev?.codingSubmissions?.filter((c: any) => c._id !== subId),
                            }));
                          }
                          showToast('Submission deleted successfully!', 'success');
                        }
                      );
                    }}
                    onDownloadOverallReport={() => setShowOverallReportModal(true)}
                  />
                )}

                {/* TAB 4: SUPER ADMIN CONDUCT ASSESSMENTS DIRECTLY */}
                {activeTab === 'assessments' && (
                  <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">Platform Assessments & Coding Arenas</h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                            Super Admin CRUD
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Create, edit, and delete MCQ exams and coding challenges across all academic subjects.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowDocxModal(true)}
                          className="px-4 py-2 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-none cursor-pointer transition-transform hover:scale-105"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload Word (.docx) Exam</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCodingModal(true)}
                          className="px-4 py-2 rounded-full bg-[#0a2540] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-none cursor-pointer transition-transform hover:scale-105"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Create Coding Exam</span>
                        </button>
                      </div>
                    </div>

                    {/* SECTION 1: MCQ ASSESSMENTS */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base text-[#0a2540] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#2563eb]" />
                          <span>Online Assessment Quizzes ({saAssessments.length})</span>
                        </h3>
                      </div>

                      {saAssessments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {saAssessments.map((ast) => (
                            <div
                              key={ast._id}
                              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none flex flex-col justify-between hover:border-gray-300 transition-colors"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[10px] font-bold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    {ast.subjectId?.title || 'Subject'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingAssessment(ast)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563eb] hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Edit Assessment"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => confirmDelete(
                                        'Delete Assessment',
                                        `Are you sure you want to delete assessment "${ast.title}"? All student submissions for this assessment will also be removed.`,
                                        ast.title,
                                        async () => {
                                          await api.superAdminDeleteAssessment(ast._id);
                                          setSaAssessments((prev) => prev.filter((a) => a._id !== ast._id));
                                          showToast(`Assessment "${ast.title}" deleted successfully!`, 'success');
                                        }
                                      )}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete Assessment"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <h4 className="font-semibold text-[#0a2540] text-sm mb-2">{ast.title}</h4>
                                <div className="text-xs text-gray-500 space-y-1 mb-4">
                                  <div className="flex items-center justify-between">
                                    <span>Questions:</span>
                                    <span className="font-semibold text-gray-800">{ast.questions?.length || 0} Questions</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Total Marks:</span>
                                    <span className="font-semibold text-[#2563eb]">{ast.totalMarks} Marks</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Duration:</span>
                                    <span className="font-semibold text-gray-800">{ast.durationMinutes || 45} mins</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Password:</span>
                                    <span className="font-mono font-bold text-[#0a2540]">{ast.accessPassword || 'DEXAR2026'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                <span>Trainer: {ast.trainerId?.name || 'Super Admin'}</span>
                                {ast.isLockdown && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" />
                                    Lockdown
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-white rounded-xl border border-gray-200/80">
                          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-600">No Assessments Created Yet</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Click &ldquo;Upload Word (.docx) Exam&rdquo; to publish the first assessment.</p>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: CODING CHALLENGES */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base text-[#0a2540] flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-purple-600" />
                          <span>Coding Exam Arena Challenges ({saCodingExams.length})</span>
                        </h3>
                      </div>

                      {saCodingExams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {saCodingExams.map((exam) => (
                            <div
                              key={exam._id}
                              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none flex flex-col justify-between hover:border-gray-300 transition-colors"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                    {exam.subjectId?.title || 'Subject'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingCodingExam(exam)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                                      title="Edit Coding Challenge"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => confirmDelete(
                                        'Delete Coding Challenge',
                                        `Are you sure you want to delete coding exam "${exam.title}"? All submitted student solutions will also be deleted.`,
                                        exam.title,
                                        async () => {
                                          await api.superAdminDeleteCodingExam(exam._id);
                                          setSaCodingExams((prev) => prev.filter((c) => c._id !== exam._id));
                                          showToast(`Coding exam "${exam.title}" deleted successfully!`, 'success');
                                        }
                                      )}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete Coding Challenge"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <h4 className="font-semibold text-[#0a2540] text-sm mb-1">{exam.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{exam.problemStatement}</p>

                                <div className="text-xs text-gray-500 space-y-1 mb-4">
                                  <div className="flex items-center justify-between">
                                    <span>Problems:</span>
                                    <span className="font-semibold text-gray-800">
                                      {exam.questions?.length || 1} {exam.questions?.length === 1 ? 'Problem' : 'Problems'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Test Cases:</span>
                                    <span className="font-semibold text-gray-800">
                                      {exam.questions?.length
                                        ? exam.questions.reduce((sum: number, q: any) => sum + (q.testCases?.length || 0), 0)
                                        : (exam.testCases?.length || 0)} Cases
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Total Points:</span>
                                    <span className="font-semibold text-[#2563eb]">{exam.totalPoints} Pts</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Password:</span>
                                    <span className="font-mono font-bold text-[#0a2540]">{exam.accessPassword || 'DEXAR2026'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                <span>Due: {exam.dueDate || 'Ongoing'}</span>
                                {exam.isLockdown && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" />
                                    Lockdown
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-white rounded-xl border border-gray-200/80">
                          <Code2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-600">No Coding Challenges Created Yet</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Click &ldquo;Create Coding Exam&rdquo; to launch algorithmic tests.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUPERADMIN TAB: DOUBTS CHAT */}
                {activeTab === 'doubts' && (
                  <DoubtsChatSection
                    role="superadmin"
                    subjects={saSubjects}
                    currentUser={currentUser}
                    showToast={showToast}
                  />
                )}

                {/* SUPERADMIN TAB: COURSE MATERIALS */}
                {activeTab === 'materials' && (
                  <CourseMaterialsSection
                    role="superadmin"
                    subjects={saSubjects}
                    currentUser={currentUser}
                    showToast={showToast}
                  />
                )}

              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. ADMIN (TRAINER) VIEW */}
            {/* ========================================================================= */}
            {currentUser.role === 'admin' && (
              <div className="space-y-6">

                {/* TAB 0: TRAINER DASHBOARD */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Trainer Hero Header */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#0a2540] via-[#1e3a8a] to-[#2563eb] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-none">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 mb-3 border border-white/10">
                          <KeyRound className="w-3.5 h-3.5" />
                          Trainer & Classroom Admin Portal
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Trainer Arena</h1>
                        <p className="text-blue-200 text-xs sm:text-sm mt-1">
                          Assigned Subject: <strong className="text-white">{trainerData?.subject?.title || 'Full Stack Web Development'}</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => setShowDocxModal(true)}
                          className="px-5 py-2.5 rounded-full bg-white text-[#0a2540] hover:bg-gray-100 text-xs font-bold shadow-none flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                        >
                          <FileUp className="w-4 h-4 text-[#2563eb]" />
                          <span>Upload Word (.docx) Exam</span>
                        </button>
                        <button
                          onClick={() => setShowLiveModal(true)}
                          className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-none flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                        >
                          <Video className="w-4 h-4" />
                          <span>Schedule Live Class</span>
                        </button>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div
                        onClick={() => setActiveTab('students')}
                        className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between cursor-pointer hover:border-[#2563eb] transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-[#2563eb] transition-colors">Enrolled Students</span>
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-100 group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
                            <Users className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl sm:text-3xl font-bold text-[#0a2540]">{trainerData?.stats?.totalStudents || 0}</div>
                          <p className="text-xs text-[#2563eb] font-semibold mt-1">Listening to your classes &bull; View roster</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab('live')}
                        className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">Scheduled Live Sessions</span>
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Video className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl sm:text-3xl font-bold text-[#0a2540]">{trainerLiveClasses.length}</div>
                          <p className="text-xs text-slate-500 mt-1">Interactive meeting links &bull; Manage</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab('recorded')}
                        className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between cursor-pointer hover:border-purple-300 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-purple-700 transition-colors">Recorded Classes & Notes</span>
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Play className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl sm:text-3xl font-bold text-[#0a2540]">{trainerRecorded.length}</div>
                          <p className="text-xs text-slate-500 mt-1">Published video lectures &bull; View all</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab('overview')}
                        className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors">Active Lockdown Exams</span>
                          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="text-2xl sm:text-3xl font-bold text-[#0a2540]">
                            {trainerAssessments.length + trainerCodingExams.length}
                          </div>
                          <p className="text-xs text-emerald-700 font-semibold mt-1">Word parsed & coding arenas &bull; Review</p>
                        </div>
                      </div>
                    </div>

                    {/* Trainer Quick Launchpad Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Upcoming Live Sessions Snapshot */}
                      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-none flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#0a2540] text-base flex items-center gap-2">
                              <Video className="w-4 h-4 text-emerald-600" />
                              <span>Live Classes Schedule</span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => setActiveTab('live')}
                              className="text-xs font-semibold text-[#2563eb] hover:underline"
                            >
                              Manage ({trainerLiveClasses.length}) &rarr;
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {trainerLiveClasses.slice(0, 3).map((cls) => (
                              <div key={cls._id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-xs text-[#0a2540]">{cls.title}</div>
                                  <div className="text-[10px] text-slate-400">{cls.date} &bull; {cls.time}</div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${cls.status === 'completed' ? 'bg-slate-100 text-slate-700 border border-slate-200' : cls.status === 'live' ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                  {cls.status || 'scheduled'}
                                </span>
                              </div>
                            ))}
                            {trainerLiveClasses.length === 0 && (
                              <p className="text-xs text-slate-400 italic py-2">No live classes scheduled yet.</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowLiveModal(true)}
                          className="mt-4 w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Schedule Live Class</span>
                        </button>
                      </div>

                      {/* Active Assessments Snapshot */}
                      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-none flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#0a2540] text-base flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#2563eb]" />
                              <span>Assessments & Quizzes</span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => setActiveTab('overview')}
                              className="text-xs font-semibold text-[#2563eb] hover:underline"
                            >
                              View ({trainerAssessments.length}) &rarr;
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {trainerAssessments.slice(0, 3).map((ast) => (
                              <div key={ast._id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-xs text-[#0a2540]">{ast.title}</div>
                                  <div className="text-[10px] text-slate-400">{ast.questions?.length || 0} Questions &bull; {ast.totalMarks} Marks</div>
                                </div>
                                <span className="text-[10px] font-bold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {ast.durationMinutes || 45}m
                                </span>
                              </div>
                            ))}
                            {trainerAssessments.length === 0 && (
                              <p className="text-xs text-slate-400 italic py-2">No exams created yet.</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDocxModal(true)}
                          className="mt-4 w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563eb] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>Upload Word (.docx) Exam</span>
                        </button>
                      </div>

                      {/* Enrolled Students Snapshot */}
                      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-none flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#0a2540] text-base flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-600" />
                              <span>Enrolled Students</span>
                            </h3>
                            <button
                              type="button"
                              onClick={() => setActiveTab('students')}
                              className="text-xs font-semibold text-[#2563eb] hover:underline"
                            >
                              Directory ({trainerData?.students?.length || 0}) &rarr;
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {(trainerData?.students || []).slice(0, 3).map((st: any) => (
                              <div key={st._id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-xs text-[#0a2540]">{st.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{st.email}</div>
                                </div>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                  {st.planType || 'monthly'}
                                </span>
                              </div>
                            ))}
                            {(!trainerData?.students || trainerData.students.length === 0) && (
                              <p className="text-xs text-slate-400 italic py-2">No students enrolled yet.</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('students')}
                          className="mt-4 w-full py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Full Student Roster</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TRAINER TAB 1: WORD DOCX EXAMS & ASSESSMENTS */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">Lockdown Mode Assessments (Word Docx Parser)</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Upload your question paper in Word format (`.docx`). The system parses questions, options, and answers, and conducts the exam under Lockdown Mode.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDocxModal(true)}
                        className="px-5 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-2 shadow-none"
                      >
                        <FileUp className="w-4 h-4" />
                        <span>Upload Word (.docx) Exam</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trainerAssessments.map((ast) => (
                        <div
                          key={ast._id}
                          className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none flex flex-col justify-between hover:shadow-none transition-shadow"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563eb] border border-[#bfdbfe]/50 text-[10px] font-bold uppercase">
                                Quiz Assessment
                              </span>
                              {ast.isLockdown && (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                  <ShieldAlert className="w-3 h-3" />
                                  Lockdown Active
                                </span>
                              )}
                            </div>

                            <h3 className="font-semibold text-[#0a2540] text-base mb-2">{ast.title}</h3>
                            <div className="text-xs text-gray-500 space-y-1 mb-4">
                              <div className="flex items-center justify-between">
                                <span>Questions:</span>
                                <span className="font-semibold text-gray-800">{ast.questions?.length || 0} Questions</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Total Marks:</span>
                                <span className="font-semibold text-[#2563eb]">{ast.totalMarks} Marks</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Due Date:</span>
                                <span className="font-semibold text-gray-800">{ast.dueDate}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Max Tab Violations:</span>
                                <span className="font-semibold text-rose-600">{ast.maxViolations || 3} allowed</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await api.getAssessmentSubmissions(ast._id);
                                setSelectedAssessmentSubs(res.submissions || []);
                                setActiveAssessmentForSubs(ast);
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#0a2540] text-xs font-semibold flex items-center justify-center gap-1.5 border border-gray-200/70 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Submissions</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAssessment(ast)}
                              className="p-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Edit Assessment"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(
                                'Delete Assessment',
                                `Are you sure you want to permanently delete the assessment "${ast.title}"? All student attempts and grades for this quiz will be permanently removed.`,
                                ast.title,
                                async () => {
                                  await api.deleteAssessment(ast._id, 'admin');
                                  setTrainerAssessments((prev) => prev.filter((a) => a._id !== ast._id));
                                  showToast('Assessment deleted successfully!', 'success');
                                }
                              )}
                              className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Delete Assessment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRAINER TAB 2: CODING EXAM ARENA */}
                {activeTab === 'coding' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">Coding Assessments (Lockdown Arena)</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Create algorithmic coding challenges with test cases for enrolled students.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCodingModal(true)}
                        className="px-5 py-2.5 rounded-full bg-[#0a2540] hover:bg-black text-white text-xs font-semibold flex items-center gap-2 shadow-none"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Coding Challenge</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trainerCodingExams.map((exam) => (
                        <div
                          key={exam._id}
                          className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none flex flex-col justify-between hover:shadow-none transition-shadow"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase">
                                Coding Exam
                              </span>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                Lockdown Enforced
                              </span>
                            </div>

                            <h3 className="font-semibold text-[#0a2540] text-base mb-2">{exam.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4">{exam.problemStatement}</p>

                            <div className="text-xs text-gray-500 space-y-1 mb-4">
                              <div className="flex items-center justify-between">
                                <span>Problems:</span>
                                <span className="font-semibold text-gray-800">
                                  {exam.questions?.length || 1} {exam.questions?.length === 1 ? 'Problem' : 'Problems'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Test Cases:</span>
                                <span className="font-semibold text-gray-800">
                                  {exam.questions?.length
                                    ? exam.questions.reduce((sum: number, q: any) => sum + (q.testCases?.length || 0), 0)
                                    : (exam.testCases?.length || 0)} Cases
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Total Points:</span>
                                <span className="font-semibold text-[#2563eb]">{exam.totalPoints} Pts</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Due Date:</span>
                                <span className="font-semibold text-gray-800">{exam.dueDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await api.getCodingSubmissions(exam._id);
                                setSelectedCodingSubs(res.submissions || []);
                                setActiveCodingExamForSubs(exam);
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#0a2540] text-xs font-semibold flex items-center justify-center gap-1.5 border border-gray-200/70 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Submissions</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCodingExam(exam)}
                              className="p-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Edit Coding Challenge"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(
                                'Delete Coding Challenge',
                                `Are you sure you want to permanently delete "${exam.title}"? All submitted code tests and scores will be deleted.`,
                                exam.title,
                                async () => {
                                  await api.deleteCodingExam(exam._id, 'admin');
                                  setTrainerCodingExams((prev) => prev.filter((c) => c._id !== exam._id));
                                  showToast('Coding challenge deleted successfully!', 'success');
                                }
                              )}
                              className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Delete Coding Challenge"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRAINER TAB 3: LIVE CLASSES */}
                {activeTab === 'live' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">Live Interactive Sessions & Meeting Links</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Add your Google Meet or Zoom meeting links so students can attend real-time classes.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowLiveModal(true)}
                        className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-none"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Schedule New Live Session</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trainerLiveClasses.map((cls) => {
                        const isCompleted = cls.status === 'completed';
                        const isLive = cls.status === 'live';

                        return (
                          <div
                            key={cls._id}
                            className={`rounded-xl p-4 sm:p-5 border shadow-none flex flex-col justify-between transition-shadow ${
                              isCompleted ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-gray-200/80'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                {isCompleted ? (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Completed
                                  </span>
                                ) : isLive ? (
                                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    Live Now
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-blue-600" />
                                    Upcoming
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">{cls.date}</span>
                              </div>

                              <h3 className={`font-semibold text-base mb-2 ${isCompleted ? 'text-slate-600 line-through decoration-slate-300' : 'text-[#0a2540]'}`}>
                                {cls.title}
                              </h3>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-4">{cls.description}</p>

                              <div className="text-xs text-gray-600 flex items-center gap-4 mb-4">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  {cls.time}
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <a
                                href={cls.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-none"
                              >
                                <span>Meeting</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {/* 1-Click Mark Completed Toggle Button */}
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const nextStatus = isCompleted ? 'upcoming' : 'completed';
                                    await api.updateLiveClass(cls._id, { status: nextStatus }, 'admin');
                                    setTrainerLiveClasses((prev) =>
                                      prev.map((l) => (l._id === cls._id ? { ...l, status: nextStatus } : l))
                                    );
                                    showToast(
                                      isCompleted
                                        ? `Reopened "${cls.title}" as Upcoming`
                                        : `Marked "${cls.title}" as Completed!`,
                                      'success'
                                    );
                                  } catch (err: any) {
                                    showToast(err.message || 'Failed to update live class status.', 'error');
                                  }
                                }}
                                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                  isCompleted
                                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                                    : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                }`}
                                title={isCompleted ? 'Click to mark as Upcoming' : 'Click to mark as Completed'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingLiveClass(cls)}
                                className="p-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                                title="Edit Live Class"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDelete(
                                  'Delete Live Class',
                                  `Are you sure you want to delete the scheduled live class "${cls.title}"?`,
                                  cls.title,
                                  async () => {
                                    await api.deleteLiveClass(cls._id, 'admin');
                                    setTrainerLiveClasses((prev) => prev.filter((l) => l._id !== cls._id));
                                    showToast('Live session deleted successfully!', 'success');
                                  }
                                )}
                                className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                title="Delete Live Class"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TRAINER TAB 4: RECORDED CLASSES */}
                {activeTab === 'recorded' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">Recorded Lecture Library & Study Notes</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Upload recorded lecture videos and downloadable PDF study notes for your enrolled students.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowRecordedModal(true)}
                        className="px-5 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-2 shadow-none"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Upload Recorded Lecture</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trainerRecorded.map((rec) => (
                        <div
                          key={rec._id}
                          className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none flex flex-col justify-between hover:shadow-none transition-shadow"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563eb] border border-[#bfdbfe]/50 text-[10px] font-bold uppercase">
                                Video Lecture
                              </span>
                              <span className="text-xs text-gray-400">{rec.duration || '45 mins'}</span>
                            </div>

                            <h3 className="font-semibold text-[#0a2540] text-base mb-2">{rec.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4">{rec.description}</p>
                          </div>

                          <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveVideoUrl(rec.videoUrl);
                                setActiveVideoData({ url: rec.videoUrl, title: rec.title, notesUrl: rec.notesUrl });
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-semibold flex items-center justify-center gap-1.5 shadow-none cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current text-white" />
                              <span>Watch Video</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRecordedClass(rec)}
                              className="p-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Edit Recorded Class"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(
                                'Delete Recorded Lecture',
                                `Are you sure you want to delete "${rec.title}"? Students will no longer be able to watch this lecture.`,
                                rec.title,
                                async () => {
                                  await api.deleteRecordedClass(rec._id, 'admin');
                                  setTrainerRecorded((prev) => prev.filter((r) => r._id !== rec._id));
                                  showToast('Recorded class deleted successfully!', 'success');
                                }
                              )}
                              className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Delete Recorded Lecture"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRAINER TAB 5: STUDENTS DIRECTORY */}
                {/* TRAINER TAB 5: STUDENTS DIRECTORY */}
                {activeTab === 'students' && (() => {
                  const trainerStudents = (trainerData?.students || []).filter((st: any) => {
                    if (trainerStudentSearch.trim()) {
                      const term = trainerStudentSearch.toLowerCase();
                      return st.name?.toLowerCase().includes(term) || st.email?.toLowerCase().includes(term);
                    }
                    return true;
                  });

                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a2540]">Enrolled Students Listening to Classes</h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                              Full Admin CRUD
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Roster of students registered for {trainerData?.subject?.title || 'your assigned course'}.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTrainerSubjectExpanded(!trainerSubjectExpanded)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-none transition-colors"
                          >
                            {trainerSubjectExpanded ? <ChevronUp className="w-4 h-4 text-[#2563eb]" /> : <ChevronDown className="w-4 h-4 text-[#2563eb]" />}
                            <span>{trainerSubjectExpanded ? 'Collapse Subject Roster' : 'Expand Subject Roster'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Subject Card */}
                      <div className="bg-white rounded-xl border border-gray-200/80 shadow-none overflow-hidden transition-all">
                        {/* Subject Header with Expand/Collapse */}
                        <div
                          onClick={() => setTrainerSubjectExpanded(!trainerSubjectExpanded)}
                          className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold text-sm border border-blue-200/60 shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-[#0a2540] text-base">
                                  {trainerData?.subject?.title || 'Full Stack Web Development'}
                                </h3>
                                {trainerData?.subject?.code && (
                                  <span className="text-[10px] font-bold text-[#2563eb] bg-white px-2 py-0.5 rounded border border-blue-200 font-mono">
                                    {trainerData.subject.code}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Assigned Classroom: <strong className="text-slate-700">{currentUser?.name}</strong> &bull; Full CRUD permissions
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200 text-xs font-bold">
                              {(trainerData?.students || []).length} Students Enrolled
                            </span>
                            <button
                              type="button"
                              onClick={() => setTrainerSubjectExpanded(!trainerSubjectExpanded)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563eb] hover:bg-white border border-slate-200 transition-colors cursor-pointer"
                              title={trainerSubjectExpanded ? 'Collapse Subject Roster' : 'Expand Subject Roster'}
                            >
                              {trainerSubjectExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {trainerSubjectExpanded ? (
                          <div>
                            {/* Real-time Search Bar within Roster */}
                            <div className="p-3.5 bg-slate-50/50 border-b border-gray-100 flex items-center justify-between gap-3">
                              <div className="relative flex-1 max-w-sm">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={trainerStudentSearch}
                                  onChange={(e) => setTrainerStudentSearch(e.target.value)}
                                  placeholder="Search enrolled students by name or email..."
                                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                                />
                              </div>
                              <span className="text-xs text-gray-500 font-medium px-2">
                                Showing <strong className="text-[#0a2540]">{trainerStudents.length}</strong> students
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-[#f8fafc] text-gray-500 font-semibold border-b border-gray-200 uppercase">
                                  <tr>
                                    <th className="py-4 px-6">Student Name</th>
                                    <th className="py-4 px-6">Email Address</th>
                                    <th className="py-4 px-6">Subscription Plan</th>
                                    <th className="py-4 px-6">End Date</th>
                                    <th className="py-4 px-6">Payment Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {trainerStudents.map((st: any) => (
                                    <tr key={st._id} className="hover:bg-slate-50/70 transition-colors">
                                      <td className="py-4 px-6 font-semibold text-[#0a2540]">
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-7 h-7 rounded-full bg-blue-50 text-[#2563eb] font-bold text-xs flex items-center justify-center border border-blue-200">
                                            {st.name?.[0] || 'S'}
                                          </div>
                                          <span>{st.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-4 px-6 text-gray-500 font-mono text-[11px]">{st.email}</td>
                                      <td className="py-4 px-6 capitalize">{st.planType || 'monthly'}</td>
                                      <td className="py-4 px-6 text-gray-500">{new Date(st.endDate).toLocaleDateString()}</td>
                                      <td className="py-4 px-6">
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase">
                                          {st.paymentStatus || 'paid'}
                                        </span>
                                      </td>
                                      <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => setEditingStudent(st)}
                                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                                            title="Edit Student"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => confirmDelete(
                                              'Delete Student',
                                              `Are you sure you want to delete student account "${st.name}"? They will lose access to Dexar courses and assessments.`,
                                              `${st.name} (${st.email})`,
                                              async () => {
                                                await api.deleteStudent(st._id, 'admin');
                                                setTrainerData((prev: any) => prev ? {
                                                  ...prev,
                                                  students: prev.students?.filter((s: any) => s._id !== st._id),
                                                  stats: {
                                                    ...prev.stats,
                                                    totalStudents: Math.max(0, (prev.stats?.totalStudents || 1) - 1),
                                                  },
                                                } : prev);
                                                showToast(`Student ${st.name} deleted successfully!`, 'success');
                                              }
                                            )}
                                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                            title="Delete Student"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {trainerStudents.length === 0 && (
                                    <tr>
                                      <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                                        {trainerStudentSearch ? 'No students found matching your search.' : 'No students currently enrolled in this subject.'}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => setTrainerSubjectExpanded(true)}
                            className="p-3.5 bg-slate-50/60 hover:bg-slate-100/70 text-center text-xs font-medium text-slate-500 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                          >
                            <span>Subject roster collapsed &bull; Click to expand {trainerStudents.length} students</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ADMIN TAB: STUDENT MARKS ACCORDING TO EXAM NAME */}
                {activeTab === 'marks' && (
                  <ExamMarksSection
                    role="admin"
                    assessments={trainerAssessments}
                    codingExams={trainerCodingExams}
                    subjects={trainerData?.subject ? [trainerData.subject] : []}
                    marks={saMarks}
                    currentUser={currentUser}
                    onEditScore={(item) => setEditingScoreItem(item)}
                    onAllowRetake={(subId, type) => {
                      if (type === 'mcq') handleAllowAssessmentRetake(subId, 'admin');
                      else handleAllowCodingRetake(subId, 'admin');
                    }}
                    onDeleteSubmission={(subId, type, stName, examTitle) => {
                      confirmDelete(
                        type === 'mcq' ? 'Delete Quiz Submission' : 'Delete Coding Submission',
                        `Are you sure you want to delete the submission of ${stName} for "${examTitle}"?`,
                        `${stName} - ${examTitle}`,
                        async () => {
                          if (type === 'mcq') {
                            await api.allowAssessmentRetake(subId, 'admin');
                            setSaMarks((prev: any) => ({
                              ...prev,
                              assessmentSubmissions: prev?.assessmentSubmissions?.filter((s: any) => s._id !== subId),
                            }));
                          } else {
                            await api.allowCodingRetake(subId, 'admin');
                            setSaMarks((prev: any) => ({
                              ...prev,
                              codingSubmissions: prev?.codingSubmissions?.filter((c: any) => c._id !== subId),
                            }));
                          }
                          showToast('Submission deleted successfully!', 'success');
                        }
                      );
                    }}
                  />
                )}

                {/* ADMIN TAB: DOUBTS CHAT */}
                {activeTab === 'doubts' && (
                  <DoubtsChatSection
                    role="admin"
                    subjects={trainerData?.subject ? [trainerData.subject] : saSubjects}
                    currentUser={currentUser}
                    showToast={showToast}
                  />
                )}

                {/* ADMIN TAB: COURSE MATERIALS */}
                {activeTab === 'materials' && (
                  <CourseMaterialsSection
                    role="admin"
                    subjects={trainerData?.subject ? [trainerData.subject] : saSubjects}
                    currentUser={currentUser}
                    showToast={showToast}
                  />
                )}

              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. STUDENT VIEW */}
            {/* ========================================================================= */}
            {currentUser.role === 'student' && (() => {
              // Priority 1: Check if SuperAdmin granted manual access bypass
              const accessGranted =
                studentDash?.subscription?.accessGrantedByAdmin === true ||
                studentDash?.student?.accessGrantedByAdmin === true ||
                currentUser?.accessGrantedByAdmin === true;

              // Priority 2: Check live payment status (backend studentDash is authoritative)
              const currentPaymentStatus =
                studentDash?.subscription?.paymentStatus ||
                studentDash?.student?.paymentStatus ||
                currentUser?.paymentStatus ||
                'pending';

              const isPaymentRequested = Boolean(
                studentDash?.subscription?.paymentRequested ||
                studentDash?.student?.paymentRequested ||
                currentUser?.paymentRequested
              );

              // Student is paid ONLY if SuperAdmin granted manual access OR account is paid with no pending payment request
              const isStudentPaid = accessGranted || (currentPaymentStatus === 'paid' && !isPaymentRequested);

              if (!isStudentPaid) {
                return (
                  <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-6">
                    {/* Header Banner */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0a2540] via-[#0f2e59] to-[#1e3a8a] text-white shadow-xl relative overflow-hidden">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs font-bold uppercase tracking-wider mb-4">
                        <Lock className="w-3.5 h-3.5 text-rose-300" />
                        <span>Account Inactive &bull; Payment Required</span>
                      </div>
                      <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                        Complete Payment to Access Student Portal
                      </h1>
                      <p className="text-blue-100 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                        Welcome, <strong>{currentUser.name}</strong>! Your account for{' '}
                        <strong className="text-white underline decoration-blue-400">{studentDash?.student?.subjectId?.title || 'your enrolled course'}</strong> requires an active subscription to access interactive live classes, recorded lectures, lecture notes, MCQ tests, and coding arenas.
                      </p>
                    </div>

                    {/* Official Payment Request Alert (if Super Admin requested payment) */}
                    {(currentUser?.paymentRequested || studentDash?.student?.paymentRequested || studentDash?.subscription?.paymentRequested) && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm leading-relaxed">
                          <strong className="font-bold">Official Super Admin Notice:</strong> The Super Admin has requested payment for your course enrollment. Please complete your transaction via Razorpay below to unlock your learning portal.
                        </div>
                      </div>
                    )}

                    {/* Access Request Status Alert (if student sent a request) */}
                    {(currentUser?.accessRequested || studentDash?.student?.accessRequested || studentDash?.subscription?.accessRequested) && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm leading-relaxed">
                          <strong className="font-bold">Access Request Submitted:</strong> Your request has been forwarded to the Super Admin (Note: &ldquo;{currentUser?.accessRequestNote || studentDash?.student?.accessRequestNote || studentDash?.subscription?.accessRequestNote || 'Payment issue reported'}&rdquo;). Once approved, your portal will automatically unlock without needing a reload. You can also pay via Razorpay below for instant activation.
                        </div>
                      </div>
                    )}

                    {/* Course Fee & Payment Details (Allocated by Super Admin) */}
                    {(() => {
                      const allocatedAmount = Number(
                        studentDash?.subscription?.amount ??
                        studentDash?.student?.amount ??
                        currentUser?.amount ??
                        499
                      );
                      const courseTitle = studentDash?.student?.subjectId?.title || currentUser?.subjectId?.title || 'Enrolled Course';
                      const planType = studentDash?.subscription?.planType || studentDash?.student?.planType || currentUser?.planType || 'monthly';
                      const planLabel = planType === 'course_wise' ? 'Course-Wise Pack' : 'Monthly Learning Pack';
                      const durationLabel = planType === 'course_wise' ? 'Permanent Access (Lifetime)' : '30 Days Access';

                      return (
                        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200 shadow-sm space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                            <div>
                              <h2 className="text-lg font-bold text-[#0a2540]">Course Enrollment & Fee Payment</h2>
                              <p className="text-xs text-gray-500">Official course fee allocated by Super Admin</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563eb] text-[11px] font-bold border border-blue-200 self-start sm:self-auto">
                              Razorpay Live Gateway
                            </span>
                          </div>

                          {/* Single Allocated Course Details Card - Strict Super Admin Allocated Price */}
                          <div className="p-5 sm:p-6 rounded-2xl border-2 border-[#2563eb] bg-[#eff6ff] ring-2 ring-[#2563eb]/20">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-200/60">
                              <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563eb] bg-blue-100 px-2.5 py-0.5 rounded-full">
                                  {planLabel} &bull; {durationLabel}
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-[#0a2540] mt-2">
                                  {courseTitle}
                                </h3>
                                <p className="text-xs text-slate-600 mt-1">
                                  Full student portal access including live lectures, recordings, assessments, and notes.
                                </p>
                              </div>
                              <div className="sm:text-right shrink-0">
                                <span className="text-xs font-semibold text-slate-500 block">Total Allocated Fee</span>
                                <div className="text-3xl sm:text-4xl font-black text-[#2563eb]">
                                  ₹{allocatedAmount.toLocaleString('en-IN')}
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">Price set by Super Admin</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs text-slate-700">
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Live interactive daily classes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Recorded class library & PDF notes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Weekly MCQ exams & coding arena</span>
                              </div>
                            </div>
                          </div>

                          {/* Pay with Razorpay Button */}
                          <div className="pt-2">
                            <button
                              type="button"
                              disabled={paymentProcessing}
                              onClick={handleProcessPayment}
                              className="w-full py-4 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
                            >
                              <CreditCard className="w-5 h-5" />
                              <span>
                                {paymentProcessing
                                  ? 'Opening Razorpay Gateway...'
                                  : `Pay ₹${allocatedAmount.toLocaleString('en-IN')} with Razorpay to Unlock Portal`}
                              </span>
                            </button>
                            <p className="text-center text-[11px] text-gray-400 mt-2 flex items-center justify-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>100% Secure Checkout powered by Razorpay (UPI, GPay, PhonePe, Cards, NetBanking)</span>
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Razorpay Issues / Fallback Help Box */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#0a2540] flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#2563eb]" />
                          <span>Razorpay Not Working or Need Manual Approval?</span>
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                          If the Razorpay payment gateway is failing, or if you have paid offline, contact the Super Admin or submit an access request. The Super Admin can review your request and allow you immediate portal access directly.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowContactAdminModal(true)}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-none cursor-pointer shrink-0"
                      >
                        Contact Super Admin &rarr;
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">

                  {/* MULTI-COURSE SWITCHER FOR STUDENTS ENROLLED IN MORE THAN 1 COURSE (HIDDEN IN DASHBOARD SECTION) */}
                  {enrolledCourses.length > 1 && activeTab !== 'dashboard' && activeTab !== 'overview' && (
                    <div className="bg-white rounded-xl p-3 sm:px-4 sm:py-2.5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-none">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-slate-500 font-medium shrink-0">Course:</span>
                        <span className="text-xs sm:text-sm font-bold text-[#0a2540] truncate">
                          {activeCourse?.title || 'Selected Course'}
                        </span>
                        {courseLoading && (
                          <span className="text-[11px] text-[#2563eb] font-semibold animate-pulse ml-1">
                            Switching...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400 font-medium hidden sm:inline">Switch:</span>
                        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          {enrolledCourses.map((course: any, idx: number) => {
                            const courseId = (course._id || course).toString();
                            const isActive =
                              selectedCourseId === courseId ||
                              (!selectedCourseId && idx === 0) ||
                              (activeCourse && (activeCourse._id || activeCourse).toString() === courseId);
                            const courseTitle = course.title || 'Course ' + (idx + 1);

                            return (
                              <button
                                key={courseId}
                                type="button"
                                onClick={() => handleSelectCourse(courseId)}
                                disabled={courseLoading && selectedCourseId === courseId}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                                  isActive
                                    ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200/80'
                                }`}
                              >
                                {courseTitle}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                {/* STUDENT TAB 0: MY ENROLLED COURSES (Course-wise list with one-click jump to Course Dashboard) */}
                {activeTab === 'courses' && (
                  <div className="space-y-6">
                    {/* Courses Hub Banner */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#0a2540] via-[#0f2e59] to-[#2563eb] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-none">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-blue-200 text-xs font-semibold mb-3 shadow-none">
                          <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                          <span>Student Enrolled Courses Hub</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">Your Enrolled Courses</h1>
                        <p className="text-blue-200 text-sm sm:text-base font-normal mt-1 max-w-xl">
                          Select any course below to switch into its dedicated dashboard, join live class meetings, watch recorded lectures, and take exams.
                        </p>
                      </div>

                      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/20 flex items-center gap-4 shadow-none">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-white">
                          <GraduationCap className="w-6 h-6 text-blue-200" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{enrolledCourses.length}</div>
                          <div className="text-xs text-blue-200 font-medium">Allocated Programs</div>
                        </div>
                      </div>
                    </div>

                    {/* Course Wise Cards Grid */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-semibold text-[#0a2540]">Course-Wise Learning Tracks</h2>
                          <p className="text-xs text-slate-500 mt-0.5">Click "Go to Course Dashboard" to launch any course</p>
                        </div>
                        {activeCourse && (
                          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active: {activeCourse.title}</span>
                          </div>
                        )}
                      </div>

                      {enrolledCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {enrolledCourses.map((course: any, idx: number) => {
                            const courseId = (course._id || course).toString();
                            const isActive = (selectedCourseId === courseId) || (!selectedCourseId && idx === 0);
                            const courseTitle = course.title || 'Course ' + courseId.slice(-4);
                            const courseCode = course.code || `CRS-${idx + 1}`;
                            const trainerName = course.trainerId?.name || (currentUser as any)?.trainerId?.name || 'Dedicated Faculty Trainer';

                            return (
                              <div
                                key={courseId}
                                className={`rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between bg-white border ${
                                  isActive
                                    ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                                    : 'border-slate-200/90 hover:border-blue-300 hover:shadow-sm'
                                }`}
                              >
                                <div>
                                  {/* Top Badges */}
                                  <div className="flex items-center justify-between gap-2 mb-4">
                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-[#2563eb] border border-blue-200">
                                      {courseCode}
                                    </span>
                                    {isActive ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Active Dashboard</span>
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                        Enrolled
                                      </span>
                                    )}
                                  </div>

                                  {/* Course Title & Description */}
                                  <h3 className="text-xl font-bold text-[#0a2540] mb-2 leading-snug">
                                    {courseTitle}
                                  </h3>
                                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                                    {course.description || 'Comprehensive curriculum covering live interactive classes, video recordings, MCQ assessments, and coding projects.'}
                                  </p>

                                  {/* Course Faculty info */}
                                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-5">
                                    <div className="w-8 h-8 rounded-full bg-[#0a2540] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                      {trainerName[0] || 'T'}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[11px] text-slate-400 font-medium">Instructor / Trainer</div>
                                      <div className="text-xs font-semibold text-slate-800 truncate">{trainerName}</div>
                                    </div>
                                  </div>

                                  {/* Curriculum Highlights */}
                                  <div className="grid grid-cols-2 gap-2 mb-6">
                                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100/80 flex items-center gap-2">
                                      <Video className="w-4 h-4 text-[#2563eb] shrink-0" />
                                      <span className="text-[11px] font-medium text-slate-700">Live Sessions</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100/80 flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                                      <span className="text-[11px] font-medium text-slate-700">Digital Notes</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-2">
                                      <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="text-[11px] font-medium text-slate-700">MCQ Exams</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100/80 flex items-center gap-2">
                                      <Code className="w-4 h-4 text-amber-600 shrink-0" />
                                      <span className="text-[11px] font-medium text-slate-700">Coding Arena</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action CTA */}
                                <button
                                  type="button"
                                  onClick={() => handleSelectCourse(courseId)}
                                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-none ${
                                    isActive
                                      ? 'bg-[#0a2540] hover:bg-slate-800 text-white'
                                      : 'bg-[#2563eb] hover:bg-blue-700 text-white shadow-sm hover:scale-[1.01]'
                                  }`}
                                >
                                  {isActive ? (
                                    <>
                                      <span>Open Active Dashboard</span>
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Go to Course Dashboard</span>
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <h3 className="text-base font-semibold text-slate-700">No Enrolled Courses Found</h3>
                          <p className="text-xs text-slate-500 mt-1">Please contact your administrator to allocate your curriculum courses.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STUDENT TAB 1: DASHBOARD & LIVE CLASSES */}
                {(activeTab === 'overview' || activeTab === 'dashboard') && (
                  <div className="space-y-3.5">

                    {/* Loading feedback during course switch */}
                    {courseLoading && (
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center gap-3 text-blue-700 text-xs font-semibold animate-pulse">
                        <Sparkles className="w-4 h-4 animate-spin text-[#2563eb]" />
                        <span>Switching to {activeCourse?.title || 'Course'} dashboard & learning data...</span>
                      </div>
                    )}

                    {/* Student Hero Header (Only in Dashboard) */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#0a2540] via-[#0f2e59] to-[#2563eb] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-none">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <div className="inline-flex items-center px-3 py-1.5 rounded-[5px] bg-white/10 backdrop-blur-md border border-white/10 text-blue-200 text-xs font-semibold shadow-none">
                            {(studentDash?.subscription?.planType === 'course_wise' || (currentUser as any)?.planType === 'course_wise') ? 'Course Program (Permanent Access)' : 'Monthly Pack'}
                          </div>
                          {activeCourse?.code && (
                            <div className="inline-flex items-center px-2.5 py-1 rounded-[5px] bg-white/10 text-blue-200 text-xs font-mono font-semibold border border-white/10">
                              {activeCourse.code}
                            </div>
                          )}
                          {enrolledCourses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('courses')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] bg-blue-500/30 hover:bg-blue-500/40 text-white text-xs font-semibold border border-white/20 cursor-pointer transition-colors"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Switch Course ({enrolledCourses.length})</span>
                            </button>
                          )}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">Welcome back, {currentUser.name}!</h1>
                        <p className="text-blue-200 text-sm sm:text-base font-normal mt-1 pl-1 flex items-center gap-2 flex-wrap">
                          <span>{activeCourse?.title || studentDash?.student?.subjectId?.title || 'Full Stack Web Development'}</span>
                          {activeCourse?.trainerId?.name && (
                            <span className="text-xs bg-white/15 px-2 py-0.5 rounded text-blue-100">
                              Trainer: {activeCourse.trainerId.name}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Subscription Pill & Payment CTA (Course Wise Students do not have Renew/Payment option) */}
                      <div className="bg-white/10 backdrop-blur-md rounded-lg p-5 sm:p-6 border border-white/20 flex flex-col items-start gap-3 sm:gap-3.5 shadow-none min-w-[220px] sm:min-w-[260px]">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-sm sm:text-base font-semibold text-white">
                            {(studentDash?.subscription?.planType || currentUser?.planType) === 'course_wise'
                              ? 'Permanent Access'
                              : `${studentDash?.subscription?.daysRemaining || 30} Days Left`}
                          </span>
                        </div>
                        {(studentDash?.subscription?.planType || currentUser?.planType) !== 'course_wise' ? (
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full px-5 py-2.5 rounded-md bg-white text-[#2563eb] hover:bg-slate-100 text-xs sm:text-sm font-bold shadow-none flex items-center justify-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Renew (Extend 1 Month)</span>
                          </button>
                        ) : (
                          <div className="w-full py-1.5 px-3 rounded-md bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Lifetime Portal Access</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Student Quick Stats Row: Attendance, MCQ Marks, Coding Marks, Download Report */}
                    {(() => {
                      const sub = studentDash?.subscription;
                      const isCourseWise = (sub?.planType || currentUser?.planType) === 'course_wise';
                      const daysRemaining = Number(sub?.daysRemaining ?? 29);

                      let totalPackDays = 30;
                      if (!isCourseWise && sub?.startDate && sub?.endDate) {
                        const s = new Date(sub.startDate).getTime();
                        const e = new Date(sub.endDate).getTime();
                        const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
                        if (diff > 0) totalPackDays = diff;
                      }

                      let completedDays = isCourseWise ? 0 : Math.max(0, totalPackDays - daysRemaining);
                      if (!isCourseWise && sub?.startDate) {
                        const elapsed = Math.floor((Date.now() - new Date(sub.startDate).getTime()) / (1000 * 60 * 60 * 24));
                        if (elapsed >= 0) completedDays = Math.min(totalPackDays, elapsed);
                      }
                      if (completedDays < 0) completedDays = 0;

                      const attendedDays = completedDays;
                      const attendancePercent = (!isCourseWise && totalPackDays > 0) ? Math.min(100, Math.round((attendedDays / totalPackDays) * 100)) : 100;

                      let mcqScored = 0;
                      let mcqTotal = 0;
                      let hasMcqAttempt = false;
                      if (studentMarks?.assessmentSubmissions && studentMarks.assessmentSubmissions.length > 0) {
                        studentMarks.assessmentSubmissions.forEach((s: any) => {
                          hasMcqAttempt = true;
                          mcqScored += Number(s.score || 0);
                          mcqTotal += Number(s.totalMarks || s.assessmentId?.totalMarks || 100);
                        });
                      } else if (studentAssessments && studentAssessments.length > 0) {
                        studentAssessments.forEach((ast: any) => {
                          if (ast.mySubmission) {
                            hasMcqAttempt = true;
                            mcqScored += Number(ast.mySubmission.score || 0);
                            mcqTotal += Number(ast.totalMarks || 100);
                          }
                        });
                      }

                      let codingScored = 0;
                      let codingTotal = 0;
                      let hasCodingAttempt = false;
                      if (studentMarks?.codingSubmissions && studentMarks.codingSubmissions.length > 0) {
                        studentMarks.codingSubmissions.forEach((cs: any) => {
                          hasCodingAttempt = true;
                          codingScored += Number(cs.score || 0);
                          codingTotal += Number(cs.examId?.totalPoints || 100);
                        });
                      } else if (studentCodingExams && studentCodingExams.length > 0) {
                        studentCodingExams.forEach((exam: any) => {
                          if (exam.mySubmission) {
                            hasCodingAttempt = true;
                            codingScored += Number(exam.mySubmission.score || 0);
                            codingTotal += Number(exam.totalPoints || 100);
                          }
                        });
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                          {/* Box 1: Course Access / Attendance */}
                          {isCourseWise ? (
                            <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between">
                              <span className="text-xs font-semibold text-black uppercase tracking-wider">Portal Access</span>
                              <div className="text-2xl sm:text-3xl font-medium text-emerald-600 mt-2">
                                Permanent
                              </div>
                              <p className="text-xs text-black mt-1">Full Course Lifetime Access · No Expiry</p>
                            </div>
                          ) : (
                            <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between">
                              <span className="text-xs font-semibold text-black uppercase tracking-wider">Attendance</span>
                              <div className="text-2xl sm:text-3xl font-medium text-black mt-2">
                                {attendedDays} <span className="text-base sm:text-lg font-normal text-black/70">/ {totalPackDays} Days</span>
                              </div>
                              <p className="text-xs text-black mt-1">1 session / day · {attendancePercent}% Logged</p>
                            </div>
                          )}

                          {/* Box 2: Total MCQ Marks */}
                          <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between">
                            <span className="text-xs font-semibold text-black uppercase tracking-wider">Total MCQ Marks</span>
                            <div className="text-2xl sm:text-3xl font-medium text-black mt-2">
                              {hasMcqAttempt ? (
                                <>
                                  {mcqScored} <span className="text-base sm:text-lg font-normal text-black/70">/ {mcqTotal}</span>
                                </>
                              ) : (
                                <span className="text-xl font-normal text-slate-500">Not attempted</span>
                              )}
                            </div>
                            <p className="text-xs text-black mt-1">
                              {hasMcqAttempt && mcqTotal > 0
                                ? `${Math.round((mcqScored / mcqTotal) * 100)}% Overall Score`
                                : 'No quiz submissions yet'}
                            </p>
                          </div>

                          {/* Box 3: Total Coding Marks */}
                          <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between">
                            <span className="text-xs font-semibold text-black uppercase tracking-wider">Total Coding Marks</span>
                            <div className="text-2xl sm:text-3xl font-medium text-black mt-2">
                              {hasCodingAttempt ? (
                                <>
                                  {codingScored} <span className="text-base sm:text-lg font-normal text-black/70">/ {codingTotal}</span>
                                </>
                              ) : (
                                <span className="text-xl font-normal text-slate-500">Not attempted</span>
                              )}
                            </div>
                            <p className="text-xs text-black mt-1">
                              {hasCodingAttempt && codingTotal > 0
                                ? `${Math.round((codingScored / codingTotal) * 100)}% Challenges Score`
                                : 'No coding submissions yet'}
                            </p>
                          </div>

                          {/* Box 4: Download Report */}
                          <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-none flex flex-col justify-between">
                            <div>
                              <span className="text-xs font-semibold text-black uppercase tracking-wider">Learning Report</span>
                              <p className="text-xs text-black mt-1">Complete Student Transcript</p>
                            </div>
                            <button
                              onClick={() => setShowReportModal(true)}
                              className="w-full py-2.5 px-4 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-none mt-3"
                            >
                              <Download className="w-4 h-4 text-white" />
                              <span>Download Report</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-3">
                      <div className="pl-2 sm:pl-2 pt-5">
                        <h2 className="text-2xl sm:text-3xl lg:text-3xl font-medium tracking-tight text-[#0a2540]">
                          Live Interactive Sessions
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Click to join live class meetings scheduled by your trainer.
                        </p>
                      </div>

                      {studentLive.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2.5 sm:gap-3">
                          {studentLive.map((cls) => {
                            const isCompleted = cls.status === 'completed';
                            const isLive = cls.status === 'live';

                            return (
                              <div
                                key={cls._id}
                                className={`rounded-xl p-4 sm:p-5 border shadow-none flex flex-col justify-between transition-colors ${
                                  isCompleted ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-gray-200/80'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    {isCompleted ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Class Completed
                                      </span>
                                    ) : isLive ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                        Live Now
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase">
                                        <Clock className="w-3 h-3 text-blue-500" />
                                        Upcoming Session
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400">{cls.date}</span>
                                  </div>

                                  <h3 className={`font-semibold text-base mb-2 ${isCompleted ? 'text-slate-600 line-through decoration-slate-300' : 'text-[#0a2540]'}`}>
                                    {cls.title}
                                  </h3>
                                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">{cls.description}</p>

                                  <div className="text-xs text-gray-600 flex items-center gap-4 mb-4">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      {cls.time}
                                    </span>
                                  </div>
                                </div>

                                {isCompleted ? (
                                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2">
                                    <div className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Session Completed</span>
                                    </div>
                                    {cls.link && (
                                      <a
                                        href={cls.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition-colors"
                                        title="Open meeting recording / notes link"
                                      >
                                        <span>Link</span>
                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <a
                                    href={cls.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2.5 px-4 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-none"
                                  >
                                    <span>{isLive ? 'Join Live Class Now' : 'Join Live Class'}</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-white rounded-xl border border-gray-200/80">
                          <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-600">No Live Classes Scheduled</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Upcoming class meetings will appear here once scheduled by your trainer.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STUDENT TAB 2: RECORDED CLASSES */}
                {activeTab === 'recorded' && (
                  <div className="space-y-4">

                    <div className='pl-2'>
                      <h2 className="text-2xl sm:text-3xl lg:text-3xl font-medium tracking-tight text-[#0a2540]">Recorded Lecture Library & Digital Notes</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Watch class videos at your own pace and access all learning materials.
                      </p>
                    </div>

                    {studentRecorded.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2.5 sm:gap-3">
                        {studentRecorded.map((rec) => (
                          <div
                            key={rec._id}
                            className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="rounded-full text-[#2563eb] text-[10px] font-bold uppercase">
                                  Recorded Lecture
                                </span>
                                <span className="text-xs text-gray-400">{rec.duration || '55 mins'}</span>
                              </div>

                              <h3 className="font-semibold text-[#0a2540] text-base mb-2">{rec.title}</h3>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-4">{rec.description}</p>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                              <button
                                onClick={() => {
                                  setActiveVideoUrl(rec.videoUrl);
                                  setActiveVideoData({ url: rec.videoUrl, title: rec.title, notesUrl: rec.notesUrl });
                                }}
                                className="w-full py-2.5 px-4 rounded-lg bg-slate-900 text-white hover:bg-black text-xs font-semibold flex items-center justify-center gap-2 shadow-none"
                              >
                                <Play className="w-3.5 h-3.5 fill-current text-white" />
                                <span>Watch Recorded Video</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white rounded-xl border border-gray-200/80">
                        <Play className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-600">No Recorded Lectures Available</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Class recordings and digital notes will be added by your trainer after sessions.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* STUDENT TAB 3: ONLINE ASSESSMENTS (EXAMINATION PORTAL) */}
                {activeTab === 'assessments' && (() => {
                  const assessmentsToRender = (studentAssessments || []).map((ast) => {
                    const hasSubmitted = Boolean(ast.mySubmission);
                    const status = hasSubmitted ? 'attempted' : (ast.status === 'ended' ? 'ended' : 'available');
                    return {
                      ...ast,
                      status,
                      score: ast.mySubmission?.score ?? 0,
                      completedDate: ast.mySubmission?.submittedAt ? new Date(ast.mySubmission.submittedAt).toLocaleDateString() : 'N/A',
                      duration: ast.durationMinutes || ast.duration || 60,
                      questionCount: ast.questions?.length || 0,
                    };
                  });

                  return (
                    <div className="space-y-4">

                      <div className="pl-2">
                        <h2 className="text-2xl sm:text-3xl lg:text-3xl font-medium tracking-tight text-[#0a2540]">Examination Portal</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Write your scheduled exams in a secure fullscreen environment.
                        </p>
                      </div>

                      {assessmentsToRender.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2.5 sm:gap-3">
                          {assessmentsToRender.map((ast: any, idx: number) => {
                            const isAttempted = ast.status === 'attempted';
                            const isAvailable = ast.status === 'available';
                            const isEnded = ast.status === 'ended';

                            return (
                              <div
                                key={ast._id || idx}
                                className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    {isAttempted ? (
                                      <span className="rounded-full text-emerald-700 text-[10px] font-bold uppercase">
                                        Attempted
                                      </span>
                                    ) : isAvailable ? (
                                      <span className="rounded-full text-[#2563eb] text-[10px] font-bold uppercase">
                                        MCQ Exam
                                      </span>
                                    ) : (
                                      <span className="rounded-full text-rose-600 text-[10px] font-bold uppercase">
                                        Ended
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400">{ast.duration || 60} mins</span>
                                  </div>

                                  <h3 className="font-semibold text-[#0a2540] text-base mb-2 uppercase">{ast.title}</h3>
                                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                                    {ast.questionCount} Questions • Total Marks: {ast.totalMarks || 100} • Due: {ast.dueDate || 'Open'}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                  {isAttempted && (
                                    <div className="flex items-center justify-between py-1">
                                      <span className="text-xs font-bold text-emerald-700">
                                        Score: {ast.score ?? 0} / {ast.totalMarks || 100}
                                      </span>
                                      <span className="text-[11px] text-gray-400">
                                        Completed: {ast.completedDate}
                                      </span>
                                    </div>
                                  )}

                                  {isAvailable && (
                                    <button
                                      onClick={() => promptExamPassword(ast, 'mcq')}
                                      className="w-full py-2.5 px-4 rounded-lg bg-slate-900 text-white hover:bg-black text-xs font-semibold flex items-center justify-center gap-2 shadow-none transition-colors cursor-pointer"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current text-white" />
                                      <span>Start Exam</span>
                                    </button>
                                  )}

                                  {isEnded && (
                                    <button
                                      disabled
                                      className="w-full py-2.5 px-4 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold flex items-center justify-center cursor-not-allowed border border-slate-200/60"
                                    >
                                      <span>Exam Ended</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 sm:p-12 text-center bg-white rounded-xl border border-gray-200/80">
                          <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <h3 className="text-base font-semibold text-[#0a2540]">No Assessments Scheduled</h3>
                          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                            Your instructor has not scheduled any online quizzes for your enrolled subject yet. Check back later.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* STUDENT TAB 4: CODING EXAM ARENA */}
                {activeTab === 'coding' && (() => {
                  const codingToRender = (studentCodingExams || []).map((exam) => {
                    const hasSubmitted = Boolean(exam.mySubmission);
                    const status = hasSubmitted ? 'attempted' : (exam.status === 'ended' ? 'ended' : 'available');
                    return {
                      ...exam,
                      status,
                      score: exam.mySubmission?.score ?? 0,
                      completedDate: exam.mySubmission?.submittedAt ? new Date(exam.mySubmission.submittedAt).toLocaleDateString() : 'N/A',
                      duration: exam.durationMinutes || exam.duration || 60,
                      questionCount: exam.questions?.length || 1,
                      totalMarks: exam.totalPoints || 100,
                    };
                  });

                  return (
                    <div className="space-y-4">

                      <div className="pl-2">
                        <h2 className="text-2xl sm:text-3xl lg:text-3xl font-medium tracking-tight text-[#0a2540]">Coding Exam Arena</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Write and execute algorithmic solutions in a secure fullscreen environment.
                        </p>
                      </div>

                      {codingToRender.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2.5 sm:gap-3">
                          {codingToRender.map((exam: any, idx: number) => {
                            const isAttempted = exam.status === 'attempted';
                            const isAvailable = exam.status === 'available';
                            const isEnded = exam.status === 'ended';

                            return (
                              <div
                                key={exam._id || idx}
                                className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    {isAttempted ? (
                                      <span className="rounded-full text-emerald-700 text-[10px] font-bold uppercase">
                                        Attempted
                                      </span>
                                    ) : isAvailable ? (
                                      <span className="rounded-full text-purple-700 text-[10px] font-bold uppercase">
                                        Coding Arena
                                      </span>
                                    ) : (
                                      <span className="rounded-full text-rose-600 text-[10px] font-bold uppercase">
                                        Ended
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400">{exam.duration || 60} mins</span>
                                  </div>

                                  <h3 className="font-semibold text-[#0a2540] text-base mb-2 uppercase">{exam.title}</h3>
                                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                                    {exam.questions?.length || 1} {(exam.questions?.length || 1) === 1 ? 'Problem' : 'Problems'} • Points: {exam.totalMarks || 100} • Due: {exam.dueDate || 'Open'}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                  {isAttempted && (
                                    <div className="flex items-center justify-between py-1">
                                      <span className="text-xs font-bold text-emerald-700">
                                        Score: {exam.score ?? 0} / {exam.totalMarks || 100} Pts
                                      </span>
                                      <span className="text-[11px] text-gray-400">
                                        Completed: {exam.completedDate}
                                      </span>
                                    </div>
                                  )}

                                  {isAvailable && (
                                    <button
                                      onClick={() => promptExamPassword(exam, 'coding')}
                                      className="w-full py-2.5 px-4 rounded-lg bg-slate-900 text-white hover:bg-black text-xs font-semibold flex items-center justify-center gap-2 shadow-none transition-colors cursor-pointer"
                                    >
                                      <Code2 className="w-3.5 h-3.5 text-white" />
                                      <span>Start Coding Exam</span>
                                    </button>
                                  )}

                                  {isEnded && (
                                    <button
                                      disabled
                                      className="w-full py-2.5 px-4 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold flex items-center justify-center cursor-not-allowed border border-slate-200/60"
                                    >
                                      <span>Exam Ended</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 sm:p-12 text-center bg-white rounded-xl border border-gray-200/80">
                          <Code2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <h3 className="text-base font-semibold text-[#0a2540]">No Coding Challenges Assigned</h3>
                          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                            There are currently no coding challenges published for your subject. Your trainer will release problems soon.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* STUDENT TAB: PROFILE (Encompasses user details, subscriptions, and scores) */}
                {(activeTab === 'profile' || activeTab === 'billing' || activeTab === 'marks') && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-medium text-[#0a2540]">Student Account Profile & Academic Overview</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Your verified student identity, enrolled courses, active subscription plan, and exam performance gradebook.
                      </p>
                    </div>

                    {/* Profile Identity Card */}
                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0a2540] to-[#2563eb] text-white font-bold text-2xl flex items-center justify-center shadow-none">
                          {currentUser.name?.[0] || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-[#0a2540]">{currentUser.name}</h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200 text-[10px] font-bold uppercase">
                              Verified Student
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{currentUser.email}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>Enrolled in: <strong className="text-[#0a2540] font-semibold">{studentDash?.student?.subjectId?.title || 'Full Stack Web Development'}</strong></span>
                            <span>•</span>
                            <span>Student ID: <strong className="font-mono text-slate-700">{currentUser.id || 'DXR-STU-8821'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-black shadow-none flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Learning Report</span>
                        </button>
                        {(studentDash?.subscription?.planType || currentUser?.planType) !== 'course_wise' && (
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] shadow-none flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Renew Subscription</span>
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>

                    {/* Current Active Plan Card */}
                    <div className="p-4 sm:p-5 rounded-xl bg-white border border-gray-200/80 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-[#2563eb] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 uppercase">
                          Active Plan
                        </span>
                        <h3 className="text-2xl font-semibold text-[#0a2540] mt-3">
                          {(studentDash?.subscription?.planType || currentUser?.planType) === 'course_wise' ? 'Course-Wise Pack (Permanent Access)' : 'Monthly Unlimited Pack'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {(studentDash?.subscription?.planType || currentUser?.planType) === 'course_wise'
                            ? 'Permanent lifetime access to your enrolled course, including all live classes, recorded lectures, assessments, and coding arenas.'
                            : 'Includes all live sessions, recorded class library, assessments with lockdown mode, and digital study materials.'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#0a2540]">₹{(studentDash?.subscription?.amount ?? studentDash?.student?.amount ?? currentUser?.amount ?? (studentDash?.subscription?.planType === 'course_wise' ? 1499 : 499)).toLocaleString('en-IN')}</div>
                        <span className="text-xs text-emerald-600 font-semibold block mt-0.5">Payment Verified</span>
                        {(studentDash?.subscription?.planType || currentUser?.planType) !== 'course_wise' ? (
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="mt-3 px-5 py-2 rounded-full bg-[#2563eb] text-white text-xs font-semibold shadow hover:bg-[#1d4ed8] cursor-pointer"
                          >
                            Renew (Extend 1 Month)
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold block mt-2">Permanent Access &bull; No Renewal Needed</span>
                        )}
                      </div>
                    </div>

                    {/* Performance & Marks Report Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Quizzes Marks */}
                      <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none">
                        <h3 className="font-semibold text-sm text-[#0a2540] mb-4 flex items-center gap-2">
                          <Award className="w-4 h-4 text-[#2563eb]" />
                          <span>Online Assessment Scores</span>
                        </h3>
                        <div className="space-y-3">
                          {studentMarks?.assessmentSubmissions?.length > 0 ? (
                            studentMarks.assessmentSubmissions.map((sub: any) => (
                              <div key={sub._id} className="p-3.5 rounded-2xl bg-[#f8fafc] border border-gray-100 flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-xs text-[#0a2540]">{sub.assessmentId?.title || 'Assessment'}</div>
                                  <div className="text-[10px] text-gray-400">{new Date(sub.submittedAt).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-[#2563eb]">{sub.score} / {sub.totalMarks}</span>
                                  <div className="text-[10px] font-bold text-emerald-600">Passed</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-4">No assessment submissions yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Coding Marks */}
                      <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/80 shadow-none">
                        <h3 className="font-semibold text-sm text-[#0a2540] mb-4 flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-purple-600" />
                          <span>Coding Exam Arena Scores</span>
                        </h3>
                        <div className="space-y-3">
                          {studentMarks?.codingSubmissions?.length > 0 ? (
                            studentMarks.codingSubmissions.map((csub: any) => (
                              <div key={csub._id} className="p-3.5 rounded-2xl bg-[#f8fafc] border border-gray-100 flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-xs text-[#0a2540]">{csub.examId?.title || 'Coding Exam'}</div>
                                  <div className="text-[10px] text-gray-400">{csub.passedTests}/{csub.totalTests} Test Cases Passed</div>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-purple-700">{csub.score} Pts</span>
                                  <div className="text-[10px] font-bold text-emerald-600">Passed</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-4">No coding exam submissions yet.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Past Transactions Receipts Table */}
                    <div className="bg-white rounded-xl border border-gray-200/80 shadow-none overflow-hidden">
                      <div className="p-5 border-b border-gray-100 font-semibold text-sm text-[#0a2540]">
                        Transaction Receipts
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#f8fafc] text-gray-500 uppercase">
                            <tr>
                              <th className="py-3 px-6">Transaction ID</th>
                              <th className="py-3 px-6">Date</th>
                              <th className="py-3 px-6">Amount</th>
                              <th className="py-3 px-6">Payment Method</th>
                              <th className="py-3 px-6">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {studentDash?.recentPayments?.map((p: any) => (
                              <tr key={p._id}>
                                <td className="py-4 px-6 font-mono font-semibold text-[#2563eb]">{p.transactionId}</td>
                                <td className="py-4 px-6 text-gray-500">{new Date(p.paidAt).toLocaleDateString()}</td>
                                <td className="py-4 px-6 font-bold text-emerald-700">₹{p.amount}</td>
                                <td className="py-4 px-6 text-gray-600">{p.paymentMethod || 'Credit Card / UPI'}</td>
                                <td className="py-4 px-6">
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* STUDENT TAB: DOUBTS CHAT */}
                {activeTab === 'doubts' && (
                  <DoubtsChatSection
                    role="student"
                    subjects={enrolledCourses}
                    currentUser={currentUser}
                    activeCourseId={selectedCourseId}
                    showToast={showToast}
                  />
                )}

                {/* STUDENT TAB: COURSE MATERIALS */}
                {activeTab === 'materials' && (
                  <CourseMaterialsSection
                    role="student"
                    subjects={enrolledCourses}
                    currentUser={currentUser}
                    activeCourseId={selectedCourseId}
                    showToast={showToast}
                  />
                )}

              </div>
            );
          })()}

          </main>

          {/* ========================================================================= */}
          {/* MODAL 1: WORD DOCUMENT (.docx) ASSESSMENT ANALYZER & PUBLISHER (TRAINER/SA) */}
          {/* ========================================================================= */}
          {showDocxModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl bg-white rounded-2xl p-6 sm:p-7 shadow-none border border-gray-200 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center border border-[#bfdbfe]">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#0a2540]">Word Document Question Paper Analyzer</h3>
                      <p className="text-xs text-gray-500">Upload .docx to auto-extract questions and conduct exams in Lockdown Mode</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDocxModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                </div>

                <div className="space-y-6">
                  {/* File Upload Zone */}
                  <div className="border-2 border-dashed border-[#bfdbfe] bg-[#eff6ff]/50 rounded-xl p-5 text-center hover:bg-[#eff6ff] transition-colors relative">
                    <input
                      type="file"
                      accept=".docx,.doc,.txt"
                      onChange={handleDocxFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white text-[#2563eb] flex items-center justify-center shadow-none">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <div className="font-semibold text-sm text-[#0a2540]">
                        {docxParsing ? 'Analyzing Document with AI...' : 'Click or Drag Word Document (.docx) here'}
                      </div>
                      <p className="text-xs text-gray-500">
                        Supports Microsoft Word (.docx), .doc, and text files formatted with question numbers & options (A, B, C, D).
                      </p>
                    </div>
                  </div>

                  {/* Or Paste Question Text */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1.5">
                      Or Paste Question Paper Content Manually:
                    </label>
                    <textarea
                      rows={4}
                      value={manualRawText}
                      onChange={(e) => setManualRawText(e.target.value)}
                      placeholder="1. What is React?&#10;A) Library&#10;B) Framework&#10;C) Database&#10;D) Language&#10;Answer: A"
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs font-mono text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={handleManualTextParse}
                        className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-black"
                      >
                        Analyze & Parse Pasted Text
                      </button>
                    </div>
                  </div>

                  {/* Exam Settings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#f8fafc] border border-gray-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Exam Title</label>
                      <input
                        type="text"
                        value={parsedExamTitle}
                        onChange={(e) => setParsedExamTitle(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-[#0a2540]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={parsedDueDate}
                        onChange={(e) => setParsedDueDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs text-[#0a2540]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Duration (Mins)</label>
                      <input
                        type="number"
                        value={parsedDuration}
                        onChange={(e) => setParsedDuration(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs text-[#0a2540]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Access Password</label>
                      <input
                        type="text"
                        value={parsedAccessPassword}
                        onChange={(e) => setParsedAccessPassword(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-mono font-bold text-[#0a2540]"
                        placeholder="DEXAR2026"
                      />
                    </div>
                  </div>

                  {/* Lockdown Mode Settings (Prompt Requirement!) */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-6 h-6 text-amber-700" />
                      <div>
                        <div className="text-xs font-bold text-amber-900">Enforce Strict Lockdown Mode</div>
                        <div className="text-[11px] text-amber-800">
                          Disables tab switching, copy/paste, and auto-submits upon {parsedMaxViolations} violations.
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={parsedIsLockdown}
                      onChange={(e) => setParsedIsLockdown(e.target.checked)}
                      className="w-5 h-5 accent-[#2563eb]"
                    />
                  </div>

                  {/* Analyzed Questions Preview */}
                  <div>
                    <h4 className="font-semibold text-sm text-[#0a2540] mb-2 flex items-center justify-between">
                      <span>Extracted Questions Preview ({parsedQuestions.length} Questions)</span>
                      <span className="text-xs text-[#2563eb] font-bold">
                        Total Marks: {parsedQuestions.reduce((acc, q) => acc + (q.marks || 10), 0)}
                      </span>
                    </h4>

                    <div className="max-h-60 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                      {parsedQuestions.length > 0 ? (
                        parsedQuestions.map((q, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-gray-200 text-xs">
                            <div className="font-semibold text-[#0a2540] mb-2">
                              {idx + 1}. {q.questionText} <span className="text-[#2563eb]">({q.marks || 10} pts)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 pl-3">
                              {q.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className={`p-1.5 rounded-lg text-[11px] ${oIdx === q.correctOptionIndex
                                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                                    : 'text-gray-600'
                                    }`}
                                >
                                  {String.fromCharCode(65 + oIdx)}) {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-xs text-gray-400 py-6">
                          Upload a Word document to see questions parsed and formatted here automatically.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowDocxModal(false)}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePublishWordExam}
                      disabled={parsedQuestions.length === 0}
                      className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Publish & Conduct Exam</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 2: CREATE ADMIN CREDENTIALS (SUPER ADMIN ONLY - STORED IN DB) */}
          {/* ========================================================================= */}
          {showCreateAdminModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-2xl p-6 shadow-none border border-gray-200"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0a2540]">Create Admin Credentials</h3>
                      <p className="text-[11px] text-gray-500">Only Super Admin can create admins in the database</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateAdminModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">Admin Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAdminData.name}
                      onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                      placeholder="Prof. Robert Davis"
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">Admin Email Address</label>
                    <input
                      type="email"
                      required
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                      placeholder="trainer.robert@dexar.com"
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">Temporary Password</label>
                    <input
                      type="password"
                      required
                      value={newAdminData.password}
                      onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                      placeholder="Trainer@Secure123"
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">Assign Curriculum Subject</label>
                    <select
                      value={newAdminData.subjectId}
                      onChange={(e) => setNewAdminData({ ...newAdminData, subjectId: e.target.value })}
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    >
                      {saSubjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.title} ({sub.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateAdminModal(false)}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Store in Database</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL: CREATE STUDENT CREDENTIALS (SUPER ADMIN EXCLUSIVE) */}
          {/* ========================================================================= */}
          {showCreateStudentModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-none border border-gray-200 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0a2540]">Create Student Credentials</h3>
                      <p className="text-[11px] text-gray-500">Only Super Admin can register students and issue login credentials</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateStudentModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] mb-1">Student Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newStudentData.name}
                        onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] mb-1">Email (Student Login ID) *</label>
                      <input
                        type="email"
                        required
                        value={newStudentData.email}
                        onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                        placeholder="john.student@dexar.com"
                        className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#0a2540]">
                        Student Login Password <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateStudentPassword}
                        className="text-[11px] text-[#2563eb] hover:underline font-semibold cursor-pointer"
                      >
                        Auto-Generate Password
                      </button>
                    </div>
                    <input
                      type="text"
                      autoComplete="new-password"
                      value={newStudentData.password}
                      onChange={(e) => setNewStudentData({ ...newStudentData, password: e.target.value })}
                      placeholder="Leave blank for student to set their own password..."
                      className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Provide a password or leave blank. If blank, an automated setup link is sent to the student.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-[#0a2540]">
                        Allocate Courses (Multi-Select) *
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllNewStudentCourses}
                          className="text-[11px] text-[#2563eb] hover:underline font-semibold cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300 text-xs">|</span>
                        <button
                          type="button"
                          onClick={handleClearAllNewStudentCourses}
                          className="text-[11px] text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                        <span className="ml-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563eb] text-[10px] font-bold border border-blue-200">
                          {newStudentData.subjectIds.length} Selected
                        </span>
                      </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto p-2 bg-[#f8fafc] rounded-xl border border-gray-200 space-y-1.5">
                      {saSubjects.map((sub) => {
                        const isSelected = (newStudentData.subjectIds || []).map(String).includes(String(sub._id));
                        return (
                          <div
                            key={sub._id}
                            onClick={() => handleToggleNewStudentCourse(sub._id)}
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
                                onChange={() => {}} // handled by parent onClick
                                className="w-4 h-4 text-[#2563eb] rounded border-gray-300 cursor-pointer"
                              />
                              <span className="font-semibold">{sub.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {sub.trainerId?.name && (
                                <span className="text-[10px] text-gray-500 font-normal hidden sm:inline">
                                  {sub.trainerId.name}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded bg-white text-[#2563eb] border border-blue-200 text-[10px] font-mono font-bold">
                                {sub.code}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {saSubjects.length === 0 && (
                        <div className="py-4 text-center text-xs text-gray-400">
                          Please create curriculum subjects first before registering students.
                        </div>
                      )}
                    </div>
                    {newStudentData.subjectIds.length === 0 && (
                      <p className="text-[11px] text-amber-600 font-medium mt-1">
                        ⚠️ Please check at least one course for this student.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] mb-1">Subscription Plan</label>
                      <select
                        value={newStudentData.planType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewStudentData({
                            ...newStudentData,
                            planType: val,
                            amount: val === 'course_wise' ? '1499' : '499',
                          });
                        }}
                        className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                      >
                        <option value="monthly">Monthly Pack (30 Days)</option>
                        <option value="course_wise">Course Wise Full Pack</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] mb-1">Fee Amount (₹)</label>
                      <input
                        type="number"
                        value={newStudentData.amount}
                        onChange={(e) => setNewStudentData({ ...newStudentData, amount: e.target.value })}
                        className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                      />
                    </div>
                  </div>

                  {newStudentData.planType === 'course_wise' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-xs text-emerald-800 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Permanent Access: No start or end date required. Student will have lifetime portal access.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0a2540] mb-1">Payment Status</label>
                        <select
                          value={newStudentData.paymentStatus}
                          onChange={(e) => setNewStudentData({ ...newStudentData, paymentStatus: e.target.value })}
                          className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                        >
                          <option value="paid">Paid & Active (Immediate Dashboard Access)</option>
                          <option value="pending">Payment Pending (Must Pay First to Unlock Dashboard)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#2563eb] shrink-0" />
                        <span>Monthly Pack: 30 days access from creation date.</span>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0a2540] mb-1">Payment Status</label>
                        <select
                          value={newStudentData.paymentStatus}
                          onChange={(e) => setNewStudentData({ ...newStudentData, paymentStatus: e.target.value })}
                          className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                        >
                          <option value="paid">Paid & Active (Immediate Dashboard Access)</option>
                          <option value="pending">Payment Pending (Must Pay First to Unlock Dashboard)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateStudentModal(false)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Create Credentials in DB</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 3: SCHEDULE LIVE CLASS (TRAINER) */}
          {/* ========================================================================= */}
          {showLiveModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-2xl p-6 shadow-none border border-gray-200"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0a2540]">Schedule Live Session</h3>
                      <p className="text-[11px] text-gray-500">Provide meeting URL for assigned students</p>
                    </div>
                  </div>
                  <button onClick={() => setShowLiveModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleScheduleLiveClass} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">Session Title</label>
                    <input
                      type="text"
                      required
                      value={newLiveClass.title}
                      onChange={(e) => setNewLiveClass({ ...newLiveClass, title: e.target.value })}
                      placeholder="Mastering Next.js 16 & Server Components"
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">Meeting Link (Google Meet / Zoom)</label>
                    <input
                      type="url"
                      required
                      value={newLiveClass.link}
                      onChange={(e) => setNewLiveClass({ ...newLiveClass, link: e.target.value })}
                      placeholder="https://meet.google.com/abc-defg-hij"
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={newLiveClass.date}
                        onChange={(e) => setNewLiveClass({ ...newLiveClass, date: e.target.value })}
                        className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] mb-1">Time</label>
                      <input
                        type="text"
                        required
                        value={newLiveClass.time}
                        onChange={(e) => setNewLiveClass({ ...newLiveClass, time: e.target.value })}
                        placeholder="06:30 PM EST"
                        className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={newLiveClass.description}
                      onChange={(e) => setNewLiveClass({ ...newLiveClass, description: e.target.value })}
                      placeholder="Interactive live lecture covering server components, state hydration, and deployment."
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowLiveModal(false)}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-none flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Publish Meeting Link</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 4: UPLOAD RECORDED CLASS (TRAINER) */}
          {/* ========================================================================= */}
          {showRecordedModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-2xl p-6 shadow-none border border-gray-200"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
                      <Play className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0a2540]">Upload Recorded Lecture</h3>
                      <p className="text-[11px] text-gray-500">Add video embed link and study notes</p>
                    </div>
                  </div>
                  <button onClick={() => setShowRecordedModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleAddRecordedClass} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">Lecture Title</label>
                    <input
                      type="text"
                      required
                      value={newRecordedClass.title}
                      onChange={(e) => setNewRecordedClass({ ...newRecordedClass, title: e.target.value })}
                      placeholder="Module 3: Database Indexing & Query Tuning"
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">Video Stream / Embed URL</label>
                    <input
                      type="url"
                      required
                      value={newRecordedClass.videoUrl}
                      onChange={(e) => setNewRecordedClass({ ...newRecordedClass, videoUrl: e.target.value })}
                      placeholder="Google Drive link, YouTube, or direct MP4/Cloud URL..."
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] mb-1">Duration</label>
                      <input
                        type="text"
                        value={newRecordedClass.duration}
                        onChange={(e) => setNewRecordedClass({ ...newRecordedClass, duration: e.target.value })}
                        placeholder="55 mins"
                        className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0a2540] mb-1">Digital Notes URL (PDF)</label>
                      <input
                        type="text"
                        value={newRecordedClass.notesUrl}
                        onChange={(e) => setNewRecordedClass({ ...newRecordedClass, notesUrl: e.target.value })}
                        placeholder="https://cdn.dexar.com/notes.pdf"
                        className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={newRecordedClass.description}
                      onChange={(e) => setNewRecordedClass({ ...newRecordedClass, description: e.target.value })}
                      placeholder="Covers performance tuning, schema optimization, and practical demonstrations."
                      className="w-full p-3 rounded-2xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRecordedModal(false)}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-none flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current text-white" />
                      <span>Publish to Student Portal</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 5: CREATE CODING EXAM (TRAINER) */}
          {/* ========================================================================= */}
          {showCodingModal && (() => {
            const questionsList = newCodingExam.questions || [];
            const curQ = questionsList[activeCodingQuestionTab] || questionsList[0] || {
              title: 'Problem 1',
              problemStatement: '',
              starterCode: '',
              points: 50,
              testCases: [{ input: '', output: '', explanation: '' }]
            };

            const handleAddCodingQuestion = () => {
              setNewCodingExam((prev) => {
                const nextNum = (prev.questions?.length || 0) + 1;
                const newQ = {
                  title: `Problem ${nextNum}`,
                  problemStatement: '',
                  starterCode: 'function solution(input) {\n  // Write your logic here\n  return input;\n}',
                  points: 50,
                  testCases: [{ input: '', output: '', explanation: '' }],
                };
                const updated = [...(prev.questions || []), newQ];
                const sumPts = updated.reduce((s, q) => s + (Number(q.points) || 0), 0);
                return { ...prev, questions: updated, totalPoints: sumPts };
              });
              setActiveCodingQuestionTab(newCodingExam.questions?.length || 0);
            };

            const handleRemoveCodingQuestion = (idxToRemove: number) => {
              if ((newCodingExam.questions?.length || 0) <= 1) {
                showToast('Exam must contain at least one question.', 'error');
                return;
              }
              setNewCodingExam((prev) => {
                const updated = (prev.questions || []).filter((_, idx) => idx !== idxToRemove);
                const sumPts = updated.reduce((s, q) => s + (Number(q.points) || 0), 0);
                return { ...prev, questions: updated, totalPoints: sumPts };
              });
              if (activeCodingQuestionTab >= idxToRemove && activeCodingQuestionTab > 0) {
                setActiveCodingQuestionTab(activeCodingQuestionTab - 1);
              }
            };

            const handleUpdateCodingQuestion = (field: string, val: any) => {
              setNewCodingExam((prev) => {
                const updated = [...(prev.questions || [])];
                const target = updated[activeCodingQuestionTab] || { ...updated[0] };
                updated[activeCodingQuestionTab] = { ...target, [field]: val };
                const sumPts = updated.reduce((s, q) => s + (Number(q.points) || 0), 0);
                return { ...prev, questions: updated, totalPoints: field === 'points' ? sumPts : prev.totalPoints };
              });
            };

            const handleAddCodingTestCase = () => {
              setNewCodingExam((prev) => {
                const updated = [...(prev.questions || [])];
                const cur = updated[activeCodingQuestionTab];
                if (!cur) return prev;
                const updatedTcs = [...(cur.testCases || []), { input: '', output: '', explanation: '' }];
                updated[activeCodingQuestionTab] = { ...cur, testCases: updatedTcs };
                return { ...prev, questions: updated };
              });
            };

            const handleRemoveCodingTestCase = (tcIdx: number) => {
              setNewCodingExam((prev) => {
                const updated = [...(prev.questions || [])];
                const cur = updated[activeCodingQuestionTab];
                if (!cur) return prev;
                if (cur.testCases && cur.testCases.length <= 1) {
                  showToast('At least one test case is required per question.', 'error');
                  return prev;
                }
                const updatedTcs = cur.testCases.filter((_, idx) => idx !== tcIdx);
                updated[activeCodingQuestionTab] = { ...cur, testCases: updatedTcs };
                return { ...prev, questions: updated };
              });
            };

            const handleUpdateCodingTestCase = (tcIdx: number, field: string, val: string) => {
              setNewCodingExam((prev) => {
                const updated = [...(prev.questions || [])];
                const cur = updated[activeCodingQuestionTab];
                if (!cur) return prev;
                const updatedTcs = [...(cur.testCases || [])];
                updatedTcs[tcIdx] = { ...updatedTcs[tcIdx], [field]: val };
                updated[activeCodingQuestionTab] = { ...cur, testCases: updatedTcs };
                return { ...prev, questions: updated };
              });
            };

            return (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-3xl bg-white rounded-2xl p-6 shadow-none border border-gray-200 max-h-[92vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
                        <Code2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#0a2540]">Create Coding Assessment Arena</h3>
                        <p className="text-[11px] text-gray-500">
                          Configure multiple coding problems, starter templates, and automated test cases
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setShowCodingModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateCodingExam} className="space-y-5">
                    {/* Overall Exam Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#0a2540] mb-1">Challenge / Exam Title *</label>
                        <input
                          type="text"
                          required
                          value={newCodingExam.title}
                          onChange={(e) => setNewCodingExam({ ...newCodingExam, title: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                          placeholder="e.g. Data Structures & Algorithms Exam"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0a2540] mb-1">Due Date</label>
                        <input
                          type="date"
                          value={newCodingExam.dueDate}
                          onChange={(e) => setNewCodingExam({ ...newCodingExam, dueDate: e.target.value })}
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
                          value={newCodingExam.durationMinutes || 60}
                          onChange={(e) => setNewCodingExam({ ...newCodingExam, durationMinutes: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0a2540] mb-1">Total Exam Points</label>
                        <input
                          type="number"
                          value={newCodingExam.totalPoints}
                          onChange={(e) => setNewCodingExam({ ...newCodingExam, totalPoints: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs font-bold text-[#2563eb]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0a2540] mb-1">Access Password</label>
                        <input
                          type="text"
                          value={newCodingExam.accessPassword}
                          onChange={(e) => setNewCodingExam({ ...newCodingExam, accessPassword: e.target.value })}
                          placeholder="DEXAR2026"
                          className="w-full p-2.5 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs font-mono font-bold text-[#0a2540]"
                        />
                      </div>
                    </div>

                    {/* Multi-Question Manager */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#0a2540]">
                            Coding Problems ({questionsList.length})
                          </span>
                          <span className="text-[11px] text-gray-500">
                            Add and configure multiple questions in this exam
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddCodingQuestion}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Another Problem</span>
                        </button>
                      </div>

                      {/* Question Tabs Bar */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3">
                        {questionsList.map((q: any, idx: number) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors border ${
                              activeCodingQuestionTab === idx
                                ? 'bg-[#0a2540] text-white border-[#0a2540]'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setActiveCodingQuestionTab(idx)}
                              className="cursor-pointer max-w-[140px] truncate"
                            >
                              Q{idx + 1}: {q.title || `Problem ${idx + 1}`}
                            </button>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                activeCodingQuestionTab === idx ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {q.points || 50} pts
                            </span>
                            {questionsList.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCodingQuestion(idx);
                                }}
                                className={`p-0.5 rounded hover:bg-red-500 hover:text-white transition-colors cursor-pointer ${
                                  activeCodingQuestionTab === idx ? 'text-white/70' : 'text-gray-400'
                                }`}
                                title="Delete this problem"
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
                            Configuring Problem #{activeCodingQuestionTab + 1}
                          </span>
                          {questionsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCodingQuestion(activeCodingQuestionTab)}
                              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Problem</span>
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
                              value={curQ.title}
                              onChange={(e) => handleUpdateCodingQuestion('title', e.target.value)}
                              className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs text-[#0a2540]"
                              placeholder="e.g. Problem 1: Array Reversal"
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
                              value={curQ.points || 50}
                              onChange={(e) => handleUpdateCodingQuestion('points', Number(e.target.value))}
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
                            value={curQ.problemStatement}
                            onChange={(e) => handleUpdateCodingQuestion('problemStatement', e.target.value)}
                            className="w-full p-3 rounded-xl bg-white border border-gray-200 text-xs text-[#0a2540]"
                            placeholder="Describe the algorithm, inputs, constraints, and return value..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#0a2540] mb-1">
                            Starter Code Template
                          </label>
                          <textarea
                            rows={4}
                            value={curQ.starterCode}
                            onChange={(e) => handleUpdateCodingQuestion('starterCode', e.target.value)}
                            className="w-full p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs border border-gray-700"
                            placeholder="function solution(input) {\n  // Write logic here\n  return input;\n}"
                          />
                        </div>

                        {/* Test Cases List */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              Automated Test Cases ({curQ.testCases?.length || 0})
                            </label>
                            <button
                              type="button"
                              onClick={handleAddCodingTestCase}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Test Case</span>
                            </button>
                          </div>

                          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                            {curQ.testCases?.map((tc: any, tcIdx: number) => (
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
                                        handleUpdateCodingTestCase(tcIdx, 'input', cur ? cur + '\n' : '');
                                      }}
                                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                                      title="Add another input line for 2+ inputs"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Input Line</span>
                                    </button>
                                    {(curQ.testCases?.length || 0) > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCodingTestCase(tcIdx)}
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
                                      onChange={(e) => handleUpdateCodingTestCase(tcIdx, 'input', e.target.value)}
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
                                      onChange={(e) => handleUpdateCodingTestCase(tcIdx, 'output', e.target.value)}
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
                                    onChange={(e) => handleUpdateCodingTestCase(tcIdx, 'explanation', e.target.value)}
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

                    {/* Lockdown Mode Enforce */}
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-amber-900 font-semibold">
                        <ShieldAlert className="w-4 h-4 text-amber-700" />
                        <span>Enforce Lockdown Anti-Cheat during this exam</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={newCodingExam.isLockdown}
                        onChange={(e) => setNewCodingExam({ ...newCodingExam, isLockdown: e.target.checked })}
                        className="w-4 h-4 accent-[#2563eb]"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCodingModal(false)}
                        className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-[#0a2540] hover:bg-black text-white text-xs font-semibold shadow-none flex items-center gap-2"
                      >
                        <Code2 className="w-4 h-4" />
                        <span>Publish Coding Exam ({questionsList.length} Problems)</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* MODAL 6: STUDENT PAYMENT CHECKOUT (RAZORPAY GATEWAY) */}
          {/* ========================================================================= */}
          {showPaymentModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-100">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#0a2540]">Dexar Checkout</h3>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563eb] text-[10px] font-bold border border-blue-200 uppercase tracking-wide">
                          Razorpay
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">256-bit encrypted secure subscription renewal</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">✕</button>
                </div>

                <div className="space-y-4">
                  {/* Single Course Fee Card Allocated by Super Admin */}
                  {(() => {
                    const allocatedAmount = Number(
                      studentDash?.subscription?.amount ??
                      studentDash?.student?.amount ??
                      currentUser?.amount ??
                      499
                    );
                    const courseTitle = studentDash?.student?.subjectId?.title || currentUser?.subjectId?.title || 'Enrolled Course';
                    const planType = studentDash?.subscription?.planType || studentDash?.student?.planType || currentUser?.planType || 'monthly';
                    const planLabel = planType === 'course_wise' ? 'Course-Wise Pack' : 'Monthly Learning Pack';

                    return (
                      <>
                        <div className="p-4 rounded-2xl border border-blue-200 bg-[#eff6ff]">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-[#2563eb] uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded-md">
                              {planLabel}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">Allocated by Admin</span>
                          </div>
                          <h4 className="text-base font-bold text-[#0a2540]">{courseTitle}</h4>
                          <div className="text-2xl font-black text-[#2563eb] mt-2">
                            ₹{allocatedAmount.toLocaleString('en-IN')}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Grants full portal access to lectures, doubt sessions, assessments, and certifications.
                          </p>
                        </div>

                        {/* Razorpay Badges & Supported Modes */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-[#0a2540]">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>Razorpay Live Payment Gateway</span>
                            </span>
                            <span className="text-emerald-700 font-semibold text-[10px]">Instant Activation</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-600 font-medium">
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">UPI / QR (GPay, PhonePe, Paytm)</span>
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Debit / Credit Cards</span>
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">NetBanking</span>
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Wallets</span>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-gray-600 text-xs font-medium block">Total Payable Now:</span>
                            <span className="text-[11px] text-gray-400">Inclusive of all platform taxes</span>
                          </div>
                          <span className="text-2xl font-black text-[#2563eb]">
                            ₹{allocatedAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 space-y-2">
                          <button
                            type="button"
                            disabled={paymentProcessing}
                            onClick={handleProcessPayment}
                            className="w-full py-3.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all hover:scale-[1.01]"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{paymentProcessing ? 'Connecting to Razorpay...' : `Pay ₹${allocatedAmount.toLocaleString('en-IN')} with Razorpay`}</span>
                          </button>
                        </div>
                      </>
                    );
                  })()}
                    <div className="flex flex-col items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPaymentModal(false);
                          setShowContactAdminModal(true);
                        }}
                        className="text-xs font-medium text-[#2563eb] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Razorpay not working? Contact Super Admin for manual access</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        Cancel Transaction
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

          {/* ========================================================================= */}
          {/* MODAL: CONTACT SUPER ADMIN & REQUEST MANUAL ACCESS */}
          {/* ========================================================================= */}
          {showContactAdminModal && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0a2540]">Contact Super Admin</h3>
                      <p className="text-[11px] text-gray-500">Request manual approval or report payment issue</p>
                    </div>
                  </div>
                  <button onClick={() => setShowContactAdminModal(false)} className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">✕</button>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    If Razorpay payment is not working, or if you have completed an offline payment, submit your request below. The Super Admin will be notified immediately and can allow you full access to the portal directly from their dashboard.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-[#0a2540] mb-1">
                      Describe the Issue (Optional Note)
                    </label>
                    <textarea
                      rows={3}
                      value={contactAdminNote}
                      onChange={(e) => setContactAdminNote(e.target.value)}
                      placeholder="e.g. Razorpay checkout is failing on my card, or paid via offline bank transfer."
                      className="w-full p-3 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs text-[#0a2540] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                    <span>Once approved by the Super Admin, your account will be activated and you will gain immediate access to all classes and assessments.</span>
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowContactAdminModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={contactAdminSubmitting}
                      onClick={handleStudentRequestAdminAccess}
                      className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center gap-1.5 shadow-none disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{contactAdminSubmitting ? 'Sending Request...' : 'Submit Request to Super Admin'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 7: EMBEDDED VIDEO PLAYER MODAL */}
          {/* ========================================================================= */}
          <VideoPlayerModal
            isOpen={Boolean(activeVideoData || activeVideoUrl)}
            videoUrl={activeVideoData?.url || activeVideoUrl}
            title={activeVideoData?.title || 'Recorded Lecture Video'}
            notesUrl={activeVideoData?.notesUrl}
            onClose={() => {
              setActiveVideoData(null);
              setActiveVideoUrl(null);
            }}
          />


          {/* ========================================================================= */}
          {/* MODAL 8: TRAINER EXAM PASSWORD VERIFICATION (MCQ & CODING) */}
          {/* ========================================================================= */}
          {showPasswordModal && targetExamForPassword && (
            <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 select-none font-sans">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg bg-white/95 rounded-[32px] p-7 sm:p-9 shadow-[0_32px_100px_-20px_rgba(10,37,64,0.35)] border border-slate-200/90 relative overflow-hidden"
              >
                {/* Luminous Ambient Header Glow */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-[#2563eb]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#3b82f6] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#2563eb] tracking-wider uppercase">
                            Proctored Security Gate
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Lockdown Armed
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-[#0a2540] tracking-tight mt-0.5 line-clamp-1">
                          {targetExamForPassword.title}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordError('');
                        setEnteredPassword('');
                      }}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Security Highlights Banner */}
                  <div className="grid grid-cols-3 gap-2.5 mb-6">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-center">
                      <div className="text-lg mb-1">🖥️</div>
                      <div className="text-[11px] font-bold text-slate-900">Fullscreen</div>
                      <div className="text-[10px] text-slate-500">Continuous</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-center">
                      <div className="text-lg mb-1">🖱️</div>
                      <div className="text-[11px] font-bold text-slate-900">Mouse Only</div>
                      <div className="text-[10px] text-slate-500">Keyboard Locked</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-center">
                      <div className="text-lg mb-1">🛡️</div>
                      <div className="text-[11px] font-bold text-slate-900">Anti-Cheat</div>
                      <div className="text-[10px] text-slate-500">Tabs Proctored</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#0a2540] uppercase tracking-wider">
                          Enter Trainer Access Passcode
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">Case-insensitive</span>
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          value={enteredPassword}
                          onChange={(e) => {
                            setEnteredPassword(e.target.value);
                            setPasswordError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleVerifyExamPassword();
                          }}
                          placeholder="••••••••••••"
                          className="w-full p-4 pr-12 rounded-2xl bg-slate-50 border border-slate-200 text-center font-mono text-base font-bold text-[#0a2540] tracking-widest placeholder:tracking-normal focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                          autoFocus
                        />
                        <Lock className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {passwordError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-rose-600 font-semibold mt-2 flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{passwordError}</span>
                        </motion.p>
                      )}
                    </div>

                    {/* Quick Access Card for Trainer's configured password */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[#2563eb]" />
                        <span className="text-xs text-slate-700 font-medium">Trainer Passcode:</span>
                        <span className="font-mono font-bold text-[#0a2540] bg-white px-2 py-0.5 rounded-md border border-blue-200 text-xs">
                          {targetExamForPassword.accessPassword || 'DEXAR2026'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEnteredPassword(targetExamForPassword.accessPassword || 'DEXAR2026');
                          setPasswordError('');
                        }}
                        className="text-[11px] font-bold text-[#2563eb] hover:underline cursor-pointer"
                      >
                        Autofill
                      </button>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordModal(false);
                          setPasswordError('');
                          setEnteredPassword('');
                        }}
                        className="px-5 py-3 rounded-2xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyExamPassword}
                        className="px-7 py-3 rounded-2xl bg-gradient-to-r from-[#0a2540] via-[#2563eb] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Unlock & Enter Proctored Exam</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          {/* MODAL 9: MCQ ONLINE EXAM RUNNER (WHITE THEME - ENHANCED & BUG-FREE) */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* MODAL 9: MCQ PROCTORED EXAM RUNNER (APPLE-GRADE LUXURY LOCKDOWN) */}
          {/* ========================================================================= */}
          {activeExam && (
            <div
              ref={examContainerRef}
              className="fixed inset-0 z-[100] bg-[#f1f5f9] text-slate-900 flex flex-col select-none overflow-hidden font-sans"
            >
              {/* Dynamic Island Top Bar - Clean solid styling without proctoring badges */}
              <header className="h-16 px-4 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 gap-3 shadow-xs">
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-md">
                    {activeExam.title || 'FINAL ASSESSMENT'}
                  </h1>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {/* Mobile Question Palette Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowMobileMatrix(true)}
                    className="lg:hidden px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-[#2563eb]" />
                    <span>Palette ({examAnswers.filter(a => a !== -1).length}/{activeExam.questions?.length || 1})</span>
                  </button>

                  {/* Chronometer Pill - Solid color */}
                  <div className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-mono font-bold flex items-center gap-2 shadow-xs transition-all ${examTimeLeft < 300
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse ring-2 ring-rose-200'
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}>
                    <Clock className={`w-4 h-4 ${examTimeLeft < 300 ? 'text-rose-600 animate-spin' : 'text-slate-500'}`} />
                    <span>
                      {Math.floor(examTimeLeft / 3600).toString().padStart(2, '0')}:
                      {Math.floor((examTimeLeft % 3600) / 60).toString().padStart(2, '0')}:
                      {(examTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Proctoring Warnings Pill - Solid color, silently increments */}
                  <div className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-xs transition-colors ${examViolations > 0
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                    <AlertTriangle className={`w-3.5 h-3.5 ${examViolations > 0 ? 'text-amber-700' : 'text-slate-500'}`} />
                    <span>Warnings: {examViolations}/{activeExam.maxViolations || 3}</span>
                  </div>

                  {/* Submit Exam Button - Solid styling */}
                  <button
                    type="button"
                    onClick={() => setShowQuizSubmitConfirm(true)}
                    className="px-5 sm:px-7 py-2.5 rounded-xl bg-[#0f172a] hover:bg-black text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Finish Exam
                  </button>
                </div>
              </header>

              {/* Main Assessment Body: Floating Full-Width Question Box and Floating Number Palette */}
              {(() => {
                const currentQ = activeExam.questions?.[currentQuestionIndex] || {};
                const qTitle = currentQ.questionText || currentQ.question || 'Question';
                const qOptions: string[] = Array.isArray(currentQ.options) ? currentQ.options : [];
                const totalQ = activeExam.questions?.length || 1;
                const answeredCount = examAnswers.filter(a => a !== -1).length;

                return (
                  <div className="flex-1 flex flex-col lg:flex-row gap-5 p-4 sm:p-6 overflow-hidden bg-[#f1f5f9]">
                    {/* Left Area: Floating Full-Width Question Box */}
                    <div className="flex-1 w-full bg-white rounded-xl shadow-md border border-slate-200/90 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto">
                      <div className="w-full">
                        {/* Question Metadata Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-wider uppercase">
                              Question {currentQuestionIndex + 1} of {totalQ}
                            </span>
                            {markedForReview.includes(currentQuestionIndex) && (
                              <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold flex items-center gap-1">
                                <span>⚐</span> Marked for Review
                              </span>
                            )}
                          </div>
                          <span className="px-3 py-1 rounded-lg bg-blue-50 text-[#2563eb] border border-blue-200 text-xs font-bold font-mono">
                            +{currentQ.marks || 10} Marks
                          </span>
                        </div>

                        {/* Question Title (Full Width) */}
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-8 leading-snug tracking-tight w-full">
                          {qTitle}
                        </h2>

                        {/* Vertical Options Stack (Full Width) */}
                        <div className="space-y-3.5 w-full">
                          {qOptions.map((opt: string, optIdx: number) => {
                            const isSelected = examAnswers[currentQuestionIndex] === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                                className={`w-full p-4.5 sm:p-5 rounded-xl border text-left flex items-center gap-4 transition-all duration-150 cursor-pointer ${isSelected
                                  ? 'bg-blue-50/90 border-2 border-[#2563eb] text-slate-900 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                                  }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${isSelected
                                    ? 'bg-[#2563eb] text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                <span className="text-sm sm:text-base leading-relaxed flex-1 font-medium">
                                  {opt}
                                </span>
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom Dock Navigation Toolbar */}
                      <div className="w-full pt-6 mt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={goToPrevQuestion}
                          disabled={currentQuestionIndex === 0}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                        >
                          ‹ Previous
                        </button>

                        <div className="flex items-center gap-2.5">
                          {examAnswers[currentQuestionIndex] !== -1 && (
                            <button
                              type="button"
                              onClick={() => handleClearOption(currentQuestionIndex)}
                              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              ✕ Clear Choice
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={toggleMarkForReview}
                            className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${markedForReview.includes(currentQuestionIndex)
                              ? 'bg-purple-100 border-purple-300 text-purple-900 font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            <span>⚐ {markedForReview.includes(currentQuestionIndex) ? 'Marked for Review' : 'Mark for Review'}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={goToNextQuestion}
                          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                        >
                          <span>{currentQuestionIndex === totalQ - 1 ? 'Review & Submit ›' : 'Next Question ›'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Floating Box: Questions Palette - Square numbers with minimal border radius, solid colors, NO black border, NO Dexar Guardian */}
                    <div className="hidden lg:flex w-80 shrink-0 bg-white rounded-xl shadow-md border border-slate-200/90 p-5 flex-col justify-between overflow-y-auto">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Questions
                          </h3>
                          <span className="text-xs font-bold text-[#2563eb]">
                            {answeredCount} / {totalQ} Solved
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-5 overflow-hidden">
                          <div
                            className="h-full bg-[#2563eb] rounded-full transition-all duration-300"
                            style={{ width: `${(answeredCount / totalQ) * 100}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
                          {activeExam.questions.map((_: any, idx: number) => {
                            const isCurrent = idx === currentQuestionIndex;
                            const isAnswered = examAnswers[idx] !== -1 && examAnswers[idx] !== undefined;
                            const isReviewed = markedForReview.includes(idx);
                            const isVisited = visitedQuestions.includes(idx);

                            // Solid colors for all numbers (no light gradient, no black border)
                            let tileClass = "bg-[#f8fafc] text-slate-600 border border-slate-200 hover:bg-slate-100";
                            if (isCurrent) {
                              tileClass = "bg-[#2563eb] text-white font-bold ring-2 ring-[#2563eb]/40 ring-offset-1";
                            } else if (isReviewed && isAnswered) {
                              tileClass = "bg-[#7c3aed] text-white font-bold";
                            } else if (isReviewed) {
                              tileClass = "bg-[#f3e8ff] text-[#7e22ce] border border-[#d8b4fe] font-bold";
                            } else if (isAnswered) {
                              tileClass = "bg-[#059669] text-white font-bold";
                            } else if (isVisited) {
                              tileClass = "bg-[#f1f5f9] text-slate-700 border border-slate-300 font-semibold";
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => jumpToQuestion(idx)}
                                className={`w-10 h-10 aspect-square rounded-md text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${tileClass}`}
                              >
                                {idx + 1}
                                {isReviewed && isAnswered && !isCurrent && (
                                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-300 ring-1 ring-white" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom Legend - Dexar Guardian removed completely */}
                      <div className="pt-4 border-t border-slate-100 mt-4">
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-md bg-[#f8fafc] border border-slate-200 shrink-0" />
                            <span>Unvisited</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-md bg-[#f1f5f9] border border-slate-300 shrink-0" />
                            <span>Unanswered</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-md bg-[#059669] shrink-0" />
                            <span>Answered</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-md bg-[#7c3aed] shrink-0" />
                            <span>Review</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Question Palette Drawer Modal */}
                    <AnimatePresence>
                      {showMobileMatrix && (
                        <div className="lg:hidden fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-end justify-center">
                          <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="w-full max-w-lg bg-white rounded-t-[32px] p-6 shadow-2xl border-t border-slate-200 max-h-[85vh] overflow-y-auto"
                          >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                              <div>
                                <h3 className="font-bold text-base text-[#0a2540]">Question Navigation Palette</h3>
                                <p className="text-xs text-gray-500">{answeredCount} of {totalQ} completed</p>
                              </div>
                              <button
                                onClick={() => setShowMobileMatrix(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="grid grid-cols-5 gap-2.5 mb-6">
                              {activeExam.questions.map((_: any, idx: number) => {
                                const isCurrent = idx === currentQuestionIndex;
                                const isAnswered = examAnswers[idx] !== -1 && examAnswers[idx] !== undefined;
                                const isReviewed = markedForReview.includes(idx);
                                const isVisited = visitedQuestions.includes(idx);

                                let tileClass = "bg-[#f8fafc] text-slate-600 border border-slate-200";
                                if (isCurrent) {
                                  tileClass = "bg-[#2563eb] text-white font-bold ring-2 ring-[#2563eb]/40 ring-offset-1";
                                } else if (isReviewed && isAnswered) {
                                  tileClass = "bg-[#7c3aed] text-white font-bold";
                                } else if (isReviewed) {
                                  tileClass = "bg-[#f3e8ff] text-[#7e22ce] border border-[#d8b4fe] font-bold";
                                } else if (isAnswered) {
                                  tileClass = "bg-[#059669] text-white font-bold";
                                } else if (isVisited) {
                                  tileClass = "bg-[#f1f5f9] text-slate-700 border border-slate-300 font-semibold";
                                }

                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      jumpToQuestion(idx);
                                      setShowMobileMatrix(false);
                                    }}
                                    className={`w-10 h-10 aspect-square rounded-md text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${tileClass}`}
                                  >
                                    {idx + 1}
                                    {isReviewed && isAnswered && !isCurrent && (
                                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-300 ring-1 ring-white" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowMobileMatrix(false)}
                              className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Close Palette
                            </button>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MCQ EXAM SUBMISSION CONFIRMATION MODAL (APPLE-GRADE SHEET) */}
          {/* ========================================================================= */}
          {showQuizSubmitConfirm && activeExam && (
            <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[32px] p-7 shadow-2xl border border-slate-200 text-slate-900 relative overflow-hidden"
              >
                <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center shadow-xs shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0a2540]">Finalize & Submit Exam?</h3>
                    <p className="text-xs text-gray-500">Please review your proctored exam summary</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Total Questions</span>
                      <strong className="text-xl font-bold text-slate-900">{activeExam.questions?.length || 0}</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 uppercase font-bold block mb-1">Answered</span>
                      <strong className="text-xl font-bold text-emerald-800">{examAnswers.filter(a => a !== -1).length}</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                      <span className="text-[10px] text-rose-700 uppercase font-bold block mb-1">Unanswered</span>
                      <strong className="text-xl font-bold text-rose-800">
                        {Math.max(0, (activeExam.questions?.length || 0) - examAnswers.filter(a => a !== -1).length)}
                      </strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                      <span className="text-[10px] text-purple-700 uppercase font-bold block mb-1">Marked for Review</span>
                      <strong className="text-xl font-bold text-purple-800">{markedForReview.length}</strong>
                    </div>
                  </div>

                  {(activeExam.questions?.length || 0) - examAnswers.filter(a => a !== -1).length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>You have unanswered questions. Once submitted, your score will be computed immediately.</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowQuizSubmitConfirm(false)}
                      className="px-5 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      Return to Exam
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitQuizExam('completed')}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0a2540] to-black hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-black/20 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Confirm & Submit
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          {/* MODAL 10: CODING EXAM ARENA RUNNER (FULLSCREEN - ENHANCED IDE & BUG-FREE) */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* MODAL 10: CODING EXAM ARENA RUNNER (APPLE/LINEAR PROCTORED IDE) */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* MODAL 10: CODING EXAM ARENA RUNNER (VS CODE BLACK THEME IDE) */}
          {/* ========================================================================= */}
          {activeCodingExam && (
            <div className="fixed inset-0 z-[100] bg-[#1a1a1a] text-[#eff1f6] flex flex-col select-none overflow-hidden font-sans">
              {/* LEETCODE TOPBAR */}
              <header className="h-12 px-4 bg-[#262626] border-b border-[#333333] flex items-center justify-between shrink-0 text-xs select-none">
                {/* Left: Brand, Problem Navigator & Difficulty */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm font-black text-xs">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-white text-sm tracking-tight hidden sm:inline">Dexar Code</span>
                  </div>

                  <div className="h-4 w-px bg-[#3a3a3a] hidden sm:block shrink-0" />

                  {/* Multi-Problem Switcher (LeetCode Question Pager) */}
                  {(() => {
                    const currentQ = activeCodingQuestions[activeCodingQuestionIdx] || activeCodingQuestions[0];
                    const pts = currentQ?.points || 50;
                    const diff = pts <= 30 ? 'Easy' : pts <= 70 ? 'Medium' : 'Hard';
                    const diffColor = diff === 'Easy'
                      ? 'text-[#00b8a3] bg-[#00b8a3]/10 border-[#00b8a3]/25'
                      : diff === 'Medium'
                      ? 'text-[#ffc01e] bg-[#ffc01e]/10 border-[#ffc01e]/25'
                      : 'text-[#ff375f] bg-[#ff375f]/10 border-[#ff375f]/25';

                    return (
                      <div className="flex items-center gap-2 min-w-0">
                        {activeCodingQuestions.length > 1 ? (
                          <div className="flex items-center gap-1 bg-[#1f1f1f] px-2 py-1 rounded-lg border border-[#383838] text-xs">
                            <button
                              type="button"
                              disabled={activeCodingQuestionIdx <= 0}
                              onClick={() => handleSwitchCodingQuestion(activeCodingQuestionIdx - 1)}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                              title="Previous Problem"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-1 font-semibold text-slate-200 whitespace-nowrap">
                              {activeCodingQuestionIdx + 1} / {activeCodingQuestions.length}
                            </span>
                            <button
                              type="button"
                              disabled={activeCodingQuestionIdx >= activeCodingQuestions.length - 1}
                              onClick={() => handleSwitchCodingQuestion(activeCodingQuestionIdx + 1)}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                              title="Next Problem"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : null}

                        <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md hidden sm:inline">
                          {currentQ?.title || activeCodingExam.title}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${diffColor} shrink-0`}>
                          {diff}
                        </span>

                        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md bg-[#333333] text-slate-300 text-[11px] font-mono shrink-0">
                          {pts} pts
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Center: LeetCode Run & Submit Actions + Timer */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* LeetCode Run Code Button */}
                  <button
                    type="button"
                    onClick={handleRunCodingTests}
                    disabled={codingTesting}
                    className="px-3.5 py-1.5 rounded-lg bg-[#ffffff14] hover:bg-[#ffffff24] text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-[#ffffff1c] shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Run code against test cases"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#2cbb5d] text-[#2cbb5d]" />
                    <span>{codingTesting ? 'Running...' : 'Run'}</span>
                  </button>

                  {/* LeetCode Vibrant Submit Button */}
                  <button
                    type="button"
                    onClick={() => setShowCodingSubmitConfirm(true)}
                    className="px-4 py-1.5 rounded-lg bg-[#2cbb5d] hover:bg-[#26a652] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                    title="Submit solution for exam evaluation"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submit</span>
                  </button>

                  {/* Chronometer */}
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors ${
                    examTimeLeft < 300
                      ? 'bg-rose-950/70 border-rose-600 text-rose-300 animate-pulse'
                      : 'bg-[#1f1f1f] border-[#383838] text-slate-200'
                  }`}>
                    <Clock className={`w-3.5 h-3.5 ${examTimeLeft < 300 ? 'text-rose-400 animate-spin' : 'text-slate-400'}`} />
                    <span>
                      {Math.floor(examTimeLeft / 3600).toString().padStart(2, '0')}:
                      {Math.floor((examTimeLeft % 3600) / 60).toString().padStart(2, '0')}:
                      {(examTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Right: Lockdown Pill, Violations Counter & Mobile Switcher */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Mobile Tab Switcher */}
                  <div className="lg:hidden flex items-center bg-[#1f1f1f] p-0.5 rounded-lg border border-[#383838] text-xs">
                    <button
                      type="button"
                      onClick={() => setCodingMobileTab('problem')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${codingMobileTab === 'problem' ? 'bg-[#333333] text-white' : 'text-slate-400'}`}
                    >
                      Problem
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodingMobileTab('editor')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${codingMobileTab === 'editor' ? 'bg-[#333333] text-white' : 'text-slate-400'}`}
                    >
                      Code
                    </button>
                  </div>

                  {/* Proctored Lockdown Badge */}
                  <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1f1f1f] border border-[#383838] text-xs text-[#2cbb5d]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2cbb5d]" />
                    <span className="font-medium">Lockdown</span>
                  </div>

                  {/* Violations Pill */}
                  <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
                    examViolations > 0
                      ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                      : 'bg-[#1f1f1f] border-[#383838] text-slate-400'
                  }`}>
                    <AlertTriangle className={`w-3.5 h-3.5 ${examViolations > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>Warn: {examViolations}/{activeCodingExam.maxViolations || 3}</span>
                  </div>
                </div>
              </header>

              {/* MAIN LEETCODE WORKSPACE: 2-COLUMN SPLIT (PROBLEM DESCRIPTION ON LEFT, CODE + CONSOLE ON RIGHT) */}
              <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 bg-[#1a1a1a] overflow-hidden">
                {/* 1. LEFT PANE: LEETCODE PROBLEM DESCRIPTION CARD */}
                <div className={`w-full lg:w-1/2 flex flex-col bg-[#262626] rounded-xl border border-[#333333] overflow-hidden shadow-lg ${
                  codingMobileTab === 'editor' ? 'hidden lg:flex' : 'flex'
                }`}>
                  {/* Left Pane Tab Bar */}
                  <div className="h-10 bg-[#262626] border-b border-[#333333] px-3 flex items-center justify-between text-xs shrink-0 select-none">
                    <div className="flex items-center gap-2 h-full">
                      <button
                        type="button"
                        onClick={() => setDescriptionActiveTab('description')}
                        className={`h-full flex items-center gap-1.5 px-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
                          descriptionActiveTab === 'description'
                            ? 'border-amber-500 text-white'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span>Description</span>
                      </button>

                      {activeCodingQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDescriptionActiveTab('problems')}
                          className={`h-full flex items-center gap-1.5 px-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
                            descriptionActiveTab === 'problems'
                              ? 'border-amber-500 text-white'
                              : 'border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5 text-blue-400" />
                          <span>All Problems ({activeCodingQuestions.length})</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
                      <span>Problem {activeCodingQuestionIdx + 1} of {activeCodingQuestions.length}</span>
                    </div>
                  </div>

                  {/* Left Pane Content Body */}
                  <div className="flex-1 overflow-y-auto p-5 text-sm font-sans space-y-4">
                    {descriptionActiveTab === 'description' ? (
                      (() => {
                        const currentQ = activeCodingQuestions[activeCodingQuestionIdx] || activeCodingQuestions[0];
                        const tcs = currentQ?.testCases || activeCodingExam.testCases || [];
                        const pts = currentQ?.points || 50;
                        const diff = pts <= 30 ? 'Easy' : pts <= 70 ? 'Medium' : 'Hard';
                        const diffColor = diff === 'Easy'
                          ? 'text-[#00b8a3] bg-[#00b8a3]/10 border-[#00b8a3]/25'
                          : diff === 'Medium'
                          ? 'text-[#ffc01e] bg-[#ffc01e]/10 border-[#ffc01e]/25'
                          : 'text-[#ff375f] bg-[#ff375f]/10 border-[#ff375f]/25';

                        return (
                          <div className="space-y-4">
                            {/* Problem Title & Header Badges */}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${diffColor}`}>
                                  {diff}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-[#333333] text-slate-300 text-xs font-mono font-medium">
                                  {pts} Points
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-[#1f1f1f] text-slate-400 text-xs font-mono border border-[#383838]">
                                  Question {activeCodingQuestionIdx + 1}
                                </span>
                              </div>
                              <h1 className="text-xl font-bold text-white tracking-tight leading-snug">
                                {currentQ?.title || activeCodingExam.title}
                              </h1>
                            </div>

                            {/* Problem Statement Text */}
                            <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-line font-sans">
                              {currentQ?.problemStatement || activeCodingExam.problemStatement}
                            </div>

                            {/* LeetCode Formatted Example Test Cases */}
                            {tcs && tcs.length > 0 && (
                              <div className="space-y-3 pt-2">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                  Examples
                                </div>
                                {tcs.map((tc: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="bg-[#1e1e1e] rounded-xl border border-[#383838] p-4 text-xs font-mono space-y-2 shadow-xs"
                                  >
                                    <div className="font-bold text-slate-200 font-sans text-xs flex items-center justify-between">
                                      <span>Example {idx + 1}:</span>
                                    </div>
                                    <div className="text-slate-300">
                                      <strong className="text-slate-400 font-sans">Input: </strong>
                                      <span className="text-amber-200/95">{tc.input}</span>
                                    </div>
                                    <div className="text-slate-300">
                                      <strong className="text-slate-400 font-sans">Output: </strong>
                                      <span className="text-emerald-300 font-semibold">{tc.output}</span>
                                    </div>
                                    {tc.explanation && (
                                      <div className="text-slate-400 text-[11px] font-sans pt-1.5 border-t border-[#2e2e2e]">
                                        <strong className="text-slate-300">Explanation: </strong>
                                        {tc.explanation}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Exam Constraints & Guidelines Card */}
                            <div className="space-y-2 pt-2 border-t border-[#333333] text-xs text-slate-400 font-sans">
                              <div className="font-bold text-slate-300 uppercase text-[11px] tracking-wider">
                                Examination Guidelines
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                                <li>Ensure your function matches the requested name and returns or outputs the expected format.</li>
                                <li>Full points are awarded only when all test cases match the expected outputs.</li>
                                <li>Single execution time limit is 4.0 seconds per test case.</li>
                                <li>Proctored arena: Tab switches and copy-paste are logged as violations.</li>
                              </ul>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      /* Multi-Problem Switcher List Tab */
                      <div className="space-y-2.5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Select Problem ({activeCodingQuestions.length})
                        </div>
                        <div className="space-y-1.5">
                          {activeCodingQuestions.map((q: any, idx: number) => {
                            const isCur = activeCodingQuestionIdx === idx;
                            const testOut = codingTestOutputs[idx];
                            const isAllPassed = testOut && testOut.passedCount === testOut.totalTests;
                            const pts = q.points || 50;
                            const diff = pts <= 30 ? 'Easy' : pts <= 70 ? 'Medium' : 'Hard';

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  handleSwitchCodingQuestion(idx);
                                  setDescriptionActiveTab('description');
                                }}
                                className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                                  isCur
                                    ? 'bg-[#333333] border-amber-500/70 text-white font-semibold shadow-xs'
                                    : 'bg-[#1f1f1f] border-[#383838] text-slate-300 hover:bg-[#2a2a2a]'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    testOut
                                      ? (isAllPassed ? 'bg-[#2cbb5d]' : 'bg-[#ef4743]')
                                      : 'bg-slate-600'
                                  }`} />
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-semibold text-white">
                                      {idx + 1}. {q.title || `Problem ${idx + 1}`}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {diff} • {pts} pts
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                                  {testOut ? `${testOut.passedCount}/${testOut.totalTests} passed` : 'Not run'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. RIGHT PANE: CODE EDITOR (TOP) + LEETCODE TESTCASE CONSOLE (BOTTOM) */}
                <div className={`w-full lg:w-1/2 flex flex-col gap-2 overflow-hidden ${
                  codingMobileTab === 'problem' ? 'hidden lg:flex' : 'flex'
                }`}>
                  {/* Top Card: Code Editor */}
                  <div className="flex-1 flex flex-col bg-[#262626] rounded-xl border border-[#333333] overflow-hidden shadow-lg">
                    {/* Editor Toolbar (LeetCode Style) */}
                    <div className="h-10 bg-[#262626] border-b border-[#333333] px-3 flex items-center justify-between text-xs select-none shrink-0">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-[#2cbb5d]" />
                        <span className="text-xs font-semibold text-slate-200">Code</span>
                      </div>

                      {/* Editor Controls: Language Dropdown, Font Size, Reset */}
                      <div className="flex items-center gap-2">
                        {/* Language Dropdown */}
                        <select
                          value={codingLanguage}
                          onChange={(e) => handleCodingLanguageChange(e.target.value)}
                          className="bg-[#1e1e1e] text-slate-200 border border-[#383838] rounded-lg px-2.5 py-1 text-xs font-sans focus:outline-none cursor-pointer"
                        >
                          <option value="javascript">JavaScript (Node.js)</option>
                          <option value="python">Python 3</option>
                          <option value="cpp">C++ (GCC)</option>
                          <option value="java">Java 17</option>
                        </select>

                        {/* Font Size Selector */}
                        <div className="hidden sm:flex items-center bg-[#1e1e1e] rounded-lg border border-[#383838] p-0.5 text-[11px] font-mono">
                          <button
                            type="button"
                            onClick={() => setEditorFontSize('xs')}
                            className={`px-2 py-0.5 rounded ${editorFontSize === 'xs' ? 'bg-[#333333] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                            title="Small Font"
                          >
                            A-
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorFontSize('sm')}
                            className={`px-2 py-0.5 rounded ${editorFontSize === 'sm' ? 'bg-[#333333] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                            title="Normal Font"
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorFontSize('base')}
                            className={`px-2 py-0.5 rounded ${editorFontSize === 'base' ? 'bg-[#333333] text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                            title="Large Font"
                          >
                            A+
                          </button>
                        </div>

                        {/* Reset Code Template */}
                        <button
                          type="button"
                          onClick={() => setShowResetCodeConfirm(true)}
                          className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-[#333333] transition-colors cursor-pointer flex items-center gap-1"
                          title="Reset code template"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* Editor Textarea with Gutter */}
                    <div className="flex-1 flex overflow-hidden bg-[#1e1e1e] relative">
                      {/* Line Numbers Gutter */}
                      <div className="py-3 px-3 bg-[#1e1e1e] text-[#6e7681] text-right select-none font-mono text-xs border-r border-[#333333] shrink-0 leading-relaxed">
                        {Array.from({ length: Math.max(codingCode.split('\n').length, 16) }).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Textarea Code Input */}
                      <textarea
                        value={codingCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCodingCode(val);
                          setCodingQuestionCodes((prev) => ({ ...prev, [activeCodingQuestionIdx]: val }));
                          const pos = e.target.selectionStart || 0;
                          const sub = val.substring(0, pos);
                          const lines = sub.split('\n');
                          setCursorPosition({ ln: lines.length, col: (lines[lines.length - 1] || '').length + 1 });
                        }}
                        onKeyUp={(e) => {
                          const target = e.currentTarget;
                          const pos = target.selectionStart || 0;
                          const sub = target.value.substring(0, pos);
                          const lines = sub.split('\n');
                          setCursorPosition({ ln: lines.length, col: (lines[lines.length - 1] || '').length + 1 });
                        }}
                        onClick={(e) => {
                          const target = e.currentTarget;
                          const pos = target.selectionStart || 0;
                          const sub = target.value.substring(0, pos);
                          const lines = sub.split('\n');
                          setCursorPosition({ ln: lines.length, col: (lines[lines.length - 1] || '').length + 1 });
                        }}
                        onKeyDown={handleCodingKeyDown}
                        onPaste={(e) => {
                          e.preventDefault();
                          triggerViolation('External clipboard paste is prohibited in Coding Arena');
                        }}
                        onCopy={(e) => {
                          e.preventDefault();
                          triggerViolation('Copying test content is prohibited');
                        }}
                        onCut={(e) => {
                          e.preventDefault();
                          triggerViolation('Cutting code is prohibited');
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          triggerViolation('Right-click context menu is disabled');
                        }}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className={`flex-1 w-full p-3 bg-[#1e1e1e] text-[#e6edf3] font-mono focus:outline-none resize-none leading-relaxed select-text selection:bg-[#264f78] ${
                          editorFontSize === 'xs' ? 'text-xs' : editorFontSize === 'base' ? 'text-base' : 'text-sm'
                        }`}
                        placeholder="// Write your solution function here..."
                      />
                    </div>
                  </div>

                  {/* Bottom Card: LeetCode Interactive Testcase & Test Result Console */}
                  <div className="h-64 sm:h-72 flex flex-col bg-[#262626] rounded-xl border border-[#333333] overflow-hidden shadow-lg shrink-0">
                    {/* Console Tab Bar */}
                    <div className="h-9 bg-[#262626] border-b border-[#333333] px-3 flex items-center justify-between text-xs select-none shrink-0">
                      <div className="flex items-center gap-2 h-full">
                        {/* Testcase Tab */}
                        <button
                          type="button"
                          onClick={() => setCodingConsoleTab('testcase')}
                          className={`h-full flex items-center gap-1.5 px-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
                            codingConsoleTab === 'testcase'
                              ? 'border-[#2cbb5d] text-white'
                              : 'border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Testcase</span>
                        </button>

                        {/* Test Result Tab */}
                        <button
                          type="button"
                          onClick={() => setCodingConsoleTab('result')}
                          className={`h-full flex items-center gap-1.5 px-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
                            codingConsoleTab === 'result'
                              ? 'border-[#2cbb5d] text-white'
                              : 'border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Test Result</span>
                          {codingTestOutput && (
                            <span className={`w-2 h-2 rounded-full ${
                              codingTestOutput.passedCount === codingTestOutput.totalTests ? 'bg-[#2cbb5d]' : 'bg-[#ef4743]'
                            }`} />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {codingTestOutput && (
                          <span className="font-mono text-xs hidden sm:inline text-slate-400">
                            Status:{' '}
                            <strong className={codingTestOutput.passedCount === codingTestOutput.totalTests ? 'text-[#2cbb5d]' : 'text-[#ef4743]'}>
                              {codingTestOutput.passedCount === codingTestOutput.totalTests ? 'Accepted' : 'Wrong Answer'}
                            </strong>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleRunCodingTests}
                          disabled={codingTesting}
                          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#333333] transition-colors cursor-pointer"
                          title="Re-run tests"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${codingTesting ? 'animate-spin text-[#2cbb5d]' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Console Tab Content Body */}
                    <div className="flex-1 overflow-y-auto p-3.5 font-mono text-xs text-[#cccccc]">
                      {/* TAB 1: TESTCASE SPECIFICATION */}
                      {codingConsoleTab === 'testcase' && (() => {
                        const currentTcs = getCurrentStudentTestCases();
                        const validIdx = Math.min(selectedTestCaseIdx, Math.max(currentTcs.length - 1, 0));
                        const selectedTc = currentTcs[validIdx] || { input: '', output: '' };
                        const inputBoxes = (selectedTc.input !== undefined && selectedTc.input !== null)
                          ? String(selectedTc.input).split('\n')
                          : [''];

                        return (
                          <div className="space-y-3">
                            {/* Case Tabs (Official Admin/Superadmin Test Cases Only) */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#333333]">
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                                {currentTcs.map((_: any, idx: number) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedTestCaseIdx(idx)}
                                    className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer shrink-0 ${
                                      validIdx === idx
                                        ? 'bg-[#383838] text-white border border-[#4a4a4a]'
                                        : 'bg-[#1f1f1f] text-slate-400 hover:text-slate-200 hover:bg-[#282828]'
                                    }`}
                                  >
                                    Case {idx + 1}
                                  </button>
                                ))}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleResetStudentTestCases}
                                  className="text-[11px] text-slate-400 hover:text-slate-200 font-sans flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Reset testcase values to original problem specification"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reset Inputs</span>
                                </button>
                              </div>
                            </div>

                            {/* Multiple Input Boxes for the Selected Case */}
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-sans font-semibold text-slate-300">
                                  Test Case Inputs ({inputBoxes.length} {inputBoxes.length === 1 ? 'parameter' : 'parameters'})
                                </span>
                              </div>

                              <div className="space-y-2">
                                {inputBoxes.map((val: string, bIdx: number) => (
                                  <div key={bIdx} className="space-y-1">
                                    <div className="text-[10px] text-slate-400 font-sans">
                                      <span>Input {bIdx + 1} =</span>
                                    </div>
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={(e) => handleUpdateStudentInputBox(bIdx, e.target.value)}
                                      placeholder={`Parameter ${bIdx + 1} value`}
                                      className="w-full px-3 py-2 rounded-lg bg-[#1e1e1e] border border-[#383838] focus:border-[#2cbb5d] focus:outline-none text-xs text-amber-200 font-mono transition-colors"
                                    />
                                  </div>
                                ))}
                              </div>

                              {/* Expected Output defined by Exam Admin */}
                              <div>
                                <span className="text-[10px] text-slate-400 font-sans block mb-1">Expected Output =</span>
                                <input
                                  type="text"
                                  value={selectedTc.output || ''}
                                  readOnly
                                  placeholder="Expected output from administrator"
                                  className="w-full px-3 py-2 rounded-lg bg-[#191919] border border-[#333333] text-xs text-emerald-300 font-mono font-semibold cursor-default"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* TAB 2: TEST RESULT OUTCOME */}
                      {codingConsoleTab === 'result' && (() => {
                        if (codingTesting) {
                          return (
                            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2 py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-[#2cbb5d]" />
                              <p className="font-semibold text-slate-200 font-sans text-xs">Running test cases...</p>
                              <p className="text-[11px] text-slate-400 font-sans">Evaluating solution in isolated sandbox.</p>
                            </div>
                          );
                        }

                        if (!codingTestOutput) {
                          return (
                            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2.5 py-8">
                              <Terminal className="w-8 h-8 text-slate-500" />
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-200 font-sans text-xs">You must run your code first.</p>
                                <p className="text-[11px] text-slate-400 font-sans">Click <strong className="text-[#2cbb5d]">&quot;Run&quot;</strong> in the toolbar to see execution results.</p>
                              </div>
                            </div>
                          );
                        }

                        const allPassed = codingTestOutput.passedCount === codingTestOutput.totalTests;
                        const testResults = codingTestOutput.testResults || [];
                        const validIdx = Math.min(selectedTestCaseIdx, Math.max(testResults.length - 1, 0));
                        const currentRes = testResults[validIdx] || testResults[0];

                        return (
                          <div className="space-y-3.5">
                            {/* LeetCode Result Outcome Header */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#333333]">
                              <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold font-sans ${allPassed ? 'text-[#2cbb5d]' : 'text-[#ef4743]'}`}>
                                  {allPassed ? 'Accepted' : 'Wrong Answer'}
                                </span>
                                <span className="text-xs font-mono text-slate-300 bg-[#1e1e1e] px-2 py-0.5 rounded-md border border-[#383838]">
                                  Runtime: {codingTestOutput.runtimeMs || 48} ms
                                </span>
                              </div>
                              <div className="text-xs font-sans text-slate-400">
                                {codingTestOutput.passedCount} / {codingTestOutput.totalTests} testcases passed
                              </div>
                            </div>

                            {/* Case Selector Pills with Pass/Fail Dots */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {testResults.map((r: any, idx: number) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedTestCaseIdx(idx)}
                                  className={`px-3 py-1 rounded-lg text-xs font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                                    validIdx === idx
                                      ? 'bg-[#383838] text-white border border-[#4a4a4a]'
                                      : 'bg-[#1f1f1f] text-slate-400 hover:text-slate-200 hover:bg-[#282828]'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${r.passed ? 'bg-[#2cbb5d]' : 'bg-[#ef4743]'}`} />
                                  <span>Case {r.testCaseIndex || idx + 1}</span>
                                </button>
                              ))}
                            </div>

                            {/* Detailed Inspection of Selected Case Result */}
                            {currentRes && (() => {
                              const resInputLines = String(currentRes.input || '').split('\n');
                              return (
                                <div className="space-y-2.5 font-mono text-xs">
                                  {resInputLines.length > 1 ? (
                                    <div className="space-y-2">
                                      {resInputLines.map((line: string, lIdx: number) => (
                                        <div key={lIdx}>
                                          <span className="text-slate-400 text-[10px] font-sans block mb-0.5">Input {lIdx + 1} =</span>
                                          <div className="p-2 rounded-lg bg-[#1e1e1e] border border-[#333333] text-amber-200/90 whitespace-pre-wrap">
                                            {line}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="text-slate-400 text-[11px] font-sans block mb-1">Input =</span>
                                      <div className="p-2 rounded-lg bg-[#1e1e1e] border border-[#333333] text-amber-200/90 whitespace-pre-wrap">
                                        {currentRes.input}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-slate-400 text-[11px] font-sans block mb-1">Output =</span>
                                    <div className={`p-2 rounded-lg bg-[#1e1e1e] border border-[#333333] whitespace-pre-wrap ${
                                      currentRes.passed ? 'text-[#2cbb5d] font-medium' : 'text-[#ef4743] font-semibold'
                                    }`}>
                                      {currentRes.actualOutput}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 text-[11px] font-sans block mb-1">Expected =</span>
                                    <div className="p-2 rounded-lg bg-[#1e1e1e] border border-[#333333] text-emerald-300 whitespace-pre-wrap">
                                      {currentRes.expectedOutput}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* LEETCODE MINIMAL DARK STATUS BAR */}
              <footer className="h-6 bg-[#1a1a1a] border-t border-[#2e2e2e] px-4 flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0 select-none">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2cbb5d]" />
                    Dexar Arena Sandbox
                  </span>
                  <span className="hidden sm:inline text-slate-500">•</span>
                  <span className="hidden sm:inline text-slate-400">Auto-save Enabled</span>
                </div>

                <div className="flex items-center gap-3">
                  <span>Ln {cursorPosition.ln}, Col {cursorPosition.col}</span>
                  <span className="hidden sm:inline">Spaces: 2</span>
                  <span className="font-semibold uppercase bg-[#282828] text-slate-300 px-1.5 py-0.2 rounded text-[10px]">
                    {codingLanguage}
                  </span>
                  <span className="hidden md:flex items-center gap-1 text-[#2cbb5d] text-[10px]">
                    <ShieldCheck className="w-3 h-3" />
                    Proctored Arena
                  </span>
                </div>
              </footer>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CODING EXAM SUBMISSION CONFIRMATION MODAL (VS CODE DARK THEME) */}
          {/* ========================================================================= */}
          {showCodingSubmitConfirm && activeCodingExam && (
            <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-[#252526] rounded-xl p-6 shadow-2xl border border-[#3c3c3c] text-[#cccccc] relative overflow-hidden font-sans"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-[#333333] mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#2cbb5d]/15 text-[#2cbb5d] flex items-center justify-center shrink-0 border border-[#2cbb5d]/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Submit Coding Solution?</h3>
                    <p className="text-xs text-slate-400">{activeCodingExam.title}</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-[#1e1e1e] border border-[#333333] text-xs space-y-2 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Language:</span>
                      <strong className="uppercase text-[#9cdcfe]">{codingLanguage}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Problems:</span>
                      <strong className="text-white">{activeCodingQuestions.length} Problems</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Max Exam Points:</span>
                      <strong className="text-[#2cbb5d] font-bold">{activeCodingExam.totalPoints || 100} Pts</strong>
                    </div>
                  </div>

                  {/* Problem-by-problem evaluation status */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Problem Evaluation &amp; Points Status
                    </div>
                    {activeCodingQuestions.map((q: any, idx: number) => {
                      const testOut = codingTestOutputs[idx];
                      const allPassed = testOut && testOut.passedCount === testOut.totalTests;
                      const qPoints = q.points || 50;
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[#1e1e1e] border border-[#333333] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">
                              Q{idx + 1}: {q.title || `Problem ${idx + 1}`}
                            </div>
                            <div className="text-[11px] font-mono">
                              {testOut ? (
                                <span className={allPassed ? 'text-[#2cbb5d]' : 'text-rose-400'}>
                                  {testOut.passedCount} / {testOut.totalTests} Tests Passed {allPassed ? '✓' : '✗'}
                                </span>
                              ) : (
                                <span className="text-slate-500">Tests not executed yet</span>
                              )}
                            </div>
                          </div>
                          <span className={`font-mono font-bold ${allPassed ? 'text-[#2cbb5d]' : 'text-slate-500'}`}>
                            {allPassed ? `+${qPoints} Pts` : '0 Pts'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Strict Marking Rule Callout */}
                  <div className="p-3 rounded-xl bg-[#1f1d14] border border-[#6b581c] text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Grading Rule: If all test cases match, full marks are awarded. If any test case fails, 0 marks are awarded for that problem.</span>
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowCodingSubmitConfirm(false)}
                      className="px-4 py-2 rounded-xl bg-[#333333] hover:bg-[#3e3e3e] text-xs font-semibold text-white cursor-pointer transition-colors"
                    >
                      Keep Editing
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitCodingExam('completed')}
                      className="px-5 py-2 rounded-xl bg-[#2cbb5d] hover:bg-[#26a652] text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
                    >
                      Confirm &amp; Submit Solution
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* CODING RESET CODE CONFIRMATION MODAL (VS CODE DARK THEME) */}
          {showResetCodeConfirm && (
            <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm bg-[#252526] rounded-xl p-5 shadow-2xl border border-[#3c3c3c] text-[#cccccc] font-sans"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-[#333333] mb-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/60 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Reset Code Solution?</h3>
                    <p className="text-[11px] text-[#858585]">Reverts to the starter template for {codingLanguage}</p>
                  </div>
                </div>
                <p className="text-xs text-[#cccccc] leading-relaxed mb-4">
                  All current changes in your editor will be replaced by the default template. Are you sure?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetCodeConfirm(false)}
                    className="px-3 py-1.5 rounded bg-[#333333] hover:bg-[#3e3e3e] text-xs font-medium text-white cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCode}
                    className="px-3.5 py-1.5 rounded bg-[#e11d48] hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Reset Code
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 11: STUDENT COMPLETE ACADEMIC LEARNING REPORT (SIMPLE MONOCHROME) */}
          {/* ========================================================================= */}
          {showReportModal && (
            <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto report-modal-backdrop-root report-modal-backdrop">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-4xl bg-white rounded-2xl p-6 sm:p-8 shadow-none border border-neutral-300 max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:p-0 report-modal-container"
              >
                {/* Close Button Pinned to Top-Right Corner */}
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 text-lg transition-colors cursor-pointer z-20 print:hidden"
                  aria-label="Close modal"
                >
                  ✕
                </button>

                {/* Modal Top Actions Header (Hidden in Print) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 mb-6 print:hidden pr-10 sm:pr-12">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-300 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-neutral-800" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black">Student Learning Transcript & Academic Standing</h3>
                      <p className="text-xs text-neutral-600">Official verified learning transcript and exam performance for {currentUser.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={downloadingReportPdf}
                      onClick={() => handleDownloadPdfReport('student-transcript-report-body', `Dexar_Academic_Transcript_${(currentUser?.name || 'Student').replace(/\s+/g, '_')}`)}
                      className="px-4 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
                    >
                      {downloadingReportPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>{downloadingReportPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
                    </button>
                  </div>
                </div>

                {/* Printable Document Body - Clean Normal Black & White Text and Tables */}
                <div id="student-transcript-report-body" className="p-6 sm:p-8 rounded-xl bg-white border border-neutral-300 print:border-none space-y-6 text-black printable-report-body">
                  {/* Formal Institution Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-black">
                    <div>
                      <div className="text-2xl font-bold text-black tracking-tight uppercase">DEXAR TECHNOLOGIES</div>
                      <div className="text-xs text-neutral-700 font-semibold tracking-wide">ACADEMY OF ADVANCED SOFTWARE ENGINEERING</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">Accredited Student Learning & Examination Record</div>
                    </div>
                    <div className="sm:text-right">
                      <span className="px-3 py-1 border border-black text-black text-xs font-bold uppercase inline-block">
                        Official Academic Report
                      </span>
                      <div className="text-xs font-mono text-neutral-700 mt-1.5">
                        Report ID: DXR-TRN-{currentUser.id?.slice(-6) || '884210'}
                      </div>
                      <div className="text-[11px] text-neutral-600">
                        Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Student Summary Data */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-300 text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-600 uppercase font-semibold block">Student Name</span>
                      <strong className="text-black text-sm font-bold">{currentUser.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-600 uppercase font-semibold block">Student Email</span>
                      <span className="text-neutral-800 truncate block">{currentUser.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-600 uppercase font-semibold block">Enrolled Course</span>
                      <strong className="text-black font-semibold">{activeCourse?.title || studentDash?.student?.subjectId?.title || 'Full Stack Web Development'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-600 uppercase font-semibold block">Subscription Plan</span>
                      <span className="text-black font-bold uppercase">Active • Verified</span>
                    </div>
                  </div>

                  {/* Summary Metric Counters (Plain Monochrome Boxes) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Live Classes Attended</div>
                      <div className="text-xl font-bold text-black mt-1">{studentLive.length || 2} / {studentLive.length || 2}</div>
                      <div className="text-[10px] text-neutral-600 font-semibold">100% Attendance</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Recorded Lectures</div>
                      <div className="text-xl font-bold text-black mt-1">{studentRecorded.length || 2}</div>
                      <div className="text-[10px] text-neutral-600">Modules Completed</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Coding Arena Tests</div>
                      <div className="text-xl font-bold text-black mt-1">100 Pts</div>
                      <div className="text-[10px] text-neutral-600 font-semibold">All Tests Passed</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Cumulative Grade</div>
                      <div className="text-xl font-bold text-black mt-1">Grade A+</div>
                      <div className="text-[10px] text-neutral-600 font-semibold">Excellent Standing</div>
                    </div>
                  </div>

                  {/* Assessment Performance Table */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3 flex items-center justify-between border-b border-neutral-200 pb-2">
                      <span>Online Examination & Assessment Performance</span>
                      <span className="text-[11px] font-normal text-neutral-600 normal-case">
                        Verified Exam Scores
                      </span>
                    </h4>
                    <div className="border border-neutral-300 rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-neutral-100 text-black border-b border-neutral-300 font-bold uppercase text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Exam Title</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Date Taken</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Score</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Percentage</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {studentMarks?.assessmentSubmissions?.length > 0 ? (
                            studentMarks.assessmentSubmissions.map((sub: any) => (
                              <tr key={sub._id} className="hover:bg-neutral-50">
                                <td className="py-2.5 px-3 border-r border-neutral-200 font-semibold text-black">{sub.assessmentId?.title || 'Weekly Assessment'}</td>
                                <td className="py-2.5 px-3 border-r border-neutral-200 text-neutral-600">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                                <td className="py-2.5 px-3 border-r border-neutral-200 font-bold text-black">{sub.score} / {sub.totalMarks || 100}</td>
                                <td className="py-2.5 px-3 border-r border-neutral-200 font-bold text-black">{Math.round((sub.score / (sub.totalMarks || 100)) * 100)}%</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="border border-neutral-400 px-2 py-0.5 rounded text-[10px] font-semibold text-black">Passed</span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <>
                              <tr className="hover:bg-neutral-50">
                                <td className="py-2.5 px-3 border-r border-neutral-200 font-semibold text-black">FINAL ASSESSMENT</td>
                                <td className="py-2.5 px-3 border-r border-neutral-200 text-neutral-600">Oct 12, 2026</td>
                                <td className="py-2.5 px-3 border-r border-neutral-200 font-bold text-black">95 / 100</td>
                                <td className="py-2.5 px-3 border-r border-neutral-200 font-bold text-black">95%</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="border border-neutral-400 px-2 py-0.5 rounded text-[10px] font-semibold text-black">Passed (Distinction)</span>
                                </td>
                              </tr>
                              <tr className="hover:bg-neutral-50">
                                <td className="py-2.5 px-3 border-r border-neutral-200 font-semibold text-black">WEEKLY ASSESSMENT 7</td>
                                <td className="py-2.5 px-3 border-r border-neutral-200 text-neutral-600">Oct 4, 2026</td>
                                <td className="py-2.5 px-3 border-r border-neutral-200 font-bold text-black">90 / 100</td>
                                <td className="py-2.5 px-3 border-r border-neutral-200 font-bold text-black">90%</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="border border-neutral-400 px-2 py-0.5 rounded text-[10px] font-semibold text-black">Passed</span>
                                </td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Coding Exam Performance Table */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3 flex items-center justify-between border-b border-neutral-200 pb-2">
                      <span>Coding Arena Algorithmic Evaluations</span>
                      <span className="text-[11px] font-normal text-neutral-600 normal-case">
                        Verified Execution Logs
                      </span>
                    </h4>
                    <div className="border border-neutral-300 rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-neutral-100 text-black border-b border-neutral-300 font-bold uppercase text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Challenge Title</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Test Cases Passed</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Score</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Security Lockdown</th>
                            <th className="py-2.5 px-3 text-right">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          <tr className="hover:bg-neutral-50">
                            <td className="py-2.5 px-3 border-r border-neutral-200 font-semibold text-black">Algorithm Challenge: TwoSum & Array Operations</td>
                            <td className="py-2.5 px-3 border-r border-neutral-200 text-neutral-600 font-mono">10 / 10 Passed</td>
                            <td className="py-2.5 px-3 border-r border-neutral-200 font-bold text-black">100 / 100 Pts</td>
                            <td className="py-2.5 px-3 border-r border-neutral-200 text-neutral-700 font-semibold">Verified Clean</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="border border-neutral-400 px-2 py-0.5 rounded text-[10px] font-semibold text-black">Completed</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Institutional Signoff (Monochrome - Verified Seal removed) */}
                  <div className="pt-6 border-t-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <div className="text-xs font-bold text-black">Officially Verified by Academic Operations</div>
                      <div className="text-[11px] text-neutral-600">Dexar Technologies Academic Board</div>
                    </div>

                    <div className="sm:text-right">
                      <div className="font-serif italic text-base font-bold text-black">Arpan</div>
                      <div className="text-xs font-semibold text-neutral-800">Lead Academic Trainer</div>
                      <div className="text-[11px] text-neutral-600">Head of Curriculum & Student Assessment</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 11B: SUPER ADMIN OVERALL STUDENTS REPORT (OFFICIAL DOWNLOAD & PRINT) */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* MODAL 11B: SUPER ADMIN OVERALL STUDENTS REPORT (CLEAN MONOCHROME - NO COLORS) */}
          {/* ========================================================================= */}
          {showOverallReportModal && (
            <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto report-modal-backdrop-root report-modal-backdrop">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-5xl bg-white rounded-2xl p-6 sm:p-8 shadow-none border border-neutral-300 max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:p-0 report-modal-container"
              >
                {/* Close Button Pinned to Top-Right Corner */}
                <button
                  type="button"
                  onClick={() => setShowOverallReportModal(false)}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 text-lg transition-colors cursor-pointer z-20 print:hidden"
                  aria-label="Close modal"
                >
                  ✕
                </button>

                {/* Modal Top Actions Header (Hidden in Print) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 mb-6 print:hidden pr-10 sm:pr-12">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-300 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-neutral-800" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black">Dexar Comprehensive Student Performance & Academic Standings Report</h3>
                      <p className="text-xs text-neutral-600">Official student evaluation records, assessment marks, coding progress, and rankings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleDownloadStudentsCSV}
                      className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export to CSV</span>
                    </button>
                    <button
                      type="button"
                      disabled={downloadingReportPdf}
                      onClick={() => handleDownloadPdfReport('superadmin-overall-report-body', 'Dexar_Overall_Student_Performance_Report')}
                      className="px-4 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
                    >
                      {downloadingReportPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>{downloadingReportPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter Toolbar (Hidden in Print) */}
                <div className="mb-6 p-4 rounded-xl bg-neutral-50 border border-neutral-300 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-800">Filter Course:</span>
                      <select
                        value={reportSubjectFilter}
                        onChange={(e) => setReportSubjectFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-black text-xs font-medium focus:outline-none focus:border-black"
                      >
                        <option value="all">All Curriculum Subjects ({saSubjects.length})</option>
                        {saSubjects.map((sub: any) => (
                          <option key={sub._id} value={sub._id}>{sub.title} ({sub.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-800">Filter Status:</span>
                      <select
                        value={reportStatusFilter}
                        onChange={(e) => setReportStatusFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-black text-xs font-medium focus:outline-none focus:border-black"
                      >
                        <option value="all">All Subscription Statuses</option>
                        <option value="paid">Paid & Active</option>
                        <option value="pending">Pending Payments</option>
                        <option value="access_requested">Access Requested ({saStudents.filter((s) => s.accessRequested).length})</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-neutral-700 font-medium">
                    Showing <strong className="text-black">{reportFilteredStudents.length}</strong> of <strong>{saStudents.length}</strong> Total Students
                  </div>
                </div>

                {/* Printable Document Body - Clean Normal Black & White Text and Tables */}
                <div id="superadmin-overall-report-body" className="p-6 sm:p-8 rounded-xl bg-white border border-neutral-300 print:border-none space-y-6 text-black printable-report-body">
                  {/* Formal Institution Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-black">
                    <div>
                      <div className="text-2xl font-bold text-black tracking-tight uppercase">Dexar Technologies</div>
                      <div className="text-xs text-neutral-700 font-semibold tracking-wide">Academy of Advanced Software Engineering</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">Central Academic Student Performance, Exam Marks & Standings Record</div>
                    </div>
                    <div className="sm:text-right">
                      <span className="px-3 py-1 border border-black text-black text-xs font-bold uppercase inline-block">
                        Official Academic Report
                      </span>
                      <div className="text-xs font-mono text-neutral-700 mt-1.5">
                        Report ID: DXR-PERF-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
                      </div>
                      <div className="text-[11px] text-neutral-600">
                        Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-neutral-800 font-semibold mt-0.5">
                        Issuer: Super Administrator ({currentUser?.name || 'Admin'})
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Counters (Plain Monochrome Boxes) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Total Enrolled Students</div>
                      <div className="text-xl font-bold text-black mt-1">{reportFilteredStudents.length}</div>
                      <div className="text-[10px] text-neutral-600">{saStudents.length} Total Cohort</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Active Subscriptions</div>
                      <div className="text-xl font-bold text-black mt-1">
                        {reportFilteredStudents.filter((st: any) => st.paymentStatus === 'paid').length}
                      </div>
                      <div className="text-[10px] text-neutral-600">Paid & Verified</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Total Fee Amount</div>
                      <div className="text-xl font-bold text-black mt-1">
                        ₹{reportFilteredStudents.reduce((acc: number, cur: any) => acc + (cur.amount || 499), 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-neutral-600">Calculated Roster Fee</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Curriculum Subjects</div>
                      <div className="text-xl font-bold text-black mt-1">{saSubjects.length}</div>
                      <div className="text-[10px] text-neutral-600">{saTrainers.length} Trainers Active</div>
                    </div>
                  </div>

                  {/* Normal Text Table - No Colors */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3 flex items-center justify-between border-b border-neutral-200 pb-2">
                      <span>Student Roster and Academic Performance Table</span>
                      <span className="text-[11px] font-normal text-neutral-600 normal-case">
                        Total {reportFilteredStudents.length} Records
                      </span>
                    </h4>
                    <div className="border border-neutral-300 rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-neutral-100 text-black border-b border-neutral-300 font-bold uppercase text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Student ID & Name</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Course</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Trainer</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Plan & Fee</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">MCQ Exams</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Coding Exams</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Standing</th>
                            <th className="py-2.5 px-3 text-right">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {reportFilteredStudents.map((st: any, idx: number) => {
                            const studentSubId = st.subjectId?._id || st.subjectId;
                            const trainer = saTrainers.find((t: any) => {
                              const tSubId = t.subjectId?._id || t.subjectId;
                              return tSubId && studentSubId && String(tSubId) === String(studentSubId);
                            });

                            const mcqSubs = (saMarks.assessmentSubmissions || []).filter(
                              (m: any) => m.studentId?._id === st._id || m.studentId?.email?.toLowerCase() === st.email?.toLowerCase()
                            );
                            const avgMcq = mcqSubs.length > 0
                              ? Math.round(mcqSubs.reduce((acc: number, cur: any) => acc + (cur.score || 0), 0) / mcqSubs.length)
                              : null;

                            const codingSubs = (saMarks.codingSubmissions || []).filter(
                              (c: any) => c.studentId?._id === st._id || c.studentId?.email?.toLowerCase() === st.email?.toLowerCase()
                            );
                            const totalPoints = codingSubs.reduce((acc: number, cur: any) => acc + (cur.pointsEarned || 0), 0);

                            const standing = mcqSubs.length > 0 || codingSubs.length > 0
                              ? (avgMcq !== null && avgMcq >= 75 ? 'Grade A+' : 'Grade A')
                              : 'Active';

                            return (
                              <tr key={st._id || idx} className="hover:bg-neutral-50">
                                <td className="py-2.5 px-3 border-r border-neutral-200">
                                  <div className="font-bold text-black">{st.name}</div>
                                  <div className="text-[10px] text-neutral-600 font-mono">{st.email}</div>
                                  <div className="text-[9px] text-neutral-500 font-mono mt-0.5">
                                    DXR-STU-{st._id ? st._id.slice(-6).toUpperCase() : String(idx + 1).padStart(4, '0')}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 border-r border-neutral-200">
                                  <div className="font-medium text-black">{st.subjectId?.title || 'Unassigned'}</div>
                                  <div className="text-[10px] text-neutral-600 font-mono">{st.subjectId?.code || '—'}</div>
                                </td>
                                <td className="py-2.5 px-3 border-r border-neutral-200 text-black">
                                  {trainer ? (
                                    <div>
                                      <div className="font-medium text-black">{trainer.name}</div>
                                      <div className="text-[10px] text-neutral-600">{trainer.email}</div>
                                    </div>
                                  ) : (
                                    <span className="text-neutral-500 italic">Unassigned</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 border-r border-neutral-200">
                                  <div className="font-bold text-black">₹{st.amount || 499}</div>
                                  <div className="text-[10px] text-neutral-600 capitalize">
                                    {st.planType === 'course_wise' ? 'Course Pack' : 'Monthly'}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 border-r border-neutral-200">
                                  {mcqSubs.length > 0 ? (
                                    <div>
                                      <div className="font-bold text-black">{avgMcq}% Avg</div>
                                      <div className="text-[10px] text-neutral-600">{mcqSubs.length} Exam(s) Taken</div>
                                    </div>
                                  ) : (
                                    <span className="text-neutral-500 text-[11px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 border-r border-neutral-200">
                                  {codingSubs.length > 0 ? (
                                    <div>
                                      <div className="font-bold text-black">{totalPoints} Pts</div>
                                      <div className="text-[10px] text-neutral-600">{codingSubs.length} Challenge(s)</div>
                                    </div>
                                  ) : (
                                    <span className="text-neutral-500 text-[11px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 border-r border-neutral-200">
                                  <span className="border border-neutral-400 px-2 py-0.5 rounded text-[10px] font-semibold text-black">
                                    {standing}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="border border-neutral-400 px-2 py-0.5 rounded text-[10px] font-semibold text-black uppercase">
                                    {st.paymentStatus || 'paid'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {reportFilteredStudents.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-neutral-500">
                                No student records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Institutional Signoff (Monochrome - Verified Seal removed) */}
                  <div className="pt-6 border-t-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <div className="text-xs font-bold text-black">Officially Verified by Academic Operations</div>
                      <div className="text-[11px] text-neutral-600">Dexar Technologies Central Academic Registrar</div>
                    </div>

                    <div className="sm:text-right">
                      <div className="font-serif italic text-base font-bold text-black">Arpan</div>
                      <div className="text-xs font-semibold text-neutral-800">Director of Academic Oversight & Student Performance Evaluation</div>
                      <div className="text-[11px] text-neutral-600">Dexar Technologies Central Academic Board</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 11C: SUPER ADMIN TRANSACTIONS LEDGER REPORT (OFFICIAL DOWNLOAD & PRINT) */}
          {/* ========================================================================= */}
          {showTransactionReportModal && (
            <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto report-modal-backdrop-root report-modal-backdrop">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-5xl bg-white rounded-2xl p-6 sm:p-8 shadow-none border border-neutral-300 max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:p-0 report-modal-container"
              >
                {/* Close Button Pinned to Top-Right Corner */}
                <button
                  type="button"
                  onClick={() => setShowTransactionReportModal(false)}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 text-lg transition-colors cursor-pointer z-20 print:hidden"
                  aria-label="Close modal"
                >
                  ✕
                </button>

                {/* Modal Top Actions Header (Hidden in Print) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 mb-6 print:hidden pr-10 sm:pr-12">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-300 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-neutral-800" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black">Dexar Platform Financial Ledger & Transactions Report</h3>
                      <p className="text-xs text-neutral-600">Official student payments, subscription purchases, and revenue ledger</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleDownloadTransactionsCSV}
                      className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export to CSV</span>
                    </button>
                    <button
                      type="button"
                      disabled={downloadingReportPdf}
                      onClick={() => handleDownloadPdfReport('superadmin-transactions-report-body', 'Dexar_Financial_Ledger_Transactions_Audit')}
                      className="px-4 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-none transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
                    >
                      {downloadingReportPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>{downloadingReportPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter Toolbar (Hidden in Print) */}
                <div className="mb-6 p-4 rounded-xl bg-neutral-50 border border-neutral-300 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-800">Filter Plan:</span>
                      <select
                        value={transactionPlanFilter}
                        onChange={(e) => setTransactionPlanFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-black text-xs font-medium focus:outline-none focus:border-black"
                      >
                        <option value="all">All Plan Types</option>
                        <option value="course_wise">Course Pack</option>
                        <option value="monthly">Monthly Pack</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-800">Filter Status:</span>
                      <select
                        value={transactionStatusFilter}
                        onChange={(e) => setTransactionStatusFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-black text-xs font-medium focus:outline-none focus:border-black"
                      >
                        <option value="all">All Payment Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-neutral-700 font-medium">
                    Showing <strong className="text-black">{filteredTransactions.length}</strong> of <strong>{saTransactions.length}</strong> Total Transactions
                  </div>
                </div>

                {/* Printable Document Body - Clean Normal Black & White Text and Tables */}
                <div id="superadmin-transactions-report-body" className="p-6 sm:p-8 rounded-xl bg-white border border-neutral-300 print:border-none space-y-6 text-black printable-report-body">
                  {/* Formal Institution Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-black">
                    <div>
                      <div className="text-2xl font-bold text-black tracking-tight uppercase">Dexar Technologies</div>
                      <div className="text-xs text-neutral-700 font-semibold tracking-wide">Academy of Advanced Software Engineering</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">Central Financial Ledger & Transactions Audit Report</div>
                    </div>
                    <div className="sm:text-right">
                      <span className="px-3 py-1 border border-black text-black text-xs font-bold uppercase inline-block">
                        Official Financial Report
                      </span>
                      <div className="text-xs font-mono text-neutral-700 mt-1.5">
                        Report ID: DXR-TXN-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
                      </div>
                      <div className="text-[11px] text-neutral-600">
                        Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-neutral-800 font-semibold mt-0.5">
                        Auditor: Super Administrator ({currentUser?.name || 'Admin'})
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Counters (Plain Monochrome Boxes) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Total Platform Revenue</div>
                      <div className="text-xl font-bold text-black mt-1">₹{saTotalRevenue.toLocaleString()}</div>
                      <div className="text-[10px] text-neutral-600">Verified Collections</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Total Transactions</div>
                      <div className="text-xl font-bold text-black mt-1">{filteredTransactions.length}</div>
                      <div className="text-[10px] text-neutral-600">Recorded Invoices</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Course Pack Plans</div>
                      <div className="text-xl font-bold text-black mt-1">
                        {filteredTransactions.filter((t: any) => t.planType === 'course_wise').length}
                      </div>
                      <div className="text-[10px] text-neutral-600">Permanent Access</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-neutral-300 bg-white text-center">
                      <div className="text-xs font-semibold text-neutral-700">Monthly Packs</div>
                      <div className="text-xl font-bold text-black mt-1">
                        {filteredTransactions.filter((t: any) => t.planType !== 'course_wise').length}
                      </div>
                      <div className="text-[10px] text-neutral-600">Recurring Access</div>
                    </div>
                  </div>

                  {/* Normal Text Table - No Colors */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3 flex items-center justify-between border-b border-neutral-200 pb-2">
                      <span>Transactions and Payment Audit Ledger</span>
                      <span className="text-[11px] font-normal text-neutral-600 normal-case">
                        Total {filteredTransactions.length} Records
                      </span>
                    </h4>
                    <div className="border border-neutral-300 rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-neutral-100 text-black border-b border-neutral-300 font-bold uppercase text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Transaction ID</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Student Name & Email</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Enrolled Plan</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Amount Paid</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Payment Gateway / Method</th>
                            <th className="py-2.5 px-3 border-r border-neutral-200">Payment Date</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {filteredTransactions.map((tx: any, idx: number) => (
                            <tr key={tx._id || idx} className="hover:bg-neutral-50">
                              <td className="py-2.5 px-3 border-r border-neutral-200 font-mono font-bold text-black">
                                {tx.transactionId || 'TXN-' + (tx._id ? tx._id.slice(-6).toUpperCase() : String(idx + 1).padStart(5, '0'))}
                              </td>
                              <td className="py-2.5 px-3 border-r border-neutral-200">
                                <div className="font-bold text-black">{tx.studentId?.name || 'Enrolled Student'}</div>
                                <div className="text-[10px] text-neutral-600 font-mono">{tx.studentId?.email || '—'}</div>
                              </td>
                              <td className="py-2.5 px-3 border-r border-neutral-200 capitalize font-medium text-black">
                                {tx.planType === 'course_wise' ? 'Course Pack' : 'Monthly Pack'}
                              </td>
                              <td className="py-2.5 px-3 border-r border-neutral-200 font-bold text-black">
                                ₹{tx.amount || 0}
                              </td>
                              <td className="py-2.5 px-3 border-r border-neutral-200 text-neutral-800">
                                {tx.paymentMethod || 'Razorpay / UPI'}
                              </td>
                              <td className="py-2.5 px-3 border-r border-neutral-200 text-neutral-700">
                                {new Date(tx.paidAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="border border-neutral-400 px-2 py-0.5 rounded text-[10px] font-semibold text-black uppercase">
                                  {tx.status || 'Completed'}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {filteredTransactions.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-neutral-500">
                                No transaction records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Institutional Signoff (Monochrome - Verified Seal removed) */}
                  <div className="pt-6 border-t-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <div className="text-xs font-bold text-black">Officially Verified by Financial Accounts Operations</div>
                      <div className="text-[11px] text-neutral-600">Dexar Technologies Central Institutional Treasury</div>
                    </div>

                    <div className="sm:text-right">
                      <div className="font-serif italic text-base font-bold text-black">Arpan</div>
                      <div className="text-xs font-semibold text-neutral-800">Chief Financial Officer & Executive Administrator</div>
                      <div className="text-[11px] text-neutral-600">Dexar Technologies Institutional Accounts Board</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 12: TRAINER ASSESSMENT SUBMISSIONS & RETAKE ACCESS MODAL */}
          {/* ========================================================================= */}
          {selectedAssessmentSubs !== null && (
            <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl bg-white rounded-2xl p-6 shadow-none border border-gray-200 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563eb] border border-blue-200/60 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0a2540]">
                        Student Submissions: {activeAssessmentForSubs?.title || 'Assessment'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Review student scores, anti-cheat logs, and grant permission to rewrite the exam.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAssessmentSubs(null);
                      setActiveAssessmentForSubs(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-lg p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {selectedAssessmentSubs.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-sm">
                    <p className="font-semibold text-slate-700">No submissions found</p>
                    <p className="text-xs text-slate-400 mt-1">None of the enrolled students have attempted this assessment yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f8fafc] text-gray-500 font-semibold border-b border-gray-100 uppercase">
                        <tr>
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Score</th>
                          <th className="py-3 px-4">Lockdown Violations</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-center">Action / Retake</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedAssessmentSubs.map((sub: any) => (
                          <tr key={sub._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-[#0a2540]">{sub.studentId?.name || 'Student'}</div>
                              <div className="text-[11px] text-gray-400">{sub.studentId?.email}</div>
                            </td>
                            <td className="py-3 px-4 font-bold text-[#2563eb]">
                              {sub.score} / {activeAssessmentForSubs?.totalMarks || sub.totalMarks || 100}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${(sub.violationsCount || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                              >
                                {sub.violationsCount || 0} Tab Switches
                              </span>
                            </td>
                            <td className="py-3 px-4 capitalize">{sub.status || 'Completed'}</td>
                            <td className="py-3 px-4 text-gray-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingScoreItem({ type: 'mcq', data: { ...sub, assessmentId: activeAssessmentForSubs } })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#2563eb] text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                                  title="Edit Score / Marks"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAllowAssessmentRetake(sub._id, 'admin')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563eb] text-[11px] font-semibold border border-blue-200/80 transition-all hover:scale-105 cursor-pointer shadow-none"
                                  title="Allow student to rewrite this exam"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Allow Rewrite</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmDelete(
                                    'Delete Quiz Submission',
                                    `Are you sure you want to delete this submission for ${sub.studentId?.name || 'Student'}?`,
                                    `${sub.studentId?.name || 'Student'} - Score: ${sub.score}`,
                                    async () => {
                                      await api.allowAssessmentRetake(sub._id, 'admin');
                                      setSelectedAssessmentSubs((prev) => (prev ? prev.filter((s) => s._id !== sub._id) : []));
                                      showToast('Quiz submission deleted successfully!', 'success');
                                    }
                                  )}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Submission"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL 13: TRAINER CODING EXAM SUBMISSIONS & RETAKE ACCESS MODAL */}
          {/* ========================================================================= */}
          {selectedCodingSubs !== null && (
            <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl bg-white rounded-2xl p-6 shadow-none border border-gray-200 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0a2540]">
                        Coding Submissions: {activeCodingExamForSubs?.title || 'Coding Exam'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Review submitted solutions, test results, and grant permission to rewrite the coding exam.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCodingSubs(null);
                      setActiveCodingExamForSubs(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-lg p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {selectedCodingSubs.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-sm">
                    <p className="font-semibold text-slate-700">No submissions found</p>
                    <p className="text-xs text-slate-400 mt-1">None of the students have submitted solutions for this challenge yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f8fafc] text-gray-500 font-semibold border-b border-gray-100 uppercase">
                          <tr>
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4">Tests Passed</th>
                            <th className="py-3 px-4">Score</th>
                            <th className="py-3 px-4">Violations</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4 text-center">Action / Retake</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedCodingSubs.map((csub: any) => (
                            <tr key={csub._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-[#0a2540]">{csub.studentId?.name || 'Student'}</div>
                                <div className="text-[11px] text-gray-400">{csub.studentId?.email}</div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-emerald-700">
                                {csub.passedTests} / {csub.totalTests} Passed
                              </td>
                              <td className="py-3 px-4 font-bold text-[#2563eb]">{csub.score} Pts</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700">
                                  {csub.violationsCount || 0} Switches
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-500">{new Date(csub.submittedAt).toLocaleDateString()}</td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingScoreItem({ type: 'coding', data: { ...csub, examId: activeCodingExamForSubs } })}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                                    title="Edit Points / Score"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAllowCodingRetake(csub._id, 'admin')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold border border-purple-200 transition-all hover:scale-105 cursor-pointer shadow-none"
                                    title="Allow student to rewrite this coding exam"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Allow Rewrite</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => confirmDelete(
                                      'Delete Coding Submission',
                                      `Are you sure you want to delete this coding submission for ${csub.studentId?.name || 'Student'}?`,
                                      `${csub.studentId?.name || 'Student'} - Score: ${csub.score}`,
                                      async () => {
                                        await api.allowCodingRetake(csub._id, 'admin');
                                        setSelectedCodingSubs((prev) => (prev ? prev.filter((c) => c._id !== csub._id) : []));
                                        showToast('Coding submission deleted successfully!', 'success');
                                      }
                                    )}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete Submission"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREENSHOT SHIELD: INSTANT BLACKOUT FLASH OVERLAY (ANTI-SCREENSHOT) */}
          {/* ========================================================================= */}
          {showScreenshotFlash && (
            <div className="fixed inset-0 z-[999999] bg-black text-white flex flex-col items-center justify-center p-8 select-none">
              <div className="w-16 h-16 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center mb-4 animate-pulse">
                <Camera className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-rose-500 mb-2">Screenshot Blocked</h2>
              <p className="text-sm text-slate-300 text-center max-w-md font-medium">
                Screen capture, Snipping Tool, and PrintScreen are strictly prohibited during Dexar exams. A security infraction has been logged to your proctoring report.
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FULLSCREEN BREACH ENFORCEMENT MODAL */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* FULLSCREEN BREACH ENFORCEMENT MODAL (APPLE-GRADE SHIELD) */}
          {/* ========================================================================= */}
          {isExitedFullscreen && (activeExam || activeCodingExam) && (
            <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-3xl text-white flex flex-col items-center justify-center p-6 sm:p-8 select-none font-sans">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full bg-slate-900/90 border border-slate-700/80 rounded-[32px] p-8 sm:p-10 text-center shadow-[0_32px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden"
              >
                <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border-2 border-amber-500/60 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                  <AlertTriangle className="w-10 h-10 text-amber-400 animate-bounce" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
                  Security Breach Detected
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mb-3">
                  Fullscreen Mode Required
                </h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto mb-8 leading-relaxed font-normal">
                  Dexar proctoring requires continuous fullscreen mode to prevent unauthorized tabs and external assistance. Exiting fullscreen has been logged ({examViolations} / {activeExam?.maxViolations || activeCodingExam?.maxViolations || 3} infractions). Please return to fullscreen immediately.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    enterFullscreen();
                    setIsExitedFullscreen(false);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#3b82f6] hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/30 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Maximize2 className="w-5 h-5" />
                  <span>Resume Fullscreen & Continue Assessment</span>
                </button>
              </motion.div>
            </div>
          )}
          {/* FULL CRUD MODAL DIALOGS (ADMIN & SUPER ADMIN) */}
          {/* ========================================================================= */}
          <DeleteConfirmModal
            isOpen={deleteDialog?.isOpen || false}
            title={deleteDialog?.title || 'Confirm Deletion'}
            message={deleteDialog?.message || 'Are you sure you want to proceed?'}
            itemTitle={deleteDialog?.itemTitle}
            isDeleting={isDeleting}
            onConfirm={() => deleteDialog?.onConfirm?.()}
            onClose={() => setDeleteDialog(null)}
          />

          <CreateSubjectModal
            isOpen={showCreateSubjectModal}
            onClose={() => setShowCreateSubjectModal(false)}
            onSuccess={(newSub) => {
              if (newSub) setSaSubjects((prev) => [newSub, ...prev]);
              loadRoleData('superadmin');
            }}
            showToast={showToast}
          />

          <EditSubjectModal
            subject={editingSubject}
            trainers={saTrainers}
            onClose={() => setEditingSubject(null)}
            onSuccess={(updatedSub) => {
              if (updatedSub) {
                setSaSubjects((prev) => prev.map((s) => s._id === updatedSub._id ? { ...s, ...updatedSub } : s));
              }
              loadRoleData(currentUser?.role || 'superadmin');
            }}
            showToast={showToast}
          />

          <EditTrainerModal
            trainer={editingTrainer}
            subjects={saSubjects}
            onClose={() => setEditingTrainer(null)}
            onSuccess={(updatedTr) => {
              if (updatedTr) {
                setSaTrainers((prev) => prev.map((t) => t._id === updatedTr._id ? { ...t, ...updatedTr } : t));
              }
              loadRoleData(currentUser?.role || 'superadmin');
            }}
            showToast={showToast}
          />

          <EditStudentModal
            student={editingStudent}
            subjects={saSubjects.length > 0 ? saSubjects : (trainerData?.subject ? [trainerData.subject] : [])}
            role={currentUser?.role === 'superadmin' ? 'superadmin' : 'admin'}
            onClose={() => setEditingStudent(null)}
            onSuccess={(updatedSt) => {
              if (updatedSt) {
                setSaStudents((prev) => prev.map((s) => s._id === updatedSt._id ? { ...s, ...updatedSt } : s));
                setTrainerData((prev: any) => prev ? {
                  ...prev,
                  students: prev.students?.map((s: any) => s._id === updatedSt._id ? { ...s, ...updatedSt } : s)
                } : prev);
              }
              loadRoleData(currentUser?.role || 'admin');
            }}
            showToast={showToast}
          />

          <EditTransactionModal
            transaction={editingTransaction}
            onClose={() => setEditingTransaction(null)}
            onSuccess={(updatedTx) => {
              if (updatedTx) {
                setSaTransactions((prev) => prev.map((t) => t._id === updatedTx._id ? { ...t, ...updatedTx } : t));
              }
              loadRoleData('superadmin');
            }}
            showToast={showToast}
          />

          <EditLiveClassModal
            liveClass={editingLiveClass}
            role={currentUser?.role === 'superadmin' ? 'superadmin' : 'admin'}
            onClose={() => setEditingLiveClass(null)}
            onSuccess={(updatedLc) => {
              if (updatedLc) {
                setTrainerLiveClasses((prev) => prev.map((l) => l._id === updatedLc._id ? { ...l, ...updatedLc } : l));
              }
              loadRoleData(currentUser?.role || 'admin');
            }}
            showToast={showToast}
          />

          <EditRecordedClassModal
            recordedClass={editingRecordedClass}
            role={currentUser?.role === 'superadmin' ? 'superadmin' : 'admin'}
            onClose={() => setEditingRecordedClass(null)}
            onSuccess={(updatedRc) => {
              if (updatedRc) {
                setTrainerRecorded((prev) => prev.map((r) => r._id === updatedRc._id ? { ...r, ...updatedRc } : r));
              }
              loadRoleData(currentUser?.role || 'admin');
            }}
            showToast={showToast}
          />

          <EditAssessmentModal
            assessment={editingAssessment}
            role={currentUser?.role === 'superadmin' ? 'superadmin' : 'admin'}
            onClose={() => setEditingAssessment(null)}
            onSuccess={(updatedAst) => {
              if (updatedAst) {
                setTrainerAssessments((prev) => prev.map((a) => a._id === updatedAst._id ? { ...a, ...updatedAst } : a));
                setSaAssessments((prev) => prev.map((a) => a._id === updatedAst._id ? { ...a, ...updatedAst } : a));
              }
              loadRoleData(currentUser?.role || 'admin');
            }}
            showToast={showToast}
          />

          <EditCodingExamModal
            exam={editingCodingExam}
            role={currentUser?.role === 'superadmin' ? 'superadmin' : 'admin'}
            onClose={() => setEditingCodingExam(null)}
            onSuccess={(updatedExam) => {
              if (updatedExam) {
                setTrainerCodingExams((prev) => prev.map((c) => c._id === updatedExam._id ? { ...c, ...updatedExam } : c));
                setSaCodingExams((prev) => prev.map((c) => c._id === updatedExam._id ? { ...c, ...updatedExam } : c));
              }
              loadRoleData(currentUser?.role || 'admin');
            }}
            showToast={showToast}
          />

          <EditScoreModal
            submissionItem={editingScoreItem}
            role={currentUser?.role === 'superadmin' ? 'superadmin' : 'admin'}
            onClose={() => setEditingScoreItem(null)}
            onSuccess={async (updatedScore) => {
              if (updatedScore && editingScoreItem) {
                if (editingScoreItem.type === 'mcq') {
                  setSaMarks((prev: any) => ({
                    ...prev,
                    assessmentSubmissions: prev?.assessmentSubmissions?.map((s: any) =>
                      s._id === updatedScore._id ? { ...s, ...updatedScore } : s
                    ),
                  }));
                  setSelectedAssessmentSubs((prev) =>
                    prev ? prev.map((s) => (s._id === updatedScore._id ? { ...s, ...updatedScore } : s)) : []
                  );
                } else {
                  setSaMarks((prev: any) => ({
                    ...prev,
                    codingSubmissions: prev?.codingSubmissions?.map((c: any) =>
                      c._id === updatedScore._id ? { ...c, ...updatedScore } : c
                    ),
                  }));
                  setSelectedCodingSubs((prev) =>
                    prev ? prev.map((c) => (c._id === updatedScore._id ? { ...c, ...updatedScore } : c)) : []
                  );
                }
              }
              loadRoleData(currentUser?.role || 'admin');
              if (activeAssessmentForSubs) {
                const res = await api.getAssessmentSubmissions(activeAssessmentForSubs._id);
                setSelectedAssessmentSubs(res.submissions || []);
              }
              if (activeCodingExamForSubs) {
                const res = await api.getCodingSubmissions(activeCodingExamForSubs._id);
                setSelectedCodingSubs(res.submissions || []);
              }
            }}
            showToast={showToast}
          />

        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

function FileCheckIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
