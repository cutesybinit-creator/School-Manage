import React from 'react';
import { Printer, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Student, SchoolClass, Transaction } from '../types.ts';
import { formatCurrency, sendWhatsAppReceipt, generateUPILink, generatePublicInvoiceLink } from '../utils.ts';

interface Props {
  student: Student;
  schoolClass: SchoolClass;
  transaction: Transaction;
  totalDue: number;
  unpaidBreakdown: { description: string, amount: number }[];
  onClose: () => void;
}

const Invoice: React.FC<Props> = ({ student, schoolClass, transaction, totalDue, unpaidBreakdown, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    sendWhatsAppReceipt(student, transaction, totalDue, unpaidBreakdown);
  };

  const handleCopyLink = () => {
    const link = generatePublicInvoiceLink(student, schoolClass, totalDue, transaction);
    navigator.clipboard.writeText(link);
    alert("Public Invoice Link copied to clipboard! You can now paste and send it anywhere.");
  };

  const upiLink = generateUPILink(totalDue, student.name, student.rollNo);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md no-print" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[95vh]">
        {/* Actions Bar */}
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between no-print gap-2 overflow-x-auto shrink-0">
            <button onClick={onClose} className="text-slate-500 font-bold px-4 py-2 hover:bg-white rounded-xl whitespace-nowrap">Close</button>
            <div className="flex gap-2">
              <button onClick={handleCopyLink} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 whitespace-nowrap">
                  <LinkIcon className="w-4 h-4" /> Copy Link
              </button>
              <button onClick={handleWhatsApp} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 whitespace-nowrap">
                  <MessageCircle className="w-4 h-4" /> Share via WhatsApp
              </button>
              <button onClick={handlePrint} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 whitespace-nowrap">
                  <Printer className="w-4 h-4" /> Print PDF
              </button>
            </div>
        </div>

        {/* Receipt Content */}
        <div id="receipt-content" className="p-8 flex-1 overflow-y-auto bg-white">
          <div className="border-[6px] border-double border-indigo-100 p-8 rounded-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-indigo-900 tracking-tight mb-1 uppercase">EDU-FEE PRO SCHOOL</h1>
              <p className="text-slate-500 font-medium text-sm">Main Campus, Academic Square - 110001</p>
              <p className="text-slate-400 text-[10px] font-bold">CONTACT: +91 91559 71941 | WEB: www.edufeepro.com</p>
            </div>

            <div className="flex justify-between items-end mb-6 pb-4 border-b-2 border-slate-100">
                <div>
                    <h2 className="text-lg font-black text-slate-800 mb-1 underline decoration-indigo-200 underline-offset-4 uppercase">Fee Receipt</h2>
                    <p className="text-[10px] text-slate-500">Receipt No: <span className="font-bold text-slate-800">REC-{transaction.id.slice(0,8).toUpperCase()}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-600 font-bold uppercase">DATE: {new Date(transaction.date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-600 uppercase">TIME: {new Date(transaction.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
            </div>

            {/* Student Details */}
            <div className="grid grid-cols-2 gap-y-2 mb-8 text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-slate-500 uppercase font-bold tracking-tighter">Student:</div><div className="font-bold text-slate-800 text-right uppercase">{student.name}</div>
                <div className="text-slate-500 uppercase font-bold tracking-tighter">Roll No:</div><div className="font-bold text-slate-800 text-right">#{student.rollNo}</div>
                <div className="text-slate-500 uppercase font-bold tracking-tighter">Class:</div><div className="font-bold text-slate-800 text-right">{schoolClass.name}</div>
                <div className="text-slate-500 uppercase font-bold tracking-tighter">Parent:</div><div className="font-bold text-slate-800 text-right">{student.fatherName}</div>
                <div className="text-slate-500 col-span-2 mt-1 pt-1 border-t border-slate-200 text-[9px]">Address: <span className="text-slate-800 font-medium">{student.address || 'N/A'}</span></div>
            </div>

            {/* Payment Items */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-indigo-900">
                        <th className="text-left py-2 text-indigo-900 font-bold uppercase text-[9px] tracking-widest">Paid Item Description</th>
                        <th className="text-right py-2 text-indigo-900 font-bold uppercase text-[9px] tracking-widest">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y text-[11px]">
                    {transaction.breakdown?.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 text-slate-700 font-medium">{item.description}</td>
                        <td className="py-2.5 text-right font-bold text-slate-800">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-slate-800">
                        <td className="py-3 text-sm font-bold text-slate-800">Total Received ({transaction.paymentMethod.toUpperCase()})</td>
                        <td className="py-3 text-right text-lg font-black text-indigo-700">{formatCurrency(transaction.amountPaid)}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {totalDue > 0 ? (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <h4 className="text-[9px] font-black text-amber-900 uppercase tracking-widest mb-3 border-b border-amber-200 pb-1">Outstanding Balance</h4>
                    <div className="space-y-1">
                      {unpaidBreakdown.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex justify-between text-[10px]">
                          <span className="text-amber-800 font-medium truncate max-w-[150px]">{item.description}</span>
                          <span className="text-amber-900 font-bold">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-amber-200 flex justify-between items-center">
                      <span className="text-xs font-black text-amber-900">Total Due</span>
                      <span className="text-sm font-black text-amber-600">{formatCurrency(totalDue)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center">
                    <div className="text-emerald-600 font-black text-[9px] uppercase mb-1 tracking-widest">Status</div>
                    <div className="text-emerald-700 font-bold text-sm uppercase">Dues Cleared</div>
                  </div>
                )}

                {totalDue > 0 && (
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col items-center">
                    <h4 className="text-[9px] font-black text-indigo-900 uppercase tracking-widest mb-2">Scan to Pay via UPI</h4>
                    <div className="bg-white p-2 rounded-lg shadow-sm mb-2 border border-indigo-50">
                      <img src={qrCodeUrl} alt="UPI QR Code" className="w-24 h-24" />
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-slate-500 uppercase">UPI ID: bingozo@ybl</p>
                    </div>
                  </div>
                )}
            </div>

            {transaction.remarks && (
              <div className="mb-6 p-3 bg-slate-50 rounded-lg text-[10px] italic text-slate-500 border border-slate-100">Note: {transaction.remarks}</div>
            )}

            <div className="mt-12 flex justify-between items-end">
                <div className="text-[7px] text-slate-400 max-w-[250px] leading-tight">
                    <p className="font-bold mb-1 underline">IMPORTANT NOTICE:</p>
                    1. Fee once paid is strictly non-refundable.<br/>
                    2. Please clear all outstanding dues by the 10th.<br/>
                    3. This is a computerized receipt.
                </div>
                <div className="text-center">
                    <div className="w-32 border-b border-slate-800 mb-2 mx-auto"></div>
                    <p className="text-[9px] font-bold text-slate-800 uppercase">Authorized Signatory</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;