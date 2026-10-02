import { useEffect, useState } from 'react'
import Button from '../common/Button'

const scenes = [
  {
    src: '/images/sigiriya.webp',
    name: 'Sigiriya',
    region: 'Cultural Triangle',
    note: 'Ancient stone. Living landscape.',
    position: '66% 50%',
  },
  {
    src: '/images/ella-train.webp',
    name: 'Ella',
    region: 'Hill Country',
    note: 'Slow trains. Endless green.',
    position: '50% 58%',
  },
  {
    src: '/images/safari.webp',
    name: 'Yala',
    region: 'Wild South',
    note: 'Untamed moments. Close to nature.',
    position: '52% 50%',
  },
  {
    src: '/images/south-coast.webp',
    name: 'Tangalle',
    region: 'Southern Coast',
    note: 'Warm water. Unhurried days.',
    position: '52% 55%',
  },
]

export default function HeroSection() {
  const [activeScene, setActiveScene] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (isPaused || reducedMotion) return undefined

    const timer = window.setInterval(() => {
      setActiveScene((current) => (current + 1) % scenes.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [isPaused])

  const scene = scenes[activeScene]

  return (
    <section
      className="hero hero-cinema"
      aria-roledescription="carousel"
      aria-label="Sri Lanka highlights"
    >
      <div className="hero-slides" aria-hidden="true">
        {scenes.map((item, index) => (
          <img
            className={`hero-image hero-slide${index === activeScene ? ' is-active' : ''}`}
            src={item.src}
            alt=""
            style={{ objectPosition: item.position }}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            loading={index === 0 ? 'eager' : 'lazy'}
            width="1920"
            height="1280"
            key={item.name}
          />
        ))}
      </div>
      <div className="container hero-content">
        <p className="hero-intro">DISCOVER SRI LANKA</p>
        <h1>
          Journeys Made
          <br />
          Unforgettable
        </h1>
        <p className="hero-description">
          Ancient paths. Wild places. Ocean days.
          <br />
          Discover a journey that feels like you.
        </p>
        <div className="button-row">
          <Button to="/destinations" variant="sand">
            Explore destinations
          </Button>
          <Button to="/tours" variant="light">
            Explore journeys
          </Button>
        </div>
      </div>

      <nav className="hero-scene-nav" aria-label="Choose a landscape">
        {scenes.map((item, index) => (
          <button
            className={`hero-scene-button${index === activeScene ? ' is-active' : ''}`}
            type="button"
            aria-label={`Show ${item.name}, ${item.region}`}
            aria-current={index === activeScene ? 'true' : undefined}
            onClick={() => setActiveScene(index)}
            key={item.name}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <i aria-hidden="true" />
            <strong>{item.name}</strong>
          </button>
        ))}
      </nav>

      <div className="container hero-caption" aria-live="polite">
        <span>{scene.note}</span>
        <span>
          {scene.name} · {scene.region}
        </span>
      </div>

      <button
        className="hero-motion-toggle"
        type="button"
        aria-label={isPaused ? 'Play image rotation' : 'Pause image rotation'}
        aria-pressed={isPaused}
        onClick={() => setIsPaused((paused) => !paused)}
      >
        <span aria-hidden="true">{isPaused ? '▶' : 'Ⅱ'}</span>
      </button>

    </section>
  )
}
