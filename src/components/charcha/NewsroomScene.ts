import * as THREE from 'three'
import { AvatarController } from './AvatarController'
import { NewsPoster, type Article } from './NewsPoster'
import { BotCharacter } from './BotCharacter'

export class NewsroomScene {
  private container: HTMLElement
  private newsData: Record<string, Article[]>
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private controller!: AvatarController
  private bots: BotCharacter[] = []
  private posters: NewsPoster[] = []
  private animFrameId?: number
  private clock = new THREE.Clock()
  private onResize?: () => void
  private raycaster = new THREE.Raycaster()
  private gazeTimer = 0
  private lastGazedPoster: NewsPoster | null = null
  private readonly AUTO_GAZE_THRESHOLD = 2.0
  private particles?: THREE.Points
  private particleGeo?: THREE.BufferGeometry
  private particleCount = 220
  private ledStrips: Array<{ mesh: THREE.Mesh; baseColor: number }> = []
  private hudGroup = new THREE.Group()
  private scanlineMat?: THREE.MeshBasicMaterial
  public botRiya?: BotCharacter
  public botArjun?: BotCharacter
  public nearestPoster: NewsPoster | null = null
  private activePoster: NewsPoster | null = null

  constructor(container: HTMLElement, newsData: Record<string, Article[]>) {
    this.container = container
    this.newsData = newsData
  }

  async init() {
    this.setupRenderer()
    this.setupScene()
    this.setupLighting()
    this.buildNewsroom()
    await this.placeNewsPosters()
    this.placeBots()
    this.setupController()
    this.setupHUD()
    this.startRenderLoop()
    this.handleResize()
    window.addEventListener('mousedown', this.handleMouseClick)
  }

  private handleMouseClick = () => {
    if (document.pointerLockElement !== this.renderer.domElement) return
    if (this.lastGazedPoster) {
      window.dispatchEvent(
        new CustomEvent('charcha:click', {
          detail: { article: this.lastGazedPoster.article },
        })
      )
    }
  }

