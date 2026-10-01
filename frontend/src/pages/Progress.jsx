import { startTransition, useEffect, useState } from 'react'
import { api } from '../services/api'
import { ProgressCard } from '../components/Cards'
import { PageIntro, SectionHeading } from '../components/Layout'

const emptySession = { course_id: '', skill_id: '', duration_minutes: 30, scheduled_for: '', notes: '' }

export default function Progress() {
  const [items, setItems] = useState([])
  const [sessions, setSessions] = useState([])
  const [courses, setCourses] = useState([])
  const [skills, setSkills] = useState([])
  const [form, setForm] = useState(emptySession)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [progress, loggedSessions, availableCourses, availableSkills] = await Promise.all([api.progress(), api.sessions(), api.courses(), api.skills()])
    startTransition(() => {
      setItems(progress)
      setSessions(loggedSessions)
      setCourses(availableCourses)
      setSkills(availableSkills)
    })
  }

  useEffect(() => {
    let active = true
    load().catch(requestError => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const completedSessions = sessions.filter(item => item.status === 'completed')
  const overall = items.length ? Math.round(items.reduce((sum, item) => sum + item.progress, 0) / items.length) : 0
  const hours = (completedSessions.reduce((sum, item) => sum + item.duration_minutes, 0) / 60).toFixed(1)

  const advance = async item => {
    setError('')
    try {
      await api.updateProgress(item.id, { completed_lessons: item.completed_lessons + 1 })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const submit = async event => {
    event.preventDefault()
    if (!form.course_id && !form.skill_id) {
      setError('Choose a course or skill for this session.')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.createSession({ ...form, course_id: form.course_id ? Number(form.course_id) : null, skill_id: form.skill_id ? Number(form.skill_id) : null, duration_minutes: Number(form.duration_minutes), scheduled_for: form.scheduled_for || null })
      setMessage('Learning session logged.')
      setForm(emptySession)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return <div className="content-page"><PageIntro eyebrow="Your learning journey" title={<>Progress you can<br /><em>feel.</em></>} text="Track course completion and record the learning time connected to your student account." />{message && <p className="form-notice" role="status">{message}</p>}{error && <p className="form-notice" role="alert">{error}</p>}{loading ? <div className="loading-state">Loading your progress...</div> : <><div className="stat-strip"><div><strong>{hours}</strong><span>Learning hours</span></div><div><strong>{completedSessions.length}</strong><span>Completed sessions</span></div><div><strong>{items.length}</strong><span>Active courses</span></div><div><strong>{items.filter(item => item.progress === 100).length}</strong><span>Courses completed</span></div></div><form className="profile-form card" onSubmit={submit}><div className="section-heading"><div><div className="eyebrow">Keep a learning record</div><h2>Log a session.</h2></div></div><div className="form-grid"><label className="field"><span>Course</span><select value={form.course_id} onChange={event => setForm(current => ({ ...current, course_id: event.target.value }))}><option value="">No course</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label className="field"><span>Skill</span><select value={form.skill_id} onChange={event => setForm(current => ({ ...current, skill_id: event.target.value }))}><option value="">No skill</option>{skills.map(skill => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></label><label className="field"><span>Duration (minutes)</span><input type="number" min="1" max="1440" value={form.duration_minutes} onChange={event => setForm(current => ({ ...current, duration_minutes: event.target.value }))} required /></label><label className="field"><span>Session date</span><input type="datetime-local" value={form.scheduled_for} onChange={event => setForm(current => ({ ...current, scheduled_for: event.target.value }))} /></label></div><label className="field"><span>Notes</span><textarea value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} placeholder="What did you practice?" maxLength={4000} /></label><button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Log session'}</button></form><div className="progress-overview"><div><span className="card-kicker">Overall course progress</span><strong>{overall}%</strong><p>{items.reduce((sum, item) => sum + item.completed_lessons, 0)} lessons completed across your courses.</p></div><div className="ring"><span>{overall}<small>%</small></span></div></div><SectionHeading eyebrow="Your courses" title="Keep the streak alive" /><div className="progress-list">{items.length ? items.map(item => <ProgressCard key={item.id} title={item.title} progress={item.progress} lessons={item.completed_lessons} quiz={item.quiz_status} onAdvance={item.progress < 100 ? () => advance(item) : undefined} />) : <p className="empty-state">Enroll in a course to start tracking progress.</p>}</div><section className="sub-section"><SectionHeading eyebrow="Learning activity" title="Recent sessions" />{sessions.length ? <div className="request-table">{sessions.slice(0, 8).map(item => <div className="request-row" key={item.id}><div><strong>{item.course_id ? courses.find(course => course.id === item.course_id)?.title || 'Course session' : skills.find(skill => skill.id === item.skill_id)?.name || 'Skill session'}</strong><span>{item.notes || 'No session notes.'}</span></div><span className="status">{item.status}</span><span>{item.duration_minutes} min</span><span>{item.scheduled_for ? new Date(item.scheduled_for).toLocaleDateString() : 'Date not recorded'}</span></div>)}</div> : <p className="empty-state">No sessions logged yet.</p>}</section></>}</div>
}