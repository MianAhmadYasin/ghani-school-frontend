/**
 * Comprehensive Grading System
 * Based on provided school criteria
 */

// Configuration
export const GRADING_CONFIG = {
  absentMarker: "A", // case-insensitive
  promotionThresholdPercent: 40, // default; configurable
  gradeBands: {
    A_PLUS: { min: 80, label: "A+" },
    A: { min: 70, max: 79.99, label: "A" },
    B: { min: 60, max: 69.99, label: "B" },
    C: { min: 50, max: 59.99, label: "C" },
    D: { min: 40, max: 49.99, label: "D" },
    F: { min: 0, max: 39.99, label: "F" }
  },
  rounding: 2, // decimal places for percentages
  treatBlankAsAbsent: false
}

// Types
export interface SubjectResult {
  subjectId: string
  subjectName: string
  maxMarks: number
  passMark: number
  obtained: number | string
  numericMark: number
  status: 'Pass' | 'Fail' | 'Absent'
}

export interface TermResult {
  termNumber: number
  subjects: SubjectResult[]
  termTotal: number
  termMaxTotal: number
  termPercent: number
  statuses: string[]
}

export interface StudentGradeData {
  studentId: string
  name: string
  roll: string
  class: string
  terms: TermResult[]
  combinedT2: number
  finalAggregate: number
  finalPercent: number
  finalGrade: string
  finalStatus: 'Pass' | 'Fail' | 'Absent'
  promoted: boolean
  rank: number
  rankLabel: string
}

export interface ClassSummary {
  totalStudents: number
  absentStudents: number
  presentStudents: number
  passCount: number
  failCount: number
  passPercentage: number
  yearPassPercent: number
}

/**
 * Compute subject status based on obtained marks and pass criteria
 */
export function computeSubjectStatus(
  obtained: number | string,
  passMark: number,
  absentMarker: string = GRADING_CONFIG.absentMarker
): { numericMark: number; status: 'Pass' | 'Fail' | 'Absent' } {
  const obtainedStr = String(obtained).trim()
  
  // Check if absent
  if (obtainedStr.toLowerCase() === absentMarker.toLowerCase()) {
    return { numericMark: 0, status: 'Absent' }
  }
  
  // Check if blank and treatBlankAsAbsent is true
  if (GRADING_CONFIG.treatBlankAsAbsent && (obtainedStr === '' || obtainedStr === 'null' || obtainedStr === 'undefined')) {
    return { numericMark: 0, status: 'Absent' }
  }
  
  // Convert to number
  const numericMark = parseFloat(obtainedStr)
  
  // Check if valid number
  if (isNaN(numericMark)) {
    throw new Error(`Invalid obtained value: ${obtained}`)
  }
  
  // Determine status
  if (numericMark >= passMark) {
    return { numericMark, status: 'Pass' }
  } else {
    return { numericMark, status: 'Fail' }
  }
}

/**
 * Compute term summary from subjects
 */
export function computeTermSummary(subjects: SubjectResult[]): {
  termTotal: number
  termMaxTotal: number
  termPercent: number
  statuses: string[]
} {
  const termTotal = subjects.reduce((sum, subject) => sum + subject.numericMark, 0)
  const termMaxTotal = subjects.reduce((sum, subject) => sum + subject.maxMarks, 0)
  const termPercent = termMaxTotal > 0 ? (termTotal / termMaxTotal) * 100 : 0
  const statuses = subjects.map(subject => subject.status)
  
  return {
    termTotal,
    termMaxTotal,
    termPercent: Math.round(termPercent * Math.pow(10, GRADING_CONFIG.rounding)) / Math.pow(10, GRADING_CONFIG.rounding),
    statuses
  }
}

/**
 * Compute final status from subject statuses (exact rule order)
 */
export function computeFinalStatus(statuses: string[]): 'Pass' | 'Fail' | 'Absent' {
  const absentCount = statuses.filter(status => status === 'Absent').length
  const failCount = statuses.filter(status => status === 'Fail').length
  
  // Rule 1: If absentCount >= 4 → finalStatus = "Absent"
  if (absentCount >= 4) return 'Absent'
  
  // Rule 2: If absentCount == 2 OR absentCount == 3 → finalStatus = "Fail"
  if (absentCount === 2 || absentCount === 3) return 'Fail'
  
  // Rule 3: If failCount >= 2 → finalStatus = "Fail"
  if (failCount >= 2) return 'Fail'
  
  // Rule 4: If failCount == 1 AND absentCount == 1 → finalStatus = "Fail"
  if (failCount === 1 && absentCount === 1) return 'Fail'
  
  // Rule 5: Else → finalStatus = "Pass"
  return 'Pass'
}

/**
 * Map percentage to grade using grade bands
 */
export function mapPercentToGrade(percent: number): string {
  const { gradeBands } = GRADING_CONFIG
  
  if (percent >= gradeBands.A_PLUS.min) return gradeBands.A_PLUS.label
  if (percent >= gradeBands.A.min) return gradeBands.A.label
  if (percent >= gradeBands.B.min) return gradeBands.B.label
  if (percent >= gradeBands.C.min) return gradeBands.C.label
  if (percent >= gradeBands.D.min) return gradeBands.D.label
  return gradeBands.F.label
}

/**
 * Convert rank number to ordinal label
 */
export function getRankLabel(rank: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const remainder = rank % 100
  return rank + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0])
}

/**
 * Calculate rankings for students
 */
