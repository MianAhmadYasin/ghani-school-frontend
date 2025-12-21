/**
 * Entity relationship and navigation helpers
 */

import { Student, Teacher, Class, Grade, Attendance } from '@/types'

/**
 * Get all students in a class
 */
export function getClassStudents(students: Student[], classId: string): Student[] {
  return students.filter(s => s.class_id === classId)
}

/**
 * Get all classes assigned to a teacher
 */
export function getTeacherClasses(classes: Class[], teacherId: string): Class[] {
  return classes.filter(c => c.teacher_id === teacherId)
}

/**
 * Get all students taught by a teacher
 */
export function getTeacherStudents(students: Student[], classes: Class[], teacherId: string): Student[] {
  const teacherClasses = getTeacherClasses(classes, teacherId)
  const classIds = teacherClasses.map(c => c.id)
  return students.filter(s => s.class_id && classIds.includes(s.class_id))
}

/**
 * Get all grades for a student
 */
export function getStudentGrades(grades: Grade[], studentId: string): Grade[] {
  return grades.filter(g => g.student_id === studentId)
}

/**
 * Get all attendance records for a student
 */
export function getStudentAttendance(attendance: Attendance[], studentId: string, students: Student[]): Attendance[] {
  const student = students.find(s => s.id === studentId)
  if (!student?.user_id) return []
  return attendance.filter(a => a.user_id === student.user_id)
}

/**
 * Get all grades for a class
 */
export function getClassGrades(grades: Grade[], classId: string, students: Student[]): Grade[] {
  const classStudents = getClassStudents(students, classId)
  const studentIds = classStudents.map(s => s.id)
  return grades.filter(g => studentIds.includes(g.student_id))
}

/**
 * Get all attendance records for a class
 */
export function getClassAttendance(attendance: Attendance[], classId: string, students: Student[]): Attendance[] {
  const classStudents = getClassStudents(students, classId)
  const userIds = classStudents.map(s => s.user_id).filter(Boolean)
  return attendance.filter(a => userIds.includes(a.user_id))
}

/**
 * Get student statistics
 */
export interface StudentStats {
  totalGrades: number
  passingGrades: number
  averageGrade: number
  passRate: number
  totalAttendance: number
  presentAttendance: number
  attendanceRate: number
}

export function getStudentStats(
  studentId: string,
  grades: Grade[],
  attendance: Attendance[],
  students: Student[]
): StudentStats {
  const studentGrades = getStudentGrades(grades, studentId)
  const studentAttendance = getStudentAttendance(attendance, studentId, students)

  const totalGrades = studentGrades.length
  const passingGrades = studentGrades.filter(g => Number(g.marks) >= 50).length
  const averageGrade = totalGrades > 0
    ? studentGrades.reduce((sum, g) => sum + Number(g.marks), 0) / totalGrades
    : 0
  const passRate = totalGrades > 0 ? (passingGrades / totalGrades) * 100 : 0

  const totalAttendance = studentAttendance.length
  const presentAttendance = studentAttendance.filter(a => a.status === 'present').length
  const attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0

  return {
    totalGrades,
    passingGrades,
    averageGrade,
    passRate,
    totalAttendance,
    presentAttendance,
    attendanceRate
  }
}

/**
 * Get class statistics
 */
export interface ClassStats {
  totalStudents: number
  totalGrades: number
  averageGrade: number
  passRate: number
  totalAttendance: number
  attendanceRate: number
}

export function getClassStats(
  classId: string,
  students: Student[],
  grades: Grade[],
  attendance: Attendance[]
): ClassStats {
  const classStudents = getClassStudents(students, classId)
  const classGrades = getClassGrades(grades, classId, students)
  const classAttendance = getClassAttendance(attendance, classId, students)

  const totalStudents = classStudents.length
  const totalGrades = classGrades.length
  const averageGrade = totalGrades > 0
    ? classGrades.reduce((sum, g) => sum + Number(g.marks), 0) / totalGrades
    : 0
  const passingGrades = classGrades.filter(g => Number(g.marks) >= 50).length
  const passRate = totalGrades > 0 ? (passingGrades / totalGrades) * 100 : 0

  const totalAttendance = classAttendance.length
  const presentAttendance = classAttendance.filter(a => a.status === 'present').length
  const attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0

  return {
    totalStudents,
    totalGrades,
    averageGrade,
    passRate,
    totalAttendance,
    attendanceRate
  }
}

/**
 * Get teacher statistics
 */
export interface TeacherStats {
  assignedClasses: number
  totalStudents: number
  totalGradesEntered: number
  totalAttendanceMarked: number
}

export function getTeacherStats(
  teacherId: string,
  classes: Class[],
  students: Student[],
  grades: Grade[],
  attendance: Attendance[]
): TeacherStats {
  const teacherClasses = getTeacherClasses(classes, teacherId)
  const teacherStudents = getTeacherStudents(students, classes, teacherId)
  
  const teacherClassIds = teacherClasses.map(c => c.id)
  const studentIds = teacherStudents.map(s => s.id)
  
  const gradesEntered = grades.filter(g => 
    studentIds.includes(g.student_id) || teacherClassIds.includes(g.class_id || '')
  ).length

  const userIds = teacherStudents.map(s => s.user_id).filter(Boolean)
  const attendanceMarked = attendance.filter(a => userIds.includes(a.user_id)).length

  return {
    assignedClasses: teacherClasses.length,
    totalStudents: teacherStudents.length,
    totalGradesEntered: gradesEntered,
    totalAttendanceMarked: attendanceMarked
  }
}

/**
 * Find entity by ID
 */
export function findStudent(students: Student[], id: string): Student | undefined {
  return students.find(s => s.id === id)
}

export function findTeacher(teachers: Teacher[], id: string): Teacher | undefined {
  return teachers.find(t => t.id === id)
}

export function findClass(classes: Class[], id: string): Class | undefined {
  return classes.find(c => c.id === id)
}

/**
 * Check if student is in class
 */
export function isStudentInClass(student: Student, classId: string): boolean {
  return student.class_id === classId
}

/**
 * Check if teacher teaches class
 */
export function doesTeacherTeachClass(teacher: Teacher, classId: string, classes: Class[]): boolean {
  const classData = findClass(classes, classId)
  return classData?.teacher_id === teacher.id
}









