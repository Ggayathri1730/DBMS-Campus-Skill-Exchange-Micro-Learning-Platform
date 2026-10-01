import { useEffect, useState } from 'react'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'
import { ReviewCard } from '../components/Cards'
import { PageIntro, SectionHeading } from '../components/Layout'

export default function Reviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('all')
  const [values, setValues] = useState({ requestId: '', rating: '5', review: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([api.reviews(), api.requests()]).then(([items, requestRows]) => {
      if (active) {
        setReviews(items)
        setRequests(requestRows)
      }
    }).catch(requestError => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.id])

  const reviewedRequestIds = new Set(reviews.filter(item => item.reviewer_id === user.id && item.request_id).map(item => item.request_id))
  const eligibleRequests = requests.filter(item => item.status === 'completed' && (item.requester_id === user.id || item.recipient_id === user.id) && !reviewedRequestIds.has(item.id))
  const selectedRequest = eligibleRequests.find(item => item.id === Number(values.requestId))
  const received = reviews.filter(item => item.partner_id === user.id)
  const visible = reviews.filter(item => tab === 'all' || (tab === 'received' && item.partner_id === user.id) || (tab === 'given' && item.reviewer_id === user.id))
  const average = received.length ? (received.reduce((sum, item) => sum + item.rating, 0) / received.length).toFixed(1) : '0.0'

  const submit = async event => {
    event.preventDefault()
    if (!selectedRequest || !values.review.trim()) return
    const partnerId = selectedRequest.requester_id === user.id ? selectedRequest.recipient_id : selectedRequest.requester_id
    setMessage('')
    setError('')
    try {
      const item = await api.createReview({ partner_id: partnerId, request_id: selectedRequest.id, rating: Number(values.rating), review: values.review.trim() })
      setReviews(current => [item, ...current])
      setValues(current => ({ ...current, requestId: '', review: '' }))
      setMessage('Review submitted successfully.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return <div className="content-page"><PageIntro eyebrow="Community feedback" title={<>Good learning deserves<br /><em>good feedback.</em></>} text="Share useful moments with your learning community." />{error && <p className="form-notice" role="alert">{error}</p>}{message && <p className="form-notice" role="status">{message}</p>}<div className="stat-strip"><div><strong>{reviews.length}</strong><span>Total reviews</span></div><div><strong>{average}</strong><span>Your average rating</span></div><div><strong>{received.length}</strong><span>Received</span></div><div><strong>{reviews.filter(item => item.reviewer_id === user.id).length}</strong><span>Given</span></div></div><div className="review-tabs">{['all', 'received', 'given'].map(item => <button key={item} className={`filter ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div><div className="review-layout"><section><SectionHeading eyebrow="From your community" title="Recent reviews" /><div className="review-list">{loading ? <div className="loading-state">Loading reviews...</div> : visible.length ? visible.map(item => <ReviewCard key={item.id} name={item.reviewer_name} initials={item.reviewer_name.split(' ').map(part => part[0]).join('').slice(0, 2)} rating={item.rating} review={item.review} />) : <p className="empty-state">No reviews yet.</p>}</div></section><form className="review-form card" onSubmit={submit}><div className="eyebrow">Add a review</div><h2>Pass it on.</h2><label className="field"><span>Completed exchange</span><select required value={values.requestId} onChange={event => setValues(current => ({ ...current, requestId: event.target.value }))}><option value="">Select an exchange</option>{eligibleRequests.map(item => <option key={item.id} value={item.id}>{item.skill_name} with {item.requester_id === user.id ? item.recipient_name : item.requester_name}</option>)}</select></label><label className="field"><span>Rating</span><select value={values.rating} onChange={event => setValues(current => ({ ...current, rating: event.target.value }))}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label><label className="field"><span>Your review</span><textarea value={values.review} onChange={event => setValues(current => ({ ...current, review: event.target.value }))} placeholder="What made this exchange useful?" required maxLength={2000} /></label>{!loading && eligibleRequests.length === 0 && <p className="empty-state">Complete a learning request before reviewing your partner.</p>}<button className="button button-dark full-width" disabled={loading || eligibleRequests.length === 0}>Submit review</button></form></div></div>
}