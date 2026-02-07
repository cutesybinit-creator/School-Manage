
import React, { useState } from 'react';
import { ChevronLeft, IndianRupee, History, Calendar, Plus, CreditCard, FileText, MessageCircle, ChevronDown, ChevronUp, MapPin, Truck, AlertCircle, UserCheck, UserX, ShieldCheck, Smartphone } from 'lucide-react';
import { Student, SchoolClass, Transaction, FeeItem } from '../types';
import { calculateStudentDues, formatCurrency, sendWhatsAppReceipt, getMonthName, generateUPILink } from '../utils';
import Invoice from './Invoice';

interface Props {
  student: Student;
  schoolClass: SchoolClass;
  allClasses: SchoolClass[];
  transactions: Transaction[];
  customFees: FeeItem[];
  onBack: () => void;
  onPay: () => void;
  onAddCustomFee: (f: FeeItem) => void;
}

const StudentDetails: React.FC<Props> = ({ student, schoolClass, allClasses, transactions, customFees, onBack, onPay, onAddCustomFee }) => {
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedTxForInvoice, setSelectedTxForInvoice] = useState<Transaction | null>(null);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customFeeForm, setCustomFeeForm] = useState({ title: '', amount: '', type: 'exam' });
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const stats = calculateStudentDues(student, schoolClass, transactions, customFees, allClasses);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFeeForm.title || !customFeeForm.amount) return;
    onAddCustomFee({
      id: crypto.randomUUID(),
      studentId: student.id,
      title: customFeeForm.title,
      amount: parseFloat(customFeeForm.amount),
      type: customFeeForm.type as any,
      monthYear: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0]
    });
    setIsAddingCustom(false);
    setCustomFeeForm({ title: '', amount: '', type: 'exam' });
  };

  const openInvoice = (tx: Transaction) => {
    setSelectedTxForInvoice(tx);
    setIsInvoiceOpen(true);
  };

  const handleWhatsApp = (tx: Transaction) => {
    sendWhatsAppReceipt(student, tx, stats.balance, stats.unpaidBreakdown);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Student List
        </button>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black tracking-widest ${
          student.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          {student.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
          {student.isActive ? 'CURRENTLY ACTIVE' : 'INACTIVE - NO NEW FEES'}
        </div>
      </div>

      {/* Header Info */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        {!student.isActive && (
          <div className="absolute top-0 right-0 p-4 transform rotate-12 bg-slate-100 border border-slate-200 text-slate-400 font-black text-xs opacity-50">
            INACTIVE SINCE {new Date(student.inactiveDate!).toLocaleDateString()}
          </div>
        )}
        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold shrink-0 ${
          student.isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
        }`}>
          {student.name.charAt(0)}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h2 className={`text-3xl font-bold ${student.isActive ? 'text-slate-800' : 'text-slate-500'}`}>{student.name}</h2>
            <p className="text-slate-500 font-medium">Roll No: #{student.rollNo} • {schoolClass.name}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Father's Name</p>
              <p className="text-slate-700 font-medium">{student.fatherName || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Contact</p>
              <div className="flex items-center gap-2">
                <p className="text-slate-700 font-medium">{student.contact || 'N/A'}</p>
                {student.contact && (
                  <button 
                    onClick={() => window.open(`https://wa.me/${student.contact.replace(/\D/g, '')}`, '_blank')}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Aadhar / ID No.</p>
              <p className="text-indigo-600 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {student.identityNo || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Date of Birth</p>
              <p className="text-slate-700 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 border-t border-slate-50">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Admission Date</p>
              <p className="text-slate-700 font-medium">{new Date(student.admissionDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Monthly Transport</p>
              <p className="text-emerald-600 font-bold flex items-center gap-1">
                <Truck className="w-3 h-3" /> {formatCurrency(student.transportFee || 0)}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-slate-400 uppercase">Address</p>
              <p className="text-slate-700 font-medium flex items-center gap-1 truncate" title={student.address}>
                <MapPin className="w-3 h-3 text-slate-400" /> {student.address || 'No address provided'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onPay}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 font-bold"
        >
          <CreditCard className="w-5 h-5" />
          Make Payment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Stats Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Expected</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalExpected)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Received</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalPaid)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ring-4 ring-amber-100 shadow-amber-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Current Due</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.balance)}</p>
              {stats.balance > 0 && (
                <a 
                  href={generateUPILink(stats.balance, student.name, student.rollNo)}
                  className="mt-3 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 w-full justify-center no-print"
                >
                  <Smartphone className="w-3.5 h-3.5" /> Pay Now via UPI Link
                </a>
              )}
            </div>
          </div>

          {/* Due Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between bg-amber-50/30">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Due Breakdown
              </h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full uppercase">Pending</span>
            </div>
            <div className="p-6">
               {stats.unpaidBreakdown.length > 0 ? (
                 <div className="space-y-3">
                   {stats.unpaidBreakdown.map((item, i) => (
                     <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                       <span className="text-slate-600 font-medium">{item.description}</span>
                       <span className="text-amber-600 font-bold">{formatCurrency(item.amount)}</span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-6 text-emerald-600 font-bold flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-2">✓</div>
                    No Outstanding Dues!
                 </div>
               )}
            </div>
          </div>

          {/* Monthly Status Tracker */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Monthly Tracker (Accrued Months Only)
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {stats.monthStatus.map((m, i) => (
                  <div key={i} className={`p-4 rounded-xl border text-center transition-all ${
                    m.status === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                    m.status === 'partial' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                    'bg-slate-50 border-slate-100 text-slate-400'
                  }`}>
                    <p className="text-[10px] font-bold uppercase mb-1">{getMonthName(m.monthYear)}</p>
                    <p className="text-sm font-bold">{m.status.toUpperCase()}</p>
                    <div className="mt-2 pt-2 border-t border-current/10 text-[9px] opacity-60 flex flex-col gap-0.5">
                      <div className="flex justify-between"><span>Exp:</span> <span>{formatCurrency(m.expectedAmount)}</span></div>
                      <div className="flex justify-between"><span>Paid:</span> <span>{formatCurrency(m.paidAmount)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              {!student.isActive && (
                <p className="mt-6 text-xs text-slate-400 italic text-center p-3 border border-dashed rounded-xl">
                  Fees stopped accruing after {new Date(student.inactiveDate!).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Custom Fees Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Extra Fee Items</h3>
              <button 
                onClick={() => setIsAddingCustom(true)}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            <div className="p-6">
              {isAddingCustom && (
                <form onSubmit={handleAddCustom} className="mb-6 p-4 bg-slate-50 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 border border-indigo-100">
                  <input placeholder="Fee Title" className="px-3 py-2 rounded-lg border" required value={customFeeForm.title} onChange={e => setCustomFeeForm({...customFeeForm, title: e.target.value})}/>
                  <input type="number" placeholder="Amount" className="px-3 py-2 rounded-lg border" required value={customFeeForm.amount} onChange={e => setCustomFeeForm({...customFeeForm, amount: e.target.value})}/>
                  <div className="flex gap-2">
                    <select className="flex-1 px-3 py-2 rounded-lg border" value={customFeeForm.type} onChange={e => setCustomFeeForm({...customFeeForm, type: e.target.value})}>
                      <option value="exam">Exam Fee</option>
                      <option value="event">Event Fee</option>
                      <option value="other">Other Fee</option>
                    </select>
                    <button type="submit" className="bg-indigo-600 text-white px-4 rounded-lg"><Plus className="w-4 h-4"/></button>
                  </div>
                </form>
              )}
              <div className="space-y-3">
                {customFees.length > 0 ? customFees.map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">{fee.title}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">{fee.type}</p>
                    </div>
                    <p className="text-lg font-bold text-indigo-600">{formatCurrency(fee.amount)}</p>
                  </div>
                )) : (
                  <p className="text-center text-slate-400 py-4 italic">No specific extra fees added.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* History Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full sticky top-24">
            <div className="p-6 border-b bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Payment Log
              </h3>
            </div>
            <div className="p-6 space-y-4 max-h-[800px] overflow-y-auto">
              {transactions.length > 0 ? transactions.slice().reverse().map((tx) => (
                <div key={tx.id} className="rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <div className="p-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(tx.amountPaid)}</p>
                        <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-slate-200">{tx.paymentMethod}</span>
                        {expandedTx === tx.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                  </div>
                  {expandedTx === tx.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1 mb-4">
                        {tx.breakdown?.map((item, i) => (
                          <div key={i} className="flex justify-between text-[11px]">
                            <span className="text-slate-500 truncate max-w-[150px]">{item.description}</span>
                            <span className="text-slate-800 font-semibold">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openInvoice(tx); }} className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center justify-center gap-2"><FileText className="w-3 h-3" /> Invoice</button>
                        <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(tx); }} className="py-2 px-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><MessageCircle className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <CreditCard className="w-12 h-12 mb-4 opacity-10" />
                  <p>No history yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isInvoiceOpen && selectedTxForInvoice && (
        <Invoice 
          student={student} 
          schoolClass={schoolClass} 
          transaction={selectedTxForInvoice} 
          onClose={() => setIsInvoiceOpen(false)} 
          totalDue={stats.balance}
          unpaidBreakdown={stats.unpaidBreakdown}
        />
      )}
    </div>
  );
};

export default StudentDetails;
