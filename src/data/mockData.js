// ============================================================
// SCHEMA-DRIVEN MOCK DATA  (matches PostgreSQL schema exactly)
// ============================================================

// clinics(id, name, gst_number, phone, email, address, city, state, pincode, subscription_plan, is_active, created_at)
export const MOCK_CLINICS = [
  { id:"C001", name:"City Medical Center",  gst_number:"29AABCC1234F1Z5", phone:"080-41234567", email:"admin@citymedical.com",  address:"12, MG Road",       city:"Bangalore", state:"Karnataka",   pincode:"560001", subscription_plan:"Enterprise", is_active:true,  created_at:"2022-01-15" },
  { id:"C002", name:"Apollo Health Clinic", gst_number:"27AABCC5678F1Z2", phone:"022-41234567", email:"info@apollohealth.com",  address:"45, Bandra West",   city:"Mumbai",    state:"Maharashtra", pincode:"400050", subscription_plan:"Pro",        is_active:true,  created_at:"2022-06-20" },
  { id:"C003", name:"Grace Hospital",       gst_number:"09AABCC9012F1Z8", phone:"011-41234567", email:"contact@gracehospital.com",address:"78, Connaught Place",city:"Delhi",   state:"Delhi",       pincode:"110001", subscription_plan:"Starter",    is_active:false, created_at:"2023-03-10" },
];

// users(id, clinic_id, full_name, email, phone, password_hash, role, is_active, last_login, created_at)
export const MOCK_USERS = [
  { id:"U001", clinic_id:"C001", full_name:"Dr. Priya Sharma",   email:"priya@citymedical.com",   phone:"9900001111", role:"Doctor",       is_active:true,  last_login:"2025-03-04 09:00", created_at:"2022-02-01" },
  { id:"U002", clinic_id:"C001", full_name:"Dr. Rajan Kumar",    email:"rajan@citymedical.com",   phone:"9900002222", role:"Doctor",       is_active:true,  last_login:"2025-03-04 08:45", created_at:"2022-03-15" },
  { id:"U003", clinic_id:"C001", full_name:"Dr. Anita Nair",     email:"anita@citymedical.com",   phone:"9900003333", role:"Doctor",       is_active:true,  last_login:"2025-03-03 17:30", created_at:"2022-04-10" },
  { id:"U004", clinic_id:"C001", full_name:"Sneha Receptionist", email:"sneha.r@citymedical.com", phone:"9900004444", role:"Receptionist", is_active:true,  last_login:"2025-03-04 08:00", created_at:"2023-01-05" },
  { id:"U005", clinic_id:"C001", full_name:"Rahul Admin",        email:"rahul.a@citymedical.com", phone:"9900005555", role:"Admin",        is_active:true,  last_login:"2025-03-04 07:55", created_at:"2022-01-16" },
  { id:"U006", clinic_id:"C002", full_name:"Dr. Suresh Menon",   email:"suresh@apollohealth.com", phone:"9900006666", role:"Doctor",       is_active:true,  last_login:"2025-03-03 18:00", created_at:"2022-07-01" },
  { id:"U007", clinic_id:"C002", full_name:"Pooja Receptionist", email:"pooja@apollohealth.com",  phone:"9900007777", role:"Receptionist", is_active:false, last_login:"2025-01-20 10:00", created_at:"2023-05-15" },
];

