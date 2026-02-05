// 3D Hero Section with Three.js
class Hero3D {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0xd9cfc4, 1);

        this.camera.position.z = 150;

        // Lighting
        this.setupLighting();

        // Create 3D objects
        this.vShape = this.createVShape();
        this.textMeshes = this.createTextMeshes();
        this.particles = [];

        // Physics
        this.mouse = { x: 0, y: 0 };
        this.mouseRadius = 100;

        // Store original positions for spring animation
        this.textMeshes.forEach(mesh => {
            mesh.originalPos = {
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z
            };
            mesh.velocity = { x: 0, y: 0, z: 0 };
        });

        // Event listeners
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light for shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Soft fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-50, 30, 50);
        this.scene.add(fillLight);
    }

    createVShape() {
        // Create an extruded V shape
        const shape = new THREE.Shape();

        // Draw a V shape
        const width = 40;
        const height = 80;

        shape.moveTo(-width / 2, height / 2);
        shape.lineTo(0, -height / 2);
        shape.lineTo(width / 2, height / 2);
        shape.lineTo(width / 2 - 8, height / 2);
        shape.lineTo(8, -height / 2 + 10);
        shape.lineTo(-width / 2 + 8, height / 2);
        shape.lineTo(-width / 2, height / 2);

        const extrudeSettings = {
            depth: 20,
            bevelEnabled: true,
            bevelThickness: 3,
            bevelSize: 3,
            bevelSegments: 3
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();

        // Gold/glass material
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xc41e3a, // Crimson
            metalness: 0.6,
            roughness: 0.3,
            envMapIntensity: 1,
            emissive: 0x660000,
            emissiveIntensity: 0.1,
            clearcoat: 0.3,
            clearcoatRoughness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        return mesh;
    }

    createTextMeshes() {
        const texts = ['the', 'People'];
        const textMeshes = [];
        const spacing = 60;

        texts.forEach((text, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 60px EB Garamond, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 128, 64);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshPhysicalMaterial({
                map: texture,
                metalness: 0.5,
                roughness: 0.4,
                emissive: 0x333333,
                emissiveIntensity: 0.2,
                color: 0xffffff,
                side: THREE.DoubleSide
            });

            const geometry = new THREE.PlaneGeometry(40, 20);
            const mesh = new THREE.Mesh(geometry, material);

            // Position floating around the V
            const angle = (index / texts.length) * Math.PI * 2;
            const radius = 80;
            mesh.position.x = Math.cos(angle) * radius - (index - 0.5) * spacing;
            mesh.position.y = Math.sin(angle) * radius + 20;
            mesh.position.z = 0;

            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            textMeshes.push(mesh);
        });

        return textMeshes;
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    updatePhysics() {
        // Convert normalized mouse coordinates to world coordinates
        const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0);
        vector.unproject(this.camera);

        this.textMeshes.forEach(mesh => {
            const distance = vector.distanceTo(mesh.position);

            if (distance < this.mouseRadius) {
                // Repel from mouse
                const direction = new THREE.Vector3()
                    .subVectors(mesh.position, vector)
                    .normalize();

                const force = (this.mouseRadius - distance) / this.mouseRadius * 5;
                mesh.velocity.x += direction.x * force;
                mesh.velocity.y += direction.y * force;
            }

            // Spring back to original position
            const springForce = 0.08;
            mesh.velocity.x += (mesh.originalPos.x - mesh.position.x) * springForce;
            mesh.velocity.y += (mesh.originalPos.y - mesh.position.y) * springForce;

            // Damping
            mesh.velocity.x *= 0.95;
            mesh.velocity.y *= 0.95;

            // Update position
            mesh.position.x += mesh.velocity.x;
            mesh.position.y += mesh.velocity.y;
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        this.updatePhysics();

        // Slow rotation of the V shape
        this.vShape.rotation.x += 0.002;
        this.vShape.rotation.y += 0.003;

        // Slight bob animation
        this.vShape.position.y = Math.sin(Date.now() * 0.0005) * 5;

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('hero3dCanvas');
    if (canvas) {
        new Hero3D(canvas);
    }
});
