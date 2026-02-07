
import React, { useState, useEffect } from 'react';
import { X, CreditCard, ListChecks, Truck } from 'lucide-react';
import { Student, SchoolClass, Transaction, FeeItem, TransactionBreakdown } from '../types';
import { formatCurrency, calculateStudentDues, getMonthName } from '../utils';

interface Props {
  student: Student;
  schoolClass: SchoolClass;
  allClasses: SchoolClass[];
  transactions: Transaction[];
  customFees: FeeItem[];
  onClose: () => void;
  onPaymentSubmit: (tx: Transaction) => void;
}

const PaymentModal: React.FC<Props> = ({ student, schoolClass, allClasses, transactions, customFees, onClose, onPaymentSubmit }) => {
  const stats = calculateStudentDues(student, schoolClass, transactions, customFees, allClasses);
  
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'bank' | 'online'>('cash');
  const [remarks, setRemarks] = useState('');
  const [breakdown, setBreakdown] = useState<TransactionBreakdown[]>([]);

  useEffect(() => {
    const val = parseFloat(amount) || 0;
    if (val <= 0) {
      setBreakdown([]);
      return;
    }

    const items: TransactionBreakdown[] = [];
    let remaining = val;

    // Allocation logic: Previous Dues -> Current Month -> Custom
    stats.pendingMonths.forEach(m => {
      if (remaining <= 0) return;
      const dueForThisMonth = m.expectedAmount - m.paidAmount;
      const allocation = Math.min(remaining, dueForThisMonth);
      if (allocation > 0) {
        items.push({
          description: `${getMonthName(m.monthYear)} Fee (Tuit.+Trans.)`,
          amount: allocation
        });
        remaining -= allocation;
      }
    });

    // custom fees allocation
    customFees.forEach(fee => {
      if (remaining <= 0) return;
      const allocation = Math.min(remaining, fee.amount);
      if (allocation > 0) {
        items.push({
          description: fee.title,
          amount: allocation
        });
        remaining -= allocation;
      }
    });

    if (remaining > 0) {
      items.push({ description: 'Excess / Advance Credit', amount: remaining });
    }

    setBreakdown(items);
  }, [amount, stats.pendingMonths, customFees]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    onPaymentSubmit({
      id: crypto.randomUUID(),
      studentId: student.id,
      amountPaid: parseFloat(amount),
      date: new Date().toISOString(),
      paymentMethod: method,
      remarks,
      breakdown: breakdown
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in fade-in duration-300">
        <div className="p-6 border-b bg-indigo-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Fee Collection</h3>
            <p className="text-sm text-indigo-600 font-medium">Roll: {student.rollNo} • {student.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-indigo-100 rounded-full transition-colors"><X className="w-5 h-5 text-indigo-900" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <span className="text-[10px] font-black text-slate-400 uppercase">Class Monthly</span>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(schoolClass.monthlyFee)}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1"><Truck className="w-3 h-3" /> Transport</span>
              <p className="text-lg font-bold text-emerald-700">{formatCurrency(student.transportFee || 0)}</p>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl flex items-center justify-between border border-indigo-100">
            <span className="text-sm font-bold text-indigo-900">Total Outstanding Balance</span>
            <span className="text-2xl font-black text-indigo-700">{formatCurrency(stats.balance)}</span>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Receive Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
              <input autoFocus type="number" placeholder="0" className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-bold focus:border-indigo-500 outline-none" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
          </div>

          {breakdown.length > 0 && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ListChecks className="w-4 h-4" /> Allocation Detail</h4>
              <div className="space-y-2">
                {breakdown.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">{item.description}</span>
                    <span className="text-indigo-700 font-bold">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Mode</label>
            <div className="grid grid-cols-3 gap-2">
                {['cash', 'bank', 'online'].map((m) => (
                    <button key={m} type="button" onClick={() => setMethod(m as any)} className={`py-3 rounded-xl border-2 font-bold capitalize transition-all ${method === m ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-100 text-slate-400'}`}>{m}</button>
                ))}
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"><CreditCard className="w-5 h-5" /> Confirm & Post Payment</button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