// patients(id, clinic_id, uhid, first_name, last_name, gender, dob, phone, email, address, blood_group, is_deleted, created_at)
export const MOCK_PATIENTS = [
  { id:"P001", clinic_id:"C001", uhid:"HF-2024-001", first_name:"Ramesh",  last_name:"Babu",     gender:"Male",   dob:"1985-03-15", phone:"9988776611", email:"ramesh@mail.com",  address:"12, MG Road, Bangalore",      blood_group:"B+",  doctor_id:"U001", is_deleted:false, created_at:"2024-10-02" },
  { id:"P002", clinic_id:"C001", uhid:"HF-2024-002", first_name:"Lakshmi", last_name:"Devi",     gender:"Female", dob:"1992-07-22", phone:"9988776622", email:"lakshmi@mail.com", address:"45, Park Street, Mumbai",      blood_group:"O+",  doctor_id:"U002", is_deleted:false, created_at:"2024-11-02" },
  { id:"P003", clinic_id:"C001", uhid:"HF-2024-003", first_name:"Suresh",  last_name:"Naidu",    gender:"Male",   dob:"1978-11-05", phone:"9988776633", email:"suresh@mail.com",  address:"78, Nehru Place, Delhi",       blood_group:"A+",  doctor_id:"U003", is_deleted:false, created_at:"2024-01-03" },
  { id:"P004", clinic_id:"C001", uhid:"HF-2024-004", first_name:"Kavitha", last_name:"Rao",      gender:"Female", dob:"1990-05-18", phone:"9988776644", email:"kavitha@mail.com", address:"23, Anna Salai, Chennai",      blood_group:"AB+", doctor_id:"U001", is_deleted:false, created_at:"2024-01-03" },
  { id:"P005", clinic_id:"C001", uhid:"HF-2024-005", first_name:"Arjun",   last_name:"Mehta",    gender:"Male",   dob:"1995-09-30", phone:"9988776655", email:"arjun@mail.com",   address:"56, Banjara Hills, Hyderabad", blood_group:"O-",  doctor_id:"U002", is_deleted:false, created_at:"2024-02-14" },
  { id:"P006", clinic_id:"C001", uhid:"HF-2024-006", first_name:"Meena",   last_name:"Krishnan", gender:"Female", dob:"1988-12-12", phone:"9988776666", email:"meena@mail.com",   address:"89, Salt Lake, Kolkata",       blood_group:"A-",  doctor_id:"U003", is_deleted:false, created_at:"2024-03-01" },
  { id:"P007", clinic_id:"C001", uhid:"HF-2024-007", first_name:"Deepak",  last_name:"Joshi",    gender:"Male",   dob:"1975-04-25", phone:"9988776677", email:"deepak@mail.com",  address:"34, Koregaon Park, Pune",     blood_group:"B+",  doctor_id:"U001", is_deleted:false, created_at:"2024-05-20" },
  { id:"P008", clinic_id:"C001", uhid:"HF-2024-008", first_name:"Ananya",  last_name:"Roy",      gender:"Female", dob:"1998-08-08", phone:"9988776688", email:"ananya@mail.com",  address:"67, Indiranagar, Bangalore",  blood_group:"O+",  doctor_id:"U002", is_deleted:false, created_at:"2025-03-02" },
];

// appointments(id, clinic_id, patient_id, doctor_id, appointment_date, slot_time, status, token_number, notes, created_at)
export const MOCK_APPOINTMENTS = [
  { id:"APT001", clinic_id:"C001", patient_id:"P001", doctor_id:"U001", appointment_date:"2025-03-04", slot_time:"09:00", status:"CheckedIn", token_number:1, notes:"Routine checkup",   created_at:"2025-03-01" },
  { id:"APT002", clinic_id:"C001", patient_id:"P002", doctor_id:"U002", appointment_date:"2025-03-04", slot_time:"09:30", status:"Booked",    token_number:2, notes:"Follow-up visit",   created_at:"2025-03-02" },
  { id:"APT003", clinic_id:"C001", patient_id:"P004", doctor_id:"U001", appointment_date:"2025-03-04", slot_time:"10:00", status:"Completed", token_number:3, notes:"BP monitoring",     created_at:"2025-03-01" },
  { id:"APT004", clinic_id:"C001", patient_id:"P005", doctor_id:"U003", appointment_date:"2025-03-04", slot_time:"10:30", status:"Booked",    token_number:4, notes:"Skin consultation", created_at:"2025-03-03" },
  { id:"APT005", clinic_id:"C001", patient_id:"P006", doctor_id:"U002", appointment_date:"2025-03-04", slot_time:"11:00", status:"Cancelled", token_number:5, notes:"Diabetes review",   created_at:"2025-03-02" },
  { id:"APT006", clinic_id:"C001", patient_id:"P008", doctor_id:"U001", appointment_date:"2025-03-05", slot_time:"09:00", status:"Booked",    token_number:1, notes:"Annual physical",   created_at:"2025-03-03" },
  { id:"APT007", clinic_id:"C001", patient_id:"P003", doctor_id:"U003", appointment_date:"2025-03-05", slot_time:"10:00", status:"Booked",    token_number:2, notes:"Joint pain",        created_at:"2025-03-03" },
];

