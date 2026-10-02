import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { apiError } from '../../utils/admin'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
const labels = {
  journeys: 'Journey ideas',
  experiences: 'Experiences',
  tips: 'Destination tips',
  faq: 'FAQs',
  business: 'About and contact details',
  name: 'Name',
  category: 'Travel style',
  slug: 'Page identifier',
  image: 'Image URL',
  description: 'Description',
  heading: 'Introduction heading',
  route: 'Suggested route',
  advice: 'Planning advice',
  duration: 'Time to allow',
  difficulty: 'Activity level and access',
  preparation: 'Before you go',
  destination: 'Destination',
  season: 'When to go',
  access: 'Getting there',
  packing: 'What to bring',
  stay: 'Suggested stay',
  nearby: 'Combine it with',
  question: 'Question',
  answer: 'Answer',
  story: 'Your story',
  email: 'Email',
  phone: 'Phone',
  whatsapp: 'WhatsApp number',
  address: 'Address',
  instagram: 'Instagram link',
  facebook: 'Facebook link',
}
const sections = ['journeys', 'experiences', 'tips', 'faq', 'business']
export default function WebsiteContentPage() {
  const [section, setSection] = useState('journeys')
  const [content, setContent] = useState(null)
  const [selected, setSelected] = useState(0)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    const c = new AbortController()
    api
      .get('/api/content/' + section, { signal: c.signal })
      .then((r) => {
        setContent(r.data)
        setSelected(0)
        setError('')
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setError(apiError(e, 'Content could not be loaded.'))
      })
    return () => c.abort()
  }, [section, reload])
  const item = content?.items[selected]
  const change = (key, value) =>
    setContent((current) => ({
      ...current,
      items: current.items.map((x, i) =>
        i === selected ? { ...x, [key]: value } : x,
      ),
    }))
  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const r = await api.put('/api/content/' + section, content)
      setContent(r.data)
      setStatus(
        'Published. The website will show this content on its next page load.',
      )
    } catch (e) {
      setError(apiError(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <AdminPageHeader
        title="Website content"
        description="Edit the journey ideas, experiences, travel tips, FAQs and business details shown to visitors."
      />
      <div className="admin-filters">
        <label>
          Content section{' '}
          <select
            value={section}
            disabled={busy}
            onChange={(e) => {
              setError('')
              setSection(e.target.value)
              setContent(null)
              setStatus('')
            }}
          >
            {sections.map((x) => (
              <option key={x} value={x}>
                {labels[x]}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setReload((x) => x + 1)}>
          Reload published content
        </button>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {status && <p role="status">{status}</p>}
      {!content ? (
        <p>Loading content…</p>
      ) : (
        <form className="admin-form" onSubmit={save}>
          <label>
            Entry
            <select
              value={selected}
              onChange={(e) => setSelected(Number(e.target.value))}
            >
              {content.items.map((x, i) => (
                <option key={x.slug} value={i}>
                  {x.name || x.question}
                </option>
              ))}
            </select>
          </label>
          {item && (
            <div className="admin-form-grid">
              {Object.entries(item)
                .filter(([key]) => !['sourceImage', 'nights'].includes(key))
                .map(([key, value]) => (
                  <label
                    key={key}
                    className={String(value).length > 100 ? 'wide' : ''}
                  >
                    {key}
                    {key === 'route'
                      ? ' (destination slugs, one per line)'
                      : ''}
                    {key === 'slug' ? (
                      <input value={value} readOnly />
                    ) : (
                      <textarea
                        disabled={busy}
                        rows={String(value).length > 100 ? 5 : 2}
                        value={
                          Array.isArray(value)
                            ? value.join('\n')
                            : (value ?? '')
                        }
                        onChange={(e) =>
                          change(
                            key,
                            Array.isArray(value)
                              ? e.target.value.split('\n').filter(Boolean)
                              : e.target.value,
                          )
                        }
                      />
                    )}
                  </label>
                ))}
            </div>
          )}
          <button className="button button-primary" disabled={busy || !item}>
            {busy ? 'Publishing…' : 'Publish changes'}
          </button>
        </form>
      )}
    </>
  )
}
