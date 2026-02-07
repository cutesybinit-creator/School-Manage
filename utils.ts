import { Student, SchoolClass, FeeItem, Transaction } from './types.ts';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const getMonthYearString = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthName = (monthYear: string) => {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export const generateUPILink = (amount: number, studentName: string, rollNo: string) => {
  const vpa = "bingozo@ybl";
  const name = "EduFee Pro School";
  const note = `Fee Payment: ${studentName} (Roll ${rollNo})`;
  return `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;
};

// Public Invoice Link encoding for serverless sharing
export const encodeInvoiceData = (data: any) => {
  try {
    const jsonStr = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(jsonStr)));
  } catch (e) {
    return "";
  }
};

export const decodeInvoiceData = (base64: string) => {
  try {
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
};

export const generatePublicInvoiceLink = (student: Student, schoolClass: SchoolClass, balance: number, transaction?: Transaction) => {
  const data = {
    sN: student.name,
    sR: student.rollNo,
    cN: schoolClass.name,
    cF: schoolClass.monthlyFee,
    bal: balance,
    txA: transaction?.amountPaid,
    txD: transaction?.date,
    txM: transaction?.paymentMethod,
    txB: transaction?.breakdown,
    txI: transaction?.id
  };
  const token = encodeInvoiceData(data);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?iv=${token}`;
};

export const calculateStudentDues = (
  student: Student,
  schoolClass: SchoolClass,
  transactions: Transaction[],
  customFees: FeeItem[],
  allClasses: SchoolClass[] = []
) => {
  const admissionDate = new Date(student.admissionDate);
  const calculationEndDate = (!student.isActive && student.inactiveDate) 
    ? new Date(student.inactiveDate) 
    : new Date();
  
  const months: string[] = [];
  let tempDate = new Date(admissionDate.getFullYear(), admissionDate.getMonth(), 1);
  
  while (tempDate <= calculationEndDate || months.length === 0) {
    months.push(`${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`);
    tempDate.setMonth(tempDate.getMonth() + 1);
    if (months.length > 500) break; 
  }

  const transportFeePerMonth = student.transportFee || 0;
  
  const getClassForMonth = (monthStr: string) => {
    if (!student.classHistory || student.classHistory.length === 0) return schoolClass;
    const history = [...student.classHistory].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    const targetDate = new Date(monthStr + "-01");
    for (const entry of history) {
      if (new Date(entry.startDate) <= targetDate) {
        const found = allClasses.find(c => c.id === entry.classId);
        return found || schoolClass;
      }
    }
    return allClasses.find(c => c.id === history[history.length - 1].classId) || schoolClass;
  };

  let totalTuitionExpected = 0;
  const monthWiseTuition = months.map(m => {
    const applicableClass = getClassForMonth(m);
    totalTuitionExpected += applicableClass.monthlyFee;
    return { month: m, fee: applicableClass.monthlyFee };
  });

  const totalTransportExpected = months.length * transportFeePerMonth;
  const studentCustomFees = customFees.filter(f => f.studentId === student.id);
  const totalCustomExpected = studentCustomFees.reduce((acc, f) => acc + f.amount, 0);
  
  const totalExpected = totalTuitionExpected + totalTransportExpected + totalCustomExpected;
  const totalPaid = transactions
    .filter(t => t.studentId === student.id)
    .reduce((acc, t) => acc + t.amountPaid, 0);

  const balance = totalExpected - totalPaid;

  let remainingPaid = totalPaid;
  const unpaidBreakdown: { description: string, amount: number }[] = [];

  const monthStatus = months.map((my, idx) => {
    let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    let paidForThisMonth = 0;
    const monthlyTuition = monthWiseTuition[idx].fee;
    const expectedForMonth = monthlyTuition + transportFeePerMonth;

    if (remainingPaid >= expectedForMonth) {
      status = 'paid';
      paidForThisMonth = expectedForMonth;
      remainingPaid -= expectedForMonth;
    } else if (remainingPaid > 0) {
      status = 'partial';
      paidForThisMonth = remainingPaid;
      const due = expectedForMonth - remainingPaid;
      unpaidBreakdown.push({ description: `${getMonthName(my)} Fee (Partial)`, amount: due });
      remainingPaid = 0;
    } else {
      status = 'unpaid';
      unpaidBreakdown.push({ description: `${getMonthName(my)} Fee`, amount: expectedForMonth });
    }

    return { 
      monthYear: my, 
      status, 
      paidAmount: paidForThisMonth, 
      expectedAmount: expectedForMonth,
      tuition: monthlyTuition,
      transport: transportFeePerMonth
    };
  });

  studentCustomFees.forEach(fee => {
    if (remainingPaid >= fee.amount) {
      remainingPaid -= fee.amount;
    } else if (remainingPaid > 0) {
      unpaidBreakdown.push({ description: `${fee.title} (Partial)`, amount: fee.amount - remainingPaid });
      remainingPaid = 0;
    } else {
      unpaidBreakdown.push({ description: fee.title, amount: fee.amount });
    }
  });

  return {
    totalExpected,
    totalPaid,
    balance,
    monthStatus,
    customFees: studentCustomFees,
    pendingMonths: monthStatus.filter(m => m.status !== 'paid'),
    unpaidBreakdown,
    calculationEndDate
  };
};

export const sendWhatsAppReceipt = (student: Student, transaction: Transaction, balance: number, unpaidItems: {description: string, amount: number}[]) => {
  if (!student.contact) {
    alert("No contact number found for this student.");
    return;
  }

  const cleanNumber = student.contact.replace(/\D/g, '');
  const formattedNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
  
  let breakdownText = "";
  transaction.breakdown.forEach(item => {
    breakdownText += `• ${item.description}: ${formatCurrency(item.amount)}%0A`;
  });

  const invoiceLink = generatePublicInvoiceLink(student, { name: 'Class' } as SchoolClass, balance, transaction);

  const message = `*OFFICIAL FEE RECEIPT - EDU-FEE PRO*%0A%0A` +
    `Dear Parent,%0A` +
    `Payment received for *${student.name}* (Roll: ${student.rollNo}).%0A%0A` +
    `*PAYMENT BREAKDOWN:*%0A${breakdownText}%0A` +
    `*Amount Received:* ${formatCurrency(transaction.amountPaid)}%0A%0A` +
    `*VIEW OFFICIAL WEB INVOICE:*%0A${invoiceLink}%0A%0A` +
    `*OUTSTANDING BALANCE:* ${formatCurrency(balance)}%0A` +
    `_Download full PDF invoice from school portal._%0A` +
    `Thank you!%0A` +
    `*EDU-FEE PRO ADMIN*`;

  window.open(`https://wa.me/${formattedNumber}?text=${message}`, '_blank');
};