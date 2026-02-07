import React, { useEffect, useState } from 'react';
import { Smartphone, BookOpen, User, CheckCircle2, Printer } from 'lucide-react';
import { decodeInvoiceData, formatCurrency, generateUPILink } from '../utils.ts';

interface Props {
  onExit: () => void;
}

const PublicInvoiceView: React.FC<Props> = ({ onExit }) => {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('iv');
    if (token) {
      const decoded = decodeInvoiceData(token);
      if (decoded) {
        setInvoiceData(decoded);
      } else {
        setError(true);
      }
    } else {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Invoice Not Found</h2>
          <p className="text-slate-500 mb-8">This link might be expired or invalid. Please contact the school admin for a new link.</p>
          <button onClick={onExit} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">Go to Home</button>
        </div>
      </div>
    );
  }

  if (!invoiceData) return null;

  const upiLink = generateUPILink(invoiceData.bal, invoiceData.sN, invoiceData.sR);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-0">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-2 text-indigo-900 font-black tracking-tighter text-xl">
               <BookOpen className="w-6 h-6" /> EduFee Pro
            </div>
            <button onClick={() => window.print()} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 text-xs font-bold text-slate-600">
              <Printer className="w-4 h-4" /> Print PDF
            </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-slate-100 relative">
          <div className="p-8 bg-indigo-600 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                   <span className="bg-indigo-500 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-indigo-400">Official Invoice</span>
                   <h1 className="text-3xl font-black mt-3 mb-1">{invoiceData.sN}</h1>
                   <p className="opacity-80 font-medium">Roll No: #{invoiceData.sR} • {invoiceData.cN}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Receipt Date</p>
                   <p className="text-lg font-bold">{new Date(invoiceData.txD || Date.now()).toLocaleDateString()}</p>
                </div>
             </div>
          </div>

          <div className="p-8 space-y-8">
             {invoiceData.txA > 0 && (
               <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4 animate-in zoom-in duration-300">
                 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-emerald-900 font-bold">Payment Confirmed</h3>
                    <p className="text-emerald-700 text-sm">Amount of {formatCurrency(invoiceData.txA)} has been successfully recorded.</p>
                 </div>
               </div>
             )}

             {invoiceData.txB && (
               <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Transaction Items</h4>
                  <div className="space-y-3">
                    {invoiceData.txB.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                        <span className="text-slate-600 font-medium">{item.description}</span>
                        <span className="text-slate-900 font-bold">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             {invoiceData.bal > 0 ? (
               <div className="pt-8 border-t border-slate-100 flex flex-col items-center">
                  <div className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-amber-100">Pending Dues</div>
                  <div className="text-5xl font-black text-slate-800 mb-6">{formatCurrency(invoiceData.bal)}</div>
                  
                  <div className="w-full max-w-sm bg-slate-50 p-8 rounded-[2rem] border border-slate-200 flex flex-col items-center">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Scan QR to Pay Instantly</p>
                     <div className="bg-white p-4 rounded-3xl shadow-lg border border-indigo-50 mb-6">
                        <img src={qrCodeUrl} alt="UPI QR Code" className="w-48 h-48" />
                     </div>
                     <div className="text-center space-y-4 w-full">
                        <p className="text-[10px] font-bold text-slate-400">UPI ID: bingozo@ybl</p>
                        <a 
                          href={upiLink}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 no-print"
                        >
                          <Smartphone className="w-5 h-5" /> Open UPI App to Pay
                        </a>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="pt-8 border-t border-slate-100 text-center py-10">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-900">Paid In Full</h3>
                  <p className="text-slate-500">Thank you for clearing all outstanding dues.</p>
               </div>
             )}

             <div className="pt-8 border-t border-slate-50 text-center space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Computer Generated Receipt • EduFee Pro v2.5</p>
                <p className="text-[9px] text-slate-300">This invoice is for verification and payment purposes only.</p>
             </div>
          </div>
        </div>
        
        <div className="text-center no-print">
          <button onClick={onExit} className="text-slate-400 hover:text-indigo-600 text-xs font-bold transition-colors">Return to School Portal</button>
        </div>
      </div>
    </div>
  );
};

export default PublicInvoiceView;