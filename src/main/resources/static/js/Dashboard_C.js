// Map styles
const lightMapStyles = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#f5f5f5" }], },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#333333" }, { weight: 1 }], },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2 }], },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#e0e0e0" }], },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#a6adc4" }], },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#bdbdbd" }], },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }], },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#90caf9" }], },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#e0e0e0" }], },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }], },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#c8e6c9" }], },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#e0e0e0" }], },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#555555" }], },
];

const darkMapStyles = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#1e1e1e" }], },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#bbbbbb" }, { weight: 1 }], },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#2a2a2a" }, { weight: 2 }], },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#444444" }], },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4688f1" }], },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#666666" }], },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#555555" }], },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0288d1" }], },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#2a2a2a" }], },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#333333" }], },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#388e3c" }], },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#444444" }], },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#888888" }], },
];
const passengerIconUrl = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2248%22%20height%3D%2248%22%20viewBox%3D%220%200%2048%2048%22%3E%3Ccircle%20cx%3D%2224%22%20cy%3D%2224%22%20r%3D%2224%22%20fill%3D%22%234CAF50%22%2F%3E%3Ccircle%20cx%3D%2224%22%20cy%3D%2224%22%20r%3D%2222%22%20fill%3D%22none%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20fill%3D%22white%22%20d%3D%22M24%2026c-4.42%200-16%202.21-16%206.6V36h32v-3.4c0-4.39-11.58-6.6-16-6.6zM24%2010c-3.31%200-6%202.69-6%206s2.69%206%206%206%206-2.69%206-6-2.69-6-6-6z%22%2F%3E%3C%2Fsvg%3E';
// Variables globales
let map, trafficLayer;
let markers = [];
let selectedServiceId = null;
let stompClient = null;
let currentServicioId = null;

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDark);
  document.getElementById('darkModeText').textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  if (map) {
      map.setOptions({ styles: isDark ? darkMapStyles : lightMapStyles });
  }
}

function checkDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
      document.body.classList.add('dark-mode');
      document.getElementById('darkModeText').textContent = 'Modo claro';
  }
}

function guardarCambios() {
  const username = document.getElementById('usernameInput').value;
  const profilePicInput = document.getElementById('profilePicInput');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const profilePicDisplay = document.getElementById('profilePicDisplay');

  if (username) {
      usernameDisplay.textContent = username;
      localStorage.setItem('username', username);
  }

  if (profilePicInput.files && profilePicInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
          const imageData = e.target.result;
          profilePicDisplay.src = imageData;
          localStorage.setItem('profilePic', imageData);
      }
      reader.readAsDataURL(profilePicInput.files[0]);
  }
}

function loadProfileData() {
  const savedUsername = localStorage.getItem('username');
  const savedProfilePic = localStorage.getItem('profilePic');

  if (savedUsername) {
      document.getElementById('usernameInput').value = savedUsername;
      document.getElementById('usernameDisplay').textContent = savedUsername;
  }

  if (savedProfilePic) {
      document.getElementById('profilePicDisplay').src = savedProfilePic;
  }
}

function resetPerfil() {
  localStorage.removeItem('username');
  localStorage.removeItem('profilePic');
  document.getElementById('usernameInput').value = 'USER';
  document.getElementById('usernameDisplay').textContent = 'USER';
  document.getElementById('profilePicDisplay').src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  document.getElementById('profilePicInput').value = '';
}

function initMap() {
  if (!document.getElementById('map')) {
      console.error('Elemento #map no encontrado');
      showError('No se pudo cargar el mapa. Intenta de nuevo.');
      return;
  }

  if (typeof google === 'undefined' || !google.maps) {
      console.warn('API de Google Maps no está lista. Reintentando...');
      setTimeout(initMap, 1000); // Reintenta después de 1 segundo
      return;
  }

  const centro = { lat: 10.4055, lng: -75.5037 };
  const isDarkMode = document.body.classList.contains('dark-mode');

  const mapContainer = document.querySelector('.map-container');
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'map-loading';
  loadingOverlay.innerHTML = '<div class="spinner"></div>';
  mapContainer.appendChild(loadingOverlay);

  try {
      map = new google.maps.Map(document.getElementById('map'), {
          center: centro,
          zoom: 13,
          styles: isDarkMode ? darkMapStyles : lightMapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU },
      });

      google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
          loadingOverlay.classList.add('hidden');
          setTimeout(() => loadingOverlay.remove(), 500);
      });

      trafficLayer = new google.maps.TrafficLayer();
      cargarServiciosDisponibles();
  } catch (error) {
      console.error('Error al inicializar el mapa:', error);
      showError('Error al cargar el mapa. Verifica tu conexión o la clave API.');
      loadingOverlay.remove();
  }
}

