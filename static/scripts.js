// Three.js scene setup
let scene, camera, renderer, earth, stars, satellites = {};
let observerMarker = null;
let selectedSatellite = null;

const API_BASE = window.location.origin;
const EARTH_RADIUS = 5;

function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Position camera to look from above and slightly back
    camera.position.set(0, 15, 10);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5); // Move light up
    scene.add(directionalLight);

    // Create Earth
    createEarth();

    // Create starfield
    createStars();

    // Create observer marker
    createObserverMarker();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Touch controls variables
    let previousTouchPosition = { x: 0, y: 0 };
    let previousTouchDistance = 0;

    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            handleRotation(deltaX, deltaY);
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch events
    renderer.domElement.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            previousTouchPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            isDragging = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            previousTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }, { passive: false });

    renderer.domElement.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling while interacting with canvas
        if (e.touches.length === 1 && isDragging) {
            const deltaX = e.touches[0].clientX - previousTouchPosition.x;
            const deltaY = e.touches[0].clientY - previousTouchPosition.y;
            handleRotation(deltaX, deltaY);
            previousTouchPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const deltaDistance = distance - previousTouchDistance;
            // Zoom logic
            camera.position.y -= deltaDistance * 0.05;
            camera.position.y = Math.max(2, Math.min(50, camera.position.y));
            camera.lookAt(0, 0, 0);

            previousTouchDistance = distance;
        }
    }, { passive: false });

    renderer.domElement.addEventListener('touchend', () => {
        isDragging = false;
    });

    function handleRotation(deltaX, deltaY) {
        // Rotate around Z axis (spin) for flat earth
        earth.rotation.z += deltaX * 0.005;

        // Tilt around X axis
        earth.rotation.x += deltaY * 0.005;

        // Clamp tilt to avoid flipping over completely
        earth.rotation.x = Math.max(-Math.PI / 2 - 1, Math.min(-Math.PI / 2 + 1, earth.rotation.x));
    }

    // Zoom with mouse wheel
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        // Zoom by moving along Y axis primarily for flat map
        camera.position.y += e.deltaY * 0.01;
        camera.position.y = Math.max(2, Math.min(50, camera.position.y));
        camera.lookAt(0, 0, 0); // Keep looking at center
    });

    // Start animation
    animate();

    // Load initial satellite
    trackSatellite(25544, 'ISS');
}

function createEarth() {
    // Flat Earth Geometry (Disk)
    // Radius covers from North Pole to South Pole (180 degrees total span)
    const geometry = new THREE.CircleGeometry(EARTH_RADIUS * 2, 64);

    const textureLoader = new THREE.TextureLoader();
    // Azimuthal Equidistant Projection Map (Gleason's Map style or similar)
    const texture = textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Azimuthal_equidistant_projection_SW.jpg/1024px-Azimuthal_equidistant_projection_SW.jpg');

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 10,
        specular: 0x111111,
        side: THREE.DoubleSide
    });

    earth = new THREE.Mesh(geometry, material);
    // Rotate to lay flat on XZ plane
    earth.rotation.x = -Math.PI / 2;
    // Adjust rotation to align Prime Meridian correctly if needed (trial and error or standard)
    // Usually these maps have North Pole center.
    scene.add(earth);

    // Add "Ice Wall" (Antarctica ring) or just a border
    const borderGeometry = new THREE.RingGeometry(EARTH_RADIUS * 2, EARTH_RADIUS * 2 + 0.2, 64);
    const borderMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    scene.add(border);
}

function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        // Dome of stars? Or just a box? Let's do a box for now but higher up
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 200 + 100; // Mostly above
        const z = (Math.random() - 0.5) * 400;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

function createObserverMarker() {
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    observerMarker = new THREE.Mesh(geometry, material);
    scene.add(observerMarker); // Add directly to scene, not earth, to handle independent movement easier
    updateObserverPosition();
}

function updateObserverPosition() {
    const lat = parseFloat(document.getElementById('lat').value) || 0;
    const lng = parseFloat(document.getElementById('lng').value) || 0;

    const pos = latLngToVector3(lat, lng, 0);
    observerMarker.position.copy(pos);
}

function latLngToVector3(lat, lng, altitude = 0) {
    // Azimuthal Equidistant Projection Math
    // Center (0,0,0) is North Pole (90 deg lat)
    // Edge is South Pole (-90 deg lat)
    // Distance from center r is proportional to (90 - lat)

    // Map 90 (North) to 0 radius
    // Map -90 (South) to Max Radius (EARTH_RADIUS * 2)
    const maxLatDiff = 180; // 90 to -90
    const currentLatDiff = 90 - lat;

    // Scale factor: Max Radius / 180 degrees
    const scale = (EARTH_RADIUS * 2) / 180;

    const r = currentLatDiff * scale;

    // Longitude to angle
    // 0 lng usually points down (positive Z) or right (positive X) depending on map
    // Let's assume standard math: 0 is +X? 
    // We might need to offset rotation to match the texture.
    // For now: theta = lng * DEG2RAD
    // Note: In 3D, X is right, Z is forward (out of screen usually).
    // Let's try standard polar: x = r cos theta, z = r sin theta
    // We need to verify alignment with the specific map image.
    // Usually Prime Meridian is at 12 o'clock or 6 o'clock.
    // Let's assume Prime Meridian (0 deg) is at -Z (Up on map) or +Z.
    // Let's try:
    const theta = (lng - 90) * (Math.PI / 180); // Rotate -90 to align 0 with top/bottom?

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);

    // Altitude is simply Y height
    // Scale altitude visually so it's not too flat
    const y = (altitude / 1000) * 0.5 + 0.1; // Base height + scaled altitude

    return new THREE.Vector3(x, y, z);
}

