/* =============================================
 * MAPA — Leaflet.js (Pasajero) - VERSION 2.0.0
 * ============================================= */
console.log('%c --- NEXA Dashboard_P V2.0.0 CARGADO --- ', 'background: #00c4ff; color: #000; font-weight: bold;');

// Tile layer URLs
const TILE_LIGHT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_DARK = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const TILE_ATTR_LIGHT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILE_ATTR_DARK = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://stadiamaps.com/">Stadia Maps</a>';
const TILE_ATTR = TILE_ATTR_LIGHT;

/* ---- UI helpers ---- */

/* showSection — gestiona la navegación y la inicialización del mapa */
function showSection(id) {
  console.log(`[NAV] Cambiando a sección: ${id}`);
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(id);
  if (section) section.classList.add('active');

  if (id === 'historial') cargarHistorialPasajero();

  if (id === 'viaje') {
    console.log('[NAV] Detectada sección VIAJE, preparando mapa...');
    // Esperar a que display:block se aplique antes de que Leaflet mida el contenedor
    requestAnimationFrame(() => {
      if (!map) {
        console.log('[NAV] Mapa no existe, llamando a initMap()...');
        initMap();
      } else {
        console.log('[NAV] Mapa ya existe, invalidando tamaño...');
        setTimeout(() => map.invalidateSize(), 50);
      }
    });
  }
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  try { localStorage.setItem('darkMode', isDark); } catch(e) {}
  document.getElementById('darkModeText').textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  if (currentTileLayer && map) {
    map.removeLayer(currentTileLayer);
    currentTileLayer = L.tileLayer(
      isDark ? TILE_DARK : TILE_LIGHT,
      { attribution: isDark ? TILE_ATTR_DARK : TILE_ATTR_LIGHT, maxZoom: 19, crossOrigin: true }
    ).addTo(map);
    currentTileLayer.on('tileerror', (e) => {
      console.warn('Tile error:', e.tile.src);
    });
  }
}

function checkDarkMode() {
  try {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.body.classList.add('dark-mode');
      document.getElementById('darkModeText').textContent = 'Modo claro';
    }
  } catch(e) {}
}

function guardarCambios() {
  const username = document.getElementById('usernameInput').value;
  const profilePicInput = document.getElementById('profilePicInput');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const profilePicDisplay = document.getElementById('profilePicDisplay');

  if (username) {
    usernameDisplay.textContent = username;
    try { localStorage.setItem('username', username); } catch(e) {}
  }

  if (profilePicInput.files && profilePicInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const imageData = e.target.result;
      profilePicDisplay.src = imageData;
      try { localStorage.setItem('profilePic', imageData); } catch(e) {}
    };
    reader.readAsDataURL(profilePicInput.files[0]);
  }
}

function loadProfileData() {
  try {
    const savedUsername = localStorage.getItem('username');
    const savedProfilePic = localStorage.getItem('profilePic');

    if (savedUsername) {
      document.getElementById('usernameInput').value = savedUsername;
      document.getElementById('usernameDisplay').textContent = savedUsername;
    }

    if (savedProfilePic) {
      document.getElementById('profilePicDisplay').src = savedProfilePic;
    }
  } catch(e) {}
}

function resetPerfil() {
  try {
    localStorage.removeItem('username');
    localStorage.removeItem('profilePic');
  } catch(e) {}
  document.getElementById('usernameInput').value = 'USER';
  document.getElementById('usernameDisplay').textContent = 'USER';
  document.getElementById('profilePicDisplay').src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  document.getElementById('profilePicInput').value = '';
}

/* ---- Variables globales del mapa ---- */
let map, currentTileLayer;
let marcadorLeaflet = null;
let originLeaflet = null;
let destinationLeaflet = null;
let routePolyline = null;
let estimatedPrice = 0;
let calculatedDistanceKm = 0;
let originLatLng = null;
let destinationLatLng = null;

