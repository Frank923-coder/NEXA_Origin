/* =============================================
 * MAPA — Leaflet.js + OpenStreetMap (Conductor)
 * ============================================= */

// Tile layer URLs
const TILE_LIGHT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_DARK = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const TILE_ATTR_LIGHT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILE_ATTR_DARK = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://stadiamaps.com/">Stadia Maps</a>';
const TILE_ATTR = TILE_ATTR_LIGHT;

// Icono SVG del pasajero (divIcon)
const passengerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="24" fill="#4CAF50"/>
  <circle cx="24" cy="24" r="22" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
  <path fill="white" d="M24 26c-4.42 0-16 2.21-16 6.6V36h32v-3.4c0-4.39-11.58-6.6-16-6.6zM24 10c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
</svg>`;

// Variables globales
let map, currentTileLayer;
let markers = [];
let selectedServiceId = null;
let stompClient = null;
let currentServicioId = null;

/* ---- UI helpers ---- */
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    try { localStorage.setItem('darkMode', isDark); } catch(e) { console.warn('localStorage bloqueado'); }
    document.getElementById('darkModeText').textContent = isDark ? 'Modo claro' : 'Modo oscuro';
    if (currentTileLayer && map) {
        map.removeLayer(currentTileLayer);
        currentTileLayer = L.tileLayer(
            isDark ? TILE_DARK : TILE_LIGHT,
            { attribution: isDark ? TILE_ATTR_DARK : TILE_ATTR_LIGHT, maxZoom: 19 }
        ).addTo(map);
    }
}

function checkDarkMode() {
    try {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeText').textContent = 'Modo claro';
        }
    } catch(e) { console.warn('localStorage bloqueado'); }
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
            profilePicDisplay.src = e.target.result;
            try { localStorage.setItem('profilePic', e.target.result); } catch(err) {}
        };
        reader.readAsDataURL(profilePicInput.files[0]);
    }
}

function loadProfileData() {
    try {
        const savedUsername = localStorage.getItem('username');
        const savedProfilePic = localStorage.getItem('profilePic');
        if (savedUsername) { document.getElementById('usernameInput').value = savedUsername; document.getElementById('usernameDisplay').textContent = savedUsername; }
        if (savedProfilePic) { document.getElementById('profilePicDisplay').src = savedProfilePic; }
    } catch(e) { console.warn('localStorage bloqueado'); }
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

/* ---- initMap: Leaflet ---- */
function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) { console.error('Elemento #map no encontrado'); return; }
    if (map) {
        // Ya inicializado: solo forzar recálculo de tamaño
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

    try {
        map = L.map('map', { center: centro, zoom: 13, zoomControl: true });

        currentTileLayer = L.tileLayer(
            isDarkMode ? TILE_DARK : TILE_LIGHT,
            {
                attribution: isDarkMode ? TILE_ATTR_DARK : TILE_ATTR_LIGHT,
                maxZoom: 19,
                crossOrigin: true
            }
        ).addTo(map);

        currentTileLayer.on('tileerror', (e) => {
            console.warn('Tile error conductor:', e.tile.src);
        });
        currentTileLayer.on('tileload', () => {
            if (loadingOverlay && loadingOverlay.parentNode) {
                loadingOverlay.classList.add('hidden');
                setTimeout(() => { try { loadingOverlay.remove(); } catch (e2) { } }, 500);
            }
        });

        // Forzar recálculo de tamaño (puede haber estado oculto)
        setTimeout(() => map.invalidateSize(), 100);

        cargarServiciosDisponibles();
    } catch (error) {
        console.error('Error al inicializar el mapa:', error);
        showError('Error al cargar el mapa.');
        loadingOverlay.remove();
    }
}

/* ---- Carga y muestra marcadores de pasajeros en el mapa ---- */
function cargarServiciosDisponibles() {
    fetch('/conductor/servicios-disponibles')
        .then(response => response.json())
        .then(servicios => {
            // Limpiar marcadores anteriores
            markers.forEach(m => {
                if (m.animationInterval) clearInterval(m.animationInterval);
                map.removeLayer(m);
            });
            markers = [];

            servicios.forEach(servicio => {
                const lat = servicio.ubicacionOrigen.latitud;
                const lon = servicio.ubicacionOrigen.longitud;
                const coords = [lat, lon];

                const iconDiv = L.divIcon({
                    className: 'passenger-marker',
                    html: passengerSVG,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                });

                const marker = L.marker(coords, { icon: iconDiv, title: servicio.pasajero.nombre }).addTo(map);

                const popupContent = `
          <div class="info-window">
            <div class="info-row"><i class="fas fa-user"></i><span>${servicio.pasajero.nombre}</span></div>
            <div class="info-row"><i class="fas fa-map-marker-alt"></i><span>${servicio.origen}</span></div>
            <div class="info-row"><i class="fas fa-flag-checkered"></i><span>${servicio.destino}</span></div>
            <div class="info-row"><i class="fas fa-money-bill-wave"></i><span class="price">$${servicio.tarifa.toLocaleString('es-CO')} COP</span></div>
            <button class="review-btn" onclick="window.showSolicitudDetails('${servicio.id}')">
              <i class="fas fa-eye"></i> Revisar Petición
            </button>
          </div>`;

                // Usamos setLatLng explícito para fijar el popup exactamente en las coordenadas del origen,
                // sin depender del cálculo interno de píxeles de Leaflet (que puede fallar si el mapa
                // fue inicializado mientras el contenedor estaba oculto).
                marker.on('click', () => {
                    map.invalidateSize(); // garantizar que el mapa mida bien antes de posicionar
                    L.popup({ maxWidth: 260, autoPan: true, autoPanPadding: [30, 30] })
                        .setLatLng(coords)
                        .setContent(popupContent)
                        .openOn(map);
                });

                if (servicio.estado === 'SOLICITADO' && typeof animarMarcadorSolicitud === 'function') {
                    animarMarcadorSolicitud(marker);
                }

                markers.push(marker);
            });
        })
        .catch(error => {
            console.error('Error al cargar servicios:', error);
            showError('Error al cargar servicios disponibles');
        });
}

/* ---- Centrar mapa ---- */
function centrarMapa() {
    if (!map) return;
    if (!navigator.geolocation) { showError('Tu navegador no soporta geolocalización.'); return; }
    navigator.geolocation.getCurrentPosition(
        ({ coords }) => map.setView([coords.latitude, coords.longitude], 15),
        () => { showError('No se pudo obtener tu ubicación.'); if (map) map.setView([10.4055, -75.5037], 13); }
    );
}

/* ---- Capa de tráfico: eliminada ---- */
function alternarTrafico() {
    showError('La capa de tráfico en tiempo real no está disponible en esta versión.');
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
 * SOLICITUDES
 * ============================================= */
function showSolicitudDetails(servicioId) {
    fetch(`/conductor/servicios/${servicioId}`)
        .then(response => response.json())
        .then(servicio => {
            selectedServiceId = servicio.id;
            const tableContainer = document.getElementById('solicitudesTable');
            tableContainer.classList.remove('empty-state');
            tableContainer.innerHTML = `
        <div class="solicitud-details">
          <div class="detail-row"><i class="fas fa-user"></i><span class="detail-label">Pasajero:</span><span class="detail-value">${servicio.pasajero.nombre}</span></div>
          <div class="detail-row"><i class="fas fa-map-marker-alt"></i><span class="detail-label">Origen:</span><span class="detail-value">${servicio.origen}</span></div>
          <div class="detail-row"><i class="fas fa-flag-checkered"></i><span class="detail-label">Destino:</span><span class="detail-value">${servicio.destino}</span></div>
          <div class="detail-row"><i class="fas fa-money-bill-wave"></i><span class="detail-label">Precio:</span><span class="detail-value price">$${servicio.tarifa.toLocaleString('es-CO')} COP</span></div>
          <div class="detail-row"><i class="fas fa-clock"></i><span class="detail-label">Hora solicitud:</span><span class="detail-value">${new Date(servicio.fechaHora).toLocaleTimeString()}</span></div>
          <div class="action-buttons">
            <button class="accept-btn" onclick="aceptarSolicitud('${servicio.id}')"><i class="fas fa-check"></i> Aceptar</button>
            <button class="reject-btn" onclick="rechazarSolicitud('${servicio.id}')"><i class="fas fa-times"></i> Rechazar</button>
          </div>
        </div>`;
            tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        })
        .catch(error => {
            console.error('Error al cargar detalles:', error);
            showError('Error al cargar detalles del servicio');
        });
}

function aceptarSolicitud(servicioId) {
    fetch(`/conductor/aceptar-servicio/${servicioId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Error al aceptar el servicio');
            return response.json();
        })
        .then(data => {
            console.log('Servicio aceptado:', data);
            showError('Servicio aceptado con éxito');
            cargarServiciosDisponibles();
            document.getElementById('solicitudesTable').innerHTML = `
      <div class="empty-state"><i class="fas fa-info-circle"></i><p>Selecciona una solicitud en el mapa para ver los detalles</p></div>`;
        })
        .catch(error => {
            console.error('Error al aceptar servicio:', error);
            showError('Error al aceptar el servicio');
        });
}