function cargarServiciosDisponibles() {
  fetch('/conductor/servicios-disponibles')
      .then(response => response.json())
      .then(servicios => {
                markers.forEach(marker => {
                    if (marker.animationInterval) {
                    clearInterval(marker.animationInterval); // Detener el intervalo
                    }
                    marker.setMap(null);
                });
                markers = [];

          servicios.forEach(servicio => {
              const marker = new google.maps.Marker({
                  position: {
                      lat: servicio.ubicacionOrigen.latitud,
                      lng: servicio.ubicacionOrigen.longitud
                  },
                  map,
                  title: servicio.pasajero.nombre,
                  icon: {
                  url: passengerIconUrl, // Usamos nuestro SVG Data URI
                                          // Definimos el tamaño base (la animación lo hará crecer)
                  scaledSize: new google.maps.Size(32, 32),
                                          // Ancla en el centro para que el pulso sea desde el centro
                  anchor: new google.maps.Point(16, 16)
                  }
              });

              const infoWindowContent = `
                  <div class="info-window">
                      <div class="info-row"><i class="fas fa-user"></i><span>${servicio.pasajero.nombre}</span></div>
                      <div class="info-row"><i class="fas fa-map-marker-alt"></i><span>${servicio.origen}</span></div>
                      <div class="info-row"><i class="fas fa-flag-checkered"></i><span>${servicio.destino}</span></div>
                      <div class="info-row"><i class="fas fa-money-bill-wave"></i><span class="price">$${servicio.tarifa.toLocaleString("es-CO")} COP</span></div>
                      <button class="review-btn" onclick="window.showSolicitudDetails('${servicio.id}')"><i class="fas fa-eye"></i> Revisar Petición</button>
                  </div>
              `;

              const infoWindow = new google.maps.InfoWindow({
                  content: infoWindowContent,
                  maxWidth: 250,
              });

              marker.addListener('click', () => {
                  infoWindow.open(map, marker);
              });

              if (servicio.estado === 'SOLICITADO') {

                if (typeof animarMarcadorSolicitud === 'function') {
                    animarMarcadorSolicitud(marker);
                }
              }

              markers.push(marker);
          });
      })
      .catch(error => {
          console.error('Error al cargar servicios:', error);
          showError("Error al cargar servicios disponibles");
      });
}