/* ---- Utilidad: convierte segundos OSRM a texto legible ---- */
function segundosATexto(segundos) {
  const totalMin = Math.round(segundos / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const horas = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins > 0 ? `${horas} h ${mins} min` : `${horas} h`;
}

/* ---- Geocodificación inversa con Nominatim ---- */
function reverseGeocode(lat, lng, callback) {
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
    headers: { 'Accept-Language': 'es', 'User-Agent': 'NEXA-App/1.0' }
  })
    .then(r => r.json())
    .then(data => callback(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`))
    .catch(() => callback(`${lat.toFixed(5)}, ${lng.toFixed(5)}`));
}

/* ---- Autocomplete con Photon (Komoot) ---- */
let photonDebounceOrigen = null;
let photonDebounceDestino = null;

function setupPhotonAutocomplete(inputId, onSelect) {
  console.log(`Buscando input '${inputId}' para autocomplete...`);
  const input = document.getElementById(inputId);
  if (!input) {
    console.error(`ERROR: No se encontró el input con id '${inputId}'`);
    return;
  }
  console.log(`Autocomplete vinculado correctamente a #${inputId}`);

  const debounceRef = inputId === 'origen' ? 'photonDebounceOrigen' : 'photonDebounceDestino';

  // El input-group ya tiene position:relative en el CSS
  // Ponemos el dropdown directamente dentro del input-group (parentNode del input)
  const inputGroup = input.parentNode;

  const dropdown = document.createElement('ul');
  dropdown.id = `photon-dropdown-${inputId}`;
  // Estilos del dropdown (oscuro premium)
  dropdown.style.cssText = [
    'position:absolute', 'top:100%', 'left:0', 'right:0', 'z-index:10000',
    'background:#1e293b', 'border:1px solid #00c4ff', 'border-radius:8px',
    'list-style:none', 'margin:4px 0 0', 'padding:5px 0', 'max-height:250px',
    'overflow-y:auto', 'box-shadow:0 10px 15px -3px rgba(0,0,0,0.5)', 'display:none',
    'color: white !important'
  ].join(';');

  // Para evitar problemas de overflow en el padre, nos aseguramos que el inputGroup sea relative
  inputGroup.style.position = 'relative';
  inputGroup.appendChild(dropdown);

  const LAT_MIN = 10.25, LAT_MAX = 10.55, LON_MIN = -75.75, LON_MAX = -75.35;

  input.addEventListener('input', () => {
    const q = input.value.trim();
    console.log(`Input detectado en #${inputId}: "${q}"`);

    if (inputId === 'origen') clearTimeout(photonDebounceOrigen);
    else clearTimeout(photonDebounceDestino);

    if (q.length < 3) {
      console.log(`Consulta muy corta (<3): "${q}"`);
      dropdown.style.display = 'none';
      return;
    }

    const timer = setTimeout(() => {
      // lang=es causaba Error 400 en la instancia pública. Lo eliminamos para que funcione.
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=10.4055&lon=-75.5037&limit=10`;

      console.log(`[PHOTON] Solicitando: ${url}`);

      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP status ${r.status}`);
          return r.json();
        })
        .then(data => {
          dropdown.innerHTML = '';
          const features = data.features || [];
          console.log(`[PHOTON] Resultados para #${inputId}: ${features.length}`);

          if (features.length === 0) {
            console.warn(`[PHOTON] Sin resultados para "${q}"`);
            dropdown.style.display = 'none';
            return;
          }

          // Filtrado manual por coordenadas (opcional, pero más seguro que el bbox de la API)
          const filtered = features.filter(f => {
            const [lon, lat] = f.geometry.coordinates;
            return lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX;
          });

          if (filtered.length === 0) {
            console.log(`[PHOTON] ${features.length} resultados encontrados pero fuera de Cartagena.`);
            dropdown.style.display = 'none';
            return;
          }

          filtered.forEach(f => {
            const props = f.properties;
            const parts = [props.name, props.street, props.city].filter(Boolean);
            const label = parts.join(', ');
            const [lon, lat] = f.geometry.coordinates;

            const li = document.createElement('li');
            li.textContent = label;
            li.style.cssText = 'padding: 10px 15px; cursor: pointer; font-size: 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: white !important;';

            li.addEventListener('mouseenter', () => li.style.background = 'rgba(0, 196, 255, 0.2)');
            li.addEventListener('mouseleave', () => li.style.background = '');
            li.addEventListener('mousedown', (e) => {
              e.preventDefault();
              console.log(`Seleccionado en #${inputId}: ${label} @ ${lat},${lon}`);
              input.value = label;
              dropdown.style.display = 'none';
              onSelect({ lat, lng: lon, label });
            });
            dropdown.appendChild(li);
          });
          dropdown.style.display = 'block';
        })
        .catch(err => {
          console.error(`Error crítico en Photon para #${inputId}:`, err);
          dropdown.style.display = 'none';
        });
    }, 450);

    if (inputId === 'origen') photonDebounceOrigen = timer;
    else photonDebounceDestino = timer;
  });

  input.addEventListener('blur', () => {
    setTimeout(() => { dropdown.style.display = 'none'; }, 200);
  });
}

