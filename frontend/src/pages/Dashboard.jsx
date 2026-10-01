import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'
import { ProgressCard, RequestCard, StudentCard } from '../components/Cards'
import { SectionHeading } from '../components/Layout'

const emptyData = { skills: [], matches: [], requests: [], progress: [], reviews: [], summary: null }

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([api.studentSkills(user.id), api.matches(), api.requests(), api.progress(), api.reviews(), api.summary()]).then(([skills, matches, requests, progress, reviews, summary]) => {
      if (active) setData({ skills, matches, requests, progress, reviews, summary })
    }).catch(requestError => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.id])

  if (loading) return <div className="dashboard"><div className="loading-state">Loading your campus activity...</div></div>
  if (error) return <div className="dashboard"><p className="form-notice" role="alert">{error}</p></div>

  const teach = data.skills.filter(skill => skill.can_teach)
  const learn = data.skills.filter(skill => skill.wants_to_learn)
  const overall = data.progress.length ? Math.round(data.progress.reduce((sum, item) => sum + item.progress, 0) / data.progress.length) : 0
  const reviewAverage = data.summary?.average_rating ?? 0

  return <div className="dashboard"><div className="welcome-row"><div><div className="eyebrow">Your campus exchange</div><h1>Good morning, {user.full_name.split(' ')[0]}<span>.</span></h1><p>Your progress and campus activity are connected to the campus exchange.</p></div><Link to="/matching" className="button button-dark">Find a match <span>↗</span></Link></div><div className="stat-strip"><div><strong>{String(teach.length).padStart(2, '0')}</strong><span>Skills shared</span></div><div><strong>{String(data.progress.length).padStart(2, '0')}</strong><span>Active courses</span></div><div><strong>{overall}%</strong><span>Learning progress</span></div><div><strong>{data.summary?.review_count ? Number(reviewAverage).toFixed(1) : '—'}</strong><span>Average rating</span></div></div><div className="dashboard-grid"><section><SectionHeading eyebrow="Your exchange profile" title="The skills in your orbit" action={<Link to="/profile" className="text-link">Edit profile ↗</Link>} /><div className="skill-orbit card"><div><span className="card-kicker">I can teach</span><div className="tag-row">{teach.map(skill => <span className="tag" key={skill.id}>{skill.name}</span>)}</div>{teach.length === 0 && <p>No teaching skills yet.</p>}</div><div className="divider" /><div><span className="card-kicker">I want to learn</span><div className="tag-row">{learn.map(skill => <span className="tag tag-coral" key={skill.id}>{skill.name}</span>)}</div>{learn.length === 0 && <p>No learning goals yet.</p>}</div></div><SectionHeading eyebrow="Suggested for you" title="People worth meeting" action={<Link to="/matching" className="text-link">See matches ↗</Link>} /><div className="card-grid two">{data.matches.slice(0, 2).map(match => <StudentCard key={`${match.student_id}-${match.skill_id}`} student={{ name: match.student_name, initials: match.student_name.split(' ').map(part => part[0]).join('').slice(0, 2), course: match.course, teaches: match.teaches, wants: match.wants, availability: match.match_type === 'reciprocal' ? 'Reciprocal exchange' : 'Can teach a skill you want' }} />)}{data.matches.length === 0 && <p className="empty-state">Add teaching and learning skills to find complementary students.</p>}</div></section><aside><div className="profile-mini card"><div className="person"><span className="avatar avatar-large">{user.full_name.split(' ').map(part => part[0]).join('').slice(0, 2)}</span><div><h3>{user.full_name}</h3><p>{user.course}, {user.year}</p></div></div><Link to="/profile" className="text-link">Edit your profile ↗</Link></div><SectionHeading eyebrow="Recent activity" title="Requests" action={<Link to="/requests" className="text-link">View all ↗</Link>} /><div className="progress-list">{data.requests.slice(0, 2).map(item => <RequestCard key={item.id} request={{ skill: item.skill_name, partner: item.requester_id === user.id ? item.recipient_name : item.requester_name, status: item.status[0].toUpperCase() + item.status.slice(1), date: new Date(item.created_at).toLocaleDateString() }} />)}{data.requests.length === 0 && <p className="empty-state">No exchange requests yet.</p>}</div></aside></div><div className="dashboard-grid"><section><SectionHeading eyebrow="Keep learning" title="Your progress" action={<Link to="/progress" className="text-link">Open progress ↗</Link>} /><div className="progress-list">{data.progress.slice(0, 2).map(item => <ProgressCard key={item.id} title={item.title} progress={item.progress} lessons={item.completed_lessons} quiz={item.quiz_status} />)}{data.progress.length === 0 && <p className="empty-state">Enroll in a course to start tracking progress.</p>}</div></section></div></div>
}