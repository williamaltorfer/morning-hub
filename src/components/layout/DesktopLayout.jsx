import Header from './Header'
import VoiceBar from './VoiceBar'
import DayColumn from '../day/DayColumn'
import TasksSection from '../tasks/TasksSection'
import LifeSection from '../life/LifeSection'
import FeedColumn from '../feed/FeedColumn'

export default function DesktopLayout() {
  return (
    <>
      <Header />
      <VoiceBar />
      <div className="desktop-grid">
        <div className="d-col">
          <DayColumn />
        </div>
        <div className="d-col">
          <div className="desktop-col-header">
            <span className="desktop-col-title"><em>Tasks</em> &amp; Life</span>
            <span className="sec-action">+ Add</span>
          </div>
          <TasksSection />
          <LifeSection />
        </div>
        <div className="d-col">
          <FeedColumn />
        </div>
      </div>
    </>
  )
}
