import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

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
        <div className="home-hero-actions">
          <Link
            to="/destinations"
            className="home-hero-action home-hero-action-primary"
          >
            Explore destinations <span aria-hidden="true">↗</span>
          </Link>
          <Link to="/tours" className="home-hero-action">
            Explore journeys <span aria-hidden="true">↗</span>
          </Link>
          <Link
            className="home-hero-action home-hero-action-ai"
            to="/ai-planner"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
              <path d="m20 2 .7 1.8L22.5 4l-1.8.7L20 6.5l-.7-1.8L17.5 4l1.8-.2L20 2Z" />
            </svg>
            Plan with AI <span aria-hidden="true">↗</span>
          </Link>
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
