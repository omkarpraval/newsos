import * as THREE from 'three'

export interface Article {
  title: string
  description: string
  urlToImage: string
  url: string
  source: { name: string }
  publishedAt: string
}

export class NewsPoster {
  public article: Article
  public position: THREE.Vector3
  private scene: THREE.Scene
  private textureLoader: THREE.TextureLoader
  private rotationY: number
  private zoneColor: number
  private group: THREE.Group = new THREE.Group()
  private hoverLight?: THREE.PointLight
  private imageMesh?: THREE.Mesh
  private breakingFrame?: THREE.Mesh
  private isBreakingNews = false
  public zoneId: string

  public originalPos: THREE.Vector3 = new THREE.Vector3()
  public originalRot: number = 0

  constructor(
    scene: THREE.Scene,
    textureLoader: THREE.TextureLoader,
    article: Article,
    position: THREE.Vector3,
    rotationY: number,
    zoneColor: number
  ) {
    this.scene = scene
    this.textureLoader = textureLoader
    this.article = article
    this.position = position
    this.rotationY = rotationY
    this.zoneColor = zoneColor
    this.zoneId = ''
  }

  async init() {
    this.originalPos.copy(this.position)
    this.originalRot = this.rotationY
    this.group.position.copy(this.position)
    this.group.rotation.y = this.rotationY

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.25, 1.6, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x07080d, roughness: 0.6, metalness: 0.2 })
    )
    frame.position.z = -0.03
    this.group.add(frame)

    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.18, 1.53, 0.01))
    const borderMat = new THREE.LineBasicMaterial({ color: this.zoneColor })
    const border = new THREE.LineSegments(borderGeo, borderMat)
    this.group.add(border)

    const imageGeo = new THREE.PlaneGeometry(2, 1.2)
    let imageMat: THREE.MeshStandardMaterial
    try {
      const texture = await this.loadTexture(this.article.urlToImage)
      imageMat = new THREE.MeshStandardMaterial({ map: texture })
    } catch {
      imageMat = new THREE.MeshStandardMaterial({ color: this.zoneColor, transparent: true, opacity: 0.35 })
    }
    this.imageMesh = new THREE.Mesh(imageGeo, imageMat)
    this.imageMesh.position.y = 0.15
    this.group.add(this.imageMesh)

    const infoBar = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 })
    )
    infoBar.position.y = -0.525
    this.group.add(infoBar)

    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.12),
      new THREE.MeshStandardMaterial({
        color: this.zoneColor,
        emissive: this.zoneColor,
        emissiveIntensity: 0.5,
      })
    )
    badge.position.set(-0.7, 0.7, 0.01)
    this.group.add(badge)

    // Title Canvas Texture
    const tCanvas = document.createElement('canvas')
    tCanvas.width = 512
    tCanvas.height = 128
    const tCtx = tCanvas.getContext('2d')!
    tCtx.fillStyle = 'white'
    tCtx.font = 'bold 32px sans-serif'
    tCtx.textAlign = 'center'
    
    // Wrap text logic
    const words = this.article.title.split(' ')
    let line = ''
    let y = 40
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' '
      const metrics = tCtx.measureText(testLine)
      if (metrics.width > 480 && n > 0) {
        tCtx.fillText(line, 256, y)
        line = words[n] + ' '
        y += 40
      } else {
        line = testLine
      }
    }
    tCtx.fillText(line, 256, y)
    
    const titleTex = new THREE.CanvasTexture(tCanvas)
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTex, transparent: true })
    const titlePlane = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), titleMat)
    titlePlane.position.set(0, -0.525, 0.01)
    this.group.add(titlePlane)

    this.hoverLight = new THREE.PointLight(this.zoneColor, 0.3, 3)
    this.hoverLight.position.set(0, 0, 1)
    this.group.add(this.hoverLight)

    const posterSpot = new THREE.SpotLight(this.zoneColor, 0.8, 6, Math.PI / 8, 0.6)
    posterSpot.position.set(0, 4, 1.4)
    posterSpot.target = this.group
    this.group.add(posterSpot)

    if (this.isBreaking()) {
      this.isBreakingNews = true
      this.breakingFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.28, 1.63, 0.02),
        new THREE.MeshStandardMaterial({
          color: 0xe63946,
          emissive: 0xe63946,
          emissiveIntensity: 1.0,
        })
      )
      this.breakingFrame.position.z = -0.035
      this.group.add(this.breakingFrame)
    }

    this.scene.add(this.group)
  }

  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          resolve(texture)
        },
        undefined,
        reject
      )
    })
  }

  setHighlighted(highlighted: boolean) {
    if (!this.hoverLight) return
    this.hoverLight.intensity = highlighted ? 0.8 : 0.3
  }

  getMainMesh(): THREE.Object3D | null {
    return this.imageMesh ?? null
  }

  isBreaking(): boolean {
    try {
      const age = Date.now() - new Date(this.article.publishedAt).getTime()
      return age < 30 * 60 * 1000
    } catch {
      return false
    }
  }

  update() {
    if (this.isBreakingNews && this.breakingFrame) {
      const mat = this.breakingFrame.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.8 + Math.sin(Date.now() * 0.006) * 0.7
    }
  }
  
  public get groupObj() {
    return this.group
  }
}
