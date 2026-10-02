const agentBaseUrl = (
  import.meta.env.VITE_AGENT_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '')

export async function createJourneyPlan(payload, signal) {
  const response = await fetch(agentBaseUrl + '/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.detail || 'The journey planner could not finish your request.')
    error.status = response.status
    throw error
  }
  return data
}
