// 3D V Shape with Three.js - Reusable for multiple canvases
class VShape3D {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.options = {
            canvasId,
            size: options.size || 60,
            color: options.color || 0xc41e3a,
            enableInteraction: options.enableInteraction !== false
        };

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xe8dfd5);

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

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

        if (this.options.enableInteraction) {
            window.addEventListener('mousemove', this.onMouseMove.bind(this));
        }
        window.addEventListener('resize', this.onWindowResize.bind(this));

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

        // Create V from two diagonal lines that meet at a point
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

        // Dimensions for the V strokes
        const strokeWidth = 10;
        const strokeLength = 110;
        const vAngle = 0.45; // Angle in radians for each side

        // Left diagonal of V (going from top-left down to center-bottom)
        const leftGeometry = new THREE.BoxGeometry(strokeWidth, strokeLength, strokeWidth);
        const leftMesh = new THREE.Mesh(leftGeometry, material);

        // Position and rotate left stroke
        leftMesh.rotation.z = vAngle;
        // Adjust position so it converges at bottom center
        const leftOffsetX = -strokeLength * Math.sin(vAngle) / 2;
        const leftOffsetY = strokeLength * Math.cos(vAngle) / 2 - 20;
        leftMesh.position.x = leftOffsetX;
        leftMesh.position.y = leftOffsetY;

        leftMesh.castShadow = true;
        leftMesh.receiveShadow = true;
        group.add(leftMesh);

        // Right diagonal of V (going from top-right down to center-bottom)
        const rightGeometry = new THREE.BoxGeometry(strokeWidth, strokeLength, strokeWidth);
        const rightMesh = new THREE.Mesh(rightGeometry, material);

        // Position and rotate right stroke (mirror of left)
        rightMesh.rotation.z = -vAngle;
        const rightOffsetX = strokeLength * Math.sin(vAngle) / 2;
        const rightOffsetY = strokeLength * Math.cos(vAngle) / 2 - 20;
        rightMesh.position.x = rightOffsetX;
        rightMesh.position.y = rightOffsetY;

        rightMesh.castShadow = true;
        rightMesh.receiveShadow = true;
        group.add(rightMesh);

        return group;
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Calculate target rotation based on mouse position
        this.targetRotation.x = this.mouse.y * 0.3;
        this.targetRotation.y = this.mouse.x * 0.3;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Smooth rotation following
        this.vShape.rotation.x += (this.targetRotation.x - this.vShape.rotation.x) * 0.05;
        this.vShape.rotation.y += (this.targetRotation.y - this.vShape.rotation.y) * 0.05;

        // Gentle auto-rotation when not interacting
        this.vShape.rotation.z += 0.002;

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
    // Initialize Explore the Debate 3D V
    const explorCanvas = document.getElementById('exploreDébate3dCanvas');
    if (explorCanvas) {
        new VShape3D('exploreDébate3dCanvas', {
            enableInteraction: true
        });
    }
});