function showSolicitudDetails(servicioId) {
  fetch(`/conductor/servicios/${servicioId}`)
      .then(response => response.json())
      .then(servicio => {
          selectedServiceId = servicio.id;

          const tableContainer = document.getElementById('solicitudesTable');
          tableContainer.classList.remove('empty-state');
          tableContainer.innerHTML = `
              <div class="solicitud-details">
                  <div class="detail-row">
                      <i class="fas fa-user"></i>
                      <span class="detail-label">Pasajero:</span>
                      <span class="detail-value">${servicio.pasajero.nombre}</span>
                  </div>
                  <div class="detail-row">
                      <i class="fas fa-map-marker-alt"></i>
                      <span class="detail-label">Origen:</span>
                      <span class="detail-value">${servicio.origen}</span>
                  </div>
                  <div class="detail-row">
                      <i class="fas fa-flag-checkered"></i>
                      <span class="detail-label">Destino:</span>
                      <span class="detail-value">${servicio.destino}</span>
                  </div>
                  <div class="detail-row">
                      <i class="fas fa-money-bill-wave"></i>
                      <span class="detail-label">Precio:</span>
                      <span class="detail-value price">$${servicio.tarifa.toLocaleString("es-CO")} COP</span>
                  </div>
                  <div class="detail-row">
                      <i class="fas fa-clock"></i>
                      <span class="detail-label">Hora solicitud:</span>
                      <span class="detail-value">${new Date(servicio.fechaHora).toLocaleTimeString()}</span>
                  </div>
                  <div class="action-buttons">
                      <button class="accept-btn" onclick="aceptarSolicitud('${servicio.id}')"><i class="fas fa-check"></i> Aceptar</button>
                      <button class="reject-btn" onclick="rechazarSolicitud('${servicio.id}')"><i class="fas fa-times"></i> Rechazar</button>
                  </div>
              </div>
          `;

          tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(error => {
          console.error('Error al cargar detalles:', error);
          showError("Error al cargar detalles del servicio");
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
        console.log('Servicio aceptado, datos recibidos:', data); // Registro de depuración
        showError("Servicio aceptado con éxito");
        cargarServiciosDisponibles();
        document.getElementById('solicitudesTable').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-info-circle"></i>
                <p>Selecciona una solicitud en el mapa para ver los detalles</p>
            </div>
        `;
    })
    .catch(error => {
        console.error('Error al aceptar servicio:', error);
        showError("Error al aceptar el servicio");
    });
}

function rechazarSolicitud(servicioId) {
  showError("Solicitud rechazada");
  document.getElementById('solicitudesTable').innerHTML = `
      <div class="empty-state">
          <i class="fas fa-info-circle"></i>
          <p>Selecciona una solicitud en el mapa para ver los detalles</p>
      </div>
  `;
}

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
                  <td>$${viaje.tarifa.toLocaleString("es-CO")}</td>
                  <td><button onclick="mostrarDetallesViaje('${viaje.id}')"><i class="fas fa-eye"></i></button></td>
              `;
              tbody.appendChild(row);
          });
      })
      .catch(error => {
          console.error('Error al cargar historial:', error);
          showError("Error al cargar historial de viajes");
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
              <div class="detail-row"><i class="fas fa-money-bill-wave"></i><span>Precio:</span><span>$${servicio.tarifa.toLocaleString("es-CO")}</span></div>
              ${servicio.calificacion ? `<div class="detail-row"><i class="fas fa-star"></i><span>Calificación:</span><span>${servicio.calificacion.toFixed(1)}</span></div>` : ''}
              ${servicio.comentarios ? `<div class="detail-row"><i class="fas fa-comment"></i><span>Comentarios:</span><span>${servicio.comentarios}</span></div>` : ''}
          `;
          document.getElementById('modalDetallesViaje').classList.add('active');
      })
      .catch(error => {
          console.error('Error al cargar detalles:', error);
          showError("Error al cargar detalles del viaje");
      });
}

function cerrarModalDetalles() {
  document.getElementById('modalDetallesViaje').classList.remove('active');
}

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
                  <td>$${ingreso.monto.toLocaleString("es-CO")}</td>
                  <td>${ingreso.descripcion}</td>
              `;
              tbody.appendChild(row);
          });
      })
      .catch(error => {
          console.error('Error al cargar ingresos:', error);
          showError("Error al cargar historial de ingresos");
      });
}

// WebSocket para actualizaciones en tiempo real

let servicioModal = null;

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
    stompClient.connect({}, function(frame) {
        console.log('Conductor conectado al WebSocket: ' + frame);

        stompClient.subscribe('/topic/servicios-disponibles', function(message) {
                    // 1. Actualizar el mapa (Lo que ya hacías)
                    cargarServiciosDisponibles();

                    // 2. Lógica de Notificación
                    const servicio = JSON.parse(message.body);
                    const areNotifsEnabled = document.getElementById('chkNotificaciones').checked;

                    // Solo notificamos si:
                    // a. Las notificaciones están activadas
                    // b. El estado es SOLICITADO (es nuevo)
                    if (areNotifsEnabled && servicio.estado === 'SOLICITADO') {
                        showNewRequestToast(servicio.pasajero.nombre);
                    }
        });

        stompClient.subscribe(`/topic/conductor/${userId}`, function(message) {
            const servicio = JSON.parse(message.body);
            console.log('Conductor recibió actualización:', servicio); // Registro de depuración
            handleServicioUpdate(servicio);
        });

        stompClient.subscribe('/topic/servicios-disponibles', function(message) {
            cargarServiciosDisponibles();
        });
    }, function(error) {
        console.error('Error en WebSocket del conductor:', error);
        showError('Error de conexión. Reintentando...');
        setTimeout(() => connectWebSocket(), 5000);
    });
}

