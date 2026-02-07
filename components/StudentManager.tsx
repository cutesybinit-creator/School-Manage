
import React, { useState } from 'react';
import { Plus, Search, User, Filter, Edit2, Trash2, Eye, Truck, ToggleLeft, ToggleRight, UserX, UserCheck, ShieldCheck, Calendar } from 'lucide-react';
import { SchoolClass, Student } from '../types';

interface Props {
  classes: SchoolClass[];
  students: Student[];
  onAdd: (s: Student) => void;
  onUpdate: (s: Student) => void;
  onRemove: (id: string) => void;
  onViewDetails: (id: string) => void;
}

const StudentManager: React.FC<Props> = ({ classes, students, onAdd, onUpdate, onRemove, onViewDetails }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    classId: '',
    fatherName: '',
    contact: '',
    address: '',
    identityNo: '',
    dob: '',
    transportFee: '',
    admissionDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNo: student.rollNo,
      classId: student.classId,
      fatherName: student.fatherName,
      contact: student.contact,
      address: student.address,
      identityNo: student.identityNo || '',
      dob: student.dob || '',
      transportFee: student.transportFee?.toString() || '',
      admissionDate: student.admissionDate.split('T')[0],
      isActive: student.isActive
    });
    setIsAdding(true);
  };

  const handleToggleStatus = (student: Student) => {
    const updated: Student = {
      ...student,
      isActive: !student.isActive,
      inactiveDate: !student.isActive ? undefined : new Date().toISOString()
    };
    onUpdate(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.classId || !formData.rollNo) return;

    const studentData: Student = {
      id: editingStudent ? editingStudent.id : crypto.randomUUID(),
      name: formData.name,
      rollNo: formData.rollNo,
      classId: formData.classId,
      fatherName: formData.fatherName,
      contact: formData.contact,
      address: formData.address,
      identityNo: formData.identityNo,
      dob: formData.dob,
      transportFee: formData.transportFee ? parseFloat(formData.transportFee) : 0,
      admissionDate: formData.admissionDate,
      isActive: formData.isActive,
      inactiveDate: !formData.isActive ? (editingStudent?.inactiveDate || new Date().toISOString()) : undefined
    };

    if (editingStudent) {
      onUpdate(studentData);
    } else {
      onAdd(studentData);
    }
    
    setFormData({
      name: '', rollNo: '', classId: '', fatherName: '', contact: '', address: '', identityNo: '', dob: '', transportFee: '', admissionDate: new Date().toISOString().split('T')[0], isActive: true
    });
    setEditingStudent(null);
    setIsAdding(false);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.rollNo.includes(searchTerm) || 
                          (s.identityNo && s.identityNo.includes(searchTerm));
    const matchesClass = selectedClassId === 'all' || s.classId === selectedClassId;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Directory</h2>
          <p className="text-slate-500">Manage student enrollment, personal details, and active status.</p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null);
            setIsAdding(!isAdding);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Student
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-lg animate-in fade-in zoom-in duration-200">
          <h3 className="text-lg font-bold mb-4">{editingStudent ? 'Edit Student Details' : 'Enroll New Student'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number</label>
              <input
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                value={formData.rollNo}
                onChange={e => setFormData({...formData, rollNo: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
              <select
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                value={formData.classId}
                onChange={e => setFormData({...formData, classId: e.target.value})}
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Father's Name</label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                value={formData.fatherName}
                onChange={e => setFormData({...formData, fatherName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                value={formData.contact}
                onChange={e => setFormData({...formData, contact: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Aadhar / ID No.</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  value={formData.identityNo}
                  placeholder="1234 5678 9012"
                  onChange={e => setFormData({...formData, identityNo: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                value={formData.dob}
                onChange={e => setFormData({...formData, dob: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transport Fee</label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                value={formData.transportFee}
                onChange={e => setFormData({...formData, transportFee: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Admission Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                value={formData.admissionDate}
                onChange={e => setFormData({...formData, admissionDate: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
               <input
                 className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                 value={formData.address}
                 placeholder="Street, City, Zip"
                 onChange={e => setFormData({...formData, address: e.target.value})}
               />
            </div>

            <div className="md:col-span-3 flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex-1">
                 <p className="text-sm font-bold text-slate-800">Student Status</p>
                 <p className="text-xs text-slate-500">Inactive students will stop accruing monthly fees.</p>
               </div>
               <button 
                type="button"
                onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                  formData.isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600 border border-slate-300'
                }`}
               >
                 {formData.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                 {formData.isActive ? 'ACTIVE' : 'INACTIVE'}
               </button>
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-8 py-2 rounded-lg hover:bg-indigo-700 shadow-md font-bold"
              >
                {editingStudent ? 'Update Details' : 'Register Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll or ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="bg-slate-50 border-transparent rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
            >
              <option value="all">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Aadhar / DOB</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => {
                const sClass = classes.find(c => c.id === student.classId);
                return (
                  <tr key={student.id} className={`hover:bg-slate-50/50 transition-colors group ${!student.isActive ? 'opacity-70 bg-slate-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                          student.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-semibold ${student.isActive ? 'text-slate-800' : 'text-slate-500'}`}>{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Contact: {student.contact || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                          <ShieldCheck className="w-3 h-3 text-indigo-400" />
                          {student.identityNo || '---'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">#{student.rollNo}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                        {sClass?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(student)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                          student.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {student.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {student.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onViewDetails(student.id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details & Fees"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(student)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onRemove(student.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <User className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p>No students found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentManager;
