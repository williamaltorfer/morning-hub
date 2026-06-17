import { createContext, useContext, useState } from 'react'
import useCalendar from '../hooks/useCalendar'
import useBriefing from '../hooks/useBriefing'
import useVoice from '../hooks/useVoice'

const HubContext = createContext(null)

export function HubProvider({ children }) {
  const [settingsOpen,    setSettingsOpen]    = useState(false)
  const [activeSpTab,     setActiveSpTab]     = useState('goals')
  const [activeScopeTab,  setActiveScopeTab]  = useState('today')
  const [activeTopicPill, setActiveTopicPill] = useState('all')

  const calendar = useCalendar()
  const briefing = useBriefing({
    events:    calendar.events,
    connected: calendar.connected,
  })
  const voice = useVoice({
    events:   calendar.events,
    briefing: briefing.briefing,
  })

  return (
    <HubContext.Provider value={{
      settingsOpen,
      openSettings:  () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      activeSpTab, setActiveSpTab,
      activeScopeTab, setActiveScopeTab,
      activeTopicPill, setActiveTopicPill,
      calendar,
      briefing,
      voice,
    }}>
      {children}
    </HubContext.Provider>
  )
}

export function useHub() {
  return useContext(HubContext)
}
