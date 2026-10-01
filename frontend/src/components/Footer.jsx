export default function Footer() {
  return <footer className="footer"><div><LinkBrand /><p>A student-powered way to learn, teach, and grow together.</p></div><div className="footer-links"><a href="#about">About</a><a href="#community">Community guidelines</a><a href="mailto:hello@campusexchange.edu">Contact</a></div><small>Campus Skill Exchange · Peer learning platform</small></footer>
}
function LinkBrand() { return <div className="brand footer-brand"><span className="brand-mark">C</span><span>Campus<span className="brand-accent">Exchange</span></span></div> }
