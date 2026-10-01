import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { useToast } from '../../components/admin/toastContext'
import { apiError } from '../../utils/admin'
import * as tours from '../../services/adminTourService'
import * as destinations from '../../services/adminDestinationService'
const dayBlank = {
  dayNumber: 1,
  title: '',
  description: '',
  accommodation: '',
  meals: '',
}
export default function ItineraryAdminPage() {
  const { id } = useParams()
  const [tour, setTour] = useState()
  const [days, setDays] = useState([])
  const [all, setAll] = useState([])
  const [attached, setAttached] = useState([])
  const [form, setForm] = useState(dayBlank)
  const [editing, setEditing] = useState()
  const [selected, setSelected] = useState('')
  const [order, setOrder] = useState(0)
  const [error, setError] = useState('')
  const [removeDay, setRemoveDay] = useState()
  const toast = useToast()
  const load = () =>
    Promise.all([
      tours.getTour(id),
      tours.getItinerary(id),
      destinations.listDestinations({ pageSize: 50 }),
      tours.getTourDestinations(id),
    ])
      .then(([t, d, a, at]) => {
        setTour(t)
        setDays(d)
        setAll(a.items)
        setAttached(at)
      })
      .catch((e) =>
        setError(apiError(e, 'Tour management data could not be loaded.')),
      )
  useEffect(load, [id])
  const change = (e) =>
    setForm((v) => ({ ...v, [e.target.name]: e.target.value }))
  const saveDay = async (e) => {
    e.preventDefault()
    const payload = { ...form, dayNumber: Number(form.dayNumber) }
    try {
      if (editing) await tours.updateItineraryDay(editing, payload)
      else await tours.createItineraryDay(id, payload)
      toast.notify(`Itinerary day ${editing ? 'updated' : 'added'}.`)
      setEditing()
      setForm(dayBlank)
      load()
    } catch (e) {
      setError(apiError(e))
    }
  }
  const attach = async (e) => {
    e.preventDefault()
    try {
      await tours.attachDestination(id, selected, Number(order))
      toast.notify('Destination added to route.')
      setSelected('')
      load()
    } catch (e) {
      setError(apiError(e))
    }
  }
  return (
    <>
      <AdminPageHeader
        title={tour ? `${tour.title} itinerary` : 'Tour itinerary'}
        description="Build the day-by-day plan and order the destinations on this route."
      />
      <AdminState loading={!tour && !error} error={error}>
        {tour && (
          <div className="itinerary-layout">
            <section className="admin-panel">
              <h2>Itinerary days</h2>
              <div className="itinerary-days">
                {days.length === 0 && (
                  <p className="muted">No itinerary days yet.</p>
                )}
                {days.map((d) => (
                  <article key={d.id}>
                    <span>Day {d.dayNumber}</span>
                    <div>
                      <h3>{d.title}</h3>
                      <p>{d.description}</p>
                      {(d.accommodation || d.meals) && (
                        <small>
                          {[d.accommodation, d.meals]
                            .filter(Boolean)
                            .join(' · ')}
                        </small>
                      )}
                    </div>
                    <div className="table-actions">
                      <button
                        onClick={() => {
                          setEditing(d.id)
                          setForm(d)
                        }}
                      >
                        Edit
                      </button>
                      <button onClick={() => setRemoveDay(d)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
              <form className="admin-form compact" onSubmit={saveDay}>
                <h3>{editing ? 'Edit day' : 'Add day'}</h3>
                <div className="admin-form-grid">
                  <label>
                    Day number
                    <input
                      type="number"
                      name="dayNumber"
                      min="1"
                      max={tour.durationDays}
                      value={form.dayNumber}
                      onChange={change}
                      required
                    />
                  </label>
                  <label>
                    Title
                    <input
                      name="title"
                      value={form.title}
                      onChange={change}
                      required
                      maxLength="150"
                    />
                  </label>
                  <label className="wide">
                    Description
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={change}
                      required
                      rows="4"
                    />
                  </label>
                  <label>
                    Accommodation
                    <input
                      name="accommodation"
                      value={form.accommodation || ''}
                      onChange={change}
                      maxLength="500"
                    />
                  </label>
                  <label>
                    Meals
                    <input
                      name="meals"
                      value={form.meals || ''}
                      onChange={change}
                      maxLength="500"
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <button className="button button-primary">
                    {editing ? 'Save day' : 'Add day'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() => {
                        setEditing()
                        setForm(dayBlank)
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>
            <section className="admin-panel">
              <h2>Destinations on route</h2>
              {attached.length === 0 && (
                <p className="muted">No destinations assigned.</p>
              )}
              <div className="route-list">
                {attached.map((d, i) => (
                  <div key={d.id}>
                    <span>{i + 1}</span>
                    <strong>{d.name}</strong>
                    <button
                      onClick={async () => {
                        await tours.removeDestination(id, d.id)
                        toast.notify('Destination removed.')
                        load()
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <form className="admin-form compact" onSubmit={attach}>
                <label>
                  Destination
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    required
                  >
                    <option value="">Choose destination</option>
                    {all
                      .filter((d) => !attached.some((a) => a.id === d.id))
                      .map((d) => (
                        <option value={d.id} key={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Visit order
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                  />
                </label>
                <button className="button button-primary">Add to route</button>
              </form>
            </section>
          </div>
        )}
      </AdminState>
      <ConfirmDialog
        open={Boolean(removeDay)}
        title="Delete itinerary day?"
        confirmLabel="Delete day"
        onClose={() => setRemoveDay()}
        onConfirm={async () => {
          await tours.deleteItineraryDay(removeDay.id)
          toast.notify('Itinerary day deleted.')
          setRemoveDay()
          load()
        }}
      >
        Day {removeDay?.dayNumber} will be permanently removed.
      </ConfirmDialog>
    </>
  )
}
