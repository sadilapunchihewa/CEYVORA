import { useEffect, useState } from 'react'
import { resolveImageUrl } from '../../utils/images'
import { validImage, apiError } from '../../utils/admin'
import { useToast } from './toastContext'
export default function ImageUpload({ value, onUpload, label = 'Image' }) {
  const [file, setFile] = useState()
  const [preview, setPreview] = useState()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )
  const pick = (e) => {
    const f = e.target.files[0]
    setError('')
    if (!f) return
    if (!validImage(f)) {
      setError('Choose a JPG, PNG or WebP image up to 5 MB.')
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }
  const upload = async () => {
    setBusy(true)
    setError('')
    try {
      await onUpload(file)
      toast.notify(`${label} uploaded.`)
      setFile(null)
    } catch (e) {
      setError(apiError(e, 'Image upload failed.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="image-upload">
      <h2>{label}</h2>
      <div className="image-upload-row">
        {preview || resolveImageUrl(value) ? (
          <img src={preview || resolveImageUrl(value)} alt="Selected preview" />
        ) : (
          <div className="image-placeholder">No image</div>
        )}
        <div>
          <input
            aria-label={`Choose ${label.toLowerCase()}`}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={pick}
          />
          <small>JPG, PNG or WebP. Maximum 5 MB.</small>
          {error && <p className="form-error">{error}</p>}
          <button
            type="button"
            className="button button-outline"
            disabled={!file || busy}
            onClick={upload}
          >
            {busy ? 'Uploading…' : 'Upload image'}
          </button>
        </div>
      </div>
    </section>
  )
}