/* ---- initMap: Leaflet ---- */
function initMap() {
  console.log('[MAP] Ejecutando initMap()...');
  if (map) {
    // Ya inicializado — solo forzar recálculo de tamaño por si el contenedor estaba oculto
    setTimeout(() => map.invalidateSize(), 50);
    return;
  }

  const centro = [10.4055, -75.5037];
  const isDarkMode = document.body.classList.contains('dark-mode');

  const mapContainer = document.querySelector('.map-container');
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'map-loading';
  loadingOverlay.innerHTML = '<div class="spinner"></div>';
  mapContainer.appendChild(loadingOverlay);

  map = L.map('map', {
    center: centro,
    zoom: 14,
    zoomControl: true
  });

  currentTileLayer = L.tileLayer(
    isDarkMode ? TILE_DARK : TILE_LIGHT,
    {
      attribution: isDarkMode ? TILE_ATTR_DARK : TILE_ATTR_LIGHT,
      maxZoom: 19,
      crossOrigin: true
    }
  ).addTo(map);

  // Log errores de tiles para diagnosticar
  currentTileLayer.on('tileerror', (e) => {
    console.warn('Tile error:', e.tile.src);
  });
  currentTileLayer.on('tileload', () => {
    // Al primer tile cargado, quitar spinner
    if (loadingOverlay && loadingOverlay.parentNode) {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => { try { loadingOverlay.remove(); } catch (e2) { } }, 500);
    }
  });

  // Forzar recálculo de tamaño (el contenedor puede haber estado oculto)
  setTimeout(() => map.invalidateSize(), 100);

  // Marcador inicial (arrastrable)
  const defaultIcon = L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
             style="fill:#a6adc4;filter:drop-shadow(0 1px 3px rgba(0,0,0,.4))">
             <circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2.5"/>
           </svg>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  marcadorLeaflet = L.marker(centro, { draggable: true, icon: defaultIcon }).addTo(map);

  marcadorLeaflet.on('dragend', function () {
    const { lat, lng } = marcadorLeaflet.getLatLng();
    originLatLng = { lat, lng };
    reverseGeocode(lat, lng, (address) => {
      document.getElementById('origen').value = address;
    });
  });

  // Autocomplete
  setupPhotonAutocomplete('origen', ({ lat, lng }) => {
    map.setView([lat, lng], 16);
    marcadorLeaflet.setLatLng([lat, lng]);
    originLatLng = { lat, lng };
  });

  setupPhotonAutocomplete('destino', ({ lat, lng }) => {
    destinationLatLng = { lat, lng };
  });
}

/* ---- animateMarker: placeholder (Leaflet no tiene API de animación nativa) ---- */
function animateMarker(marker) {
  // No-op: marcador ya se mueve visualmente al cambiar latLng
}

/* ---- Limpiar ruta ---- */
function limpiarRuta() {
  if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }
  if (originLeaflet) { map.removeLayer(originLeaflet); originLeaflet = null; }
  if (destinationLeaflet) { map.removeLayer(destinationLeaflet); destinationLeaflet = null; }

  document.getElementById('origen').value = '';
  document.getElementById('destino').value = '';
  document.getElementById('detalle-precio').innerHTML = `
    <div class="empty-state">
      <i class="fas fa-route"></i>
      <p>Ingresa origen y destino para calcular tu viaje</p>
    </div>`;

  const precioInput = document.getElementById('precioInput');
  precioInput.value = '';
  precioInput.placeholder = 'Ej: 15.000';
  document.getElementById('requestRideBtn').disabled = true;
  calculatedDistanceKm = 0;
  originLatLng = null;
  destinationLatLng = null;
}

/* ---- Centrar mapa con geolocalización ---- */
function centrarMapa() {
  if (!navigator.geolocation) {
    showError('Tu navegador no soporta geolocalización.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const { latitude, longitude } = coords;
      map.setView([latitude, longitude], 15);
      marcadorLeaflet.setLatLng([latitude, longitude]);
      originLatLng = { lat: latitude, lng: longitude };
      reverseGeocode(latitude, longitude, (address) => {
        document.getElementById('origen').value = address;
      });
    },
    () => showError('No se pudo obtener tu ubicación.')
  );
}

