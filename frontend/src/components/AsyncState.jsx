export function AsyncState({ loading, error, children }) {
  if (loading) return <div className="loading-state">Loading...</div>
  if (error) return <div className="error-state" role="alert">{error}</div>
  return children
}
