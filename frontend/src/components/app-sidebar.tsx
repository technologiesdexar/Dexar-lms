'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Video,
  Play,
  ShieldAlert,
  Code2,
  Award,
  CreditCard,
  UploadCloud,
  Users,
  FileCheck,
  LogOut,
  LayoutDashboard,
  User,
  MessageSquare,
  BookOpen,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';

export interface NavItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role: 'student' | 'admin' | 'superadmin';
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  currentUser: {
    name?: string;
    email?: string;
    role?: string;
  };
  onLogout?: () => void;
  enrolledCourses?: any[];
  selectedCourseId?: string | null;
  onSelectCourse?: (courseId: string) => void;
}

export function AppSidebar({
  role = 'student',
  activeTab = 'dashboard',
  onSelectTab,
  currentUser = { name: 'Student User', email: 'student@dexar.com', role: 'student' },
  onLogout,
  enrolledCourses = [],
  selectedCourseId = null,
  onSelectCourse,
  ...props
}: AppSidebarProps) {
  // Navigation items based on role
  const navItems: NavItem[] = React.useMemo(() => {
    if (role === 'superadmin') {
      return [
        { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
        { id: 'overview', title: 'Trainers & Admin', icon: Users },
        { id: 'subjects', title: 'Curriculum Subjects', icon: BookOpen },
        { id: 'students', title: 'Enrolled Students', icon: GraduationCap },
        { id: 'transactions', title: 'Transactions', icon: CreditCard },
        { id: 'marks', title: 'Student Marks', icon: Award },
        { id: 'assessments', title: 'Assessments', icon: FileCheck },
        { id: 'doubts', title: 'Doubts Chat', icon: MessageSquare },
        { id: 'materials', title: 'Course Materials', icon: BookOpen },
      ];
    }

    if (role === 'admin') {
      return [
        { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
        { id: 'overview', title: 'Online Exams', icon: UploadCloud },
        { id: 'coding', title: 'Coding Exam', icon: Code2 },
        { id: 'marks', title: 'Student Marks', icon: Award },
        { id: 'live', title: 'Live Classes', icon: Video },
        { id: 'recorded', title: 'Recorded Classes', icon: Play },
        { id: 'students', title: 'Enrolled Students', icon: Users },
        { id: 'doubts', title: 'Doubts Chat', icon: MessageSquare },
        { id: 'materials', title: 'Course Materials', icon: BookOpen },
      ];
    }

    // Student modules (Dashboard, Recorded Classes, Mcq Exams, Coding Exam, Doubts Chat, Course Materials, Profile)
    return [
      { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
      { id: 'recorded', title: 'Recorded Classes', icon: Play },
      { id: 'assessments', title: 'MCQ Exams', icon: FileCheck },
      { id: 'coding', title: 'Coding Exam', icon: Code2 },
      { id: 'doubts', title: 'Doubts Chat', icon: MessageSquare },
      { id: 'materials', title: 'Course Materials', icon: BookOpen },
      { id: 'profile', title: 'Profile', icon: User },
    ];
  }, [role]);

  return (
    <Sidebar variant="floating" collapsible="icon" className="shadow-none border-none ring-0 bg-transparent" {...props}>
      {/* 1. Sidebar Header with Clean Logo */}
      <SidebarHeader className="p-4 bg-white border-b border-slate-100/70">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/dexar-logo-clean.png"
                alt="Dexar Technologies"
                width={145}
                height={38}
                priority
                className="h-8 w-auto object-contain"
              />
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 2. Sidebar Navigation Items */}
      <SidebarContent className="px-2 py-3 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-white">

        {/* Student Multi-Course Tab Selector in Sidebar */}
        {role === 'student' && enrolledCourses && enrolledCourses.length > 1 && (
          <SidebarGroup className="pb-2.5 mb-2 border-b border-slate-100">
            <div className="flex items-center justify-between px-2 mb-2">
              <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500 p-0 h-auto">
                Switch Course Track
              </SidebarGroupLabel>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563eb] border border-blue-100">
                {enrolledCourses.length} Courses
              </span>
            </div>
            <SidebarGroupContent>
              <div className="space-y-1">
                {enrolledCourses.map((c: any, idx: number) => {
                  const cId = (c._id || c).toString();
                  const isCurrent =
                    selectedCourseId === cId ||
                    (!selectedCourseId && idx === 0);
                  const title = c.title || `Course ${cId.slice(-4)}`;
                  const code = c.code || `CRS-${idx + 1}`;

                  return (
                    <button
                      key={cId}
                      type="button"
                      onClick={() => onSelectCourse && onSelectCourse(cId)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#0a2540] to-[#1e3a8a] text-white border-transparent shadow-xs'
                          : 'bg-slate-50/80 border-slate-200/70 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-white/20 text-white'
                              : 'bg-white text-slate-500 border border-slate-200/80'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-xs truncate font-semibold leading-tight ${
                              isCurrent ? 'text-white' : 'text-[#0a2540]'
                            }`}
                          >
                            {title}
                          </div>
                          <div
                            className={`text-[10px] font-mono leading-tight ${
                              isCurrent ? 'text-blue-200' : 'text-slate-400'
                            }`}
                          >
                            {code}
                          </div>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1">
            Dashboard Modules
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id || (item.id === 'dashboard' && (activeTab === 'dashboard' || activeTab === 'overview'));
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isSelected}
                      onClick={() => onSelectTab && onSelectTab(item.id)}
                      className={`w-full justify-between px-3 rounded-xl transition-all cursor-pointer font-medium text-xs sm:text-sm select-none ${
                        isSelected
                          ? '!bg-[#eff6ff] !text-[#2563eb] shadow-none hover:!bg-[#dbeafe] active:!bg-[#dbeafe] focus:!bg-[#eff6ff] font-semibold !h-11 py-2.5'
                          : 'text-slate-600 hover:text-[#0a2540] hover:!bg-slate-50 active:!bg-slate-100 focus:!bg-slate-50 !h-10 py-2'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? '!text-[#2563eb]' : 'text-slate-500 group-hover:text-slate-700'}`} />
                        <span className="truncate">{item.title}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isSelected
                            ? 'bg-blue-100 text-[#2563eb]'
                            : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 4. Sidebar Footer with User Profile and Logout */}
      <SidebarFooter className="p-3 bg-white border-t border-slate-100/70">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 shadow-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white text-[#2563eb] font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                  {currentUser.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#0a2540] truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