/* ---- Capa de tráfico: eliminada (no existe alternativa gratuita) ---- */
function alternarTrafico() {
  showError('La capa de tráfico en tiempo real no está disponible en esta versión.');
}

/* ---- Calcular ruta con OSRM ---- */
function calcularRuta() {
  const origenText = document.getElementById('origen').value.trim();
  const destinoText = document.getElementById('destino').value.trim();

  if (!origenText || !destinoText) {
    showError('Por favor, completa ambos campos.'); return;
  }
  if (!originLatLng || !destinationLatLng) {
    showError('Selecciona origen y destino desde las sugerencias del buscador.'); return;
  }

  // Spinner
  const mapContainer = document.querySelector('.map-container');
  let loadingOverlay = document.querySelector('.map-loading');
  if (!loadingOverlay) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'map-loading';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    mapContainer.appendChild(loadingOverlay);
  }

  document.getElementById('detalle-precio').innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Calculando la mejor ruta...</p>
    </div>`;

  const { lat: oLat, lng: oLng } = originLatLng;
  const { lat: dLat, lng: dLng } = destinationLatLng;
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&steps=true`;

  fetch(osrmUrl)
    .then(r => r.json())
    .then(data => {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => loadingOverlay.remove(), 500);

      if (!data.routes || data.routes.length === 0) {
        showError('No se encontró una ruta entre esas direcciones.'); return;
      }

      const route = data.routes[0];
      const distanciaKm = route.distance / 1000;
      calculatedDistanceKm = distanciaKm;
      const duracionTexto = segundosATexto(route.duration);
      estimatedPrice = 1000 + distanciaKm * 800;

      // Limpiar capas previas
      if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }
      if (originLeaflet) { map.removeLayer(originLeaflet); originLeaflet = null; }
      if (destinationLeaflet) { map.removeLayer(destinationLeaflet); destinationLeaflet = null; }

      // Polilínea de ruta
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      routePolyline = L.polyline(coords, {
        color: '#1E3A8A', weight: 5, opacity: 0.8
      }).addTo(map);
      map.fitBounds(routePolyline.getBounds(), { padding: [45, 45] });

      // Ícono SVG origen (gris)
      const mkOrigenIcon = L.divIcon({
        className: '',
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                 style="fill:#a6adc4;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))">
                 <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
        iconSize: [28, 28], iconAnchor: [14, 28]
      });
      // Ícono SVG destino (verde)
      const mkDestinoIcon = L.divIcon({
        className: '',
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                 style="fill:#4caf50;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))">
                 <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
        iconSize: [28, 28], iconAnchor: [14, 28]
      });

      originLeaflet = L.marker([oLat, oLng], { icon: mkOrigenIcon }).addTo(map).bindTooltip('Origen');
      destinationLeaflet = L.marker([dLat, dLng], { icon: mkDestinoIcon }).addTo(map).bindTooltip('Destino');

      // Instrucciones de ruta (steps OSRM)
      const steps = route.legs[0]?.steps || [];
      let instructionsHTML = '<div class="route-instructions"><h4><i class="fas fa-directions"></i> Instrucciones de Ruta</h4><ol>';
      steps.forEach((step, index) => {
        const instruccion = step.maneuver?.type
          ? `${step.maneuver.modifier || ''} ${step.maneuver.type}`.trim()
          : 'Continúa';
        const distStep = step.distance >= 1000
          ? `${(step.distance / 1000).toFixed(1)} km`
          : `${Math.round(step.distance)} m`;
        instructionsHTML += `<li><span class="step-number">${index + 1}.</span> <span class="instruction-text">${instruccion}</span> <span class="step-distance">(${distStep})</span></li>`;
      });
      instructionsHTML += '</ol></div>';

      document.getElementById('detalle-precio').innerHTML = `
        <div class="detail-row">
          <i class="fas fa-road"></i>
          <div><span class="detail-label">Distancia:</span>
               <span class="detail-value">${distanciaKm.toFixed(2)} km</span></div>
        </div>
        <div class="detail-row">
          <i class="fas fa-clock"></i>
          <div><span class="detail-label">Duración:</span>
               <span class="detail-value">${duracionTexto}</span></div>
        </div>
        <div class="detail-row">
          <i class="fas fa-money-bill-wave"></i>
          <div><span class="detail-label">Precio estimado:</span>
               <span class="detail-value price">$${estimatedPrice.toLocaleString('es-CO')} COP</span></div>
        </div>
        ${instructionsHTML}`;

      document.getElementById('requestRideBtn').disabled = false;
      const precioInput = document.getElementById('precioInput');
      precioInput.placeholder = `Ej: ${estimatedPrice.toLocaleString('es-CO')} COP`;
      precioInput.removeAttribute('readonly');
      precioInput.value = '';
    })
    .catch(err => {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => loadingOverlay.remove(), 500);
      showError('No se pudo calcular la ruta. Verifica tu conexión.');
      console.error('Error OSRM:', err);
    });
}

