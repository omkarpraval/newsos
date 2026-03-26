import * as THREE from 'three'

export class AvatarController {
  private camera: THREE.PerspectiveCamera
  private keys: Set<string> = new Set()
  private yaw = 0
  private pitch = 0
  private speed = 4
  private isLocked = false
  private domElement: HTMLElement
  private onKeyDown: (e: KeyboardEvent) => void
  private onKeyUp: (e: KeyboardEvent) => void
  private onPointerLockChange: () => void
  private onMouseMove: (e: MouseEvent) => void

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.domElement = domElement
    this.onKeyDown = (e) => this.keys.add(e.code)
    this.onKeyUp = (e) => this.keys.delete(e.code)
    this.onPointerLockChange = () => {
      this.isLocked = document.pointerLockElement === this.domElement
    }
    this.onMouseMove = (e) => {
      if (!this.isLocked) return
      this.yaw -= e.movementX * 0.002
      this.pitch -= e.movementY * 0.002
      this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch))
    }
    this.setupKeyboard()
    this.setupMouseLook()
  }

  private setupKeyboard() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  private setupMouseLook() {
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
    document.addEventListener('mousemove', this.onMouseMove)
  }

  update(delta: number) {
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch

    const dir = new THREE.Vector3()
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dir.add(forward)
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dir.sub(forward)
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dir.sub(right)
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dir.add(right)

    if (dir.length() > 0) {
      dir.normalize().multiplyScalar(this.speed * delta)
      const newPos = this.camera.position.clone().add(dir)
      newPos.x = Math.max(-10, Math.min(10, newPos.x))
      newPos.z = Math.max(-10, Math.min(10, newPos.z))
      newPos.y = 1.7
      const deskDist = Math.sqrt(newPos.x ** 2 + newPos.z ** 2)
      if (deskDist < 2.5) {
        const angle = Math.atan2(newPos.z, newPos.x)
        newPos.x = Math.cos(angle) * 2.5
        newPos.z = Math.sin(angle) * 2.5
      }
      this.camera.position.copy(newPos)
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
    document.removeEventListener('mousemove', this.onMouseMove)
  }
}
