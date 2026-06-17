import { createContext, useContext, useState } from 'react'
import useCalendar from '../hooks/useCalendar'

const HubContext = createContext(null)

export function HubProvider({ children }) {
  const [settingsOpen,    setSettingsOpen]    = useState(false)
  const [activeSpTab,     setActiveSpTab]     = useState('goals')
  const [activeScopeTab,  setActiveScopeTab]  = useState('today')
  const [activeTopicPill, setActiveTopicPill] = useState('all')

  const calendar = useCalendar()

  return (
    <HubContext.Provider value={{
      settingsOpen,
      openSettings:  () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      activeSpTab, setActiveSpTab,
      activeScopeTab, setActiveScopeTab,
      activeTopicPill, setActiveTopicPill,
      calendar,
    }}>
      {children}
    </HubContext.Provider>
  )
}

export function useHub() {
  return useContext(HubContext)
}