/* ---- showError ---- */
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  document.body.appendChild(errorDiv);
  setTimeout(() => {
    errorDiv.classList.add('fade-out');
    setTimeout(() => errorDiv.remove(), 500);
  }, 3000);
}

/* =============================================
 * MODAL BÚSQUEDA DE MOTO
 * ============================================= */
function showMotoModal(title, message = '', showDriverInfo = false, showProgress = false, progress = 0, origin = '', destination = '', driverData = {}) {
  const motoModal = document.getElementById('motoModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const driverInfo = document.getElementById('driverInfo');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const originText = document.getElementById('originText');
  const destinationText = document.getElementById('destinationText');
  const driverPhoto = document.getElementById('driverPhoto');
  const driverName = document.getElementById('driverName');
  const driverStatus = document.getElementById('driverStatus');

  if (!motoModal || !modalTitle || !modalMessage || !driverInfo || !progressContainer || !progressBar || !originText || !destinationText || !driverPhoto || !driverName || !driverStatus) {
    console.error('Faltan elementos en el DOM para mostrar el modal');
    showError('Error al mostrar el modal. Por favor, revisa la estructura HTML.');
    return;
  }

  modalTitle.textContent = title;
  if (message) {
    modalMessage.textContent = message;
    modalMessage.style.display = 'block';
  } else {
    modalMessage.style.display = 'none';
  }

  if (showDriverInfo) {
    driverInfo.style.display = 'block';
    driverPhoto.src = driverData.driverPhoto || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    driverName.textContent = driverData.driverName || 'Conductor no asignado';
    driverStatus.textContent = driverData.driverStatus || 'Preparándose para recogerte';

    let cancelBtn = driverInfo.querySelector('.action-buttons .cancel-btn');
    if (!cancelBtn) {
      const actionButtons = document.createElement('div');
      actionButtons.className = 'action-buttons';
      actionButtons.innerHTML = `
        <button id="cancelRideBtn" class="btn cancel-btn">
          <i class="fas fa-times"></i> Cancelar viaje
        </button>`;
      driverInfo.appendChild(actionButtons);
      cancelBtn = document.getElementById('cancelRideBtn');
      cancelBtn.addEventListener('click', cancelRide);
    }
  } else {
    driverInfo.style.display = 'none';
  }

  if (showProgress) {
    progressContainer.style.display = 'block';
    progressBar.style.width = `${progress}%`;
    originText.textContent = origin || 'Origen';
    destinationText.textContent = destination || 'Destino';
  } else {
    progressContainer.style.display = 'none';
  }

  motoModal.style.display = 'block';
  setTimeout(() => motoModal.classList.add('active'), 10);
}

function hideMotoModal() {
  const motoModal = document.getElementById('motoModal');
  if (motoModal) {
    motoModal.classList.remove('active');
    setTimeout(() => {
      motoModal.style.display = 'none';
      const modalMessage = document.getElementById('modalMessage');
      const driverInfo = document.getElementById('driverInfo');
      const progressContainer = document.getElementById('progressContainer');
      if (modalMessage) modalMessage.style.display = 'block';
      if (driverInfo) driverInfo.style.display = 'none';
      if (progressContainer) progressContainer.style.display = 'none';
    }, 200);
  }
}

function cancelRide() {
  if (!currentServicioId) { hideMotoModal(); return; }

  fetch(`/pasajero/cancelar-viaje/${currentServicioId}`, {
    method: 'POST',
    headers: { 'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value }
  })
    .then(response => {
      if (!response.ok) throw new Error('Error al cancelar el viaje');
      hideMotoModal();
      showError('Viaje cancelado correctamente');
    })
    .catch(error => {
      console.error('Error al cancelar viaje:', error);
      showError(error.message || 'Error al cancelar el viaje');
    });
}

/* =============================================
 * WEBSOCKET
 * ============================================= */
let stompClient = null;
let currentServicioId = null;

function connectWebSocket() {
  const socket = new SockJS('/ws');
  stompClient = Stomp.over(socket);

  fetch('/api/user-id')
    .then(response => response.json())
    .then(data => {
      if (data.userId) {
        startWebSocket(data.userId);
      } else {
        console.error('No se recibió userId');
        showError('Por favor, inicia sesión nuevamente');
      }
    })
    .catch(error => {
      console.error('Error al obtener userId:', error);
      setTimeout(connectWebSocket, 5000);
    });
}

function startWebSocket(userId) {
  stompClient.connect({}, function (frame) {
    console.log('Pasajero conectado al WebSocket: ' + frame);
    stompClient.subscribe(`/topic/pasajero/${userId}`, function (message) {
      const servicio = JSON.parse(message.body);
      console.log('Pasajero recibió actualización:', servicio);
      handleServicioUpdate(servicio);
    });
  }, function (error) {
    console.error('Error en WebSocket del pasajero:', error);
    showError('Error de conexión. Reintentando...');
    setTimeout(() => connectWebSocket(), 5000);
  });
}

function handleServicioUpdate(servicio) {
  console.log('Pasajero procesando estado:', servicio.estado, servicio);
  currentServicioId = servicio.id;

  const driverPhoto = servicio.conductor?.fotoUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  const driverName = servicio.conductor?.nombre || 'Conductor asignado';

  switch (servicio.estado) {
    case 'ACEPTADO':
      showMotoModal('Conductor asignado', 'Tu conductor está en camino', true, false, 0, '', '',
        { driverPhoto, driverName, driverStatus: 'Preparándose para recogerte' });
      break;
    case 'EN_CURSO':
      showMotoModal('Viaje en curso', 'Disfruta tu viaje', true, true, 50,
        servicio.origen, servicio.destino,
        { driverPhoto, driverName, driverStatus: 'En camino' });
      break;
    case 'FINALIZADO':
      console.log('Servicio FINALIZADO, redirigiendo a calificación');
      hideMotoModal();
      try {
        window.location.href = `/rating?servicioId=${servicio.id}&rol=pasajero`;
      } catch (error) {
        console.error('Error al redirigir:', error);
        showError('Error al redirigir a la página de calificación');
      }
      break;
    case 'CANCELADO':
      hideMotoModal();
      showError('El conductor ha cancelado el viaje');
      break;
    default:
      console.warn('Estado no manejado:', servicio.estado);
  }
}

/* Funciones adicionales */
function showServicioModal(servicio, title, content) {
  hideServicioModal();
  const servicioModal = document.createElement('div');
  servicioModal.id = 'servicioModal';
  servicioModal.className = 'modal';
  servicioModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <span class="close-btn" onclick="hideServicioModal()">×</span>
      </div>
      <div class="modal-body">${content}</div>
    </div>`;
  document.body.appendChild(servicioModal);
  setTimeout(() => servicioModal.classList.add('active'), 10);
}

function hideServicioModal() {
  const servicioModal = document.getElementById('servicioModal');
  if (servicioModal) {
    servicioModal.classList.remove('active');
    setTimeout(() => servicioModal.remove(), 200);
  }
}

function cancelarViaje(servicioId) {
  fetch(`/pasajero/cancelar-viaje/${servicioId}`, {
    method: 'POST',
    headers: { 'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value }
  })
    .then(response => {
      if (!response.ok) throw new Error('Error al cancelar');
      hideMotoModal();
      showError('Viaje cancelado correctamente');
    })
    .catch(error => showError(error.message || 'Error al cancelar el viaje'));
}

function subscribeToPasajeroTopic() {
  let userId = null;
  try { userId = localStorage.getItem('userId'); } catch(e) {}
  if (userId && stompClient) {
    stompClient.subscribe('/topic/pasajero/' + userId, function (message) {
      const servicio = JSON.parse(message.body);
      handleServicioUpdate(servicio);
    });
  }
}

/* =============================================
 * HISTORIAL
 * ============================================= */
let historialDataPasajero = [];
let currentPagePasajero = 1;
const itemsPerPagePasajero = 5;

function cargarHistorialPasajero() {
  fetch('/pasajero/historial')
    .then(response => response.json())
    .then(historial => {
      historialDataPasajero = historial;
      renderizarHistorialPasajero();
    })
    .catch(error => {
      console.error('Error al cargar historial:', error);
      showError('Error al cargar historial de viajes');
    });
}

function renderizarHistorialPasajero(filteredData = historialDataPasajero) {
  const tbody = document.getElementById('historialBody');
  tbody.innerHTML = '';

  const start = (currentPagePasajero - 1) * itemsPerPagePasajero;
  const end = start + itemsPerPagePasajero;
  const paginatedData = filteredData.slice(start, end);

  paginatedData.forEach(viaje => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${new Date(viaje.fechaHora).toLocaleDateString()}</td>
      <td>${new Date(viaje.fechaHora).toLocaleTimeString()}</td>
      <td>${viaje.origen}</td>
      <td>${viaje.destino}</td>
      <td>$${viaje.tarifa.toLocaleString('es-CO')}</td>
      <td>
        <button onclick="mostrarDetallesViajePasajero('${viaje.id}')">
          <i class="fas fa-eye"></i>
        </button>
      </td>`;
    tbody.appendChild(row);
  });

  document.getElementById('pageInfo').textContent = `Página ${currentPagePasajero}`;
  document.getElementById('prevPage').disabled = currentPagePasajero === 1;
  document.getElementById('nextPage').disabled = end >= filteredData.length;
}

