import * as THREE from 'three';

let scene, camera, renderer;
let thermometerGlass, mercury;
let tarotCard, particles;
let isAnimatingCard = false;
let isReady = false;

export function init3D() {
    try {
        const container = document.getElementById('webgl-container');
        if (!container || renderer) return;

        scene = new THREE.Scene();
        
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 10;

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambient);
        const pointLight = new THREE.PointLight(0xffb800, 2, 20); 
        pointLight.position.set(2, 2, 5);
        scene.add(pointLight);
        const mercuryLight = new THREE.PointLight(0xff003c, 0, 10); 
        mercuryLight.position.set(0, 0, 1);
        scene.add(mercuryLight);

        // THERMOMÈTRE (Verre)
        const glassGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 32);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, transmission: 1, opacity: 1, metalness: 0, roughness: 0.1, ior: 1.5, thickness: 0.5
        });
        thermometerGlass = new THREE.Mesh(glassGeo, glassMat);
        thermometerGlass.position.set(0, 0, 0);
        scene.add(thermometerGlass);

        // THERMOMÈTRE (Mercure)
        const mercuryGeo = new THREE.CylinderGeometry(0.2, 0.2, 5.8, 32);
        mercuryGeo.translate(0, 2.9, 0); 
        const mercuryMat = new THREE.MeshStandardMaterial({ color: 0xff003c, emissive: 0xff003c, emissiveIntensity: 0.5 });
        mercury = new THREE.Mesh(mercuryGeo, mercuryMat);
        mercury.position.set(0, -2.9, 0);
        mercury.scale.y = 0.5; 
        scene.add(mercury);

        // CARTE DE TAROT
        const cardGeo = new THREE.PlaneGeometry(1.5, 2.5);
        const cardMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2, side: THREE.DoubleSide });
        tarotCard = new THREE.Mesh(cardGeo, cardMat);
        tarotCard.position.set(2, -2, 2);
        tarotCard.rotation.set(0.2, -0.2, 0.1);
        scene.add(tarotCard);

        // PARTICULES
        const partGeo = new THREE.BufferGeometry();
        const partCount = 500;
        const posArray = new Float32Array(partCount * 3);
        for(let i=0; i<partCount*3; i++) posArray[i] = (Math.random() - 0.5) * 2;
        partGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const partMat = new THREE.PointsMaterial({ size: 0.05, color: 0xffd700, transparent: true, opacity: 0 });
        particles = new THREE.Points(partGeo, partMat);
        particles.position.copy(tarotCard.position);
        scene.add(particles);

        const animate = () => {
            requestAnimationFrame(animate);
            if (tarotCard && !isAnimatingCard) {
                const time = Date.now() * 0.001;
                tarotCard.position.y = -2 + Math.sin(time * 2) * 0.1;
                tarotCard.rotation.y = -0.2 + Math.sin(time) * 0.05;
            }
            if (particles.material.opacity > 0) {
                particles.rotation.y += 0.01;
                particles.position.y += 0.02;
                particles.material.opacity -= 0.01;
            }
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        isReady = true;
    } catch (e) {
        console.error("Three.js n'a pas pu démarrer:", e);
    }
}

export function update3DThermometer(percent) {
    if (!isReady || !mercury) return;
    const ratio = percent / 100;
    mercury.scale.y = Math.max(0.01, ratio);
    mercury.material.emissiveIntensity = 0.2 + (ratio * 1.5);
    if (ratio > 0.8) {
        mercury.material.emissive.setHex(0xffffff); 
    } else {
        mercury.material.emissive.setHex(0xff003c);
    }
}

export function toggle3DThermometer(visible) {
    if (!isReady) return;
    if (thermometerGlass) thermometerGlass.visible = visible;
    if (mercury) mercury.visible = visible;
}

export function burnTarotCard() {
    if (!isReady || !tarotCard || isAnimatingCard) return;
    isAnimatingCard = true;
    let flips = 0;
    const flipInterval = setInterval(() => {
        tarotCard.rotation.y += 0.4;
        flips++;
        if (flips > 15) {
            clearInterval(flipInterval);
            tarotCard.visible = false;
            particles.position.copy(tarotCard.position);
            particles.material.opacity = 1;
        }
    }, 30);
}

export function resetTarotCard(hasPower) {
    if (!isReady || !tarotCard) return;
    isAnimatingCard = false;
    tarotCard.visible = hasPower;
    tarotCard.rotation.set(0.2, -0.2, 0.1);
}
