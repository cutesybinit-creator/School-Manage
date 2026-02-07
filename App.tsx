import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, BookOpen, Menu, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('iv')) {
      setIsGuestView(true);
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        { data: classes },
        { data: students },
        { data: transactions },
        { data: customFees }
      ] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('students').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('custom_fees').select('*')
      ]);

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

  if (isGuestView) {
    return <PublicInvoiceView onExit={() => { window.location.href = window.location.origin + window.location.pathname; }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Connecting to Supabase...</p>
      </div>
    );
  }

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
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-white p-2 rounded-xl"><BookOpen className="w-6 h-6 text-indigo-900" /></div>
            <h1 className="text-xl font-bold tracking-tight">EduFee Pro</h1>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'classes', label: 'Classes', icon: BookOpen },
              { id: 'students', label: 'Students', icon: Users },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); setSelectedStudentId(null); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id && !selectedStudentId ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
          <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-sm text-slate-500 font-medium">Welcome, Admin</div>
             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">A</div>
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