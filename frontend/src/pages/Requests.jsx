import { useEffect, useState } from 'react'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'
import { RequestCard } from '../components/Cards'
import { PageIntro } from '../components/Layout'

const emptyForm = { recipient_id: '', skill_id: '', title: 'Learning exchange', message: '' }
const tabs = ['all', 'incoming', 'sent', 'pending', 'accepted', 'rejected', 'completed']

export default function Requests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [matches, setMatches] = useState([])
  const [tab, setTab] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([api.requests(), api.matches()]).then(([requestRows, matchRows]) => {
      if (active) {
        setRequests(requestRows)
        setMatches(matchRows)
      }
    }).catch(requestError => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.id])

  const partners = [...new Map(matches.map(item => [item.student_id, item])).values()]
  const offeredSkills = matches.filter(item => item.student_id === Number(form.recipient_id))
  const filtered = requests.filter(item => {
    if (tab === 'all') return true
    if (tab === 'incoming') return item.recipient_id === user.id
    if (tab === 'sent') return item.requester_id === user.id
    return item.status === tab
  })
  const countFor = value => requests.filter(item => {
    if (value === 'all') return true
    if (value === 'incoming') return item.recipient_id === user.id
    if (value === 'sent') return item.requester_id === user.id
    return item.status === value
  }).length

  const refresh = async () => setRequests(await api.requests())

  const create = async event => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.createRequest({ ...form, recipient_id: Number(form.recipient_id), skill_id: Number(form.skill_id) })
      setMessage('Learning request created.')
      setForm(emptyForm)
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const update = async (id, status) => {
    setError('')
    setMessage('')
    try {
      await api.updateRequest(id, status)
      setMessage(`Request ${status}.`)
      await refresh()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const formatRequest = request => ({
    skill: request.skill_name,
    partner: request.requester_id === user.id ? request.recipient_name : request.requester_name,
    status: request.status[0].toUpperCase() + request.status.slice(1),
    date: new Date(request.created_at).toLocaleDateString(),
  })

  return <div className="content-page"><PageIntro eyebrow="Your exchange inbox" title={<>Learning works<br /><em>better together.</em></>} text="Create, respond to, and complete learning requests stored in MySQL." /><form className="profile-form card" onSubmit={create}><div className="section-heading"><div><div className="eyebrow">Start an exchange</div><h2>Post a learning request.</h2></div></div><div className="form-grid"><label className="field"><span>Learning partner</span><select required value={form.recipient_id} onChange={event => setForm(current => ({ ...current, recipient_id: event.target.value, skill_id: '' }))}><option value="">Choose a match</option>{partners.map(match => <option key={match.student_id} value={match.student_id}>{match.student_name}</option>)}</select></label><label className="field"><span>Skill to learn</span><select required value={form.skill_id} onChange={event => setForm(current => ({ ...current, skill_id: event.target.value }))} disabled={!form.recipient_id}><option value="">Choose a skill</option>{offeredSkills.map(match => <option key={match.skill_id} value={match.skill_id}>{match.teaches}</option>)}</select></label><label className="field"><span>Title</span><input required minLength={2} maxLength={160} value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} /></label></div><label className="field"><span>Description</span><textarea maxLength={2000} value={form.message} onChange={event => setForm(current => ({ ...current, message: event.target.value }))} placeholder="Describe what you want to learn." /></label><button className="button button-dark" type="submit" disabled={saving || partners.length === 0}>{saving ? 'Sending...' : 'Send request'}</button>{partners.length === 0 && <p className="empty-state">Add learning goals and find a match before sending a request.</p>}</form>{message && <p className="form-notice" role="status">{message}</p>}{error && <p className="form-notice" role="alert">{error}</p>}<div className="request-tabs">{tabs.map(item => <button key={item} className={`filter ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)} <b>{countFor(item)}</b></button>)}</div><section className="request-table">{loading ? <div className="loading-state">Loading requests...</div> : filtered.length ? filtered.map(request => {
    const canRespond = request.status === 'pending' && request.recipient_id === user.id
    const canComplete = request.status === 'accepted'
    const actions = canRespond || canComplete ? status => update(request.id, status) : undefined
    return <RequestCard key={request.id} request={formatRequest(request)} onUpdate={actions} />
  }) : <p className="empty-state">No learning requests in this view yet.</p>}</section></div>
}