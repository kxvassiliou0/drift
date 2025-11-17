import { Close, Help } from '@mui/icons-material'
import p5 from 'p5'
import { useEffect, useRef, useState } from 'react'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<p5 | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove()
      p5InstanceRef.current = null
    }

    const sketch = (p: p5) => {
      const layers = 60
      const baseRadius = p.windowWidth * 0.12

      let breathPhase = 0
      const breathSpeed = 1 / 8

      let currentHue = 180
      let currentSat = 60

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.colorMode(p.HSB, 360, 100, 100, 100)
        p.noStroke()
      }

      p.draw = () => {
        p.background(220, 25, 15)

        const fr = p.frameRate() || 60
        breathPhase += breathSpeed / fr
        if (breathPhase > 1) breathPhase -= 1

        const breath = 0.3 + 0.7 * Math.sin(p.TWO_PI * breathPhase)

        currentHue = p.lerp(
          currentHue,
          p.map(p.mouseX, 0, p.width, 0, 360),
          0.02
        )
        currentSat = p.lerp(
          currentSat,
          p.map(p.mouseY, 0, p.height, 30, 100),
          0.02
        )

        const xOffset = p.map(p.noise(p.frameCount * 0.002), 0, 1, -5, 5)
        const yOffset = p.map(p.noise(p.frameCount * 0.002 + 100), 0, 1, -5, 5)
        p.push()
        p.translate(p.width / 2 + xOffset, p.height / 2 + yOffset)

        for (let i = layers; i > 0; i--) {
          let layerRadius = baseRadius + p.map(breath, 0, 1, -15, 15) + i * 2
          if (i < layers - 1)
            layerRadius = p.lerp(
              layerRadius,
              layerRadius + (layers - i) * 0.5,
              0.08
            )

          const alpha =
            p.map(i, 0, layers, 0, 12) *
            (0.8 + 0.2 * Math.sin(p.frameCount * 0.005 + i * 0.3))
          p.fill((currentHue + i * 3) % 360, currentSat, 100, alpha)

          p.beginShape()
          const points = 160
          for (let j = 0; j < points; j++) {
            const angle = p.map(j, 0, points, 0, p.TWO_PI)
            const sineWave = 10 * Math.sin(j * 0.2 + p.frameCount * 0.002)
            const noise1 = p.map(
              p.noise(
                Math.cos(angle) * 0.5 + p.frameCount * 0.001 + i * 0.05,
                Math.sin(angle) * 0.5 + p.frameCount * 0.001 + i * 0.05
              ),
              0,
              1,
              -5,
              5
            )
            const noise2 = p.map(
              p.noise(
                Math.cos(angle) * 1.5 + p.frameCount * 0.002 + i * 0.1,
                Math.sin(angle) * 1.5 + p.frameCount * 0.002 + i * 0.1
              ),
              0,
              1,
              -2,
              2
            )
            const totalOffset =
              (sineWave + noise1 + noise2) * p.map(i, 0, layers, 1.0, 0.6)

            const x = Math.cos(angle) * (layerRadius + totalOffset)
            const y = Math.sin(angle) * (layerRadius + totalOffset)
            p.vertex(x, y)
          }
          p.endShape(p.CLOSE)
        }

        p.pop()
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight)
      }
    }

    const myP5 = new p5(sketch, containerRef.current)
    return () => myP5.remove()
  }, [])

  const openOverlay = () => {
    setOverlayVisible(true)
    requestAnimationFrame(() => setShowOverlay(true))
  }

  const closeOverlay = () => {
    setShowOverlay(false)
    setTimeout(() => setOverlayVisible(false), 300)
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="absolute top-0 left-0 w-full h-full z-0"
      />
      <Help
        className="absolute top-4 right-4 z-10 text-white cursor-pointer"
        onClick={openOverlay}
      />
      {overlayVisible && (
        <div
          className={`fixed inset-0 z-20 flex items-center justify-center backdrop-blur-md bg-black/90 transition-opacity duration-300 ${
            showOverlay ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className={`relative w-full max-w-2xl p-8 bg-white/10 rounded-3xl transform transition-transform duration-300 ${
              showOverlay ? 'scale-100' : 'scale-95'
            }`}
          >
            <button
              className="absolute top-4 right-4 text-white"
              onClick={closeOverlay}
            >
              <Close />
            </button>
            <div className="text-white text-center">
              <h2 className="text-3xl font-bold mb-6">How This Works</h2>

              <p className="mb-4 leading-relaxed">
                The central form is created from multiple concentric layers of
                points arranged in a circular pattern. Each layer gently expands
                and contracts over time, following a smooth sinusoidal rhythm
                that mimics the natural pace of inhaling and exhaling.
              </p>

              <p className="mb-4 leading-relaxed">
                <span className="font-semibold">Perlin noise</span> introduces
                subtle, non-repetitive variations in point positions, giving the
                edges an organic wobble. The combination of rhythmic expansion
                and noise produces the impression of a living, pulsating
                structure.
              </p>

              <p className="mb-4 leading-relaxed">
                Colors gradually shift across the spectrum based on user
                interaction, while layered transparency enhances depth. Inner
                layers appear denser, and outer layers fade softly, creating a
                sense of volume and dimensionality.
              </p>

              <p className="leading-relaxed">
                Together, these elements foster a calming, meditative
                experience, encouraging focused attention and relaxation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
