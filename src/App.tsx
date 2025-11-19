import { Help, VolumeOff, VolumeUp } from '@mui/icons-material'
import p5 from 'p5'
import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

class Layer {
  p: p5
  index: number
  radius: number
  alphaBase: number
  noiseOffset1: number
  noiseOffset2: number

  constructor(p: p5, index: number, radius: number) {
    this.p = p
    this.index = index
    this.radius = radius
    this.alphaBase = this.p.map(index, 0, 60, 0, 12)
    this.noiseOffset1 = Math.random() * 1000
    this.noiseOffset2 = Math.random() * 1000
  }

  draw(currentHue: number, currentSat: number, breath: number, layers: number) {
    const p = this.p
    let layerRadius =
      this.radius + p.map(breath, 0, 1, -15, 15) + this.index * 2

    if (this.index < layers - 1) {
      layerRadius = p.lerp(
        layerRadius,
        layerRadius + (layers - this.index) * 0.5,
        0.08
      )
    }

    const alpha =
      this.alphaBase *
      (0.8 + 0.2 * Math.sin(p.frameCount * 0.005 + this.index * 0.3))

    p.fill((currentHue + this.index * 3) % 360, currentSat, 100, alpha)
    p.beginShape()

    const points = 80
    for (let j = 0; j < points; j++) {
      const angle = p.map(j, 0, points, 0, p.TWO_PI)
      const sineWave = 10 * Math.sin(j * 0.2 + p.frameCount * 0.002)

      const noise1 = p.map(
        p.noise(
          Math.cos(angle) * 0.5 + this.noiseOffset1,
          Math.sin(angle) * 0.5 + this.noiseOffset1
        ),
        0,
        1,
        -5,
        5
      )

      const noise2 = p.map(
        p.noise(
          Math.cos(angle) * 1.5 + this.noiseOffset2,
          Math.sin(angle) * 1.5 + this.noiseOffset2
        ),
        0,
        1,
        -2,
        2
      )

      const totalOffset =
        (sineWave + noise1 + noise2) * p.map(this.index, 0, layers, 1, 0.6)

      p.vertex(
        Math.cos(angle) * (layerRadius + totalOffset),
        Math.sin(angle) * (layerRadius + totalOffset)
      )
    }

    p.endShape(p.CLOSE)
  }
}

class Blob {
  p: p5
  layers: Layer[] = []
  baseRadius: number
  breathPhase = 0
  breathSpeed = 1 / 8
  currentHue = 180
  currentSat = 60
  totalLayers: number

  constructor(p: p5, totalLayers: number) {
    this.p = p
    this.totalLayers = totalLayers
    this.baseRadius = p.windowWidth * 0.12

    for (let i = totalLayers; i > 0; i -= 2) {
      this.layers.push(new Layer(p, i, this.baseRadius))
    }
  }

  update(breathSpeed?: number): number {
    const p = this.p
    const fr = p.frameRate() || 60

    if (breathSpeed !== undefined) this.breathSpeed = breathSpeed

    this.breathPhase += this.breathSpeed / fr
    if (this.breathPhase > 1) this.breathPhase -= 1

    const breath = 0.3 + 0.7 * Math.sin(p.TWO_PI * this.breathPhase)

    this.currentHue = p.lerp(
      this.currentHue,
      p.map(p.mouseX, 0, p.width, 0, 360),
      0.02
    )

    this.currentSat = p.lerp(
      this.currentSat,
      p.map(p.mouseY, 0, p.height, 30, 100),
      0.02
    )

    const xOffset = p.map(p.noise(p.frameCount * 0.002), 0, 1, -5, 5)
    const yOffset = p.map(p.noise(p.frameCount * 0.002 + 100), 0, 1, -5, 5)

    p.push()
    p.translate(p.width / 2 + xOffset, p.height / 2 + yOffset)

    this.layers.forEach(layer =>
      layer.draw(this.currentHue, this.currentSat, breath, this.totalLayers)
    )

    p.pop()

    return breath
  }
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)

  const [hovered, setHovered] = useState(false)
  const [audioStarted, setAudioStarted] = useState(false)
  const [soundOn, setSoundOn] = useState(false)

  const noiseRef = useRef<Tone.Noise | null>(null)
  const gainRef = useRef<Tone.Gain | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (p5Ref.current) {
      p5Ref.current.remove()
      p5Ref.current = null
    }

    const sketch = (p: p5) => {
      let blob: Blob
      const breathCycle = 8
      const breathSpeed = 1 / breathCycle

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.colorMode(p.HSB, 360, 100, 100, 100)
        p.noStroke()
        blob = new Blob(p, 60)
      }

      p.draw = () => {
        p.background(220, 25, 15)
        const breath = blob.update(breathSpeed)

        if (!gainRef.current) return

        if (audioStarted && soundOn) {
          const target = 0.3 + breath * 0.7
          gainRef.current.gain.rampTo(target, 0.15)
        } else {
          gainRef.current.gain.rampTo(0, 0.15)
        }
      }

      p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight)
    }

    p5Ref.current = new p5(sketch, containerRef.current)
    return () => p5Ref.current?.remove()
  }, [audioStarted, soundOn])

  const startAudio = async () => {
    await Tone.start()

    const gain = new Tone.Gain(0).toDestination()
    gainRef.current = gain

    const noise = new Tone.Noise('pink').start()
    noiseRef.current = noise

    const filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 800,
      Q: 1,
    })

    noise.connect(filter)
    filter.connect(gain)

    setAudioStarted(true)
  }

  const toggleSound = async (e?: React.MouseEvent) => {
    e?.stopPropagation()

    if (!audioStarted) {
      await startAudio()
    }

    setSoundOn(prev => {
      const next = !prev
      return next
    })
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="absolute top-0 left-0 w-full h-full z-0"
      />

      <div
        className="absolute top-4 left-4 z-10 flex items-center cursor-pointer"
        onClick={toggleSound}
      >
        {soundOn ? (
          <VolumeUp className="text-white" />
        ) : (
          <VolumeOff className="text-white" />
        )}
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Help className="text-white cursor-pointer" />
      </div>

      <div
        className="absolute top-14 right-4 z-10 flex flex-col items-end"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {hovered && (
          <div className="mt-2 w-64 p-3 bg-black/80 text-white rounded-lg shadow-lg text-sm">
            <p className="mb-1 font-semibold">How This Works</p>
            <p>
              The blob consists of concentric layers that expand and contract
              like breathing. Perlin noise adds organic wobble, and colours
              shift with mouse movement for a calming, meditative effect.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
