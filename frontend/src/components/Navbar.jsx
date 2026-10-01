import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

export default function Navbar({ authenticated = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = authenticated
    ? [['/dashboard', 'Dashboard'], ['/skills', 'My Skills'], ['/matching', 'Matching'], ['/requests', 'Requests'], ['/courses', 'Courses'], ['/progress', 'Progress'], ['/reviews', 'Reviews'], ...(user?.is_admin ? [['/admin', 'Admin']] : [])]
    : [['/', 'Home'], ['/skills', 'Skills'], ['/courses', 'Courses'], ['/#how-it-works', 'How It Works']]

  return <header className="site-header">
    <Link to="/" className="brand"><span className="brand-mark">C</span><span>Campus<span className="brand-accent">Exchange</span></span></Link>
    <nav className="main-nav">{links.map(([to, label]) => <NavLink key={label} to={to} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}</nav>
    <div className="nav-actions">{authenticated ? <><Link to="/profile" className="avatar">AS</Link><button className="button button-ghost" onClick={() => { logout(); navigate('/') }}>Log out</button></> : <><Link to="/login" className="button button-ghost">Log in</Link><Link to="/register" className="button button-dark">Join platform</Link></>}</div>
  </header>
}
