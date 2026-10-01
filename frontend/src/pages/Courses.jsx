import { startTransition, useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'
import { CourseCard } from '../components/Cards'
import { PageIntro } from '../components/Layout'

const emptyCourse = { title: '', skill: '', category: 'Programming', description: '', level: 'Beginner', duration: '', lessons: 6, outline: '' }

export default function Courses() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [level, setLevel] = useState('All')
  const [tab, setTab] = useState('all')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [enrolled, setEnrolled] = useState(new Set())
  const [form, setForm] = useState(emptyCourse)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [available, progress] = await Promise.all([api.courses(), user ? api.progress() : Promise.resolve([])])
    startTransition(() => {
      setCourses(available)
      setEnrolled(new Set(progress.map(item => item.course_id)))
    })
  }, [user])

  useEffect(() => {
    let active = true
    load().catch(requestError => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [load])

  const categories = ['All', ...new Set(courses.map(course => course.category || 'General'))]
  const levels = ['All', ...new Set(courses.map(course => course.level))]
  const visible = courses.filter(course => (category === 'All' || course.category === category) && (level === 'All' || course.level === level) && `${course.title} ${course.skill} ${course.level}`.toLowerCase().includes(query.trim().toLowerCase()) && (tab === 'all' || (tab === 'enrolled' && enrolled.has(course.id)) || (tab === 'created' && (user?.is_admin || course.creator_id === user?.id))))

  const handleEnroll = async course => {
    setError('')
    setMessage('')
    try {
      await api.enroll(course.id)
      setEnrolled(current => new Set([...current, course.id]))
      setMessage(`${course.title} enrolled successfully.`)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const edit = course => {
    setEditingId(course.id)
    setForm({ title: course.title, skill: course.skill, category: course.category, description: course.description, level: course.level, duration: course.duration, lessons: course.lessons, outline: course.outline || '' })
    setShowForm(true)
  }

  const resetForm = () => {
    setForm(emptyCourse)
    setEditingId(null)
    setShowForm(false)
  }

  const saveCourse = async event => {
    event.preventDefault()
    setError('')
    setMessage('')
    const payload = { ...form, lessons: Number(form.lessons) }
    try {
      if (editingId) {
        await api.updateCourse(editingId, payload)
        setMessage('Course updated successfully.')
      } else {
        await api.createCourse(payload)
        setMessage('Course created successfully.')
      }
      resetForm()
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return <div className="content-page"><PageIntro eyebrow="Micro-learning library" title={<>Small lessons.<br /><em>Real progress.</em></>} text="Browse practical courses connected to your learning path." />{user?.is_admin && <button className="button button-dark" onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}>{showForm ? 'Close course form' : 'Create a course'} <span>+</span></button>}{showForm && user?.is_admin && <form className="profile-form card" onSubmit={saveCourse}><div className="section-heading"><div><div className="eyebrow">Course administration</div><h2>{editingId ? 'Update a course.' : 'Create a micro-course.'}</h2></div></div><div className="form-grid"><label className="field"><span>Title</span><input required maxLength={160} value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} /></label><label className="field"><span>Skill</span><input required maxLength={120} value={form.skill} onChange={event => setForm(current => ({ ...current, skill: event.target.value }))} /></label><label className="field"><span>Category</span><input required maxLength={80} value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))} /></label><label className="field"><span>Difficulty</span><select value={form.level} onChange={event => setForm(current => ({ ...current, level: event.target.value }))}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label className="field"><span>Duration</span><input required maxLength={40} value={form.duration} onChange={event => setForm(current => ({ ...current, duration: event.target.value }))} /></label><label className="field"><span>Lessons</span><input required type="number" min="1" value={form.lessons} onChange={event => setForm(current => ({ ...current, lessons: event.target.value }))} /></label></div><label className="field"><span>Description</span><textarea required value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /></label><label className="field"><span>Course outline</span><textarea value={form.outline} onChange={event => setForm(current => ({ ...current, outline: event.target.value }))} /></label><button className="button button-dark" type="submit">{editingId ? 'Save course' : 'Publish course'}</button>{editingId && <button className="button button-ghost" type="button" onClick={resetForm}>Cancel edit</button>}</form>}{message && <p className="form-notice" role="status">{message}</p>}{error && <p className="form-notice" role="alert">{error}</p>}<div className="toolbar"><label className="search"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search courses" /></label><div className="filter-row">{['all', 'enrolled', 'created'].map(item => <button key={item} className={`filter ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item === 'all' ? 'Browse all' : item === 'enrolled' ? 'My enrollments' : user?.is_admin ? 'Manage courses' : 'My courses'}</button>)}{categories.map(item => <button key={item} className={`filter ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}{levels.map(item => <button key={item} className={`filter ${level === item ? 'active' : ''}`} onClick={() => setLevel(item)}>{item}</button>)}</div></div>{loading ? <div className="loading-state">Loading courses...</div> : <div className="card-grid three course-grid">{visible.length ? visible.map(course => <CourseCard key={course.id} course={course} enrolled={enrolled.has(course.id)} onEnroll={user ? () => handleEnroll(course) : undefined} onEdit={user?.is_admin ? () => edit(course) : undefined} />) : <p className="empty-state">No courses available for this view yet.</p>}</div>}</div>
}