function filtrarHistorialPasajero() {
  const fecha = document.getElementById('filtroFecha').value;
  const filteredData = historialDataPasajero.filter(viaje => {
    return fecha
      ? new Date(viaje.fechaHora).toLocaleDateString() === new Date(fecha).toLocaleDateString()
      : true;
  });
  currentPagePasajero = 1;
  renderizarHistorialPasajero(filteredData);
}

function resetFiltrosHistorialPasajero() {
  document.getElementById('filtroFecha').value = '';
  document.getElementById('filtroConductor').value = '';
  currentPagePasajero = 1;
  renderizarHistorialPasajero();
}

function cambiarPaginaPasajero(delta) {
  currentPagePasajero += delta;
  if (currentPagePasajero < 1) currentPagePasajero = 1;
  const maxPage = Math.ceil(historialDataPasajero.length / itemsPerPagePasajero);
  if (currentPagePasajero > maxPage) currentPagePasajero = maxPage;
  renderizarHistorialPasajero();
}

function mostrarDetallesViajePasajero(servicioId) {
  fetch(`/pasajero/servicios/${servicioId}`)
    .then(response => response.json())
    .then(servicio => {
      document.getElementById('detallesViajeContent').innerHTML = `
        <div class="detail-row"><i class="fas fa-calendar"></i><span>Fecha:</span><span>${new Date(servicio.fechaHora).toLocaleDateString()}</span></div>
        <div class="detail-row"><i class="fas fa-clock"></i><span>Hora:</span><span>${new Date(servicio.fechaHora).toLocaleTimeString()}</span></div>
        <div class="detail-row"><i class="fas fa-map-marker-alt"></i><span>Origen:</span><span>${servicio.origen}</span></div>
        <div class="detail-row"><i class="fas fa-flag-checkered"></i><span>Destino:</span><span>${servicio.destino}</span></div>
        <div class="detail-row"><i class="fas fa-money-bill-wave"></i><span>Precio:</span><span>$${servicio.tarifa.toLocaleString('es-CO')}</span></div>
        ${servicio.calificacionConductor ? `<div class="detail-row"><i class="fas fa-star"></i><span>Tu calificación:</span><span>${servicio.calificacionConductor.toFixed(1)}</span></div>` : ''}
        ${servicio.comentariosConductor ? `<div class="detail-row"><i class="fas fa-comment"></i><span>Tu comentario:</span><span>${servicio.comentariosConductor}</span></div>` : ''}`;
      document.getElementById('modalDetallesViaje').classList.add('active');
    })
    .catch(error => {
      console.error('Error al cargar detalles:', error);
      showError('Error al cargar detalles del viaje');
    });
}

