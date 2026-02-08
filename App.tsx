import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, BookOpen, Menu, Loader2, Lock, LogOut } from 'lucide-react';
import { SchoolClass, Student, Transaction, FeeItem, AppData } from './types.ts';
import { INITIAL_DATA } from './constants.tsx';
import Dashboard from './components/Dashboard.tsx';
import ClassManager from './components/ClassManager.tsx';
import StudentManager from './components/StudentManager.tsx';
import StudentDetails from './components/StudentDetails.tsx';
import PaymentModal from './components/PaymentModal.tsx';
import PublicInvoiceView from './components/PublicInvoiceView.tsx';
import { supabase } from './supabaseClient.ts';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'students'>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isGuestView, setIsGuestView] = useState(false);
  
  // Admin Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const initialize = async () => {
      const params = new URLSearchParams(window.location.search);
      // Parent View check - No login needed for public invoice
      if (params.has('iv')) {
        setIsGuestView(true);
        setLoading(false);
      } else {
        // Admin Auth check
        const savedAuth = localStorage.getItem('edufee_auth');
        if (savedAuth === 'true') {
          setIsAuthenticated(true);
          await fetchAllData();
        } else {
          setLoading(false);
        }
      }
    };
    initialize();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        { data: classes, error: ce },
        { data: students, error: se },
        { data: transactions, error: te },
        { data: customFees, error: fe }
      ] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('students').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('custom_fees').select('*')
      ]);

      if (ce || se || te || fe) throw new Error("Data fetch error");

      setData({
        classes: classes || [],
        students: students || [],
        transactions: transactions || [],
        customFees: customFees || []
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('edufee_auth', 'true');
      setLoginError('');
      fetchAllData();
    } else {
      setLoginError('Invalid credentials. (admin / admin123)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('edufee_auth');
    window.location.href = window.location.origin + window.location.pathname;
  };

  const addClass = async (newClass: SchoolClass) => {
    const { data: inserted, error } = await supabase.from('classes').insert(newClass).select().single();
    if (!error) setData(prev => ({ ...prev, classes: [...prev.classes, inserted] }));
  };

  const removeClass = async (id: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (!error) {
      setData(prev => ({
        ...prev,
        classes: prev.classes.filter(c => c.id !== id),
        students: prev.students.filter(s => s.classId !== id)
      }));
    }
  };

  const addStudent = async (student: Student) => {
    const studentWithHistory = {
      ...student,
      classHistory: student.classHistory || [{ classId: student.classId, startDate: student.admissionDate }]
    };
    const { data: inserted, error } = await supabase.from('students').insert(studentWithHistory).select().single();
    if (!error) setData(prev => ({ ...prev, students: [...prev.students, inserted] }));
  };

  const updateStudent = async (updated: Student) => {
    const { error } = await supabase.from('students').update(updated).eq('id', updated.id);
    if (!error) {
      setData(prev => ({
        ...prev,
        students: prev.students.map(s => s.id === updated.id ? updated : s)
      }));
    }
  };

  const removeStudent = async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (!error) {
      setData(prev => ({
        ...prev,
        students: prev.students.filter(s => s.id !== id),
        transactions: prev.transactions.filter(t => t.studentId !== id),
        customFees: prev.customFees.filter(f => f.studentId !== id)
      }));
    }
  };

  const promoteStudents = async (studentIds: string[], targetClassId: string) => {
    const now = new Date();
    const nextMonthStartDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    
    const updates = data.students
      .filter(s => studentIds.includes(s.id))
      .map(s => {
        const currentHistory = s.classHistory || [{ classId: s.classId, startDate: s.admissionDate }];
        return {
          ...s,
          classId: targetClassId,
          classHistory: [...currentHistory, { classId: targetClassId, startDate: nextMonthStartDate }]
        };
      });

    for (const s of updates) {
      await supabase.from('students').update(s).eq('id', s.id);
    }
    
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => {
        const up = updates.find(u => u.id === s.id);
        return up || s;
      })
    }));
    alert(`Successfully promoted ${studentIds.length} students.`);
  };

  const addTransaction = async (tx: Transaction) => {
    const { data: inserted, error } = await supabase.from('transactions').insert(tx).select().single();
    if (!error) setData(prev => ({ ...prev, transactions: [...prev.transactions, inserted] }));
  };

  const addCustomFee = async (fee: FeeItem) => {
    const { data: inserted, error } = await supabase.from('custom_fees').insert(fee).select().single();
    if (!error) setData(prev => ({ ...prev, customFees: [...prev.customFees, inserted] }));
  };

  const bulkAddFee = async (classId: string, feeTemplate: Omit<FeeItem, 'id' | 'studentId'>) => {
    const studentsInClass = data.students.filter(s => s.classId === classId && s.isActive);
    const newFees: FeeItem[] = studentsInClass.map(student => ({
      ...feeTemplate,
      id: crypto.randomUUID(),
      studentId: student.id,
    }));
    
    const { error } = await supabase.from('custom_fees').insert(newFees);
    if (!error) {
      setData(prev => ({
        ...prev,
        customFees: [...prev.customFees, ...newFees]
      }));
      alert(`Successfully applied to ${newFees.length} active students.`);
    }
  };

  // 1. Parent View (Public Invoice)
  if (isGuestView) {
    return <PublicInvoiceView onExit={() => { window.location.href = window.location.origin + window.location.pathname; }} />;
  }

  // 2. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading EduFee Pro...</p>
      </div>
    );
  }

  // 3. Admin Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-4 rounded-2xl mb-4 shadow-lg shadow-indigo-100">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin Portal</h1>
            <p className="text-slate-500 text-sm text-center">Login to manage school fees and students</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              required
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              placeholder="Username (admin)"
              value={loginForm.username}
              onChange={e => setLoginForm({...loginForm, username: e.target.value})}
            />
            <input
              type="password"
              required
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              placeholder="Password (admin123)"
              value={loginForm.password}
              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
            />
            {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Admin Dashboard
  const renderContent = () => {
    if (selectedStudentId) {
      const student = data.students.find(s => s.id === selectedStudentId);
      const schoolClass = data.classes.find(c => c.id === student?.classId);
      if (!student || !schoolClass) return null;
      return (
        <StudentDetails
          student={student}
          schoolClass={schoolClass}
          allClasses={data.classes}
          transactions={data.transactions.filter(t => t.studentId === student.id)}
          customFees={data.customFees.filter(f => f.studentId === student.id)}
          onBack={() => setSelectedStudentId(null)}
          onPay={() => setIsPaymentModalOpen(true)}
          onAddCustomFee={addCustomFee}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'classes':
        return (
          <ClassManager 
            classes={data.classes} 
            students={data.students}
            onAdd={addClass} 
            onRemove={removeClass} 
            onBulkAddFee={bulkAddFee}
            onPromote={promoteStudents}
            onAddStudent={addStudent}
            onUpdateStudent={updateStudent}
            onRemoveStudent={removeStudent}
            onViewStudent={(id) => setSelectedStudentId(id)}
          />
        );
      case 'students':
        return (
          <StudentManager
            classes={data.classes}
            students={data.students}
            onAdd={addStudent}
            onUpdate={updateStudent}
            onRemove={removeStudent}
            onViewDetails={(id) => setSelectedStudentId(id)}
          />
        );
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-indigo-900 text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:inset-0`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-white p-2 rounded-xl"><BookOpen className="w-6 h-6 text-indigo-900" /></div>
            <h1 className="text-xl font-bold tracking-tight">EduFee Pro</h1>
          </div>
          <nav className="space-y-2 flex-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setSelectedStudentId(null); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-800' : 'text-indigo-200 hover:bg-indigo-800'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => { setActiveTab('classes'); setSelectedStudentId(null); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'classes' ? 'bg-indigo-800' : 'text-indigo-200 hover:bg-indigo-800'}`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Classes</span>
            </button>
            <button
              onClick={() => { setActiveTab('students'); setSelectedStudentId(null); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'students' ? 'bg-indigo-800' : 'text-indigo-200 hover:bg-indigo-800'}`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Students</span>
            </button>
          </nav>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-200 hover:bg-red-500/20 hover:text-red-200 transition-colors mt-auto"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
          <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-[10px] text-slate-500 font-bold uppercase tracking-widest">Admin Portal</div>
             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">A</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">{renderContent()}</div>
        {isPaymentModalOpen && selectedStudentId && (
          <PaymentModal
            student={data.students.find(s => s.id === selectedStudentId)!}
            schoolClass={data.classes.find(c => c.id === data.students.find(s => s.id === selectedStudentId)?.classId)!}
            allClasses={data.classes}
            transactions={data.transactions.filter(t => t.studentId === selectedStudentId)}
            customFees={data.customFees.filter(f => f.studentId === selectedStudentId)}
            onClose={() => setIsPaymentModalOpen(false)}
            onPaymentSubmit={addTransaction}
          />
        )}
      </main>
    </div>
  );
};

export default App;