// encounters(id, clinic_id, patient_id, doctor_id, appointment_id, visit_date, chief_complaint, notes, follow_up_date, created_at)
export const MOCK_ENCOUNTERS = [
  { id:"ENC001", clinic_id:"C001", patient_id:"P001", doctor_id:"U001", appointment_id:"APT001", visit_date:"2025-03-01 10:00", chief_complaint:"Fever and body ache",     notes:"Temperature 101°F. Advised rest and fluids.",       follow_up_date:"2025-03-08", created_at:"2025-03-01" },
  { id:"ENC002", clinic_id:"C001", patient_id:"P002", doctor_id:"U002", appointment_id:"APT002", visit_date:"2025-02-28 09:30", chief_complaint:"Persistent dry cough",    notes:"Chest clear. No wheezing. Prescribed antibiotics.", follow_up_date:"2025-03-07", created_at:"2025-02-28" },
  { id:"ENC003", clinic_id:"C001", patient_id:"P004", doctor_id:"U001", appointment_id:"APT003", visit_date:"2025-02-25 11:00", chief_complaint:"High blood pressure",     notes:"BP 150/95. Adjusted medication dosage.",            follow_up_date:"2025-03-25", created_at:"2025-02-25" },
  { id:"ENC004", clinic_id:"C001", patient_id:"P006", doctor_id:"U003", appointment_id:null,     visit_date:"2025-02-20 14:00", chief_complaint:"Uncontrolled blood sugar", notes:"HbA1c 8.2%. Revised diet plan and medication.",    follow_up_date:"2025-03-20", created_at:"2025-02-20" },
];

// diagnoses(id, encounter_id, icd_code, description)
export const MOCK_DIAGNOSES = [
  { id:"DX001", encounter_id:"ENC001", icd_code:"A09",   description:"Viral Fever / Acute gastroenteritis" },
  { id:"DX002", encounter_id:"ENC001", icd_code:"M79.3", description:"Myalgia — body ache" },
  { id:"DX003", encounter_id:"ENC002", icd_code:"J20.9", description:"Acute Bronchitis, unspecified" },
  { id:"DX004", encounter_id:"ENC003", icd_code:"I10",   description:"Essential (primary) hypertension" },
  { id:"DX005", encounter_id:"ENC004", icd_code:"E11.9", description:"Type 2 diabetes mellitus without complications" },
];

// prescriptions(id, encounter_id, medicine_name, dosage, frequency, duration, instructions)
export const MOCK_PRESCRIPTIONS = [
  { id:"RX001", encounter_id:"ENC001", medicine_name:"Paracetamol 500mg",  dosage:"1 tablet",  frequency:"TID", duration:"5 days",  instructions:"After food" },
  { id:"RX002", encounter_id:"ENC001", medicine_name:"Cetirizine 10mg",    dosage:"1 tablet",  frequency:"OD",  duration:"3 days",  instructions:"At bedtime" },
  { id:"RX003", encounter_id:"ENC002", medicine_name:"Amoxicillin 500mg",  dosage:"1 capsule", frequency:"TID", duration:"7 days",  instructions:"With food" },
  { id:"RX004", encounter_id:"ENC002", medicine_name:"Azithromycin 500mg", dosage:"1 tablet",  frequency:"OD",  duration:"5 days",  instructions:"Empty stomach" },
  { id:"RX005", encounter_id:"ENC002", medicine_name:"Cough Syrup 10ml",   dosage:"10 ml",     frequency:"BID", duration:"5 days",  instructions:"Before bed" },
  { id:"RX006", encounter_id:"ENC003", medicine_name:"Amlodipine 5mg",     dosage:"1 tablet",  frequency:"OD",  duration:"30 days", instructions:"Morning" },
  { id:"RX007", encounter_id:"ENC004", medicine_name:"Metformin 500mg",    dosage:"1 tablet",  frequency:"BID", duration:"30 days", instructions:"After food" },
];

