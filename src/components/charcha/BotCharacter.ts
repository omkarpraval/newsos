import * as THREE from 'three'

export class BotCharacter {
  public name: string
  private scene: THREE.Scene
  private basePosition: THREE.Vector3
  private color: number
  private group: THREE.Group = new THREE.Group()
  private body?: THREE.Mesh
  private head?: THREE.Mesh
  private speakingRing?: THREE.Mesh
  private onAirBadge?: THREE.Mesh
  private isSpeaking = false
  private bobTime = 0
  private targetPosition: THREE.Vector3 = new THREE.Vector3()
  private followOffset: THREE.Vector3

  constructor(scene: THREE.Scene, position: THREE.Vector3, color: number, name: string, followOffset: THREE.Vector3) {
    this.scene = scene
    this.basePosition = position
    this.color = color
    this.name = name
    this.followOffset = followOffset
  }

  init() {
    this.group.position.copy(this.basePosition)
    this.body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.7, 12),
      new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.3, metalness: 0.1 })
    )
    this.body.position.y = 0.35
    this.group.add(this.body)

    this.head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.2 })
    )
    this.head.position.y = 0.85
    this.group.add(this.head)

    ;[-0.08, 0.08].forEach((x) => {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 })
      )
      eye.position.set(x, 0.88, 0.19)
      this.group.add(eye)
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      )
      pupil.position.set(x, 0.88, 0.22)
      this.group.add(pupil)
    })

    this.speakingRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.02, 8, 32),
      new THREE.MeshStandardMaterial({
        color: this.color,
        emissive: this.color,
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0,
      })
    )
    this.speakingRing.position.y = 0.85
    this.speakingRing.rotation.x = Math.PI / 2
    this.group.add(this.speakingRing)

    this.onAirBadge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.14),
      new THREE.MeshStandardMaterial({
        color: 0xe63946,
        emissive: 0xe63946,
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0,
      })
    )
    this.onAirBadge.position.y = 1.55
    this.group.add(this.onAirBadge)

    this.addNameSprite()
    this.scene.add(this.group)
  }

  private addNameSprite() {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, 256, 64)
    ctx.fillStyle = `#${this.color.toString(16).padStart(6, '0')}`
    ctx.font = 'bold 28px DM Sans, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(this.name, 128, 42)
    const texture = new THREE.CanvasTexture(canvas)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }))
    sprite.scale.set(1.2, 0.3, 1)
    sprite.position.y = 1.3
    this.group.add(sprite)
  }

  setSpeaking(speaking: boolean) {
    this.isSpeaking = speaking
    if (!this.speakingRing) return
    const mat = this.speakingRing.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = speaking ? 1.5 : 0
    mat.opacity = speaking ? 0.8 : 0
    if (this.onAirBadge) {
      const badgeMat = this.onAirBadge.material as THREE.MeshStandardMaterial
      badgeMat.emissiveIntensity = speaking ? 2.0 : 0
      badgeMat.opacity = speaking ? 1.0 : 0
    }
    if (this.body) {
      const bodyMat = this.body.material as THREE.MeshStandardMaterial
      bodyMat.emissive = new THREE.Color(this.color)
      bodyMat.emissiveIntensity = speaking ? 0.25 : 0
    }
  }

  followPlayer(playerPosition: THREE.Vector3, playerYaw: number, delta: number) {
    const offset = this.followOffset.clone()
    const cos = Math.cos(playerYaw)
    const sin = Math.sin(playerYaw)
    const rotatedX = offset.x * cos - offset.z * sin
    const rotatedZ = offset.x * sin + offset.z * cos
    this.targetPosition.set(playerPosition.x + rotatedX, this.group.position.y, playerPosition.z + rotatedZ)
    this.targetPosition.x = Math.max(-9.5, Math.min(9.5, this.targetPosition.x))
    this.targetPosition.z = Math.max(-9.5, Math.min(9.5, this.targetPosition.z))
    const lerpSpeed = Math.min(1, 3.0 * delta)
    this.group.position.lerp(this.targetPosition, lerpSpeed)
  }

  update(delta: number, nearestPosterPosition?: THREE.Vector3, playerPosition?: THREE.Vector3) {
    this.bobTime += delta
    this.group.position.y = this.basePosition.y + Math.sin(this.bobTime * 1.2) * 0.02
    if (this.isSpeaking && this.speakingRing) {
      const scale = 1 + Math.sin(this.bobTime * 8) * 0.15
      this.speakingRing.scale.setScalar(scale)
    } else if (this.speakingRing) {
      this.speakingRing.scale.setScalar(1)
    }

    const lookTarget = this.isSpeaking && nearestPosterPosition ? nearestPosterPosition : playerPosition
    if (lookTarget) {
      const dir = new THREE.Vector3(lookTarget.x - this.group.position.x, 0, lookTarget.z - this.group.position.z)
      if (dir.length() > 0.1) {
        const targetAngle = Math.atan2(dir.x, dir.z)
        const currentAngle = this.group.rotation.y
        let diff = targetAngle - currentAngle
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        this.group.rotation.y += diff * 0.12
      }
    } else if (this.head) {
      this.head.rotation.y = Math.sin(this.bobTime * 0.5) * 0.2
    }
  }
}
