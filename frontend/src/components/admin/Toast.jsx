import { useMemo, useState } from 'react'
import { ToastContext } from './toastContext'
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const value = useMemo(
    () => ({
      notify(message, type = 'success') {
        const id = Date.now() + Math.random()
        setItems((v) => [...v, { id, message, type }])
        setTimeout(() => setItems((v) => v.filter((x) => x.id !== id)), 3500)
      },
    }),
    [],
  )
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((x) => (
          <div key={x.id} className={`admin-toast ${x.type}`}>
            {x.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
