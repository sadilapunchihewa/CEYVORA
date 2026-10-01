import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import ImageUpload from '../../components/admin/ImageUpload'
import { useToast } from '../../components/admin/toastContext'
import { apiError } from '../../utils/admin'
import * as service from '../../services/adminTourService'
const blank = {
  title: '',
  slug: '',
  shortDescription: '',
  description: '',
  durationDays: 1,
  durationNights: 0,
  startingPrice: 0,
  currency: 'USD',
  heroImageUrl: null,
  isFeatured: false,
  isActive: true,
}
export default function TourFormPage() {
  const { id } = useParams()
  const edit = Boolean(id)
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(edit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const navigate = useNavigate()
  useEffect(() => {
    if (edit)
      service
        .getTour(id)
        .then(setForm)
        .catch((e) => setError(apiError(e, 'Tour could not be loaded.')))
        .finally(() => setLoading(false))
  }, [edit, id])
  const change = (e) =>
    setForm((v) => ({
      ...v,
      [e.target.name]:
        e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))
  const submit = async (e) => {
    e.preventDefault()
    if (Number(form.durationNights) > Number(form.durationDays)) {
      setError('Nights cannot exceed days.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      slug: form.slug || null,
      durationDays: Number(form.durationDays),
      durationNights: Number(form.durationNights),
      startingPrice: Number(form.startingPrice),
      currency: form.currency.toUpperCase(),
      heroImageUrl: form.heroImageUrl || null,
    }
    try {
      const result = edit
        ? (await service.updateTour(id, payload), { id })
        : await service.createTour(payload)
      toast.notify(`Tour ${edit ? 'updated' : 'created'}.`)
      navigate(`/admin/tours/${result.id}/edit`)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <AdminPageHeader
        title={edit ? 'Edit tour package' : 'Add tour package'}
        description="Set the offer travellers see before managing its route and itinerary."
      />
      <AdminState loading={loading} error={loading && error}>
        {!loading && (
          <>
            <form className="admin-form" onSubmit={submit}>
              <div className="admin-form-grid">
                <label>
                  Title *
                  <input
                    name="title"
                    value={form.title}
                    onChange={change}
                    required
                    maxLength="150"
                  />
                </label>
                <label>
                  Slug
                  <input
                    name="slug"
                    value={form.slug || ''}
                    onChange={change}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    placeholder="Generated when left blank"
                  />
                </label>
                <label>
                  Duration days *
                  <input
                    type="number"
                    name="durationDays"
                    min="1"
                    max="365"
                    value={form.durationDays}
                    onChange={change}
                    required
                  />
                </label>
                <label>
                  Duration nights *
                  <input
                    type="number"
                    name="durationNights"
                    min="0"
                    max="365"
                    value={form.durationNights}
                    onChange={change}
                    required
                  />
                </label>
                <label>
                  Starting price *
                  <input
                    type="number"
                    name="startingPrice"
                    min="0"
                    max="100000000"
                    step="0.01"
                    value={form.startingPrice}
                    onChange={change}
                    required
                  />
                </label>
                <label>
                  Currency *
                  <input
                    name="currency"
                    value={form.currency}
                    onChange={change}
                    pattern="[A-Za-z]{3}"
                    maxLength="3"
                    required
                  />
                </label>
                <label className="wide">
                  Short description *
                  <textarea
                    name="shortDescription"
                    value={form.shortDescription}
                    onChange={change}
                    required
                    maxLength="500"
                    rows="3"
                  />
                </label>
                <label className="wide">
                  Description *
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={change}
                    required
                    maxLength="10000"
                    rows="8"
                  />
                </label>
              </div>
              <div className="admin-checks">
                <label>
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={change}
                  />{' '}
                  Feature this tour
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={change}
                  />{' '}
                  Active on website
                </label>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                <Link className="button button-outline" to="/admin/tours">
                  Cancel
                </Link>
                <button className="button button-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save tour package'}
                </button>
                {edit && (
                  <Link
                    className="button button-outline"
                    to={`/admin/tours/${id}/itinerary`}
                  >
                    Manage itinerary and route
                  </Link>
                )}
              </div>
            </form>
            {edit && (
              <ImageUpload
                value={form.heroImageUrl}
                label="Tour hero image"
                onUpload={async (file) => {
                  const r = await service.uploadTourImage(id, file)
                  setForm((v) => ({ ...v, heroImageUrl: r.imageUrl }))
                }}
              />
            )}
          </>
        )}
      </AdminState>
    </>
  )
}
