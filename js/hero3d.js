// 3D V Shape with Three.js - Reusable for multiple canvases
class VShape3D {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.options = {
            canvasId,
            size: options.size || 60,
            color: options.color || 0xc41e3a,
            enableInteraction: options.enableInteraction !== false,
            sensitivity: options.sensitivity || 0.3,
            lerpSpeed: options.lerpSpeed || 0.05
        };

        this.scene = new THREE.Scene();

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.baseWidth = width;
        this.baseHeight = height;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.camera.position.z = 150;

        this.setupLighting();
        this.vShape = this.createCleanVShape();
        this.scene.add(this.vShape);

        this.mouse = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.scaleFactor = 1;

        if (this.options.enableInteraction) {
            window.addEventListener('mousemove', this.onMouseMove.bind(this));
        }
        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.canvas.addEventListener('click', this.onClick.bind(this));

        this.animate();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(50, 50, 50);
        this.scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-50, 30, 50);
        this.scene.add(fillLight);
    }

    createCleanVShape() {
        const group = new THREE.Group();

        // Create serif V with proper proportions
        const material = new THREE.MeshPhysicalMaterial({
            color: this.options.color,
            metalness: 0.7,
            roughness: 0.2,
            envMapIntensity: 1,
            emissive: 0x330000,
            emissiveIntensity: 0.15,
            clearcoat: 0.4,
            clearcoatRoughness: 0.15
        });

        // Dimensions
        const strokeWidth = 12;
        const strokeLength = 140;
        const serifLength = 38;
        const serifHeight = 8;
        const vAngle = 0.40; // Angle for each diagonal

        // Convergence point at bottom center
        const convergeX = 0;
        const convergeY = -65;

        // Calculate positions so strokes' bottom endpoints meet at convergence point
        // For a rotated box, bottom point is at: center - (length/2)*sin(angle), center - (length/2)*cos(angle)
        // So to converge at (0, -65): centerX + (length/2)*sin(angle) = 0, centerY + (length/2)*cos(angle) = -65
        const leftOffsetX = convergeX + (strokeLength / 2) * Math.sin(vAngle);
        const leftOffsetY = convergeY + (strokeLength / 2) * Math.cos(vAngle);

        // Left diagonal stroke
        const leftGeometry = new THREE.BoxGeometry(strokeWidth, strokeLength, strokeWidth);
        const leftMesh = new THREE.Mesh(leftGeometry, material);
        leftMesh.rotation.z = vAngle;
        leftMesh.position.x = leftOffsetX;
        leftMesh.position.y = leftOffsetY;
        leftMesh.castShadow = true;
        leftMesh.receiveShadow = true;
        group.add(leftMesh);

        // Right diagonal stroke (mirror)
        const rightOffsetX = convergeX - (strokeLength / 2) * Math.sin(vAngle);
        const rightOffsetY = convergeY + (strokeLength / 2) * Math.cos(vAngle);

        const rightGeometry = new THREE.BoxGeometry(strokeWidth, strokeLength, strokeWidth);
        const rightMesh = new THREE.Mesh(rightGeometry, material);
        rightMesh.rotation.z = -vAngle;
        rightMesh.position.x = rightOffsetX;
        rightMesh.position.y = rightOffsetY;
        rightMesh.castShadow = true;
        rightMesh.receiveShadow = true;
        group.add(rightMesh);

        // Serif at convergence point (visual top of V - flipped)
        const bottomSerifGeometry = new THREE.BoxGeometry(serifLength * 1.2, serifHeight, strokeWidth);
        const bottomSerifMesh = new THREE.Mesh(bottomSerifGeometry, material);
        bottomSerifMesh.position.x = convergeX;
        bottomSerifMesh.position.y = -convergeY;
        bottomSerifMesh.castShadow = true;
        bottomSerifMesh.receiveShadow = true;
        group.add(bottomSerifMesh);

        // Top-left serif (centered at the endpoint of left stroke - visual bottom-left prong - flipped)
        const topLeftSerifGeometry = new THREE.BoxGeometry(serifLength, serifHeight, strokeWidth);
        const topLeftSerifMesh = new THREE.Mesh(topLeftSerifGeometry, material);
        topLeftSerifMesh.position.x = leftOffsetX + (strokeLength / 2) * Math.sin(vAngle);
        topLeftSerifMesh.position.y = -(leftOffsetY + (strokeLength / 2) * Math.cos(vAngle));
        topLeftSerifMesh.castShadow = true;
        topLeftSerifMesh.receiveShadow = true;
        group.add(topLeftSerifMesh);

        // Top-right serif (centered at the endpoint of right stroke - visual bottom-right prong - flipped)
        const topRightSerifGeometry = new THREE.BoxGeometry(serifLength, serifHeight, strokeWidth);
        const topRightSerifMesh = new THREE.Mesh(topRightSerifGeometry, material);
        topRightSerifMesh.position.x = rightOffsetX - (strokeLength / 2) * Math.sin(vAngle);
        topRightSerifMesh.position.y = -(rightOffsetY + (strokeLength / 2) * Math.cos(vAngle));
        topRightSerifMesh.castShadow = true;
        topRightSerifMesh.receiveShadow = true;
        group.add(topRightSerifMesh);

        return group;
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Calculate target rotation based on mouse position
        this.targetRotation.x = this.mouse.y * this.options.sensitivity;
        this.targetRotation.y = this.mouse.x * this.options.sensitivity;
    }

    onClick() {
        // Grow the canvas itself (not the mesh) so the V is never clipped by its
        // frame as it grows - it just renders bigger, on top of everything else.
        this.scaleFactor *= 1.1;
        this.canvas.style.width = (this.baseWidth * this.scaleFactor) + 'px';
        this.canvas.style.height = (this.baseHeight * this.scaleFactor) + 'px';
        this.onWindowResize();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Smooth rotation following mouse (x and y axes)
        this.vShape.rotation.x += (this.targetRotation.x - this.vShape.rotation.x) * this.options.lerpSpeed;
        this.vShape.rotation.y += (this.targetRotation.y - this.vShape.rotation.y) * this.options.lerpSpeed;

        // Continuous spin like Earth rotating on its axis (Y axis - shows 3D depth)
        this.vShape.rotation.y += 0.008;

        // Subtle bob animation
        this.vShape.position.y = Math.sin(Date.now() * 0.0005) * 3;

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.canvas) return;
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navbar 3D V
    const navCanvas = document.getElementById('navV3dCanvas');
    if (navCanvas) {
        new VShape3D('navV3dCanvas', {
            enableInteraction: true,
            sensitivity: 1.4,
            lerpSpeed: 0.18
        });
    }
});