function rechazarSolicitud(servicioId) {
    showError('Solicitud rechazada');
    document.getElementById('solicitudesTable').innerHTML = `
    <div class="empty-state"><i class="fas fa-info-circle"></i><p>Selecciona una solicitud en el mapa para ver los detalles</p></div>`;
}

/* =============================================
 * HISTORIAL
 * ============================================= */
function cargarHistorial() {
    fetch('/conductor/historial')
        .then(response => response.json())
        .then(historial => {
            const tbody = document.getElementById('historialBody');
            tbody.innerHTML = '';
            historial.forEach(viaje => {
                const row = document.createElement('tr');
                row.innerHTML = `
          <td>${new Date(viaje.fechaHora).toLocaleDateString()}</td>
          <td>${new Date(viaje.fechaHora).toLocaleTimeString()}</td>
          <td>${viaje.origen}</td>
          <td>${viaje.destino}</td>
          <td>${viaje.pasajero.nombre}</td>
          <td>$${viaje.tarifa.toLocaleString('es-CO')}</td>
          <td><button onclick="mostrarDetallesViaje('${viaje.id}')"><i class="fas fa-eye"></i></button></td>`;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error al cargar historial:', error);
            showError('Error al cargar historial de viajes');
        });
}

function mostrarDetallesViaje(servicioId) {
    fetch(`/conductor/servicios/${servicioId}`)
        .then(response => response.json())
        .then(servicio => {
            document.getElementById('detallesViajeContent').innerHTML = `
        <div class="detail-row"><i class="fas fa-calendar"></i><span>Fecha:</span><span>${new Date(servicio.fechaHora).toLocaleDateString()}</span></div>
        <div class="detail-row"><i class="fas fa-clock"></i><span>Hora:</span><span>${new Date(servicio.fechaHora).toLocaleTimeString()}</span></div>
        <div class="detail-row"><i class="fas fa-map-marker-alt"></i><span>Origen:</span><span>${servicio.origen}</span></div>
        <div class="detail-row"><i class="fas fa-flag-checkered"></i><span>Destino:</span><span>${servicio.destino}</span></div>
        <div class="detail-row"><i class="fas fa-user"></i><span>Pasajero:</span><span>${servicio.pasajero.nombre}</span></div>
        <div class="detail-row"><i class="fas fa-money-bill-wave"></i><span>Precio:</span><span>$${servicio.tarifa.toLocaleString('es-CO')}</span></div>
        ${servicio.calificacion ? `<div class="detail-row"><i class="fas fa-star"></i><span>Calificación:</span><span>${servicio.calificacion.toFixed(1)}</span></div>` : ''}
        ${servicio.comentarios ? `<div class="detail-row"><i class="fas fa-comment"></i><span>Comentarios:</span><span>${servicio.comentarios}</span></div>` : ''}`;
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
 * INGRESOS
 * ============================================= */
function cargarIngresos() {
    fetch('/conductor/ingresos')
        .then(response => response.json())
        .then(ingresos => {
            const tbody = document.getElementById('ingresosBody');
            tbody.innerHTML = '';
            ingresos.forEach(ingreso => {
                const row = document.createElement('tr');
                row.innerHTML = `
          <td>${new Date(ingreso.fecha).toLocaleDateString()}</td>
          <td>$${ingreso.monto.toLocaleString('es-CO')}</td>
          <td>${ingreso.descripcion}</td>`;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error al cargar ingresos:', error);
            showError('Error al cargar historial de ingresos');
        });
}

/* =============================================
 * WEBSOCKET
 * ============================================= */
let servicioModal = null;

function connectWebSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    fetch('/api/user-id')
        .then(response => response.json())
        .then(data => {
            if (data.userId) startWebSocket(data.userId);
            else { console.error('No se recibió userId'); showError('Por favor, inicia sesión nuevamente'); }
        })
        .catch(error => {
            console.error('Error al obtener userId:', error);
            setTimeout(connectWebSocket, 5000);
        });
}

function startWebSocket(userId) {
    stompClient.connect({}, function (frame) {
        console.log('Conductor conectado al WebSocket: ' + frame);

        stompClient.subscribe('/topic/servicios-disponibles', function (message) {
            cargarServiciosDisponibles();
            const servicio = JSON.parse(message.body);
            const areNotifsEnabled = document.getElementById('chkNotificaciones').checked;
            if (areNotifsEnabled && servicio.estado === 'SOLICITADO') {
                showNewRequestToast(servicio.pasajero.nombre);
            }
        });

        stompClient.subscribe(`/topic/conductor/${userId}`, function (message) {
            const servicio = JSON.parse(message.body);
            console.log('Conductor recibió actualización:', servicio);
            handleServicioUpdate(servicio);
        });

    }, function (error) {
        console.error('Error en WebSocket del conductor:', error);
        showError('Error de conexión. Reintentando...');
        setTimeout(() => connectWebSocket(), 5000);
    });
}

function handleServicioUpdate(servicio) {
    console.log('Conductor procesando estado:', servicio.estado, servicio);
    currentServicioId = servicio.id;
    switch (servicio.estado) {
        case 'ACEPTADO':
            showServicioModal(servicio, 'Servicio Aceptado', `
        <div class="passenger-info">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="passenger-photo">
          <h4>${servicio.pasajero.nombre}</h4>
          <p>Esperando en: ${servicio.origen}</p>
        </div>
        <div class="service-details">
          <div class="detail-row"><i class="fas fa-flag-checkered"></i><span>Destino: ${servicio.destino}</span></div>
          <div class="detail-row"><i class="fas fa-money-bill-wave"></i><span>Precio: $${servicio.tarifa.toLocaleString('es-CO')} COP</span></div>
        </div>
        <div class="action-buttons">
          <button class="start-btn" onclick="iniciarViaje('${servicio.id}')"><i class="fas fa-play"></i> Iniciar Viaje</button>
          <button class="cancel-btn" onclick="cancelarServicio('${servicio.id}')"><i class="fas fa-times"></i> Cancelar</button>
        </div>`);
            break;
        case 'EN_CURSO':
            showServicioModal(servicio, 'Viaje en Curso', `
        <div class="progress-container">
          <div class="route-progress">
            <div class="progress-bar"><div class="progress" style="width:50%"></div></div>
            <div class="locations"><span class="origin">${servicio.origen}</span><span class="destination">${servicio.destino}</span></div>
          </div>
          <div class="passenger-info">
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="passenger-photo">
            <h4>${servicio.pasajero.nombre}</h4>
          </div>
        </div>
        <div class="action-buttons">
          <button class="finish-btn" onclick="finalizarViaje('${servicio.id}')"><i class="fas fa-flag-checkered"></i> Finalizar Viaje</button>
        </div>`);
            break;
        case 'FINALIZADO':
            hideServicioModal();
            window.location.href = `/rating?servicioId=${servicio.id}&rol=conductor`;
            break;
        case 'CANCELADO':
            hideServicioModal();
            showError('El pasajero ha cancelado el viaje');
            break;
    }
}

function hideServicioModal() {
    const existingModal = document.getElementById('servicioModal');
    if (existingModal) existingModal.remove();
}

function showServicioModal(servicio, title, content) {
    console.log('Mostrando modal para:', title);
    hideServicioModal();

    servicioModal = document.createElement('div');
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
    servicioModal.classList.add('active');
    Object.assign(servicioModal.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        zIndex: '2000', backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
}

function iniciarViaje(servicioId) {
    fetch(`/conductor/iniciar-servicio/${servicioId}`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value }
    })
        .then(response => { if (!response.ok) throw new Error('Error al iniciar'); })
        .catch(error => showError(error.message || 'Error al iniciar el viaje'));
}

function finalizarViaje(servicioId) {
    const modalContent = document.querySelector('.modal-body');
    const originalContent = modalContent.innerHTML;
    modalContent.innerHTML = '<div class="spinner-container"><div class="spinner"></div><p>Finalizando viaje...</p></div>';

    fetch(`/conductor/finalizar-servicio/${servicioId}`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value }
    })
        .then(response => {
            if (!response.ok) throw new Error('Error al finalizar');
            return response.json();
        })
        .then(() => { window.location.href = `/rating?servicioId=${servicioId}&rol=conductor`; })
        .catch(error => {
            console.error('Error al finalizar viaje:', error);
            modalContent.innerHTML = originalContent;
            showError(error.message || 'Error al finalizar el viaje');
        });
}

function cancelarServicio(servicioId) {
    fetch(`/conductor/cancelar-servicio/${servicioId}`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value }
    })
        .then(response => {
            if (!response.ok) throw new Error('Error al cancelar');
            hideServicioModal();
            showError('Servicio cancelado correctamente');
        })
        .catch(error => showError(error.message || 'Error al cancelar el servicio'));
}

// Conectar WebSocket al cargar
document.addEventListener('DOMContentLoaded', connectWebSocket);

/* =============================================
 * HISTORIAL LOCAL (paginación + filtros)
 * ============================================= */
let historialData = [];
let currentPage = 1;
const itemsPerPage = 5;

function cargarHistorialLocal() {
    fetch('/conductor/historial')
        .then(response => response.json())
        .then(historial => { historialData = historial; renderizarHistorial(); })
        .catch(error => { console.error('Error al cargar historial:', error); showError('Error al cargar historial de viajes'); });
}

function renderizarHistorial(filteredData = historialData) {
    const tbody = document.getElementById('historialBody');
    tbody.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = filteredData.slice(start, end);

    paginatedData.forEach(viaje => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${new Date(viaje.fechaHora).toLocaleDateString()}</td>
      <td>${new Date(viaje.fechaHora).toLocaleTimeString()}</td>
      <td>${viaje.origen}</td>
      <td>${viaje.destino}</td>
      <td>${viaje.pasajero.nombre}</td>
      <td>$${viaje.tarifa.toLocaleString('es-CO')}</td>
      <td><button onclick="mostrarDetallesViaje('${viaje.id}')"><i class="fas fa-eye"></i></button></td>`;
        tbody.appendChild(row);
    });

    document.getElementById('pageInfo').textContent = `Página ${currentPage}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = end >= filteredData.length;
}

function filtrarHistorial() {
    const fecha = document.getElementById('filtroFecha').value;
    const pasajero = document.getElementById('filtroPasajero').value.toLowerCase();
    const filteredData = historialData.filter(viaje => {
        const matchFecha = fecha ? new Date(viaje.fechaHora).toLocaleDateString() === new Date(fecha).toLocaleDateString() : true;
        const matchPasajero = pasajero ? viaje.pasajero.nombre.toLowerCase().includes(pasajero) : true;
        return matchFecha && matchPasajero;
    });
    currentPage = 1;
    renderizarHistorial(filteredData);
}

function resetFiltrosHistorial() {
    document.getElementById('filtroFecha').value = '';
    document.getElementById('filtroPasajero').value = '';
    currentPage = 1;
    renderizarHistorial();
}

function cambiarPagina(delta) {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > Math.ceil(historialData.length / itemsPerPage)) currentPage = Math.ceil(historialData.length / itemsPerPage);
    renderizarHistorial();
}

/* =============================================
 * INGRESOS LOCAL (filtros)
 * ============================================= */
let ingresosData = [];

function cargarIngresosLocal() {
    fetch('/conductor/ingresos')
        .then(response => response.json())
        .then(ingresos => { ingresosData = ingresos; filtrarIngresos(); })
        .catch(error => { console.error('Error al cargar ingresos:', error); showError('Error al cargar historial de ingresos'); });
}

function filtrarIngresos() {
    const periodo = document.getElementById('filtroPeriodo').value;
    const fechaFiltro = document.getElementById('filtroFechaIngresos').value;
    const today = new Date();
    let filteredIngresos = [...ingresosData];

    if (fechaFiltro) {
        filteredIngresos = filteredIngresos.filter(i => i.fecha === fechaFiltro);
    } else {
        if (periodo === 'año') filteredIngresos = filteredIngresos.filter(i => new Date(i.fecha).getFullYear() === today.getFullYear());
        else if (periodo === 'mes') filteredIngresos = filteredIngresos.filter(i => { const d = new Date(i.fecha); return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth(); });
        else if (periodo === 'semana') {
            const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
            filteredIngresos = filteredIngresos.filter(i => new Date(i.fecha) >= weekAgo);
        } else if (periodo === 'día') filteredIngresos = filteredIngresos.filter(i => new Date(i.fecha).toDateString() === today.toDateString());
    }

    const tbody = document.getElementById('ingresosBody');
    tbody.innerHTML = '';
    filteredIngresos.forEach(ingreso => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${new Date(ingreso.fecha).toLocaleDateString()}</td>
      <td>$${ingreso.monto.toLocaleString('es-CO')}</td>
      <td>${ingreso.descripcion}</td>`;
        tbody.appendChild(row);
    });
}

function resetFiltrosIngresos() {
    document.getElementById('filtroFechaIngresos').value = '';
    filtrarIngresos();
}

/* =============================================
 * DOMContentLoaded
 * ============================================= */
document.addEventListener('DOMContentLoaded', function () {
    checkDarkMode();
    loadProfileData();
    initNotificationSettings();

    // Inicializar mapa si la sección activa es solicitudes
    const activeSection = document.querySelector('.section.active');
    if (activeSection && activeSection.id === 'solicitudes') {
        requestAnimationFrame(() => initMap());
    }

    document.querySelectorAll('.sidebar ul li[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            showSection(sectionId);
            if (sectionId === 'solicitudes') {
                requestAnimationFrame(() => {
                    if (!map) initMap();
                    else map.invalidateSize();
                });
            } else if (sectionId === 'historial') {
                cargarHistorialLocal();
            } else if (sectionId === 'billetera') {
                cargarIngresosLocal();
            }
        });
    });

    const toggleBtn = document.querySelector('.toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            const main = document.querySelector('.main');
            const icon = toggleBtn.querySelector('i');
            sidebar.classList.toggle('collapsed');
            main.classList.toggle('collapsed');
            icon.classList.toggle('fa-angle-double-left');
            icon.classList.toggle('fa-angle-double-right');
        });
    }

    const centerMapBtn = document.querySelector('.map-controls .map-btn[title="Centrar mapa"]');
    if (centerMapBtn) centerMapBtn.addEventListener('click', centrarMapa);

    // Botón tráfico: solo muestra aviso
    const trafficBtn = document.querySelector('.map-controls .map-btn[title="Mostrar tráfico"]');
    if (trafficBtn) trafficBtn.addEventListener('click', alternarTrafico);

    const modalClose = document.querySelector('.modal-close');
    if (modalClose) modalClose.addEventListener('click', cerrarModalDetalles);
});

/* =============================================
 * MODAL CONFIRMACIÓN GENÉRICO
 * ============================================= */
const confirmModal = document.getElementById('confirm-modal');
const confirmBtnYes = document.getElementById('confirm-modal-btn-yes');
const confirmTitle = document.getElementById('confirm-modal-title');
const confirmMessage = document.getElementById('confirm-modal-message');

function openConfirmModal(title, message, actionId) {
    if (!confirmModal || !confirmBtnYes || !confirmTitle || !confirmMessage) { console.error('Elementos del modal de confirmación no encontrados'); return; }
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
if (confirmModal) confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) closeConfirmModal(); });

/* =============================================
 * NOTIFICACIONES
 * ============================================= */
function initNotificationSettings() {
    const chkNotif = document.getElementById('chkNotificaciones');
    if (!chkNotif) return;
    let savedState = null;
    try { savedState = localStorage.getItem('receiveNotifications'); } catch(e) {}
    chkNotif.checked = savedState === null ? true : (savedState === 'true');
    chkNotif.addEventListener('change', function () {
        try { localStorage.setItem('receiveNotifications', this.checked); } catch(e) {}
        if (this.checked) showNewRequestToast('Sistema', 'Notificaciones activadas correctamente');
    });
}

function showNewRequestToast(pasajeroNombre, mensajeExtra = 'está buscando conductor') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
    <div class="toast-icon"><i class="fas fa-street-view"></i></div>
    <div class="toast-content">
      <h4>Nueva Solicitud</h4>
      <p><strong>${pasajeroNombre}</strong> ${mensajeExtra}</p>
    </div>`;
    document.body.appendChild(toast);
    playNotificationSound();
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 5000);
}

function playNotificationSound() {
    // const audio = new Audio('/sounds/notification.mp3');
    // audio.play().catch(e => console.log('Interacción requerida para audio'));
}

/* Exponer al scope global */
window.openConfirmModal = openConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.initMap = initMap;
window.showSection = showSection;
window.resetPerfil = resetPerfil;
window.showSolicitudDetails = showSolicitudDetails;