// bills(id, clinic_id, patient_id, encounter_id, invoice_number, subtotal, gst_amount, discount, total_amount, status, created_at)
export const MOCK_BILLS = [
  { id:"B001", clinic_id:"C001", patient_id:"P001", encounter_id:"ENC001", invoice_number:"INV-2025-001", subtotal:1500, gst_amount:270, discount:0,   total_amount:1770, status:"Paid",    created_at:"2025-03-01" },
  { id:"B002", clinic_id:"C001", patient_id:"P002", encounter_id:"ENC002", invoice_number:"INV-2025-002", subtotal:2200, gst_amount:396, discount:200, total_amount:2396, status:"Partial", created_at:"2025-02-28" },
  { id:"B003", clinic_id:"C001", patient_id:"P004", encounter_id:"ENC003", invoice_number:"INV-2025-003", subtotal:900,  gst_amount:162, discount:0,   total_amount:1062, status:"Unpaid",  created_at:"2025-02-25" },
  { id:"B004", clinic_id:"C001", patient_id:"P005", encounter_id:null,     invoice_number:"INV-2025-004", subtotal:3500, gst_amount:630, discount:500, total_amount:3630, status:"Paid",    created_at:"2025-02-20" },
  { id:"B005", clinic_id:"C001", patient_id:"P006", encounter_id:"ENC004", invoice_number:"INV-2025-005", subtotal:1200, gst_amount:216, discount:0,   total_amount:1416, status:"Unpaid",  created_at:"2025-02-20" },
];

// payments(id, bill_id, payment_mode, transaction_reference, amount_paid, payment_date)
export const MOCK_PAYMENTS = [
  { id:"PAY001", bill_id:"B001", payment_mode:"UPI",  transaction_reference:"UPI-TX-789123",  amount_paid:1770, payment_date:"2025-03-01 11:30" },
  { id:"PAY002", bill_id:"B004", payment_mode:"Card", transaction_reference:"CARD-TX-456789", amount_paid:3630, payment_date:"2025-02-20 15:00" },
  { id:"PAY003", bill_id:"B002", payment_mode:"Cash", transaction_reference:"—",              amount_paid:1200, payment_date:"2025-03-02 10:00" },
];

// inventory / medicines
export const MOCK_MEDICINES = [
  { id:"M001", name:"Paracetamol 500mg",  batch:"B2024-01", stock:450, expiry:"2026-06", price:2.5,  category:"Analgesic",        status:"Good"     },
  { id:"M002", name:"Amoxicillin 250mg",  batch:"B2024-02", stock:18,  expiry:"2025-08", price:12.0, category:"Antibiotic",       status:"Low"      },
  { id:"M003", name:"Metformin 500mg",    batch:"B2024-03", stock:320, expiry:"2026-03", price:5.0,  category:"Antidiabetic",     status:"Good"     },
  { id:"M004", name:"Amlodipine 5mg",     batch:"B2024-04", stock:8,   expiry:"2025-05", price:8.5,  category:"Antihypertensive", status:"Critical" },
  { id:"M005", name:"Omeprazole 20mg",    batch:"B2024-05", stock:150, expiry:"2025-07", price:6.0,  category:"Antacid",          status:"Expiring" },
  { id:"M006", name:"Cetirizine 10mg",    batch:"B2024-06", stock:200, expiry:"2026-12", price:3.0,  category:"Antihistamine",    status:"Good"     },
  { id:"M007", name:"Atorvastatin 10mg",  batch:"B2024-07", stock:5,   expiry:"2025-04", price:15.0, category:"Statin",           status:"Critical" },
  { id:"M008", name:"Azithromycin 500mg", batch:"B2024-08", stock:85,  expiry:"2026-09", price:22.0, category:"Antibiotic",       status:"Good"     },
];

