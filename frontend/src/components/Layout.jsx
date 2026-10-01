import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import Navbar from './Navbar'
import Footer from './Footer'

export function PublicLayout() { const { user } = useAuth(); return <><Navbar authenticated={Boolean(user)} /><main><Outlet /></main><Footer /></> }
export function AppLayout() { const location = useLocation(); const admin = location.pathname === '/admin'; return <><Navbar authenticated /><main className="app-main"><Outlet /></main>{!admin && <Footer />}</> }
export function SectionHeading({ eyebrow, title, text, action }) { return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{text && <p>{text}</p>}</div>{action}</div> }
export function PageIntro({ eyebrow, title, text }) { return <section className="page-intro"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></section> }