function handleServicioUpdate(servicio) {
    console.log('Conductor procesando estado:', servicio.estado, servicio);
    currentServicioId = servicio.id;
    switch(servicio.estado) {
        case 'ACEPTADO':
            showServicioModal(servicio, 'Servicio Aceptado', `
                <div class="passenger-info">
                    <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="passenger-photo">
                    <h4>${servicio.pasajero.nombre}</h4>
                    <p>Esperando en: ${servicio.origen}</p>
                </div>
                <div class="service-details">
                    <div class="detail-row">
                        <i class="fas fa-flag-checkered"></i>
                        <span>Destino: ${servicio.destino}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Precio: $${servicio.tarifa.toLocaleString("es-CO")} COP</span>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="start-btn" onclick="iniciarViaje('${servicio.id}')">
                        <i class="fas fa-play"></i> Iniciar Viaje
                    </button>
                    <button class="cancel-btn" onclick="cancelarServicio('${servicio.id}')">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            `);
            break; // Agregar este break
        case 'EN_CURSO':
            showServicioModal(servicio, 'Viaje en Curso', `
                <div class="progress-container">
                    <div class="route-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: 50%"></div>
                        </div>
                        <div class="locations">
                            <span class="origin">${servicio.origen}</span>
                            <span class="destination">${servicio.destino}</span>
                        </div>
                    </div>
                    <div class="passenger-info">
                        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="passenger-photo">
                        <h4>${servicio.pasajero.nombre}</h4>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="finish-btn" onclick="finalizarViaje('${servicio.id}')">
                        <i class="fas fa-flag-checkered"></i> Finalizar Viaje
                    </button>
                </div>
            `);
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
    if (existingModal) {
        existingModal.remove();
    }
}

function showServicioModal(servicio, title, content) {
    console.log('Intentando mostrar modal para:', title);
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
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;

    document.body.appendChild(servicioModal);
    servicioModal.classList.add('active');
    servicioModal.style.position = 'fixed';
    servicioModal.style.top = '0';
    servicioModal.style.left = '0';
    servicioModal.style.width = '100%';
    servicioModal.style.height = '100%';
    servicioModal.style.zIndex = '2000';
    servicioModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    servicioModal.style.display = 'flex'; // Asegura que align-items y justify-content funcionen
    servicioModal.style.alignItems = 'center';
    servicioModal.style.justifyContent = 'center';
    console.log('Modal añadido al DOM:', servicioModal);
}

function iniciarViaje(servicioId) {
    fetch(`/conductor/iniciar-servicio/${servicioId}`, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al iniciar');
    })
    .catch(error => {
        showError(error.message || 'Error al iniciar el viaje');
    });
}

function finalizarViaje(servicioId) {
    // Mostrar feedback al usuario
    const modalContent = document.querySelector('.modal-body');
    const originalContent = modalContent.innerHTML;
    modalContent.innerHTML = '<div class="spinner-container"><div class="spinner"></div><p>Finalizando viaje...</p></div>';

    fetch(`/conductor/finalizar-servicio/${servicioId}`, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al finalizar');
        return response.json();
    })
    .then(data => {

        window.location.href = `/rating?servicioId=${servicioId}&rol=conductor`;
    })
    .catch(error => {
        console.error('Error al finalizar viaje:', error);
        modalContent.innerHTML = originalContent;
        showError(error.message || 'Error al finalizar el viaje');
    });
}
function cancelarServicio(servicioId) {
    fetch(`/conductor/cancelar-servicio/${servicioId}`, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cancelar');
        hideServicioModal();
        showError('Servicio cancelado correctamente');
    })
    .catch(error => {
        showError(error.message || 'Error al cancelar el servicio');
    });
}

// Conectar WebSocket cuando la página cargue
document.addEventListener('DOMContentLoaded', connectWebSocket);
function showMotoModal(servicio, texto) {
  hideMotoModal();
  const modal = document.createElement('div');
  modal.id = 'motoModal';
  modal.className = 'modal';
  modal.innerHTML = `
      <div class="modal-content">
          <div class="moto-icon">
              <i class="fas fa-motorcycle"></i>
          </div>
          <div class="searching-text">${texto}</div>
          <div class="progress-bar">
              <div class="progress"></div>
          </div>
          <br>
          <button class="close-btn" onclick="hideMotoModal()">Cerrar</button>
      </div>
  `;
  document.body.appendChild(modal);
  const progress = modal.querySelector('.progress');
  progress.style.animation = 'progressAnim 5s linear forwards';
}