async function trackSatellite(id, name) {
    try {
        const response = await fetch(`${API_BASE}/positions/${id}?lat=0&lng=0&alt=0&sec=1`);
        if (!response.ok) throw new Error('Failed to fetch satellite');
        const data = await response.json();

        addSatelliteToScene(id, data.info.satname || name, data.positions[0]);
        updateSatelliteList();
    } catch (error) {
        console.error('Error tracking satellite:', error);
    }
}

function addSatelliteToScene(id, name, position) {
    // Remove existing if present
    if (satellites[id]) {
        earth.remove(satellites[id].mesh);
        if (satellites[id].label) earth.remove(satellites[id].label);
    }

    // Create satellite sprite
    const map = new THREE.TextureLoader().load('/static/jet.png');
    const material = new THREE.SpriteMaterial({ map: map });
    const satellite = new THREE.Sprite(material);

    // Scale the sprite (adjust size as needed)
    satellite.scale.set(0.5, 0.5, 1);

    const satPosition = latLngToVector3(position.satlatitude, position.satlongitude, position.sataltitude);
    satellite.position.copy(satPosition);

    earth.add(satellite);

    // Store satellite data
    satellites[id] = {
        mesh: satellite,
        name: name,
        position: position,
        id: id
    };
}

async function addSatellite() {
    const satId = document.getElementById('satId').value;
    if (!satId) return;
    await trackSatellite(parseInt(satId), `Satellite ${satId}`);
}

function updateObserver() {
    updateObserverPosition();
}

function updateSatelliteList() {
    const listEl = document.getElementById('satellite-list');
    if (Object.keys(satellites).length === 0) {
        listEl.innerHTML = '<div class="loading">No satellites tracked</div>';
        return;
    }

    listEl.innerHTML = '';
    Object.values(satellites).forEach(sat => {
        const item = document.createElement('div');
        item.className = 'satellite-item';
        item.onclick = () => selectSatellite(sat.id);
        item.innerHTML = `
            <div class="sat-name">${sat.name}</div>
            <div class="sat-id">ID: ${sat.id}</div>
            <div class="sat-info">Alt: ${sat.position.sataltitude.toFixed(0)} km</div>
        `;
        listEl.appendChild(item);
    });
}

function selectSatellite(id) {
    selectedSatellite = satellites[id];
    const panel = document.getElementById('info-panel');
    const details = document.getElementById('sat-details');

    if (selectedSatellite) {
        panel.style.display = 'block';
        details.innerHTML = `
            <div class="info-item">
                <span class="info-label">Name</span>
                <span class="info-value">${selectedSatellite.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">ID</span>
                <span class="info-value">${selectedSatellite.id}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Latitude</span>
                <span class="info-value">${selectedSatellite.position.satlatitude.toFixed(4)}°</span>
            </div>
            <div class="info-item">
                <span class="info-label">Longitude</span>
                <span class="info-value">${selectedSatellite.position.satlongitude.toFixed(4)}°</span>
            </div>
            <div class="info-item">
                <span class="info-label">Altitude</span>
                <span class="info-value">${selectedSatellite.position.sataltitude.toFixed(2)} km</span>
            </div>
        `;
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Auto-rotate Earth slowly (around Z axis for flat disk)
    if (earth) earth.rotation.z += 0.0005;

    // Rotate stars slowly
    if (stars) stars.rotation.y += 0.0002;

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Mobile panel toggle function
function toggleMobilePanel() {
    const panel = document.querySelector('.control-panel');
    const toggle = document.getElementById('mobile-toggle');

    if (panel.classList.contains('mobile-open')) {
        panel.classList.remove('mobile-open');
        toggle.innerHTML = '☰';
    } else {
        panel.classList.add('mobile-open');
        toggle.innerHTML = '✕';
    }
}

// Close mobile panel when clicking outside
document.addEventListener('click', (e) => {
    const panel = document.querySelector('.control-panel');
    const toggle = document.getElementById('mobile-toggle');

    if (window.innerWidth <= 768 &&
        panel.classList.contains('mobile-open') &&
        !panel.contains(e.target) &&
        !toggle.contains(e.target)) {
        panel.classList.remove('mobile-open');
        toggle.innerHTML = '☰';
    }
});

// Start the application
init();

// Auto-refresh satellite positions every 10 seconds
setInterval(() => {
    Object.keys(satellites).forEach(id => {
        trackSatellite(parseInt(id), satellites[id].name);
    });
}, 10000);