// audit_logs(id, clinic_id, user_id, action, entity_name, entity_id, timestamp)
export const MOCK_AUDIT_LOGS = [
  { id:"AL001", clinic_id:"C001", user_id:"U005", action:"Created",   entity_name:"Patient",     entity_id:"P008",   timestamp:"2025-03-02 09:10" },
  { id:"AL002", clinic_id:"C001", user_id:"U004", action:"Booked",    entity_name:"Appointment", entity_id:"APT006", timestamp:"2025-03-03 14:22" },
  { id:"AL003", clinic_id:"C001", user_id:"U001", action:"Completed", entity_name:"Encounter",   entity_id:"ENC001", timestamp:"2025-03-01 11:00" },
  { id:"AL004", clinic_id:"C001", user_id:"U005", action:"Paid",      entity_name:"Bill",        entity_id:"B001",   timestamp:"2025-03-01 11:35" },
];

// Chart data
export const REVENUE_DATA = [
  { month:"Sep", revenue:142000, expenses:89000  },
  { month:"Oct", revenue:168000, expenses:95000  },
  { month:"Nov", revenue:155000, expenses:91000  },
  { month:"Dec", revenue:180000, expenses:102000 },
  { month:"Jan", revenue:192000, expenses:108000 },
  { month:"Feb", revenue:210000, expenses:115000 },
  { month:"Mar", revenue:48000,  expenses:28000  },
];
export const DOCTOR_APPOINTMENTS = [
  { doctor:"Dr. Priya Sharma", appointments:48, completed:42 },
  { doctor:"Dr. Rajan Kumar",  appointments:62, completed:58 },
  { doctor:"Dr. Anita Nair",   appointments:35, completed:31 },
  { doctor:"Dr. Suresh Menon", appointments:41, completed:38 },
];
export const PAYMENT_MODES  = [{ name:"Cash", value:42, color:"#0E6C68" }, { name:"Card", value:31, color:"#14A3A0" }, { name:"UPI", value:27, color:"#4ECDC4" }];
export const PATIENT_GROWTH = [{ month:"Sep", patients:280 },{ month:"Oct", patients:310 },{ month:"Nov", patients:295 },{ month:"Dec", patients:340 },{ month:"Jan", patients:380 },{ month:"Feb", patients:420 },{ month:"Mar", patients:95 }];

// Current logged-in user
export const CURRENT_USER = {
  id: "EMP-001",
  name: "Dr. Rajesh Agarwal",
  initials: "RA",
  role: "Super Admin",
  designation: "Chief Medical Officer",
  department: "Administration",
  specialization: "Internal Medicine",
  email: "rajesh.agarwal@clinicos.com",
  phone: "+91 98765 43210",
  dob: "1978-06-12",
  gender: "Male",
  bloodGroup: "B+",
  joinDate: "2019-04-01",
  employeeId: "EMP-2019-001",
  clinic: "City Medical Center",
  address: "14, Jacaranda Apartments, Koramangala, Bangalore - 560034",
  qualifications: ["MBBS – AIIMS Delhi (2002)", "MD Internal Medicine – PGI Chandigarh (2006)", "MRCP (UK) (2009)"],
  recentActivity: [
    { date:"2025-03-04", action:"Approved invoice INV-003 payment extension" },
    { date:"2025-03-03", action:"Updated clinic working hours for Saturday" },
    { date:"2025-03-02", action:"Added new staff member: Nurse Preethi S." },
    { date:"2025-02-28", action:"Reviewed monthly revenue report – Feb 2025" },
    { date:"2025-02-25", action:"Configured low-stock alert threshold" },
  ],
  stats: { patientsHandled:412, appointmentsThisMonth:38, avgRating:4.8, yearsExperience:16 },
};

// Helpers
export const ptName   = p   => `${p.first_name} ${p.last_name}`;
export const doctorName = (uid, users = MOCK_USERS) => users.find(u => u.id === uid)?.full_name || "—";
