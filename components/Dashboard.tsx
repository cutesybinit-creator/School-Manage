import React from 'react';
import { IndianRupee, Users, GraduationCap, TrendingUp } from 'lucide-react';
import { AppData } from '../types.ts';
import { calculateStudentDues, formatCurrency } from '../utils.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: AppData;
}

const Dashboard: React.FC<Props> = ({ data }) => {
  const totalPaid = data.transactions.reduce((acc, t) => acc + t.amountPaid, 0);
  const activeStudents = data.students.filter(s => s.isActive).length;
  
  let totalDues = 0;
  data.students.forEach(student => {
    const schoolClass = data.classes.find(c => c.id === student.classId);
    if (schoolClass) {
      const stats = calculateStudentDues(student, schoolClass, data.transactions, data.customFees, data.classes);
      totalDues += stats.balance;
    }
  });

  const chartData = data.classes.map(c => {
    const count = data.students.filter(s => s.classId === c.id).length;
    return { name: c.name, count };
  });

  const stats = [
    { label: 'Total Collection', value: formatCurrency(totalPaid), icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Dues', value: formatCurrency(totalDues), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active Students', value: activeStudents, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Classes', value: data.classes.length, icon: GraduationCap, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">School Overview</h2>
        <p className="text-slate-500">Summary of fees and enrollments across all classes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Student Distribution per Class</h3>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">No data available</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4 text-slate-800">Recent Transactions</h3>
          <div className="space-y-4">
            {data.transactions.slice(0, 5).map((tx, idx) => {
              const student = data.students.find(s => s.id === tx.studentId);
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-800">{student?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-emerald-600 font-bold">
                    +{formatCurrency(tx.amountPaid)}
                  </div>
                </div>
              );
            })}
            {data.transactions.length === 0 && (
              <p className="text-center text-slate-400 py-10">No transactions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;