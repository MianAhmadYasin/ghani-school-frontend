'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { settingsService, SystemSetting, AcademicYear } from '@/services/settingsService'

interface SettingsContextType {
  settings: SystemSetting[]
  academicYears: AcademicYear[]
  currentAcademicYear: AcademicYear | null
  schoolName: string
  isLoading: boolean
  getSetting: (key: string) => string | null
  refreshSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Fetch all settings
  const { data: settings = [], isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSystemSettings(),
  })

  // Fetch academic years
  const { data: academicYears = [], isLoading: yearsLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => settingsService.getAcademicYears(),
  })

  // Get current academic year
  const currentAcademicYear = academicYears.find((year: AcademicYear) => year.is_current) || academicYears[0] || null

  // Get school name from settings
  const schoolName = settings.find((s: SystemSetting) => s.setting_key === 'school_name')?.setting_value || 
                    settings.find((s: SystemSetting) => s.setting_key === 'institution_name')?.setting_value ||
                    'School Management System'

  // Helper function to get setting value by key
  const getSetting = (key: string): string | null => {
    const setting = settings.find((s: SystemSetting) => s.setting_key === key)
    return setting?.setting_value || null
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        academicYears,
        currentAcademicYear,
        schoolName,
        isLoading: settingsLoading || yearsLoading,
        getSetting,
        refreshSettings: () => {
          refetchSettings()
        },
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}









