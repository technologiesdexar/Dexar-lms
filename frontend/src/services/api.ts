// Dynamic API Base URL Resolver:
// 1. Explicit NEXT_PUBLIC_API_URL (if configured in Vercel or .env)
// 2. Client-side browser in production (dexartechnologies.in): uses same-origin relative '/api' rewrite
// 3. Server-side (SSR / API routes / Vercel build): uses API_URL or Render backend URL
// 4. Local development (localhost / 127.0.0.1): uses 'http://localhost:5000/api'
export const getApiBase = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // When running in client browser
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '/api';
    }
    return 'http://localhost:5000/api';
  }

  // Server-side (SSR / Server Components / Next.js Rewrites)
  if (process.env.API_URL) {
    let clean = process.env.API_URL.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'https://dexar-7v5o.onrender.com/api';
  }

  return 'http://localhost:5000/api';
};

export const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dexar_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Client-side in-memory fast cache (15-second TTL) for instant tab switching & protecting backend
const clientCache = new Map<string, { data: any; timestamp: number }>();
const CLIENT_CACHE_TTL = 15 * 1000;

export const clearClientCache = () => {
  clientCache.clear();
};

// Robust unified request helper with dynamic URL evaluation, Render cold-start auto-retry, and smart caching
const request = async (endpoint: string, options: RequestInit = {}, retries = 2) => {
  const base = getApiBase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${base}${cleanEndpoint}`;

  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  // Invalidate client cache on mutations
  if (!isGet) {
    clientCache.clear();
  } else {
    // Check client cache for instant responses
    const cached = clientCache.get(url);
    if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL) {
      return cached.data;
    }
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = !options.signal ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 18000) : null;
    const fetchOptions: RequestInit = {
      ...options,
      signal: options.signal || controller?.signal,
    };

    try {
      const res = await fetch(url, fetchOptions);
      if (timeoutId) clearTimeout(timeoutId);

      // Render Free Tier sleep recovery: retry on 502, 503, 504 gateway spin-up errors
      if ([502, 503, 504].includes(res.status) && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        continue;
      }

      const contentType = res.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = {
            ok: res.ok,
            status: res.status,
            message: text || `Server responded with status ${res.status}`,
          };
        }
      }

      // Save to client cache if successful GET
      if (isGet && res.ok && data) {
        clientCache.set(url, { data, timestamp: Date.now() });
      }

      return data;
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);

      // If server is waking up or network blip, retry with progressive delay
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        continue;
      }
      console.error(`[Dexar API] Request failed for ${url}:`, err);
      throw err;
    }
  }
};

export const api = {
  // Auth
  login: async (credentials: any) => {
    return request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  },
  signup: async (data: any) => {
    return request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  forgotPassword: async (data: { email: string; frontendUrl?: string }) => {
    return request('/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  verifyResetToken: async (token: string, email: string) => {
    return request(`/auth/verify-reset-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
  },
  resetPassword: async (data: { token: string; email: string; password: string }) => {
    return request('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  firstTimeSetPassword: async (data: { email: string; password: string }) => {
    return request('/auth/first-time-set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  getMe: async () => {
    return request('/auth/me', {
      headers: getHeaders(),
    });
  },

  // =========================================================================
  // SuperAdmin CRUD
  // =========================================================================
  getSuperAdminStats: async () => {
    return request('/superadmin/dashboard', { headers: getHeaders() });
  },

  // Subjects
  getSubjects: async () => {
    return request('/superadmin/subjects', { headers: getHeaders() });
  },
  createSubject: async (data: any) => {
    return request('/superadmin/subjects', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  updateSubject: async (id: string, data: any) => {
    return request(`/superadmin/subjects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteSubject: async (id: string) => {
    return request(`/superadmin/subjects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  // Trainers (Admins)
  getTrainers: async () => {
    return request('/superadmin/trainers', { headers: getHeaders() });
  },
  createTrainer: async (data: any) => {
    return request('/superadmin/trainers', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  updateTrainer: async (id: string, data: any) => {
    return request(`/superadmin/trainers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteTrainer: async (id: string) => {
    return request(`/superadmin/trainers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  // Students (SuperAdmin & Admin)
  getStudents: async () => {
    return request('/superadmin/students', { headers: getHeaders() });
  },
  createStudent: async (data: any) => {
    return request('/superadmin/students', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  updateStudent: async (id: string, data: any, role: string = 'superadmin') => {
    const endpoint = role === 'admin' ? 'admin' : 'superadmin';
    return request(`/${endpoint}/students/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteStudent: async (id: string, role: string = 'superadmin') => {
    const endpoint = role === 'admin' ? 'admin' : 'superadmin';
    return request(`/${endpoint}/students/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },
  superAdminRequestPayment: async (id: string) => {
    return request(`/superadmin/students/${id}/request-payment`, {
      method: 'PUT',
      headers: getHeaders(),
    });
  },
  superAdminGrantAccess: async (id: string) => {
    return request(`/superadmin/students/${id}/grant-access`, {
      method: 'PUT',
      headers: getHeaders(),
    });
  },

  // Transactions
  getTransactions: async () => {
    return request('/superadmin/transactions', { headers: getHeaders() });
  },
  updateTransaction: async (id: string, data: any) => {
    return request(`/superadmin/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteTransaction: async (id: string) => {
    return request(`/superadmin/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  // Platform Marks & Exam Oversight
  getAllMarks: async () => {
    return request('/superadmin/marks', { headers: getHeaders() });
  },

  // SuperAdmin Direct Assessments
  getSuperAdminAssessments: async () => {
    return request('/superadmin/assessments', { headers: getHeaders() });
  },
  superAdminCreateAssessment: async (data: any) => {
    return request('/superadmin/assessments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  superAdminUpdateAssessment: async (id: string, data: any) => {
    return request(`/superadmin/assessments/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  superAdminDeleteAssessment: async (id: string) => {
    return request(`/superadmin/assessments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  // SuperAdmin Direct Coding Exams
  getSuperAdminCodingExams: async () => {
    return request('/superadmin/coding-exams', { headers: getHeaders() });
  },
  superAdminCreateCodingExam: async (data: any) => {
    return request('/superadmin/coding-exams', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  superAdminUpdateCodingExam: async (id: string, data: any) => {
    return request(`/superadmin/coding-exams/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  superAdminDeleteCodingExam: async (id: string) => {
    return request(`/superadmin/coding-exams/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  // =========================================================================
  // Trainer / Admin CRUD
  // =========================================================================
  getTrainerDashboard: async () => {
    return request('/admin/dashboard', { headers: getHeaders() });
  },

  // Live Classes
  addLiveClass: async (data: any) => {
    return request('/admin/live-classes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  getTrainerLiveClasses: async () => {
    return request('/admin/live-classes', { headers: getHeaders() });
  },
  updateLiveClass: async (id: string, data: any, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/live-classes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteLiveClass: async (id: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/live-classes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  // Recorded Classes
  addRecordedClass: async (data: any) => {
    return request('/admin/recorded-classes', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  getTrainerRecordedClasses: async () => {
    return request('/admin/recorded-classes', { headers: getHeaders() });
  },
  updateRecordedClass: async (id: string, data: any, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/recorded-classes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteRecordedClass: async (id: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/recorded-classes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  // Word Document Docx Parser
  analyzeDocx: async (data: { base64Docx?: string; rawText?: string }) => {
    return request('/admin/analyze-docx', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Assessments
  addAssessment: async (data: any) => {
    return request('/admin/assessments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  getTrainerAssessments: async () => {
    return request('/admin/assessments', { headers: getHeaders() });
  },
  updateAssessment: async (id: string, data: any, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/assessments/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteAssessment: async (id: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/assessments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },
  getAssessmentSubmissions: async (id: string) => {
    return request(`/admin/assessments/${id}/submissions`, { headers: getHeaders() });
  },
  updateAssessmentSubmission: async (id: string, data: any, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/assessments/submissions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Coding Exams
  addCodingExam: async (data: any) => {
    return request('/admin/coding-exams', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  getTrainerCodingExams: async () => {
    return request('/admin/coding-exams', { headers: getHeaders() });
  },
  updateCodingExam: async (id: string, data: any, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/coding-exams/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  deleteCodingExam: async (id: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/coding-exams/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },
  getCodingSubmissions: async (id: string) => {
    return request(`/admin/coding-exams/${id}/submissions`, { headers: getHeaders() });
  },
  updateCodingSubmission: async (id: string, data: any, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/coding-exams/submissions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  getAdminMarks: async () => {
    return request('/admin/marks', { headers: getHeaders() });
  },

  // =========================================================================
  // Student
  // =========================================================================
  getStudentDashboard: async () => {
    return request('/student/dashboard', { headers: getHeaders() });
  },
  processPayment: async (data: any) => {
    return request('/student/pay', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  createRazorpayOrder: async (data: { planType?: string; amount?: number }) => {
    return request('/student/razorpay/create-order', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  verifyRazorpayPayment: async (data: any) => {
    return request('/student/razorpay/verify-payment', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  requestAdminAccess: async (data: { note?: string } = {}) => {
    return request('/student/request-admin-access', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },
  getStudentLiveClasses: async (subjectId?: string) => {
    const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    return request(`/student/live-classes${qs}`, { headers: getHeaders() });
  },
  getStudentRecordedClasses: async (subjectId?: string) => {
    const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    return request(`/student/recorded-classes${qs}`, { headers: getHeaders() });
  },
  getStudentAssessments: async (subjectId?: string) => {
    const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    return request(`/student/assessments${qs}`, { headers: getHeaders() });
  },
  submitAssessment: async (id: string, answers: number[], violationsCount: number = 0, status: string = 'completed') => {
    return request(`/student/assessments/${id}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answers, violationsCount, status }),
    });
  },
  getStudentCodingExams: async (subjectId?: string) => {
    const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    return request(`/student/coding-exams${qs}`, { headers: getHeaders() });
  },
  runCodingTest: async (code: string, testCases: any[], language: string = 'javascript') => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await request('/student/coding-exams/run-test', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code, testCases, language }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  },
  submitCodingExam: async (
    id: string,
    code: string,
    language: string = 'javascript',
    violationsCount: number = 0,
    status: string = 'completed',
    questionSubmissions?: any[]
  ) => {
    return request(`/student/coding-exams/${id}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, language, violationsCount, status, questionSubmissions }),
    });
  },
  getStudentMarks: async () => {
    return request('/student/marks', { headers: getHeaders() });
  },

  // Reset Submissions / Allow Exam Rewrite (For Admin Trainers and Super Admin)
  allowAssessmentRetake: async (submissionId: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/assessments/submissions/${submissionId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },
  allowCodingRetake: async (submissionId: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/coding-exams/submissions/${submissionId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },
  allowAssessmentRetakeByStudent: async (assessmentId: string, studentId: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/assessments/allow-retake`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assessmentId, studentId }),
    });
  },
  allowCodingRetakeByStudent: async (examId: string, studentId: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/coding-exams/allow-retake`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ examId, studentId }),
    });
  },

  // =========================================================================
  // Doubts Chat & Student Q&A (Admin, SuperAdmin & Student)
  // =========================================================================
  getDoubts: async (role: string = 'admin', params: { subjectId?: string; status?: string; search?: string } = {}) => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    const query = new URLSearchParams();
    if (params.subjectId) query.set('subjectId', params.subjectId);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/${endpoint}/doubts${qs}`, { headers: getHeaders() });
  },

  replyDoubt: async (id: string, message: string, role: string = 'admin', status?: string) => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/doubts/${id}/reply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, status }),
    });
  },

  updateDoubtStatus: async (id: string, status: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/doubts/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  deleteDoubt: async (id: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/doubts/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  getStudentDoubts: async (subjectId?: string) => {
    const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    return request(`/student/doubts${qs}`, { headers: getHeaders() });
  },

  postStudentDoubt: async (data: { title: string; description?: string; subjectId?: string; subjectName?: string }) => {
    return request('/student/doubts', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  replyStudentDoubt: async (id: string, message: string) => {
    return request(`/student/doubts/${id}/reply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    });
  },

  // =========================================================================
  // Course Materials (Google Drive PDF / DOC)
  // =========================================================================
  getCourseMaterials: async (role: string = 'admin', subjectId?: string) => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    return request(`/${endpoint}/course-materials${qs}`, { headers: getHeaders() });
  },

  addCourseMaterial: async (data: any, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/course-materials`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  updateCourseMaterial: async (id: string, data: any, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/course-materials/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  deleteCourseMaterial: async (id: string, role: string = 'admin') => {
    const endpoint = role === 'superadmin' ? 'superadmin' : 'admin';
    return request(`/${endpoint}/course-materials/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  getStudentCourseMaterials: async (subjectId?: string) => {
    const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    return request(`/student/course-materials${qs}`, { headers: getHeaders() });
  },
};