export function calculateRankings(students: StudentGradeData[]): StudentGradeData[] {
  // Sort by finalAggregate (higher first), then by name for ties
  const sorted = [...students].sort((a, b) => {
    if (b.finalAggregate !== a.finalAggregate) {
      return b.finalAggregate - a.finalAggregate
    }
    return a.name.localeCompare(b.name)
  })
  
  // Assign ranks (handle ties)
  let currentRank = 1
  let currentAggregate = sorted[0]?.finalAggregate
  
  return sorted.map((student, index) => {
    if (student.finalAggregate !== currentAggregate) {
      currentRank = index + 1
      currentAggregate = student.finalAggregate
    }
    
    return {
      ...student,
      rank: currentRank,
      rankLabel: getRankLabel(currentRank)
    }
  })
}

/**
 * Calculate promotion status
 */
export function calculatePromotion(finalStatus: string, finalPercent: number): boolean {
  return finalStatus === 'Pass' && finalPercent >= GRADING_CONFIG.promotionThresholdPercent
}

/**
 * Process complete student grade data
 */
export function processStudentGrades(
  studentId: string,
  name: string,
  roll: string,
  classLevel: string,
  termsData: Array<{
    termNumber: number
    subjects: Array<{
      subjectId: string
      subjectName: string
      maxMarks: number
      passMark: number
      obtained: number | string
    }>
  }>
): StudentGradeData {
  // Process each term
  const terms: TermResult[] = termsData.map(termData => {
    const subjects: SubjectResult[] = termData.subjects.map(subject => {
      const { numericMark, status } = computeSubjectStatus(
        subject.obtained,
        subject.passMark
      )
      
      return {
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        maxMarks: subject.maxMarks,
        passMark: subject.passMark,
        obtained: subject.obtained,
        numericMark,
        status
      }
    })
    
    const termSummary = computeTermSummary(subjects)
    
    return {
      termNumber: termData.termNumber,
      subjects,
      ...termSummary
    }
  })
  
  // Calculate aggregates
  const T1 = terms[0]?.termTotal || 0
  const T2 = terms[1]?.termTotal || 0
  const T3 = terms[2]?.termTotal || 0
  
  const combinedT2 = (T1 + T2) / 2
  const finalAggregate = (T1 + T2 + T3) / 3
  
  // Calculate final percentage (using consistent denominator)
  const termMaxTotal = terms[0]?.termMaxTotal || 1
  const finalPercent = (finalAggregate / termMaxTotal) * 100
  
  // Get final grade
  const finalGrade = mapPercentToGrade(finalPercent)
  
  // Get final status (using latest term statuses or aggregated)
  const finalStatuses = terms[terms.length - 1]?.statuses || []
  const finalStatus = computeFinalStatus(finalStatuses)
  
  // Calculate promotion
  const promoted = calculatePromotion(finalStatus, finalPercent)
  
  return {
    studentId,
    name,
    roll,
    class: classLevel,
    terms,
    combinedT2: Math.round(combinedT2 * 100) / 100,
    finalAggregate: Math.round(finalAggregate * 100) / 100,
    finalPercent: Math.round(finalPercent * 100) / 100,
    finalGrade,
    finalStatus,
    promoted,
    rank: 0, // Will be set by calculateRankings
    rankLabel: '' // Will be set by calculateRankings
  }
}

/**
 * Calculate class summary statistics
 */
export function calculateClassSummary(students: StudentGradeData[]): ClassSummary {
  const totalStudents = students.length
  const absentStudents = students.filter(s => s.finalStatus === 'Absent').length
  const presentStudents = totalStudents - absentStudents
  const passCount = students.filter(s => s.finalStatus === 'Pass').length
  const failCount = presentStudents - passCount
  const passPercentage = presentStudents > 0 ? (passCount / presentStudents) * 100 : 0
  
  // Calculate year pass percentage (average of term pass percentages)
  // This would need term-wise data, simplified for now
  const yearPassPercent = passPercentage
  
  return {
    totalStudents,
    absentStudents,
    presentStudents,
    passCount,
    failCount,
    passPercentage: Math.round(passPercentage * 100) / 100,
    yearPassPercent: Math.round(yearPassPercent * 100) / 100
  }
}

/**
 * Generate report card data for a student
 */
export function generateReportCard(student: StudentGradeData) {
  return {
    studentId: student.studentId,
    name: student.name,
    roll: student.roll,
    class: student.class,
    terms: student.terms.map(term => ({
      termNumber: term.termNumber,
      termTotal: term.termTotal,
      termMaxTotal: term.termMaxTotal,
      termPercent: term.termPercent,
      subjectResults: term.subjects.map(subject => ({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        numericMark: subject.numericMark,
        status: subject.status
      }))
    })),
    combinedT2: student.combinedT2,
    finalAggregate: student.finalAggregate,
    finalPercent: student.finalPercent,
    finalGrade: student.finalGrade,
    finalStatus: student.finalStatus,
    promoted: student.promoted,
    rank: student.rank,
    rankLabel: student.rankLabel
  }
}

/**
 * Validate grade data
 */
export function validateGradeData(data: any): boolean {
  try {
    // Basic validation
    if (!data.studentId || !data.name || !data.roll || !data.class) {
      return false
    }
    
    if (!Array.isArray(data.terms) || data.terms.length === 0) {
      return false
    }
    
    // Validate each term
    for (const term of data.terms) {
      if (!Array.isArray(term.subjects) || term.subjects.length === 0) {
        return false
      }
      
      // Validate each subject
      for (const subject of term.subjects) {
        if (!subject.subjectId || !subject.subjectName || 
            typeof subject.maxMarks !== 'number' || 
            typeof subject.passMark !== 'number') {
          return false
        }
      }
    }
    
    return true
  } catch (error) {
    console.error('Grade data validation error:', error)
    return false
  }
}