  private setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.container.appendChild(this.renderer.domElement)
    this.container.addEventListener('click', () => this.renderer.domElement.requestPointerLock())
  }

  private setupScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#050a18')
    this.scene.fog = new THREE.FogExp2('#050a18', 0.035)
    this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
    this.camera.position.set(0, 1.7, 0)
  }

  private setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xfff4e0, 0.22))
    const overhead = new THREE.SpotLight(0xfff3d0, 1.0, 26, Math.PI / 5, 0.45)
    overhead.position.set(0, 6.4, 0)
    overhead.target.position.set(0, 0, 0)
    overhead.castShadow = true
    this.scene.add(overhead)
    this.scene.add(overhead.target)

    const accentPositions = [
      { pos: new THREE.Vector3(0, 3, -9), color: 0xf0a500 },
      { pos: new THREE.Vector3(-9, 3, 0), color: 0x3a86ff },
      { pos: new THREE.Vector3(9, 3, 0), color: 0x8b5cf6 },
      { pos: new THREE.Vector3(0, 3, 9), color: 0x2ec4b6 },
    ]
    accentPositions.forEach(({ pos, color }) => {
      const light = new THREE.PointLight(color, 0.55, 12)
      light.position.copy(pos)
      this.scene.add(light)
    })

    // Ceiling rigs: 3x3 warm spotlights
    for (let x = -6; x <= 6; x += 6) {
      for (let z = -6; z <= 6; z += 6) {
        const rig = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.06, 3),
          new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.35 })
        )
        rig.position.set(x, 6.65, z)
        this.scene.add(rig)
        const housing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.08, 0.3, 8),
          new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.85, roughness: 0.25 })
        )
        housing.position.set(x, 6.3, z)
        this.scene.add(housing)
        const spot = new THREE.SpotLight(0xfff3d0, 1.05, 14, Math.PI / 7, 0.5)
        spot.position.set(x, 6.2, z)
        spot.target.position.set(x, 0, z)
        spot.castShadow = false
        this.scene.add(spot)
        this.scene.add(spot.target)
        const lens = new THREE.Mesh(
          new THREE.CircleGeometry(0.06, 8),
          new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xfff3d0, emissiveIntensity: 1.2 })
        )
        lens.rotation.x = Math.PI / 2
        lens.position.set(x, 6.15, z)
        this.scene.add(lens)
      }
    }
  }

  private buildNewsroom() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({
        color: 0x0a0e1a,
        roughness: 0.05,
        metalness: 0.4,
        envMapIntensity: 1.0,
      })
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 1 })
    )
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = 7
    this.scene.add(ceiling)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0d1120, roughness: 0.9, metalness: 0.05 })
    ;[
      { pos: [0, 3, -11], rot: [0, 0, 0] },
      { pos: [0, 3, 11], rot: [0, Math.PI, 0] },
      { pos: [-11, 3, 0], rot: [0, Math.PI / 2, 0] },
      { pos: [11, 3, 0], rot: [0, -Math.PI / 2, 0] },
    ].forEach(({ pos, rot }) => {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(24, 7), wallMat.clone())
      wall.position.set(pos[0], pos[1], pos[2])
      wall.rotation.set(rot[0], rot[1], rot[2])
      this.scene.add(wall)
    })

    // Wall accent strips (gold)
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xf0a500,
      emissive: 0xf0a500,
      emissiveIntensity: 0.18,
      metalness: 0.35,
      roughness: 0.55,
    })
    ;[-4, 0, 4].forEach((offset) => {
      const geo = new THREE.BoxGeometry(0.04, 7, 0.05)
      const front = new THREE.Mesh(geo, accentMat)
      front.position.set(offset, 3.5, -10.95)
      this.scene.add(front)
      const back = new THREE.Mesh(geo, accentMat)
      back.position.set(offset, 3.5, 10.95)
      this.scene.add(back)
      const left = new THREE.Mesh(geo, accentMat)
      left.position.set(-10.95, 3.5, offset)
      left.rotation.y = Math.PI / 2
      this.scene.add(left)
      const right = new THREE.Mesh(geo, accentMat)
      right.position.set(10.95, 3.5, offset)
      right.rotation.y = Math.PI / 2
      this.scene.add(right)
    })

    // LED floor edge strips + glow lights
    const ledColors = [0xf0a500, 0x3a86ff, 0x8b5cf6, 0x2ec4b6]
    const ledPositions = [
      { x: 0, z: -10.8, rotY: 0, len: 21.6 },
      { x: 0, z: 10.8, rotY: Math.PI, len: 21.6 },
      { x: -10.8, z: 0, rotY: Math.PI / 2, len: 21.6 },
      { x: 10.8, z: 0, rotY: -Math.PI / 2, len: 21.6 },
    ]
    ledPositions.forEach(({ x, z, rotY, len }, i) => {
      const c = ledColors[i]
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.04, 0.08),
        new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2.0 })
      )
      strip.position.set(x, 0.02, z)
      strip.rotation.y = rotY
      this.scene.add(strip)
      this.ledStrips.push({ mesh: strip, baseColor: c })
      const light = new THREE.PointLight(c, 0.6, 4)
      light.position.set(x, 0.5, z)
      this.scene.add(light)
    })

    // Frosted glass dividers
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.08,
      roughness: 0.0,
      metalness: 0.1,
    })
    ;[
      { x: -5.5, z: 0, rotY: 0 },
      { x: 5.5, z: 0, rotY: 0 },
      { x: 0, z: -5.5, rotY: Math.PI / 2 },
      { x: 0, z: 5.5, rotY: Math.PI / 2 },
    ].forEach(({ x, z, rotY }) => {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 5), glassMat)
      panel.position.set(x, 2.5, z)
      panel.rotation.y = rotY
      this.scene.add(panel)
    })

    // Broadcast screen (back wall)
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 4),
      new THREE.MeshStandardMaterial({ color: 0x001133, emissive: 0x001133, emissiveIntensity: 0.55 })
    )
    screen.position.set(0, 3.7, 10.4)
    screen.rotation.y = Math.PI
    this.scene.add(screen)
    const liveBar = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xe63946, emissive: 0xe63946, emissiveIntensity: 1.0 })
    )
    liveBar.position.set(0, 1.75, 10.35)
    liveBar.rotation.y = Math.PI
    this.scene.add(liveBar)
    const screenLight = new THREE.PointLight(0x0044ff, 0.8, 8)
    screenLight.position.set(0, 3.5, 9)
    this.scene.add(screenLight)

    // Upgraded desk
    const desk = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.4, 0.9, 32),
      new THREE.MeshStandardMaterial({ color: 0x0a1628, roughness: 0.3, metalness: 0.6 })
    )
    desk.position.set(0, 0.45, 0)
    desk.castShadow = true
    desk.receiveShadow = true
    this.scene.add(desk)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.04, 8, 64),
      new THREE.MeshStandardMaterial({ color: 0xf0a500, emissive: 0xf0a500, emissiveIntensity: 1.3 })
    )
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, 0.93, 0)
    this.scene.add(ring)
    const underGlow = new THREE.PointLight(0xf0a500, 0.5, 3)
    underGlow.position.set(0, 0.1, 0)
    this.scene.add(underGlow)

    // Haze particles
    const positions = new Float32Array(this.particleCount * 3)
    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = Math.random() * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    this.particleGeo = new THREE.BufferGeometry()
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0xfff3d0,
      size: 0.04,
      transparent: true,
      opacity: 0.22,
    })
    this.particles = new THREE.Points(this.particleGeo, particleMat)
    this.scene.add(this.particles)
  }

  private setupHUD() {
    // Holographic HUD fixed to camera
    this.hudGroup = new THREE.Group()
    this.camera.add(this.hudGroup)
    this.scene.add(this.camera) // Ensure camera with HUD is in scene

    // Digital Scanlines / HUD Vignette
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(0, 20, 40, 0.1)'
    ctx.fillRect(0, 0, 512, 512)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'
    ctx.lineWidth = 2
    for (let i = 0; i < 512; i += 8) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(512, i)
      ctx.stroke()
    }
    const noiseTex = new THREE.CanvasTexture(canvas)
    noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping

    this.scanlineMat = new THREE.MeshBasicMaterial({
      map: noiseTex,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    })

    const hudPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.scanlineMat)
    hudPlane.position.z = -0.1 // Just in front of lens
    hudPlane.scale.set(0.4, 0.3, 1) // Fit aspect roughly
    this.hudGroup.add(hudPlane)

    // Corner brackets
    const bracketMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5, depthTest: false })
    for (let i = 0; i < 4; i++) {
        const b = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.002), bracketMat)
        const x = i < 2 ? -0.15 : 0.15
        const y = i % 2 === 0 ? 0.08 : -0.08
        b.position.set(x, y, -0.1)
        this.hudGroup.add(b)
        const bv = new THREE.Mesh(new THREE.PlaneGeometry(0.002, 0.02), bracketMat)
        bv.position.set(x + (x > 0 ? -0.01 : 0.01), y + (y > 0 ? -0.01 : 0.01), -0.1)
        this.hudGroup.add(bv)
    }
  }

  private updateHandheldCamera() {
    // Immersive camera bobbing/shake
    const time = this.clock.getElapsedTime()
    this.camera.position.y += Math.sin(time * 0.8) * 0.0003
    this.camera.position.x += Math.cos(time * 0.5) * 0.0002
    
    // Slight roll
    this.camera.rotation.z = Math.sin(time * 0.4) * 0.002
  }

  async placeNewsPosters() {
    const wallZones = [
      { zoneId: 'business', zoneColor: 0xf0a500, wallZ: -10.5, wallRotY: 0, xPositions: [-6, -2, 2, 6] },
      { zoneId: 'politics', zoneColor: 0x3a86ff, wallX: -10.5, wallRotY: Math.PI / 2, zPositions: [-6, -2, 2, 6] },
      { zoneId: 'startup', zoneColor: 0x8b5cf6, wallX: 10.5, wallRotY: -Math.PI / 2, zPositions: [-6, -2, 2, 6] },
      { zoneId: 'world', zoneColor: 0x2ec4b6, wallZ: 10.5, wallRotY: Math.PI, xPositions: [-6, -2, 2, 6] },
    ]
    const textureLoader = new THREE.TextureLoader()
    for (const wall of wallZones) {
      const articles = this.newsData[wall.zoneId] || []
      const positions = wall.xPositions
        ? wall.xPositions.map((x) => new THREE.Vector3(x, 2.8, wall.wallZ!))
        : wall.zPositions!.map((z) => new THREE.Vector3(wall.wallX!, 2.8, z))
      for (let i = 0; i < Math.min(positions.length, articles.length); i++) {
        const poster = new NewsPoster(this.scene, textureLoader, articles[i], positions[i], wall.wallRotY, wall.zoneColor)
        await poster.init()
        poster.zoneId = wall.zoneId
        this.posters.push(poster)
      }
    }
  }

  private placeBots() {
    this.botRiya = new BotCharacter(
      this.scene,
      new THREE.Vector3(-1.2, 0.8, -0.5),
      0xff6b9d,
      'Riya',
      new THREE.Vector3(-1.5, 0, 1.2)
    )
    this.botArjun = new BotCharacter(
      this.scene,
      new THREE.Vector3(1.2, 0.8, -0.5),
      0x4ecdc4,
      'Arjun',
      new THREE.Vector3(1.5, 0, 1.2)
    )
    this.botRiya.init()
    this.botArjun.init()
    this.bots = [this.botRiya, this.botArjun]
  }

  private setupController() {
    this.controller = new AvatarController(this.camera, this.renderer.domElement)
  }

  private startRenderLoop() {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate)
      const delta = this.clock.getDelta()
      this.controller.update(delta)
      this.updateNearestPoster()
      this.updateHandheldCamera()
      
      const nearestPos = this.nearestPoster?.position
      const playerPos = this.camera.position
      const playerYaw = this.camera.rotation.y
      this.botRiya?.followPlayer(playerPos, playerYaw, delta)
      this.botArjun?.followPlayer(playerPos, playerYaw, delta)
      this.bots.forEach((bot) => bot.update(delta, nearestPos, playerPos))
      this.posters.forEach((p) => p.update())
      this.updateActivePoster(delta)
      this.updateParticles(delta)
      this.updateGaze(delta)
      this.updateLeds()
      if (this.scanlineMat?.map) this.scanlineMat.map.offset.y -= delta * 0.2
      this.renderer.render(this.scene, this.camera)
    }
    animate()
  }

  private updateLeds() {
    const time = this.clock.getElapsedTime()
    this.ledStrips.forEach((strip, i) => {
      const pulse = 0.5 + Math.sin(time * 2 + i) * 0.5
      const mat = strip.mesh.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.0 + pulse * 2.0
    })
  }

  private updateNearestPoster() {
    let minDist = Infinity
    let nearest: NewsPoster | null = null
    this.posters.forEach((poster) => {
      if (poster !== this.activePoster) poster.setHighlighted(false)
      const dist = this.camera.position.distanceTo(poster.position)
      if (dist < minDist) {
        minDist = dist
        nearest = poster
      }
    })
    const nearestPoster = minDist < 5 ? (nearest as unknown as NewsPoster) : null
    this.nearestPoster = nearestPoster
    if (nearestPoster && nearestPoster !== this.activePoster) nearestPoster.setHighlighted(true)
  }

  private updateActivePoster(delta: number) {
    const targetPosActive = new THREE.Vector3(0, 1.8, -2.5) // Center front of bots
    const targetRotActive = 0
    const targetScaleActive = new THREE.Vector3(1.6, 1.6, 1.6)
    
    this.posters.forEach(p => {
      if (p === this.activePoster) {
        p.groupObj.position.lerp(targetPosActive, delta * 3.5)
        p.groupObj.scale.lerp(targetScaleActive, delta * 3.5)
        p.groupObj.rotation.y += (targetRotActive - p.groupObj.rotation.y) * delta * 3.5
      } else {
        p.groupObj.position.lerp(p.originalPos, delta * 3.5)
        p.groupObj.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 3.5)
        p.groupObj.rotation.y += (p.originalRot - p.groupObj.rotation.y) * delta * 3.5
      }
    })
  }

  private updateParticles(_delta: number) {
    if (!this.particleGeo) return
    const posAttr = this.particleGeo.getAttribute('position') as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array
    for (let i = 0; i < this.particleCount; i++) {
      const y = i * 3 + 1
      arr[y] += 0.002
      if (arr[y] > 6) arr[y] = 0
    }
    posAttr.needsUpdate = true
  }

  private updateGaze(delta: number) {
    // Ray from screen center
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)
    const meshes = this.posters.map((p) => p.getMainMesh()).filter(Boolean) as THREE.Object3D[]
    const intersects = this.raycaster.intersectObjects(meshes, false)
    if (intersects.length > 0 && intersects[0].distance < 6) {
      const hit = intersects[0].object
      const gazed = this.posters.find((p) => p.getMainMesh() === hit) || null
      if (gazed && gazed === this.lastGazedPoster) {
        this.gazeTimer += delta
        if (this.gazeTimer >= this.AUTO_GAZE_THRESHOLD) {
          this.gazeTimer = 0
          window.dispatchEvent(
            new CustomEvent('charcha:gaze', {
              detail: { article: gazed.article },
            })
          )
        }
      } else {
        this.lastGazedPoster = gazed
        this.gazeTimer = 0
      }
    } else {
      this.gazeTimer = 0
      this.lastGazedPoster = null
    }
  }

  private handleResize() {
    this.onResize = () => {
      const w = this.container.clientWidth
      const h = this.container.clientHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
    }
    window.addEventListener('resize', this.onResize)
  }

  resize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  setBotSpeaking(botName: 'Riya' | 'Arjun', speaking: boolean) {
    if (botName === 'Riya') this.botRiya?.setSpeaking(speaking)
    if (botName === 'Arjun') this.botArjun?.setSpeaking(speaking)
  }

  showActiveNews(category: string) {
    let targetZone = category
    if (category === 'technology') targetZone = 'startup'
    if (category === 'general') targetZone = 'world'

    const poster = this.posters.find((p) => p.zoneId === targetZone) || this.posters[0]
    if (poster && poster !== this.activePoster) {
      if (this.activePoster) this.activePoster.setHighlighted(false)
      this.activePoster = poster
      poster.setHighlighted(true)
    }
  }

  hideActiveNews() {
    if (this.activePoster) {
      this.activePoster.setHighlighted(false)
      this.activePoster = null
    }
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId)
    this.controller?.destroy()
    if (this.onResize) window.removeEventListener('resize', this.onResize)
    window.removeEventListener('mousedown', this.handleMouseClick)
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
