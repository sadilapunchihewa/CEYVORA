import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import ImageUpload from '../../components/admin/ImageUpload'
import { useToast } from '../../components/admin/toastContext'
import { apiError } from '../../utils/admin'
import * as service from '../../services/adminDestinationService'
const blank = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  district: '',
  province: '',
  imageUrl: null,
  isFeatured: false,
  isActive: true,
}
export default function DestinationFormPage() {
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
        .getDestination(id)
        .then((x) => setForm(x))
        .catch((e) => setError(apiError(e, 'Destination could not be loaded.')))
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
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      slug: form.slug || null,
      imageUrl: form.imageUrl || null,
    }
    try {
      const result = edit
        ? (await service.updateDestination(id, payload), { id })
        : await service.createDestination(payload)
      toast.notify(`Destination ${edit ? 'updated' : 'created'}.`)
      navigate(`/admin/destinations/${result.id}/edit`)
    } catch (err) {
      setError(apiError(err))
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <AdminPageHeader
        title={edit ? 'Edit destination' : 'Add destination'}
        description="Publish clear, useful information for travellers."
      />
      <AdminState loading={loading} error={loading && error}>
        {!loading && (
          <>
            <form className="admin-form" onSubmit={submit}>
              <div className="admin-form-grid">
                <label>
                  Name *
                  <input
                    name="name"
                    value={form.name}
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
                  District
                  <input
                    name="district"
                    value={form.district || ''}
                    onChange={change}
                    maxLength="100"
                  />
                </label>
                <label>
                  Province
                  <input
                    name="province"
                    value={form.province || ''}
                    onChange={change}
                    maxLength="100"
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
                  Feature this destination
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
                <Link
                  className="button button-outline"
                  to="/admin/destinations"
                >
                  Cancel
                </Link>
                <button className="button button-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save destination'}
                </button>
              </div>
            </form>
            {edit && (
              <ImageUpload
                value={form.imageUrl}
                label="Destination image"
                onUpload={async (file) => {
                  const r = await service.uploadDestinationImage(id, file)
                  setForm((v) => ({ ...v, imageUrl: r.imageUrl }))
                }}
              />
            )}
          </>
        )}
      </AdminState>
    </>
  )
}
