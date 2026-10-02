import { useState } from 'react'
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ],
  )
export default function BrandedEnquiryEmail({ enquiry }) {
  const [message, setMessage] = useState(
    `Hello ${enquiry.name},\n\nThank you for your enquiry. We'd love to help shape your Sri Lanka journey.\n\nCould you share your preferred travel dates, accommodation style and the experiences you would like to include?\n\nKind regards,\nCeyvora`,
  )
  const [feedback, setFeedback] = useState('')
  const banner = new URL('/images/south-coast.webp', window.location.origin)
    .href
  const html = `<div style="background:#edf1f0;padding:24px;font-family:Arial,sans-serif;color:#18344b"><table role="presentation" style="max-width:600px;width:100%;margin:auto;background:white;border-collapse:collapse"><tr><td style="padding:28px;text-align:center;background:#142d4e;color:white"><div style="font-family:Georgia,serif;font-size:30px;letter-spacing:4px">CEYVORA</div><div style="font-size:12px;margin-top:8px">Sri Lanka, your way</div></td></tr><tr><td><img src="${escapeHtml(banner)}" alt="Sri Lanka's southern coast" width="600" style="display:block;width:100%;height:auto" /></td></tr><tr><td style="padding:32px"><p style="font-size:12px;color:#677b87">YOUR JOURNEY ENQUIRY · CEY-${enquiry.id}</p><h1 style="font-family:Georgia,serif;font-size:28px;font-weight:normal">Let's shape your Sri Lanka journey.</h1><div style="font-size:15px;line-height:1.8">${escapeHtml(message).replace(/\n/g, '<br />')}</div></td></tr><tr><td style="padding:20px 32px;border-top:1px solid #e3e9e8;font-size:12px;color:#677b87">Contact: ceyvora@gmail.com<br />Reply to this email to continue planning. Your enquiry does not confirm a reservation.</td></tr></table></div>`
  async function copyEmail() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([message], { type: 'text/plain' }),
        }),
      ])
      setFeedback(
        'Formatted email copied. Open Gmail and paste into the message body.',
      )
    } catch {
      setFeedback(
        'Your browser could not copy the formatted email. Use the plain Gmail draft below.',
      )
    }
  }
  return (
    <section className="admin-panel enquiry-follow-up">
      <h2>Branded email reply</h2>
      <label htmlFor="branded-reply">Message</label>
      <textarea
        id="branded-reply"
        rows="8"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <iframe
        title="Ceyvora email preview"
        sandbox=""
        srcDoc={html}
        style={{
          width: '100%',
          height: 650,
          border: '1px solid #e3e9e8',
          borderRadius: 8,
        }}
      />
      <div className="button-row">
        <button className="button button-primary" onClick={copyEmail}>
          Copy formatted email
        </button>
        <a
          className="button button-outline"
          target="_blank"
          rel="noopener noreferrer"
          href={
            'https://mail.google.com/mail/?' +
            new URLSearchParams({
              authuser: 'ceyvora@gmail.com',
                  view: 'cm',
              fs: '1',
              to: enquiry.email,
              su: `Your Ceyvora journey enquiry #${enquiry.id}`,
            }).toString()
          }
        >
          Open Gmail
        </a>
      </div>
      <p role="status">{feedback}</p>
      <p className="muted">
        Sign in to ceyvora@gmail.com. Copy the formatted email, open Gmail, then paste it into the message
        body and review before sending. Gmail links cannot insert the design
        automatically.
      </p>
      {['localhost', '127.0.0.1'].includes(window.location.hostname) && (
        <p className="muted">
          Preview only: the banner uses localhost. Recipients can see it after
          the website and image are hosted publicly.
        </p>
      )}
    </section>
  )
}
