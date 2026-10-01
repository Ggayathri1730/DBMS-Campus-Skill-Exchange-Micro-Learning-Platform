import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { MatchCard } from '../components/Cards'
import { PageIntro } from '../components/Layout'

export default function Matching() {
	const [matches, setMatches] = useState([])
	const [message, setMessage] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(true)
	const [requestingId, setRequestingId] = useState(null)

	useEffect(() => {
		let active = true
		api.matches().then(items => { if (active) setMatches(items) }).catch(requestError => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
		return () => { active = false }
	}, [])

	const send = async match => {
		const key = `${match.student_id}-${match.skill_id}`
		setRequestingId(key)
		setMessage('')
		setError('')
		try {
			await api.createRequest({ recipient_id: match.student_id, skill_id: match.skill_id, message: `I would like to learn ${match.teaches}.` })
			setMessage(`Learning request sent to ${match.student_name}.`)
		} catch (requestError) {
			setError(requestError.message)
		} finally {
			setRequestingId(null)
		}
	}

	return <div className="content-page"><PageIntro eyebrow="Skill matching" title={<>The best exchange<br /><em>goes both ways.</em></>} text="Matches are calculated from complementary skills in the campus database." />{error && <p className="form-notice" role="alert">{error}</p>}{message && <p className="form-notice" role="status">{message}</p>}{loading ? <div className="loading-state">Finding students with complementary skills...</div> : <><div className="match-summary"><div><strong>{matches.length}</strong><span>skill matches</span></div><div><strong>{new Set(matches.map(match => match.teaches)).size}</strong><span>skills you can learn</span></div><div><strong>{matches.filter(match => match.match_type === 'reciprocal').length}</strong><span>reciprocal matches</span></div><div className="match-summary-note">A good match starts with a<br /><em>conversation.</em></div></div>{matches.length ? <div className="match-list">{matches.map(match => { const key = `${match.student_id}-${match.skill_id}`; return <MatchCard key={key} student={{ ...match, name: match.student_name, initials: match.student_name.split(' ').map(part => part[0]).join('').slice(0, 2) }} requesting={requestingId === key} onRequest={() => send(match)} /> })}</div> : <p className="empty-state">No skill matches yet. Add skills you can teach and want to learn to your profile to find peers.</p>}</>}</div>
}