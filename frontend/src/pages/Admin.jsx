import { startTransition, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { PageIntro } from '../components/Layout'

export default function Admin() {
  const [overview, setOverview] = useState(null)
  const [students, setStudents] = useState([])
  const [requests, setRequests] = useState([])
  const [skills, setSkills] = useState([])
  const [courses, setCourses] = useState([])
  const [skillForm, setSkillForm] = useState({ name: '', category: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [summary, studentRows, requestRows, skillRows, courseRows] = await Promise.all([api.adminOverview(), api.students(), api.adminRequests(), api.skills(), api.courses()])
    startTransition(() => {
      setOverview(summary)
      setStudents(studentRows)
      setRequests(requestRows)
      setSkills(skillRows)
      setCourses(courseRows)
    })
  }

  useEffect(() => {
    let active = true
    load().catch(requestError => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const createSkill = async event => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await api.createSkill(skillForm)
      setSkillForm({ name: '', category: '' })
      setMessage('Skill added to the library.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return <div className="admin-page"><PageIntro eyebrow="Database administration" title={<>Keep the exchange<br /><em>moving.</em></>} text="Review and manage platform records through protected FastAPI admin endpoints." />{error && <p className="form-notice" role="alert">{error}</p>}{message && <p className="form-notice" role="status">{message}</p>}{loading ? <div className="loading-state">Loading administration data...</div> : <><div className="admin-stats"><div><span>Total students</span><strong>{overview.total_students}</strong></div><div><span>Total skills</span><strong>{overview.total_skills}</strong></div><div><span>Active requests</span><strong>{overview.active_requests}</strong></div><div><span>Courses · Reviews</span><strong>{overview.courses} · {overview.reviews}</strong></div></div><div className="admin-grid"><section className="admin-table card"><div className="section-heading"><div><div className="eyebrow">Students</div><h2>Registered campus</h2></div></div><table><thead><tr><th>Name</th><th>Student ID</th><th>Course</th><th>Year</th></tr></thead><tbody>{students.map(student => <tr key={student.id}><td>{student.full_name}</td><td>{student.student_id}</td><td>{student.course}</td><td>{student.year}</td></tr>)}</tbody></table></section><section className="admin-table card"><div className="section-heading"><div><div className="eyebrow">Requests</div><h2>Exchange activity</h2></div></div><table><thead><tr><th>Requester</th><th>Recipient</th><th>Skill</th><th>Status</th></tr></thead><tbody>{requests.map(request => <tr key={request.id}><td>{request.requester}</td><td>{request.recipient}</td><td>{request.skill}</td><td>{request.status}</td></tr>)}</tbody></table>{requests.length === 0 && <p className="empty-state">No requests yet.</p>}</section><section className="admin-table card"><div className="section-heading"><div><div className="eyebrow">Skill library</div><h2>{skills.length} available skills</h2></div></div><form onSubmit={createSkill}><div className="form-grid"><label className="field"><span>Skill name</span><input required maxLength={120} value={skillForm.name} onChange={event => setSkillForm(current => ({ ...current, name: event.target.value }))} /></label><label className="field"><span>Category</span><input required maxLength={80} value={skillForm.category} onChange={event => setSkillForm(current => ({ ...current, category: event.target.value }))} /></label></div><button className="button button-dark" type="submit">Add skill</button></form><table><thead><tr><th>Skill</th><th>Category</th><th>Can teach</th><th>Learning goals</th></tr></thead><tbody>{skills.map(skill => <tr key={skill.id}><td>{skill.name}</td><td>{skill.category}</td><td>{skill.can_teach_count}</td><td>{skill.wants_to_learn_count}</td></tr>)}</tbody></table></section><section className="admin-table card"><div className="section-heading"><div><div className="eyebrow">Courses</div><h2>{courses.length} courses in the library</h2></div><Link className="text-link" to="/courses">Manage courses ↗</Link></div><table><thead><tr><th>Title</th><th>Skill</th><th>Level</th><th>Enrolled</th></tr></thead><tbody>{courses.map(course => <tr key={course.id}><td>{course.title}</td><td>{course.skill}</td><td>{course.level}</td><td>{course.enrollment_count}</td></tr>)}</tbody></table></section></div></>}</div>
}