
import React, { useState } from 'react';
import { Plus, Trash2, GraduationCap, ArrowLeft, Users, AlertCircle, CheckCircle2, IndianRupee, ArrowUpCircle, X, Eye, Edit2, UserCheck, UserX, ShieldCheck, UserPlus, Calendar } from 'lucide-react';
import { SchoolClass, Student, FeeItem } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  classes: SchoolClass[];
  students: Student[];
  onAdd: (c: SchoolClass) => void;
  onRemove: (id: string) => void;
  onBulkAddFee: (classId: string, feeTemplate: Omit<FeeItem, 'id' | 'studentId'>) => void;
  onPromote: (studentIds: string[], targetClassId: string) => void;
  onAddStudent: (s: Student) => void;
  onUpdateStudent: (s: Student) => void;
  onRemoveStudent: (id: string) => void;
  onViewStudent: (id: string) => void;
}

const ClassManager: React.FC<Props> = ({ 
  classes, students, onAdd, onRemove, onBulkAddFee, onPromote, 
  onAddStudent, onUpdateStudent, onRemoveStudent, onViewStudent 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');

  // Bulk Fee Form State
  const [bulkFeeTitle, setBulkFeeTitle] = useState('');
  const [bulkFeeAmount, setBulkFeeAmount] = useState('');
  const [bulkFeeType, setBulkFeeType] = useState<FeeItem['type']>('exam');

  // Multi-select & Promotion State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPromoting, setIsPromoting] = useState(false);
  const [targetClassId, setTargetClassId] = useState('');

  // Student Admission State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentFormData, setStudentFormData] = useState({
    name: '', rollNo: '', fatherName: '', contact: '', address: '', identityNo: '', dob: '', transportFee: '', admissionDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !fee) return;
    onAdd({
      id: crypto.randomUUID(),
      name,
      monthlyFee: parseFloat(fee)
    });
    setName('');
    setFee('');
    setIsAdding(false);
  };

  const handleBulkApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !bulkFeeTitle || !bulkFeeAmount) return;
    
    onBulkAddFee(selectedClassId, {
      title: bulkFeeTitle,
      amount: parseFloat(bulkFeeAmount),
      type: bulkFeeType,
      monthYear: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0]
    });

    setBulkFeeTitle('');
    setBulkFeeAmount('');
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (classStudents: Student[]) => {
    if (selectedStudentIds.length === classStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(classStudents.map(s => s.id));
    }
  };

  const handlePromotionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClassId || selectedStudentIds.length === 0) return;
    onPromote(selectedStudentIds, targetClassId);
    setSelectedStudentIds([]);
    setIsPromoting(false);
    setTargetClassId('');
  };

  const openStudentAdmission = (classId: string, classStudents: Student[]) => {
    // Auto Roll Number Calculation
    const maxRoll = classStudents.reduce((max, s) => {
      const num = parseInt(s.rollNo);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    
    setEditingStudent(null);
    setStudentFormData({
      name: '',
      rollNo: (maxRoll + 1).toString(),
      fatherName: '',
      contact: '',
      address: '',
      identityNo: '',
      dob: '',
      transportFee: '',
      admissionDate: new Date().toISOString().split('T')[0]
    });
    setIsAddingStudent(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentFormData({
      name: student.name,
      rollNo: student.rollNo,
      fatherName: student.fatherName,
      contact: student.contact,
      address: student.address,
      identityNo: student.identityNo || '',
      dob: student.dob || '',
      transportFee: student.transportFee?.toString() || '',
      admissionDate: student.admissionDate.split('T')[0]
    });
    setIsAddingStudent(true);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;

    const sData: Student = {
      id: editingStudent ? editingStudent.id : crypto.randomUUID(),
      classId: selectedClassId,
      name: studentFormData.name,
      rollNo: studentFormData.rollNo,
      fatherName: studentFormData.fatherName,
      contact: studentFormData.contact,
      address: studentFormData.address,
      identityNo: studentFormData.identityNo,
      dob: studentFormData.dob,
      transportFee: parseFloat(studentFormData.transportFee) || 0,
      admissionDate: studentFormData.admissionDate,
      isActive: editingStudent ? editingStudent.isActive : true,
      classHistory: editingStudent?.classHistory
    };

    if (editingStudent) {
      onUpdateStudent(sData);
    } else {
      onAddStudent(sData);
    }
    setIsAddingStudent(false);
  };

  if (selectedClassId) {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    const classStudents = students.filter(s => s.classId === selectedClassId);
    
    if (!selectedClass) {
      setSelectedClassId(null);
      return null;
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 relative">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              setSelectedClassId(null);
              setSelectedStudentIds([]);
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Classes
          </button>
          <button
            onClick={() => openStudentAdmission(selectedClassId, classStudents)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md font-bold text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Enroll New Student
          </button>
        </div>

        {isAddingStudent && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm" onClick={() => setIsAddingStudent(false)}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
               <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <UserCheck className="w-5 h-5" /> {editingStudent ? 'Edit' : 'Enroll'} Student - {selectedClass.name}
                  </h3>
                  <button onClick={() => setIsAddingStudent(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
               </div>
               <form onSubmit={handleStudentSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                      <input required className="w-full px-4 py-2 rounded-xl border border-slate-200" value={studentFormData.name} onChange={e => setStudentFormData({...studentFormData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Roll Number</label>
                      <input required className="w-full px-4 py-2 rounded-xl border border-slate-200" value={studentFormData.rollNo} onChange={e => setStudentFormData({...studentFormData, rollNo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Father's Name</label>
                      <input className="w-full px-4 py-2 rounded-xl border border-slate-200" value={studentFormData.fatherName} onChange={e => setStudentFormData({...studentFormData, fatherName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact No.</label>
                      <input className="w-full px-4 py-2 rounded-xl border border-slate-200" value={studentFormData.contact} onChange={e => setStudentFormData({...studentFormData, contact: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aadhar / ID No.</label>
                      <input className="w-full px-4 py-2 rounded-xl border border-slate-200" value={studentFormData.identityNo} placeholder="12-digit Aadhar" onChange={e => setStudentFormData({...studentFormData, identityNo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date of Birth</label>
                      <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={studentFormData.dob} onChange={e => setStudentFormData({...studentFormData, dob: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transport Fee</label>
                      <input type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={studentFormData.transportFee} onChange={e => setStudentFormData({...studentFormData, transportFee: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Admission Date</label>
                      <input type="date" required className="w-full px-4 py-2 rounded-xl border border-slate-200" value={studentFormData.admissionDate} onChange={e => setStudentFormData({...studentFormData, admissionDate: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Address</label>
                    <input className="w-full px-4 py-2 rounded-xl border border-slate-200" value={studentFormData.address} onChange={e => setStudentFormData({...studentFormData, address: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all mt-4">
                    {editingStudent ? 'Update Details' : 'Register Now'}
                  </button>
               </form>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 w-full space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <GraduationCap className="w-8 h-8" />
                   </div>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800">{selectedClass.name}</h2>
                     <p className="text-slate-500">Universal Monthly Fee: <span className="font-bold text-indigo-600">{formatCurrency(selectedClass.monthlyFee)}</span></p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 font-medium">Total Enrollment</p>
                  <p className="text-2xl font-bold text-slate-800">{classStudents.length} Students</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
               <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Class Student List</h3>
                  </div>
                  {selectedStudentIds.length > 0 && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                       <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                          {selectedStudentIds.length} Selected
                       </span>
                       <button 
                        onClick={() => setIsPromoting(true)}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                       >
                         <ArrowUpCircle className="w-4 h-4" /> Promote
                       </button>
                    </div>
                  )}
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-indigo-600"
                            checked={classStudents.length > 0 && selectedStudentIds.length === classStudents.length}
                            onChange={() => handleSelectAll(classStudents)}
                          />
                        </th>
                        <th className="px-4 py-3">Roll No</th>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Identity / ID</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classStudents.map(student => (
                        <tr key={student.id} className={`hover:bg-slate-50/50 transition-colors ${selectedStudentIds.includes(student.id) ? 'bg-indigo-50/30' : ''}`}>
                          <td className="px-4 py-4">
                             <input 
                               type="checkbox" 
                               className="rounded border-slate-300 text-indigo-600"
                               checked={selectedStudentIds.includes(student.id)}
                               onChange={() => toggleStudentSelection(student.id)}
                             />
                          </td>
                          <td className="px-4 py-4 font-bold text-slate-600 text-sm">#{student.rollNo}</td>
                          <td className="px-4 py-4 font-semibold text-slate-800">
                            <div>
                              {student.name}
                              <p className="text-[10px] text-slate-400 font-medium">Contact: {student.contact || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-slate-500">
                            <div className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-slate-300" />
                              {student.identityNo || '---'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <button 
                              onClick={() => onUpdateStudent({...student, isActive: !student.isActive})}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                student.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {student.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-right">
                             <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => onViewStudent(student.id)}
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleOpenEditStudent(student)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => onRemoveStudent(student.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                      {classStudents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                             No students enrolled in this class yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

          <aside className="w-full md:w-80 space-y-6">
            <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-lg">
               <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-bold">Bulk Fee Application</h3>
               </div>
               <p className="text-xs text-slate-500 mb-6">Apply a one-time fee to all active students in this class with one click.</p>
               
               <form onSubmit={handleBulkApply} className="space-y-4">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fee Title</label>
                   <input required placeholder="e.g. Annual Exam Fee" className="w-full px-3 py-2 rounded-lg border border-slate-200" value={bulkFeeTitle} onChange={e => setBulkFeeTitle(e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount (INR)</label>
                   <input required type="number" placeholder="500" className="w-full px-3 py-2 rounded-lg border border-slate-200" value={bulkFeeAmount} onChange={e => setBulkFeeAmount(e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</label>
                   <select className="w-full px-3 py-2 rounded-lg border border-slate-200" value={bulkFeeType} onChange={e => setBulkFeeType(e.target.value as any)}>
                     <option value="exam">Exam Fee</option>
                     <option value="event">Function / Event</option>
                     <option value="other">Other Extra Fee</option>
                   </select>
                 </div>
                 <button type="submit" disabled={classStudents.length === 0} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                   <CheckCircle2 className="w-4 h-4" />
                   Apply Universally
                 </button>
               </form>
            </div>
          </aside>
        </div>

        {/* Promotion Modal */}
        {isPromoting && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm" onClick={() => setIsPromoting(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
               <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5" /> Promote Students
                  </h3>
                  <button onClick={() => setIsPromoting(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
               </div>
               <form onSubmit={handlePromotionSubmit} className="p-6 space-y-6">
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-sm text-indigo-700 font-bold mb-1">Promoting {selectedStudentIds.length} Students</p>
                    <p className="text-xs text-indigo-600 opacity-70">All details and paid history will be transferred. New fees from next month.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Class</label>
                    <select required className="w-full px-4 py-3 rounded-xl border border-slate-200" value={targetClassId} onChange={e => setTargetClassId(e.target.value)}>
                      <option value="">Choose class...</option>
                      {classes.filter(c => c.id !== selectedClassId).map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({formatCurrency(c.monthlyFee)}/mo)</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl">
                    Transfer & Promote Now
                  </button>
               </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Class Management</h2>
          <p className="text-slate-500">Define classes, fees, and manage class-wide student lists.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Class
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
              <input type="text" placeholder="e.g. Class 10-A" className="w-full px-4 py-2 rounded-lg border border-slate-200" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Tuition Fee</label>
              <input type="number" placeholder="0.00" className="w-full px-4 py-2 rounded-lg border border-slate-200" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-sm">Save Class</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {classes.map((c) => {
          const classStudentCount = students.filter(s => s.classId === c.id).length;
          return (
            <div 
              key={c.id} 
              onClick={() => setSelectedClassId(c.id)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-200 transition-all group cursor-pointer relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(c.id); }}
                  className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{c.name}</h3>
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-4 font-medium uppercase tracking-wider">
                <Users className="w-3 h-3" />
                {classStudentCount} Students Enrolled
              </div>
              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-transparent group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-400 uppercase tracking-widest">Monthly Fee</span>
                <span className="text-lg font-black text-indigo-600">{formatCurrency(c.monthlyFee)}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                 <span className="text-indigo-600 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                   View Class Dashboard →
                 </span>
              </div>
            </div>
          );
        })}
        {classes.length === 0 && !isAdding && (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
             <GraduationCap className="w-12 h-12 mb-4 opacity-20" />
             <p>No classes defined yet. Add your first class to start.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassManager;
