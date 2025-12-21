// User types
export type UserRole = 'admin' | 'principal' | 'teacher' | 'student'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  address?: string
  avatar_url?: string
  created_at: string
}

export interface GuardianInfo {
  name: string
  relation: string
  phone: string
  email?: string
  address?: string
}

export interface Student {
  id: string
  user_id: string
  admission_number: string
  admission_date: string
  class_id?: string
  guardian_info: GuardianInfo
  status: string
  created_at: string
  user?: User
}

export interface SalaryInfo {
  basic_salary: number
  allowances?: number
  currency: string
}

export interface Teacher {
  id: string
  user_id: string
  employee_id: string
  join_date: string
  qualification: string
  subjects: string[]
  salary_info: SalaryInfo
  status: string
  created_at: string
  user?: User
}

export interface Class {
  id: string
  name: string
  section: string
  teacher_id?: string
  academic_year: string
  created_at: string
}

export interface Grade {
  id: string
  student_id: string
  class_id: string
  subject: string
  marks: number
  grade: string
  term: string
  academic_year: string
  remarks?: string
  created_at: string
  updated_at?: string
}

export interface StudentPosition {
  student_id: string
  student_name: string
  admission_number: string
  position: number
  average_marks: number
  total_marks: number
  total_subjects: number
  passed_subjects: number
}

export interface ClassPositions {
  class_id: string
  class_name: string
  term: string
  academic_year: string
  positions: StudentPosition[]
  class_average?: number
}

// Exam Management Types
export type ExamType = 'term_exam' | 'mid_term' | 'final' | 'quiz' | 'assignment' | 'annual' | 'custom'
export type ExamStatus = 'draft' | 'published' | 'completed' | 'archived'
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type ResultStatus = 'active' | 'absent' | 'absent_with_excuse' | 'incomplete'

export interface Exam {
  id: string
  exam_name: string
  exam_type: ExamType
  term: string
  academic_year: string
  class_id: string
  subject: string
  total_marks: number
  passing_marks: number
  exam_date?: string
  duration_minutes?: number
  instructions?: string
  created_by: string
  created_by_name?: string
  status: ExamStatus
  created_at: string
  updated_at?: string
}

export interface ExamResult {
  id: string
  exam_id: string
  student_id: string
  student_name?: string
  admission_number?: string
  marks_obtained: number
  total_marks: number
  grade?: string
  percentage: number
  status: ResultStatus
  remarks?: string
  uploaded_by: string
  uploaded_by_name?: string
  uploaded_at: string
  created_at: string
  updated_at?: string
}

export interface ExamSettings {
  id: string
  school_name: string
  terms_config: string[]
  exam_types: string[]
  default_grading_criteria?: Record<string, any>
  bulk_upload_enabled: boolean
  approval_required: boolean
  auto_calculate_grade: boolean
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at?: string
}

export interface BulkResultEntry {
  student_id?: string
  admission_number?: string
  student_name?: string
  marks_obtained: number
  status?: ResultStatus
  remarks?: string
}

export interface GradingCriterion {
  id?: string
  grade_name: string
  min_marks: number
  max_marks: number
  gpa_value: number
  is_passing: boolean
  display_order: number
}

export interface GradingScheme {
  id: string
  name: string
  description?: string
  is_active: boolean
  is_default: boolean
  criteria: GradingCriterion[]
  created_at: string
  updated_at?: string
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface Attendance {
  id: string
  user_id: string
  date: string
  status: AttendanceStatus
  marked_by: string
  remarks?: string
  created_at: string
}

export interface StationeryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  reorder_level: number
  created_at: string
}

export interface StationeryDistribution {
  id: string
  student_id: string
  item_id: string
  quantity: number
  distributed_date: string
  distributed_by: string
  created_at: string
}

export interface SalaryRecord {
  id: string
  teacher_id: string
  month: number
  year: number
  basic_salary: number
  deductions: number
  bonuses: number
  net_salary: number
  paid_date?: string
  created_at: string
}

export interface Expense {
  id: string
  category: string
  amount: number
  description: string
  date: string
  recorded_by: string
  payment_method?: string
  created_at: string
}

export interface Donation {
  id: string
  donor_name: string
  amount: number
  date: string
  purpose?: string
  receipt_number: string
  payment_method?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  link?: string
  announcement_id?: string
  read_at?: string
  created_at: string
}

export interface Timetable {
  id: string
  class_id: string
  period_duration_minutes: number
  break_duration_minutes: number
  total_periods_per_day: number
  working_days: number[] // [1,2,3,4,5] for Monday-Friday
  start_time: string
  status: 'draft' | 'final'
  created_by: string
  created_at: string
  updated_at: string
}

export interface TimetableEntry {
  id: string
  timetable_id: string
  day_of_week: number // 1=Monday, 7=Sunday
  period_number: number
  is_break: boolean
  subject?: string
  teacher_id?: string
  class_id?: string
  start_time?: string
  end_time?: string
}

export interface Syllabus {
  id: string
  class_id: string
  class_name: string
  subject: string
  term: 'first_term' | 'second_term' | 'third_term' | 'annual'
  year: number
  file_url: string
  file_name: string
  file_type: string
  file_size?: number
  uploaded_by: string
  upload_date: string
  created_at: string
  updated_at: string
}

// API Response types
export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ApiError {
  detail: string
}