function cerrarModalDetalles() {
  document.getElementById('modalDetallesViaje').classList.remove('active');
}

/* =============================================
 * DOMContentLoaded
 * ============================================= */
/* showSection ya está definida globalmente arriba */


document.addEventListener('DOMContentLoaded', () => {
  checkDarkMode();
  loadProfileData();
  connectWebSocket();
  // NO llamar initMap() aquí: el contenedor #viaje está oculto (display:none)
  // initMap se llama en showSection('viaje') via requestAnimationFrame

  const precioInput = document.getElementById('precioInput');
  if (precioInput) precioInput.removeAttribute('readonly');

  document.querySelector('.toggle-btn').addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main');
    const icon = document.querySelector('.toggle-btn i');
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('collapsed');
    icon.classList.toggle('fa-angle-double-left');
    icon.classList.toggle('fa-angle-double-right');
  });

  const requestBtn = document.getElementById('requestRideBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const motoModal = document.getElementById('motoModal');

  requestBtn.addEventListener('click', () => {
    const origen = document.getElementById('origen').value;
    const destino = document.getElementById('destino').value;
    const precioVal = document.getElementById('precioInput').value.replace(/\D/g, '') || estimatedPrice;
    const metodoPago = document.querySelector('.option-card.selected span').textContent;

    if (!originLatLng || !destinationLatLng) {
      showError('Primero calcula una ruta.'); return;
    }

    const solicitud = {
      origen,
      destino,
      ubicacionOrigen: { latitud: originLatLng.lat, longitud: originLatLng.lng },
      ubicacionDestino: { latitud: destinationLatLng.lat, longitud: destinationLatLng.lng },
      distanciaKM: calculatedDistanceKm,
      tarifa: parseFloat(precioVal),
      fechaHora: new Date().toISOString(),
      metodoPago
    };

    fetch('/pasajero/solicitar-viaje', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
      },
      body: JSON.stringify(solicitud)
    })
      .then(response => {
        if (!response.ok) return response.json().then(err => { throw err; });
        return response.json();
      })
      .then(data => {
        currentServicioId = data.servicioId;
        showMotoModal('Buscando conductor...', 'Por favor espera mientras encontramos un conductor para ti');
        subscribeToPasajeroTopic();
      })
      .catch(error => {
        console.error('Error al solicitar viaje:', error);
        showError(error.message || 'Error al solicitar el viaje');
      });
  });

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => hideMotoModal());

  if (motoModal) {
    window.addEventListener('click', (event) => {
      if (event.target === motoModal) hideMotoModal();
    });
  }

  document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', function () {
      document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
});

