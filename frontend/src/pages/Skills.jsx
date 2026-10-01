import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { api } from '../services/api'
import { SkillCard } from '../components/Cards'
import { PageIntro, SectionHeading } from '../components/Layout'

export default function Skills() {
  const { user } = useAuth()
  const userId = user?.id
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [direction, setDirection] = useState('teach')
  const [catalog, setCatalog] = useState([])
  const [mine, setMine] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([api.skills(), userId ? api.studentSkills(userId) : Promise.resolve([])]).then(([skills, assignments]) => {
      if (active) {
        setCatalog(skills)
        setMine(assignments)
      }
    }).catch(requestError => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId])

  const categories = ['All', ...new Set(catalog.map(skill => skill.category))]
  const visible = catalog.filter(skill => (category === 'All' || skill.category === category) && `${skill.name} ${skill.category}`.toLowerCase().includes(query.trim().toLowerCase()))
  const teach = mine.filter(skill => skill.can_teach)
  const learn = mine.filter(skill => skill.wants_to_learn)

  const updateSkill = async skill => {
    if (!user) return
    const current = mine.find(item => item.skill_id === skill.id)
    const isSet = direction === 'teach' ? current?.can_teach : current?.wants_to_learn
    const key = `${skill.id}-${direction}`
    setSavingId(key)
    setError('')
    setMessage('')
    try {
      if (isSet && current.can_teach && current.wants_to_learn) {
        await api.addStudentSkill(user.id, { skill_id: skill.id, can_teach: direction !== 'teach', wants_to_learn: direction !== 'learn' })
      } else if (isSet) {
        await api.removeStudentSkill(user.id, skill.id)
      } else {
        await api.addStudentSkill(user.id, { skill_id: skill.id, can_teach: direction === 'teach' || current?.can_teach, wants_to_learn: direction === 'learn' || current?.wants_to_learn })
      }
      const assignments = await api.studentSkills(user.id)
      setMine(assignments)
      setMessage(`${skill.name} updated on your profile.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingId(null)
    }
  }

  return <div className="content-page"><PageIntro eyebrow="The skill library" title={<>Find your next<br /><em>useful thing.</em></>} text="Explore campus skills and connect your teaching and learning goals to real matches." /><div className="toolbar"><label className="search"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search skills or categories" /></label><div className="filter-row">{categories.map(item => <button key={item} className={`filter ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}{user && <><button className={`filter ${direction === 'teach' ? 'active' : ''}`} onClick={() => setDirection('teach')}>I can teach</button><button className={`filter ${direction === 'learn' ? 'active' : ''}`} onClick={() => setDirection('learn')}>I want to learn</button></>}</div></div>{message && <p className="form-notice" role="status">{message}</p>}{error && <p className="form-notice" role="alert">{error}</p>}{loading ? <div className="loading-state">Loading the skill library...</div> : <div className="card-grid three skills-grid">{visible.length ? visible.map(skill => {
    const assignment = mine.find(item => item.skill_id === skill.id)
    const added = direction === 'teach' ? assignment?.can_teach : assignment?.wants_to_learn
    const key = `${skill.id}-${direction}`
    return <div key={skill.id}><SkillCard skill={{ title: skill.name, category: skill.category, level: user ? added ? 'Added to your profile' : 'Available to add' : `${skill.can_teach_count} can teach · ${skill.wants_to_learn_count} want to learn`, teachers: skill.can_teach_count }} onAdd={user ? () => updateSkill(skill) : undefined} disabled={savingId === key} /></div>
  }) : <p className="empty-state">No skills match this search.</p>}</div>}{user ? <section className="sub-section"><SectionHeading eyebrow="Your connected profile" title="Skills in your orbit" /><div className="tag-row">{teach.map(skill => <span className="tag" key={`teach-${skill.id}`}>Teach {skill.name}</span>)}{learn.map(skill => <span className="tag tag-coral" key={`learn-${skill.id}`}>Learn {skill.name}</span>)}</div>{mine.length === 0 && <p className="empty-state">No skills added yet. Choose a direction above to start your profile.</p>}</section> : <p className="empty-state">Log in or create an account to add skills to your profile. <Link to="/login">Log in</Link></p>}</div>
}