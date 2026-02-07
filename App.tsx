import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, BookOpen, IndianRupee, Menu, X, Plus, Trash2, ChevronRight, FileText, CreditCard, Loader2 } from 'lucide-react';
import { SchoolClass, Student, Transaction, FeeItem, AppData } from './types';
import { INITIAL_DATA } from './constants';
import Dashboard from './components/Dashboard';
import ClassManager from './components/ClassManager';
import StudentManager from './components/StudentManager';
import StudentDetails from './components/StudentDetails';
import PaymentModal from './components/PaymentModal';
import PublicInvoiceView from './components/PublicInvoiceView';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'students'>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isGuestView, setIsGuestView] = useState(false);

  // Initialize and Setup Real-time Listeners
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('iv')) {
      setIsGuestView(true);
    }
    
    fetchAllData();

    // Setup Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Change received!', payload);
        fetchAllData(false); // Refetch without global loader for smoother experience
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [
        { data: classes, error: ce },
        { data: students, error: se },
        { data: transactions, error: te },
        { data: customFees, error: fe }
      ] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('students').select('*').order('name'),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
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
      if (showLoader) setLoading(false);
    }
  };

  const addClass = async (newClass: SchoolClass) => {
    const { error } = await supabase.from('classes').insert(newClass);
    if (error) console.error("Error adding class:", error);
    // Realtime listener handles UI update
  };

  const removeClass = async (id: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) console.error("Error removing class:", error);
    // Realtime listener handles UI update
  };

  const addStudent = async (student: Student) => {
    const studentWithHistory = {
      ...student,
      classHistory: student.classHistory || [{ classId: student.classId, startDate: student.admissionDate }]
    };
    const { error } = await supabase.from('students').insert(studentWithHistory);
    if (error) console.error("Error adding student:", error);
  };

  const updateStudent = async (updated: Student) => {
    const { error } = await supabase.from('students').update(updated).eq('id', updated.id);
    if (error) console.error("Error updating student:", error);
  };

  const removeStudent = async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) console.error("Error removing student:", error);
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
      const { error } = await supabase.from('students').update(s).eq('id', s.id);
      if (error) console.error(`Error promoting student ${s.name}:`, error);
    }
    
    alert(`Promotion process completed for ${studentIds.length} students.`);
  };

  const addTransaction = async (tx: Transaction) => {
    const { error } = await supabase.from('transactions').insert(tx);
    if (error) console.error("Error posting transaction:", error);
  };

  const addCustomFee = async (fee: FeeItem) => {
    const { error } = await supabase.from('custom_fees').insert(fee);
    if (error) console.error("Error adding custom fee:", error);
  };

  const bulkAddFee = async (classId: string, feeTemplate: Omit<FeeItem, 'id' | 'studentId'>) => {
    const studentsInClass = data.students.filter(s => s.classId === classId && s.isActive);
    const newFees: FeeItem[] = studentsInClass.map(student => ({
      ...feeTemplate,
      id: crypto.randomUUID(),
      studentId: student.id,
    }));
    
    const { error } = await supabase.from('custom_fees').insert(newFees);
    if (error) {
      console.error("Error applying bulk fee:", error);
      alert("Error applying fees. Please try again.");
    } else {
      alert(`Applied "${feeTemplate.title}" to ${newFees.length} students successfully.`);
    }
  };

  if (isGuestView) {
    return <PublicInvoiceView onExit={() => { window.location.href = window.location.origin + window.location.pathname; }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <p className="text-slate-500 font-bold animate-pulse text-lg">Syncing School Data...</p>
        <p className="text-slate-400 text-sm">EduFee Pro Real-time Database</p>
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
        <div className="absolute bottom-6 left-6 right-6">
           <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700/50 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Live Sync Connected</span>
           </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
          <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-sm text-slate-500 font-medium">Administrator Portal</div>
             <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100">A</div>
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