/* =============================================
 * MODAL CONFIRMACIÓN GENÉRICO
 * ============================================= */
const confirmModal = document.getElementById('confirm-modal');
const confirmBtnYes = document.getElementById('confirm-modal-btn-yes');
const confirmTitle = document.getElementById('confirm-modal-title');
const confirmMessage = document.getElementById('confirm-modal-message');

function openConfirmModal(title, message, actionId) {
  if (!confirmModal || !confirmBtnYes || !confirmTitle || !confirmMessage) {
    console.error('Elementos del modal de confirmación no encontrados'); return;
  }
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmBtnYes.dataset.actionId = actionId;
  confirmModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeConfirmModal() {
  if (!confirmModal) return;
  confirmModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

function executeConfirmAction() {
  const actionId = confirmBtnYes.dataset.actionId;
  switch (actionId) {
    case 'logout':
      const logoutForm = document.getElementById('logout-form');
      if (logoutForm) logoutForm.submit();
      else console.error("El formulario 'logout-form' no se encontró.");
      break;
    default:
      console.warn('Acción de confirmación desconocida:', actionId);
  }
  closeConfirmModal();
}

if (confirmBtnYes) confirmBtnYes.addEventListener('click', executeConfirmAction);

if (confirmModal) {
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) closeConfirmModal();
  });
}

/* Exponer al scope global para los onclick del HTML */
window.openConfirmModal = openConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.initMap = initMap;
window.showSection = showSection;
window.resetPerfil = resetPerfil;
window.calcularRuta = calcularRuta;
window.limpiarRuta = limpiarRuta;
window.centrarMapa = centrarMapa;
window.alternarTrafico = alternarTrafico;
window.toggleDarkMode = toggleDarkMode;
window.guardarCambios = guardarCambios;
window.showSolicitudDetails = function () { }; // placeholder