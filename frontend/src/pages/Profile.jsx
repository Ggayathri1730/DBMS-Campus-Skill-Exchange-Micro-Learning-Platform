import { startTransition, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'
import { ReviewCard } from '../components/Cards'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [values, setValues] = useState({ full_name: user.full_name, student_id: user.student_id, email: user.email, course: user.course, year: user.year, bio: user.bio })
  const [summary, setSummary] = useState(null)
  const [reviews, setReviews] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([api.summary(), api.reviews()]).then(([profile, reviewRows]) => {
      if (active) startTransition(() => { setSummary(profile); setReviews(reviewRows) })
    }).catch(requestError => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.id])

  const update = event => setValues(current => ({ ...current, [event.target.name]: event.target.value }))

  const submit = async event => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const saved = await api.updateProfile(user.id, { full_name: values.full_name, email: values.email, course: values.course, year: values.year, bio: values.bio })
      setUser(saved)
      setValues(current => ({ ...current, ...saved }))
      setMessage('Profile updated successfully.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const teaching = summary?.skills_teaching || []
  const learning = summary?.skills_learning || []
  const receivedReviews = reviews.filter(item => item.partner_id === user.id)

  return <div className="profile-page content-page"><div className="profile-cover"><div className="profile-avatar">{values.full_name.split(' ').map(part => part[0]).join('').slice(0, 2)}</div><div><div className="eyebrow">Your public profile</div><h1>{values.full_name}</h1><p>{values.course} · {values.year}</p></div><Link to="/dashboard" className="button button-light">Back to dashboard</Link></div>{error && <p className="form-notice" role="alert">{error}</p>}{message && <p className="form-notice" role="status">{message}</p>}<div className="stat-strip"><div><strong>{loading ? '—' : summary?.learning_hours ?? 0}</strong><span>Learning hours</span></div><div><strong>{loading ? '—' : summary?.courses_completed ?? 0}</strong><span>Courses completed</span></div><div><strong>{loading ? '—' : Number(summary?.average_rating ?? 0).toFixed(1)}</strong><span>Average rating</span></div><div><strong>{loading ? '—' : summary?.review_count ?? 0}</strong><span>Reviews received</span></div></div><section className="card profile-skills"><div className="eyebrow">Exchange skills</div><h2>What you bring to campus.</h2>{loading ? <div className="loading-state">Loading profile details...</div> : <div className="tag-row">{teaching.map(skill => <span className="tag" key={`teach-${skill.id}`}>Teach {skill.name}</span>)}{learning.map(skill => <span className="tag tag-coral" key={`learn-${skill.id}`}>Learn {skill.name}</span>)}{teaching.length === 0 && learning.length === 0 && <p className="empty-state">No skills added yet.</p>}</div>}</section><form className="profile-form card" onSubmit={submit}><div className="section-heading"><div><div className="eyebrow">Personal details</div><h2>Tell your campus story.</h2></div></div><div className="form-grid"><label className="field"><span>Name</span><input name="full_name" value={values.full_name} onChange={update} minLength={2} maxLength={120} required /></label><label className="field"><span>Student ID</span><input name="student_id" value={values.student_id} readOnly /></label><label className="field"><span>Email</span><input name="email" type="email" value={values.email} onChange={update} required /></label><label className="field"><span>Department / course</span><input name="course" value={values.course} onChange={update} minLength={2} maxLength={120} required /></label><label className="field"><span>Year of study</span><input name="year" value={values.year} onChange={update} maxLength={40} required /></label></div><label className="field"><span>Bio</span><textarea name="bio" value={values.bio || ''} onChange={update} maxLength={4000} /></label><button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button></form><section className="sub-section"><div className="section-heading"><div><div className="eyebrow">Community feedback</div><h2>Reviews received</h2></div><Link to="/reviews" className="text-link">Open reviews ↗</Link></div>{loading ? <div className="loading-state">Loading reviews...</div> : receivedReviews.length ? <div className="review-list">{receivedReviews.slice(0, 3).map(item => <ReviewCard key={item.id} name={item.reviewer_name} initials={item.reviewer_name.split(' ').map(part => part[0]).join('').slice(0, 2)} rating={item.rating} review={item.review} />)}</div> : <p className="empty-state">No reviews received yet.</p>}</section></div>
}