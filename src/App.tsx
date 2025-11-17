import p5 from 'p5'
import { useEffect, useRef } from 'react'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p: p5) => {
      let layers = 60
      let blobs = 2
      let baseRadius: number[] = []
      let angleOffset: number[] = []

      let breathPhase = 0
      let breathSpeed = 1 / 8

      let currentHue = 180
      let currentSat = 60

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.colorMode(p.HSB, 360, 100, 100, 100)
        p.noStroke()

        for (let i = 0; i < blobs; i++) {
          baseRadius[i] = p.width * (0.12 + i * 0.03)
          angleOffset[i] = p.random(p.TWO_PI)
        }
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

        p.push()
        const xOffset = p.map(p.noise(p.frameCount * 0.002), 0, 1, -5, 5)
        const yOffset = p.map(p.noise(p.frameCount * 0.002 + 100), 0, 1, -5, 5)
        p.translate(p.width / 2 + xOffset, p.height / 2 + yOffset)

        for (let b = 0; b < blobs; b++) {
          const breathing = p.map(breath, 0, 1, -15, 15)

          for (let i = layers; i > 0; i--) {
            let layerRadius = baseRadius[b] + breathing + i * 2
            if (i < layers - 1)
              layerRadius = p.lerp(
                layerRadius,
                layerRadius + (layers - i) * 0.5,
                0.08
              )

            const alpha =
              p.map(i, 0, layers, 0, 12) *
              (0.8 + 0.2 * Math.sin(p.frameCount * 0.005 + i * 0.3))
            p.fill((currentHue + i * 3 + b * 25) % 360, currentSat, 100, alpha)

            p.beginShape()
            const points = 160
            for (let j = 0; j < points; j++) {
              const angle = p.map(j, 0, points, 0, p.TWO_PI)
              const sineWave =
                10 * Math.sin(j * 0.2 + p.frameCount * 0.002 + b * 2)
              const noise1 = p.map(
                p.noise(
                  Math.cos(angle) * 0.5 +
                    p.frameCount * 0.001 +
                    i * 0.05 +
                    b * 5,
                  Math.sin(angle) * 0.5 +
                    p.frameCount * 0.001 +
                    i * 0.05 +
                    b * 5
                ),
                0,
                1,
                -5,
                5
              )
              const noise2 = p.map(
                p.noise(
                  Math.cos(angle) * 1.5 +
                    p.frameCount * 0.002 +
                    i * 0.1 +
                    b * 2,
                  Math.sin(angle) * 1.5 + p.frameCount * 0.002 + i * 0.1 + b * 2
                ),
                0,
                1,
                -2,
                2
              )
              const totalOffset =
                (sineWave + noise1 + noise2) * p.map(i, 0, layers, 1.0, 0.6) +
                breathing

              const x = Math.cos(angle) * (layerRadius + totalOffset)
              const y = Math.sin(angle) * (layerRadius + totalOffset)
              p.vertex(x, y)
            }
            p.endShape(p.CLOSE)
          }
          angleOffset[b] += p.TWO_PI / (60 * 12 + b * 10)
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

  return <div ref={containerRef} className="w-full h-full"></div>
}
