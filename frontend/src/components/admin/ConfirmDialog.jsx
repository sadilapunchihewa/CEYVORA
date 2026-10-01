import { useEffect, useId, useRef } from 'react'
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  danger = true,
  busy,
  onConfirm,
  onClose,
}) {
  const ref = useRef()
  const titleId = useId()
  const descriptionId = useId()
  useEffect(() => {
    if (open) ref.current?.showModal()
    else ref.current?.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={onClose}
      onClose={onClose}
    >
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{children}</p>
      <div>
        <button
          type="button"
          className="button button-outline"
          onClick={onClose}
        >
          Keep it
        </button>
        <button
          type="button"
          className={`button ${danger ? 'admin-danger' : 'button-primary'}`}
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