function hideMotoModal() {
  const motoModal = document.getElementById('motoModal');
  if (motoModal) {
      motoModal.remove();
  }
}

function centrarMapa() {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
              const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
              };
              if (map) {
                  map.setCenter(pos);
              } else {
                  showError('Mapa no inicializado. Intenta recargar la página.');
              }
          },
          () => {
              showError("No se pudo obtener tu ubicación. Usando ubicación predeterminada.");
              if (map) {
                  map.setCenter({ lat: 10.4055, lng: -75.5037 });
              }
          }
      );
  } else {
      showError("Tu navegador no soporta geolocalización. Usando ubicación predeterminada.");
      if (map) {
          map.setCenter({ lat: 10.4055, lng: -75.5037 });
      }
  }
}

function alternarTrafico() {
  if (!map || !trafficLayer) {
      showError('Mapa no inicializado. Intenta recargar la página.');
      return;
  }
  if (trafficLayer.getMap()) {
      trafficLayer.setMap(null);
      document.querySelector(".map-controls .fa-traffic-light").style.color = "";
  } else {
      trafficLayer.setMap(map);
      document.querySelector(".map-controls .fa-traffic-light").style.color = "#a6adc4";
  }
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  document.body.appendChild(errorDiv);
  setTimeout(() => {
      errorDiv.classList.add("fade-out");
      setTimeout(() => errorDiv.remove(), 500);
  }, 3000);
}

// Historial
let historialData = [];
let currentPage = 1;
const itemsPerPage = 5;

