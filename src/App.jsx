import DesktopLayout from './components/layout/DesktopLayout'
import MobileLayout from './components/layout/MobileLayout'
import SettingsPanel from './components/settings/SettingsPanel'

export default function App() {
  return (
    <>
      <div className="desktop-shell">
        <DesktopLayout />
      </div>
      <div className="mobile-shell">
        <MobileLayout />
      </div>
      <SettingsPanel />
    </>
  )
}
