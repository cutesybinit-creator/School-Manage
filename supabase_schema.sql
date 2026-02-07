-- 1. Enable pgcrypto for UUID generation if needed (though app provides IDs)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if they exist (Be careful with this in production!)
DROP TABLE IF EXISTS custom_fees;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;

-- 3. Classes Table
CREATE TABLE classes (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  "monthlyFee" NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY,
  "classId" UUID REFERENCES classes(id) ON DELETE SET NULL,
  "rollNo" TEXT NOT NULL,
  name TEXT NOT NULL,
  "fatherName" TEXT,
  contact TEXT,
  address TEXT,
  "identityNo" TEXT,
  dob DATE,
  "admissionDate" DATE NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE,
  "inactiveDate" TIMESTAMPTZ,
  "transportFee" NUMERIC DEFAULT 0,
  "classHistory" JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  "studentId" UUID REFERENCES students(id) ON DELETE CASCADE,
  "amountPaid" NUMERIC NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  "paymentMethod" TEXT CHECK ("paymentMethod" IN ('cash', 'bank', 'online')),
  remarks TEXT,
  breakdown JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Custom Fees Table
CREATE TABLE custom_fees (
  id UUID PRIMARY KEY,
  "studentId" UUID REFERENCES students(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('tuition', 'exam', 'event', 'other', 'transport')),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  "monthYear" TEXT,
  "dueDate" DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fees ENABLE ROW LEVEL SECURITY;

-- 8. Create Public Access Policies (Allow all operations for public key)
CREATE POLICY "Public Read Classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Public Insert Classes" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Classes" ON classes FOR UPDATE USING (true);
CREATE POLICY "Public Delete Classes" ON classes FOR DELETE USING (true);

CREATE POLICY "Public Read Students" ON students FOR SELECT USING (true);
CREATE POLICY "Public Insert Students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Students" ON students FOR UPDATE USING (true);
CREATE POLICY "Public Delete Students" ON students FOR DELETE USING (true);

CREATE POLICY "Public Read Transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public Insert Transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Transactions" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Public Delete Transactions" ON transactions FOR DELETE USING (true);

CREATE POLICY "Public Read Fees" ON custom_fees FOR SELECT USING (true);
CREATE POLICY "Public Insert Fees" ON custom_fees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Fees" ON custom_fees FOR UPDATE USING (true);
CREATE POLICY "Public Delete Fees" ON custom_fees FOR DELETE USING (true);

-- 9. Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE classes;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE custom_fees;