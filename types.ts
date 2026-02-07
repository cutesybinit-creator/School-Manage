
export interface SchoolClass {
  id: string;
  name: string;
  monthlyFee: number;
}

export interface ClassHistoryItem {
  classId: string;
  startDate: string; // ISO string
}

export interface Student {
  id: string;
  classId: string;
  rollNo: string;
  name: string;
  fatherName: string;
  contact: string;
  address: string;
  identityNo?: string; // Aadhar or other ID
  dob?: string; // Date of Birth
  admissionDate: string; // ISO string
  isActive: boolean;
  inactiveDate?: string; // ISO string, date when student stopped attending
  transportFee?: number; // Optional monthly transport fee
  classHistory?: ClassHistoryItem[]; // History of class enrollments
}

export interface FeeItem {
  id: string;
  studentId: string;
  type: 'tuition' | 'exam' | 'event' | 'other' | 'transport';
  title: string;
  amount: number;
  monthYear: string; // e.g., "2023-10"
  dueDate: string;
}

export interface TransactionBreakdown {
  description: string;
  amount: number;
}

export interface Transaction {
  id: string;
  studentId: string;
  amountPaid: number;
  date: string;
  paymentMethod: 'cash' | 'bank' | 'online';
  remarks: string;
  breakdown: TransactionBreakdown[];
}

export interface AppData {
  classes: SchoolClass[];
  students: Student[];
  transactions: Transaction[];
  customFees: FeeItem[];
}