function cargarHistorialLocal() {
  fetch('/conductor/historial')
      .then(response => response.json())
      .then(historial => {
          historialData = historial;
          renderizarHistorial();
      })
      .catch(error => {
          console.error('Error al cargar historial:', error);
          showError("Error al cargar historial de viajes");
      });
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
          <td>$${viaje.tarifa.toLocaleString("es-CO")}</td>
          <td><button onclick="mostrarDetallesViaje('${viaje.id}')"><i class="fas fa-eye"></i></button></td>
      `;
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



function cargarIngresosLocal() {
  fetch('/conductor/ingresos')
      .then(response => response.json())
      .then(ingresos => {
          ingresosData = ingresos;
          filtrarIngresos();
      })
      .catch(error => {
          console.error('Error al cargar ingresos:', error);
          showError("Error al cargar historial de ingresos");
      });
}

function filtrarIngresos() {
  const periodo = document.getElementById('filtroPeriodo').value;
  const fechaFiltro = document.getElementById('filtroFechaIngresos').value;
  const today = new Date();

  let filteredIngresos = [...ingresosData];

  if (fechaFiltro) {
      filteredIngresos = filteredIngresos.filter(i => i.fecha === fechaFiltro);
  } else {
      if (periodo === "año") {
          filteredIngresos = filteredIngresos.filter(i => new Date(i.fecha).getFullYear() === today.getFullYear());
      } else if (periodo === "mes") {
          filteredIngresos = filteredIngresos.filter(i => {
              const d = new Date(i.fecha);
              return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
          });
      } else if (periodo === "semana") {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          filteredIngresos = filteredIngresos.filter(i => {
              const d = new Date(i.fecha);
              return d >= startOfWeek && d <= endOfWeek;
          });
      } else if (periodo === "día") {
          filteredIngresos = filteredIngresos.filter(i => i.fecha === today.toISOString().split('T')[0]);
      }
  }

  const tbody = document.getElementById('ingresosBody');
  tbody.innerHTML = '';

  filteredIngresos.forEach(ingreso => {
      const row = document.createElement('tr');
      row.innerHTML = `
          <td>${new Date(ingreso.fecha).toLocaleDateString()}</td>
          <td>$${ingreso.monto.toLocaleString("es-CO")}</td>
          <td>${ingreso.descripcion}</td>
      `;
      tbody.appendChild(row);
  });

  const totalMonto = filteredIngresos.reduce((sum, ingreso) => sum + ingreso.monto, 0);
  document.querySelector('.wallet-amount').textContent = `$${totalMonto.toLocaleString("es-CO")} COP`;
}

function resetFiltrosIngresos() {
  document.getElementById('filtroPeriodo').value = 'año';
  document.getElementById('filtroFechaIngresos').value = '';
  filtrarIngresos();
}

// Configurar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  checkDarkMode();
  loadProfileData();
  connectWebSocket();
  initNotificationSettings();

  // Intentar inicializar el mapa si la sección de solicitudes está activa
  const activeSection = document.querySelector('.section.active').id;
  if (activeSection === 'solicitudes' && typeof google !== 'undefined' && google.maps) {
      initMap();
  }

  document.querySelectorAll('.sidebar ul li[data-section]').forEach(item => {
      item.addEventListener('click', () => {
          const sectionId = item.getAttribute('data-section');
          showSection(sectionId);
          if (sectionId === 'solicitudes' && typeof google !== 'undefined' && google.maps) {
              initMap();
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

  const resetBtn = document.querySelector('.reset-btn');
  if (resetBtn) {
      resetBtn.addEventListener('click', resetPerfil);
  }

  const saveBtn = document.querySelector('#perfil button:not(.reset-btn)'); // Selecciona el botón "Guardar Cambios"
  if (saveBtn) {
      saveBtn.addEventListener('click', guardarCambios);
  }

  const centerMapBtn = document.querySelector('.map-controls .map-btn[title="Centrar mapa"]');
  if (centerMapBtn) {
      centerMapBtn.addEventListener('click', centrarMapa);
  }

  const trafficBtn = document.querySelector('.map-controls .map-btn[title="Mostrar tráfico"]');
  if (trafficBtn) {
      trafficBtn.addEventListener('click', alternarTrafico);
  }

  const filterHistorialBtn = document.querySelector('button[onclick="filtrarHistorial()"]');
  if (filterHistorialBtn) {
      filterHistorialBtn.addEventListener('click', filtrarHistorial);
  }

  const resetHistorialBtn = document.querySelector('button[onclick="resetFiltrosHistorial()"]');
  if (resetHistorialBtn) {
      resetHistorialBtn.addEventListener('click', resetFiltrosHistorial);
  }

  const prevPageBtn = document.querySelector('#prevPage');
  if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => cambiarPagina(-1));
  }

  const nextPageBtn = document.querySelector('#nextPage');
  if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => cambiarPagina(1));
  }

  const filtroPeriodo = document.querySelector('#filtroPeriodo');
  if (filtroPeriodo) {
      filtroPeriodo.addEventListener('change', filtrarIngresos);
  }

  const filtroFechaIngresos = document.querySelector('#filtroFechaIngresos');
  if (filtroFechaIngresos) {
      filtroFechaIngresos.addEventListener('change', filtrarIngresos);
  }

  const resetIngresosBtn = document.querySelector('button[onclick="resetFiltrosIngresos()"]');
  if (resetIngresosBtn) {
      resetIngresosBtn.addEventListener('click', resetFiltrosIngresos);
  }

  const darkModeToggle = document.querySelector('.setting-box:nth-child(3) button');
  if (darkModeToggle) {
      darkModeToggle.addEventListener('click', toggleDarkMode);
  }

  const modalClose = document.querySelector('.modal-close');
  if (modalClose) {
      modalClose.addEventListener('click', cerrarModalDetalles);
  }
});

/* =================================== */
/* ===== LÓGICA MODAL CONFIRMACIÓN ===== */
/* =================================== */

const confirmModal = document.getElementById('confirm-modal');
const confirmBtnYes = document.getElementById('confirm-modal-btn-yes');
const confirmTitle = document.getElementById('confirm-modal-title');
const confirmMessage = document.getElementById('confirm-modal-message');

/**
 * Abre el modal de confirmación genérico.
 * @param {string} title - El título para el modal.
 * @param {string} message - El mensaje de pregunta.
 * @param {string} actionId - Un ID para saber qué acción ejecutar (ej: 'logout', 'deleteUser')
 */
function openConfirmModal(title, message, actionId) {
    if (!confirmModal || !confirmBtnYes || !confirmTitle || !confirmMessage) {
        console.error("Elementos del modal de confirmación no encontrados");
        return;
    }

    // 1. Poblar el modal con el texto
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;

    // 2. Guardar la acción a ejecutar en el botón de confirmación
    // Usamos data-attributes, una práctica estándar y limpia.
    confirmBtnYes.dataset.actionId = actionId;

    // 3. Mostrar el modal
    confirmModal.style.display = 'flex';
    document.body.style.overflow = "hidden"; // Evita scroll de fondo
}

/**
 * Cierra el modal de confirmación.
 */
function closeConfirmModal() {
    if (!confirmModal) return;
    confirmModal.style.display = 'none';
    document.body.style.overflow = "auto"; // Restaura scroll
}

/**
 * Ejecuta la acción guardada en el botón 'Confirmar'.
 */
function executeConfirmAction() {
    const actionId = confirmBtnYes.dataset.actionId;

    // Aquí es donde la "reutilización" brilla.
    // Puedes añadir más 'case' para otras acciones.
    switch (actionId) {
        case 'logout':
            // Busca el formulario de logout y lo envía.
            const logoutForm = document.getElementById('logout-form');
            if (logoutForm) {
                logoutForm.submit();
            } else {
                console.error("El formulario 'logout-form' no se encontró.");
            }
            break;

        case 'delete-user':
            // EJEMPLO FUTURO:
            // console.log("Lógica para borrar usuario...");
            break;

        case 'approve-all':
            // EJEMPLO FUTURO:
            // console.log("Lógica para aprobar todo...");
            break;

        default:
            console.warn("Acción de confirmación desconocida:", actionId);
    }

    // Cierra el modal después de ejecutar la acción
    closeConfirmModal();
}

// --- Event Listeners Globales ---
// 1. Asignar el clic al botón de confirmación
if (confirmBtnYes) {
    confirmBtnYes.addEventListener('click', executeConfirmAction);
}

// 2. (Opcional) Cerrar modal si se hace clic fuera del contenido
if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
        // Si el clic fue en el overlay (fondo) y no en el contenido
        if (e.target === confirmModal) {
            closeConfirmModal();
        }
    });
}
// Función para inicializar el estado de las notificaciones
function initNotificationSettings() {
    const chkNotif = document.getElementById('chkNotificaciones');

    // 1. Cargar estado guardado (o true por defecto)
    const savedState = localStorage.getItem('receiveNotifications');
    chkNotif.checked = savedState === null ? true : (savedState === 'true');

    // 2. Guardar cambios cuando el usuario hace click
    chkNotif.addEventListener('change', function() {
        localStorage.setItem('receiveNotifications', this.checked);
        if(this.checked) {
            // Notificación de prueba visual para confirmar activación
            showNewRequestToast("Sistema", "Notificaciones activadas correctamente");
        }
    });
}
function showNewRequestToast(pasajeroNombre, mensajeExtra = "está buscando conductor") {
    // 1. Verificar si ya existe un toast y removerlo para evitar acumulación
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();

    // 2. Crear HTML dinámico
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-street-view"></i>
        </div>
        <div class="toast-content">
            <h4>Nueva Solicitud</h4>
            <p><strong>${pasajeroNombre}</strong> ${mensajeExtra}</p>
        </div>
    `;

    // 3. Añadir al DOM
    document.body.appendChild(toast);

    // 4. Reproducir sonido (Opcional pero recomendado para conductores)
    playNotificationSound();

    // 5. Animar entrada (pequeño delay para que CSS detecte el cambio)
    setTimeout(() => toast.classList.add('show'), 10);

    // 6. Eliminar automáticamente después de 5 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Esperar a que termine la animación de salida
    }, 5000);
}

// Sonido simple "ding"
function playNotificationSound() {
    // Puedes usar un archivo mp3 real o este beep generado por JS si quieres ser minimalista,
    // pero un archivo de audio es mejor. Aquí simulo la intención.
    // const audio = new Audio('/sounds/notification.mp3');
    // audio.play().catch(e => console.log("Interacción requerida para audio"));
}


// Asignar funciones al objeto 'window' para que los 'onclick' del HTML funcionen
window.openConfirmModal = openConfirmModal;
window.closeConfirmModal = closeConfirmModal;
// Asegurar que las funciones estén en el ámbito global
window.initMap = initMap;
window.showSection = showSection;
window.resetPerfil = resetPerfil;
window.showSolicitudDetails = showSolicitudDetails;