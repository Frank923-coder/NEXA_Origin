/* Map styles */
const lightMapStyles = [
  {
      featureType: "all",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }]
  },
  {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [{ color: "#333333" }, { weight: 1 }]
  },
  {
      featureType: "all",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#ffffff" }, { weight: 2 }]
  },
  {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#e0e0e0" }]
  },
  {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#a6adc4" }]
  },
  {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ color: "#bdbdbd" }]
  },
  {
      featureType: "road.local",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }]
  },
  {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#90caf9" }]
  },
  {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#e0e0e0" }]
  },
  {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#eeeeee" }]
  },
  {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#c8e6c9" }]
  },
  {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#e0e0e0" }]
  },
  {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#555555" }]
  }
];

const darkMapStyles = [
  {
      featureType: "all",
      elementType: "geometry",
      stylers: [{ color: "#1e1e1e" }]
  },
  {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [{ color: "#bbbbbb" }, { weight: 1 }]
  },
  {
      featureType: "all",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#2a2a2a" }, { weight: 2 }]
  },
  {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#444444" }]
  },
  {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#4688f1" }]
  },
  {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ color: "#666666" }]
  },
  {
      featureType: "road.local",
      elementType: "geometry",
      stylers: [{ color: "#555555" }]
  },
  {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0288d1" }]
  },
  {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#2a2a2a" }]
  },
  {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#333333" }]
  },
  {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#388e3c" }]
  },
  {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#444444" }]
  },
  {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#888888" }]
  }
];

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

let map, marcador, directionsService, directionsRenderer, infoWindowRuta;
let trafficLayer;
let originMarker, destinationMarker;
let estimatedPrice = 0;
let calculatedDistanceKm = 0;

function initMap() {
  const centro = { lat: 10.4055, lng: -75.5037 };
  const isDarkMode = document.body.classList.contains('dark-mode');

  const mapContainer = document.querySelector('.map-container');
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'map-loading';
  loadingOverlay.innerHTML = '<div class="spinner"></div>';
  mapContainer.appendChild(loadingOverlay);

  const geocoder = new google.maps.Geocoder();

  map = new google.maps.Map(document.getElementById("map"), {
      center: centro,
      zoom: 14,
      styles: isDarkMode ? darkMapStyles : lightMapStyles,
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
      }
  });

  google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => loadingOverlay.remove(), 500);
  });

  trafficLayer = new google.maps.TrafficLayer();

  marcador = new google.maps.Marker({
      map: map,
      position: centro,
      draggable: true,
      icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#a6adc4",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 8
      },
      animation: google.maps.Animation.DROP
  });

  setInterval(() => {
      const currentOpacity = marcador.getIcon().fillOpacity;
      marcador.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#a6adc4",
          fillOpacity: currentOpacity === 1 ? 0.7 : 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 8
      });
  }, 1500);

  marcador.addListener('dragstart', function() {
      this.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#8f97b1",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 8
      });
      this.setAnimation(null);
  });

  marcador.addListener('dragend', function() {
      this.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#4caf50",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 8
      });
      this.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => this.setAnimation(null), 1000);

      const posicion = this.getPosition();
      geocoder.geocode({ location: posicion }, (results, status) => {
          if (status === "OK" && results[0]) {
              document.getElementById("origen").value = results[0].formatted_address;
          }
      });
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
          strokeColor: '#1E3A8A',
          strokeOpacity: 0.8,
          strokeWeight: 5,
          zIndex: 1
      }
  });
  directionsRenderer.setMap(map);

  infoWindowRuta = new google.maps.InfoWindow({
      maxWidth: 280,
      minWidth: 200,
      disableAutoPan: true
  });

  const origenInput = document.getElementById("origen");
  const destinoInput = document.getElementById("destino");

  const boundsCartagena = new google.maps.LatLngBounds(
      { lat: 10.3, lng: -75.6 },
      { lat: 10.5, lng: -75.4 }
  );

  const opcionesAutocompletado = {
      bounds: boundsCartagena,
      strictBounds: true,
      componentRestrictions: { country: "CO" },
      fields: ["address_components", "geometry", "name", "formatted_address"]
  };

  const autocompleteOrigen = new google.maps.places.Autocomplete(origenInput, opcionesAutocompletado);
  const autocompleteDestino = new google.maps.places.Autocomplete(destinoInput, opcionesAutocompletado);

  autocompleteOrigen.addListener('place_changed', function() {
      const place = autocompleteOrigen.getPlace();
      if (!place.geometry) return;

      map.setCenter(place.geometry.location);
      marcador.setPosition(place.geometry.location);
      animateMarker(marcador);
  });
}

function animateMarker(marker) {
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => marker.setAnimation(null), 1000);
}

function calcularRuta() {
  const origen = document.getElementById("origen").value;
  const destino = document.getElementById("destino").value;

  if (!origen || !destino) {
      showError("Por favor, completa ambos campos.");
      return;
  }

  const mapContainer = document.querySelector('.map-container');
  let loadingOverlay = document.querySelector('.map-loading');
  if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'map-loading';
      loadingOverlay.innerHTML = '<div class="spinner"></div>';
      mapContainer.appendChild(loadingOverlay);
  }

  document.getElementById("detalle-precio").innerHTML = `
      <div class="loading-state">
          <div class="spinner"></div>
          <p>Calculando la mejor ruta...</p>
      </div>
  `;

  const request = {
      origin: origen,
      destination: destino,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: false,
  };

  directionsService.route(request, function(result, status) {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => loadingOverlay.remove(), 500);

      if (status === google.maps.DirectionsStatus.OK) {
          if (originMarker) originMarker.setMap(null);
          if (destinationMarker) destinationMarker.setMap(null);

          directionsRenderer.setOptions({
              polylineOptions: {
                  strokeColor: '#1E3A8A',
                  strokeOpacity: 0.4,
                  strokeWeight: 5,
                  zIndex: 1
              }
          });

          let opacity = 0.4;
          const animateRoute = setInterval(() => {
              opacity += 0.1;
              if (opacity >= 0.8) {
                  clearInterval(animateRoute);
                  opacity = 0.8;
              }
              directionsRenderer.setOptions({
                  polylineOptions: {
                      strokeColor: '#1E3A8A',
                      strokeOpacity: opacity,
                      strokeWeight: 5,
                      zIndex: 1
                  }
              });
          }, 50);

          directionsRenderer.setDirections(result);

          const ruta = result.routes[0].legs[0];
          const distanciaKm = ruta.distance.value / 1000;
          calculatedDistanceKm = distanciaKm;
          const duracionTexto = ruta.duration.text;
          estimatedPrice = 1000 + distanciaKm * 800;

          originMarker = new google.maps.Marker({
              position: ruta.start_location,
              map: map,
              icon: {
                  url: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23a6adc4"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 32)
              },
              title: "Origen"
          });

          destinationMarker = new google.maps.Marker({
              position: ruta.end_location,
              map: map,
              icon: {
                  url: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%234caf50"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 32)
              },
              title: "Destino"
          });

          [originMarker, destinationMarker].forEach(marker => {
              setInterval(() => {
                  const currentOpacity = marker.getIcon().fillOpacity || 1;
                  marker.setIcon({
                      url: marker.getIcon().url,
                      scaledSize: marker.getIcon().scaledSize,
                      anchor: marker.getIcon().anchor,
                      fillOpacity: currentOpacity === 1 ? 0.7 : 1
                  });
              }, 1500);
          });

          updateRideDetails(distanciaKm, duracionTexto, estimatedPrice, ruta.steps);
          document.getElementById("requestRideBtn").disabled = false;
          showRouteInfo(ruta);

          const precioInput = document.getElementById("precioInput");
          precioInput.placeholder = `Ej: ${estimatedPrice.toLocaleString("es-CO")} COP`;
          precioInput.removeAttribute('readonly');
          precioInput.value = '';
      } else {
          let errorMessage = "No se pudo calcular la ruta. Verifica las direcciones.";
          if (status === google.maps.DirectionsStatus.INVALID_REQUEST) {
              errorMessage = "La solicitud de ruta no es válida. Intenta nuevamente.";
          } else if (status === google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
              errorMessage = "Límite de consultas excedido. Espera un momento.";
          } else if (status === google.maps.DirectionsStatus.REQUEST_DENIED) {
              errorMessage = "Acceso denegado. Verifica tu API key de Google Maps.";
          } else if (status === google.maps.DirectionsStatus.UNKNOWN_ERROR) {
              errorMessage = "Error desconocido. Intenta nuevamente.";
          }

          showError(errorMessage);
          console.error("Error al calcular la ruta:", status, result);
      }
  });
}

function updateRideDetails(distance, duration, price, steps) {
  let instructionsHTML = '<div class="route-instructions"><h4><i class="fas fa-directions"></i> Instrucciones de Ruta</h4><ol>';
  steps.forEach((step, index) => {
      const instructionText = step.instructions || 'Instrucción no disponible';
      instructionsHTML += `<li><span class="step-number">${index + 1}.</span> <span class="instruction-text">${instructionText}</span> <span class="step-distance">(${step.distance.text})</span></li>`;
  });
  instructionsHTML += '</ol></div>';

  document.getElementById("detalle-precio").innerHTML = `
      <div class="detail-row">
          <i class="fas fa-road"></i>
          <div>
              <span class="detail-label">Distancia:</span>
              <span class="detail-value">${distance.toFixed(2)} km</span>
          </div>
      </div>
      <div class="detail-row">
          <i class="fas fa-clock"></i>
          <div>
              <span class="detail-label">Duración:</span>
              <span class="detail-value">${duration}</span>
          </div>
      </div>
      <div class="detail-row">
          <i class="fas fa-money-bill-wave"></i>
          <div>
              <span class="detail-label">Precio estimado:</span>
              <span class="detail-value price">$${price.toLocaleString("es-CO")} COP</span>
          </div>
      </div>
      ${instructionsHTML}
  `;
}

function showRouteInfo(route) {
  const distanciaKm = route.distance.value / 1000;
  const duracionTexto = route.duration.text;
  const precioTotal = estimatedPrice;

  const contenidoHTML = `
      <div class="route-tooltip">
          <div class="route-summary">
              <div class="route-stat">
                  <i class="fas fa-road"></i>
                  <span>${distanciaKm.toFixed(2)} km</span>
              </div>
              <div class="route-stat">
                  <i class="fas fa-clock"></i>
                  <span>${duracionTexto}</span>
              </div>
          </div>
          <div class="route-price">
              <i class="fas fa-tag"></i>
              <span>$${precioTotal.toLocaleString("es-CO")} COP</span>
          </div>
      </div>
  `;

  infoWindowRuta.setContent(contenidoHTML);
  infoWindowRuta.setPosition(route.steps[Math.floor(route.steps.length / 2)].end_location);
  infoWindowRuta.open(map);
}

function limpiarRuta() {
  directionsRenderer.setMap(null);
  if (originMarker) originMarker.setMap(null);
  if (destinationMarker) destinationMarker.setMap(null);
  document.getElementById("origen").value = "";
  document.getElementById("destino").value = "";
  document.getElementById("detalle-precio").innerHTML = `
      <div class="empty-state">
          <i class="fas fa-route"></i>
          <p>Ingresa origen y destino para calcular tu viaje</p>
      </div>
  `;
  const precioInput = document.getElementById("precioInput");
  precioInput.value = "";
  precioInput.placeholder = "Ej: 15.000";
  document.getElementById("requestRideBtn").disabled = true;
  infoWindowRuta.close();
  calculatedDistanceKm = 0;
}

function centrarMapa() {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
              const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
              };
              map.setCenter(pos);
              marcador.setPosition(pos);
              animateMarker(marcador);

              geocoder.geocode({ location: pos }, (results, status) => {
                  if (status === "OK" && results[0]) {
                      document.getElementById("origen").value = results[0].formatted_address;
                  }
              });
          },
          () => {
              showError("No se pudo obtener tu ubicación. Usando ubicación predeterminada.");
              map.setCenter({ lat: 10.4055, lng: -75.5037 });
          }
      );
  } else {
      showError("Tu navegador no soporta geolocalización. Usando ubicación predeterminada.");
      map.setCenter({ lat: 10.4055, lng: -75.5037 });
  }
}

function alternarTrafico() {
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

/* Funciones para mostrar/ocultar el modal de búsqueda de moto */
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

  /* Asegurarse de que el modal y sus elementos existen */
  if (!motoModal || !modalTitle || !modalMessage || !driverInfo || !progressContainer || !progressBar || !originText || !destinationText || !driverPhoto || !driverName || !driverStatus) {
    console.error('Faltan elementos en el DOM para mostrar el modal');
    showError('Error al mostrar el modal. Por favor, revisa la estructura HTML.');
    return;
  }

  /* Actualizar contenido básico */
  modalTitle.textContent = title;
  if (message) {
    modalMessage.textContent = message;
    modalMessage.style.display = 'block';
  } else {
    modalMessage.style.display = 'none';
  }

  /* Manejar la sección de información del conductor */
  if (showDriverInfo) {
    driverInfo.style.display = 'block';
    driverPhoto.src = driverData.driverPhoto || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    driverName.textContent = driverData.driverName || 'Conductor no asignado';
    driverStatus.textContent = driverData.driverStatus || 'Preparándose para recogerte';

    /* Añadir el botón de cancelar si no existe */
    let cancelBtn = driverInfo.querySelector('.action-buttons .cancel-btn');
    if (!cancelBtn) {
      const actionButtons = document.createElement('div');
      actionButtons.className = 'action-buttons';
      actionButtons.innerHTML = `
        <button id="cancelRideBtn" class="btn cancel-btn">
          <i class="fas fa-times"></i> Cancelar viaje
        </button>
      `;
      driverInfo.appendChild(actionButtons);
      cancelBtn = document.getElementById('cancelRideBtn');
      cancelBtn.addEventListener('click', cancelRide);
    }
  } else {
    driverInfo.style.display = 'none';
  }

  /* Manejar la sección de progreso */
  if (showProgress) {
    progressContainer.style.display = 'block';
    progressBar.style.width = `${progress}%`;
    originText.textContent = origin || 'Origen';
    destinationText.textContent = destination || 'Destino';
  } else {
    progressContainer.style.display = 'none';
  }

  /* Mostrar el modal con animación */
  motoModal.style.display = 'block';
  setTimeout(() => motoModal.classList.add('active'), 10);
}

function hideMotoModal() {
  const motoModal = document.getElementById('motoModal');
  if (motoModal) {
    motoModal.classList.remove('active');
    setTimeout(() => {
      motoModal.style.display = 'none';
      /* Restablecer el modal al estado inicial */
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
  if (!currentServicioId) {
    hideMotoModal();
    return;
  }

  fetch(`/pasajero/cancelar-viaje/${currentServicioId}`, {
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error al cancelar el viaje');
    }
    hideMotoModal();
    showError('Viaje cancelado correctamente');
  })
  .catch(error => {
    console.error('Error al cancelar viaje:', error);
    showError(error.message || 'Error al cancelar el viaje');
  });
}

/* WebSocket para actualizaciones en tiempo real */
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
  stompClient.connect({}, function(frame) {
    console.log('Pasajero conectado al WebSocket: ' + frame);
    stompClient.subscribe(`/topic/pasajero/${userId}`, function(message) {
      const servicio = JSON.parse(message.body);
      console.log('Pasajero recibió actualización:', servicio);
      handleServicioUpdate(servicio);
    });
  }, function(error) {
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
            showMotoModal(
                'Conductor asignado',
                'Tu conductor está en camino',
                true,
                false,
                0,
                '',
                '',
                { driverPhoto, driverName, driverStatus: 'Preparándose para recogerte' }
            );
            break;
        case 'EN_CURSO':
            showMotoModal(
                'Viaje en curso',
                'Disfruta tu viaje',
                true,
                true,
                50,
                servicio.origen,
                servicio.destino,
                { driverPhoto, driverName, driverStatus: 'En camino' }
            );
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

/* Funciones adicionales (mantenidas como estaban) */
function showServicioModal(servicio, title, content) {
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
    headers: {
      'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]').value
    }
  })
  .then(response => {
    if (!response.ok) throw new Error('Error al cancelar');
    hideMotoModal();
    showError('Viaje cancelado correctamente');
  })
  .catch(error => {
    showError(error.message || 'Error al cancelar el viaje');
  });
}

function subscribeToPasajeroTopic() {
  const userId = localStorage.getItem('userId');
  if (userId && stompClient) {
    stompClient.subscribe('/topic/pasajero/' + userId, function(message) {
      const servicio = JSON.parse(message.body);
      handleServicioUpdate(servicio);
    });
  }
}

// Variables para el historial
let historialDataPasajero = [];
let currentPagePasajero = 1;
const itemsPerPagePasajero = 5;

// Función para cargar el historial del pasajero
function cargarHistorialPasajero() {
    fetch('/pasajero/historial')
        .then(response => response.json())
        .then(historial => {
            historialDataPasajero = historial;
            renderizarHistorialPasajero();
        })
        .catch(error => {
            console.error('Error al cargar historial:', error);
            showError("Error al cargar historial de viajes");
        });
}

// Función para renderizar el historial con paginación
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

            <td>$${viaje.tarifa.toLocaleString("es-CO")}</td>
            <td>
                <button onclick="mostrarDetallesViajePasajero('${viaje.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('pageInfo').textContent = `Página ${currentPagePasajero}`;
    document.getElementById('prevPage').disabled = currentPagePasajero === 1;
    document.getElementById('nextPage').disabled = end >= filteredData.length;
}

// Función para filtrar el historial
function filtrarHistorialPasajero() {
    const fecha = document.getElementById('filtroFecha').value;

    const filteredData = historialDataPasajero.filter(viaje => {
        const matchFecha = fecha ? new Date(viaje.fechaHora).toLocaleDateString() === new Date(fecha).toLocaleDateString() : true;

        return matchFecha;
    });

    currentPagePasajero = 1;
    renderizarHistorialPasajero(filteredData);
}

// Función para resetear filtros
function resetFiltrosHistorialPasajero() {
    document.getElementById('filtroFecha').value = '';
    document.getElementById('filtroConductor').value = '';
    currentPagePasajero = 1;
    renderizarHistorialPasajero();
}

// Función para cambiar de página
function cambiarPaginaPasajero(delta) {
    currentPagePasajero += delta;
    if (currentPagePasajero < 1) currentPagePasajero = 1;
    const maxPage = Math.ceil(historialDataPasajero.length / itemsPerPagePasajero);
    if (currentPagePasajero > maxPage) currentPagePasajero = maxPage;
    renderizarHistorialPasajero();
}

// Función para mostrar detalles del viaje
function mostrarDetallesViajePasajero(servicioId) {
    fetch(`/pasajero/servicios/${servicioId}`)
        .then(response => response.json())
        .then(servicio => {
            document.getElementById('detallesViajeContent').innerHTML = `
                <div class="detail-row"><i class="fas fa-calendar"></i><span>Fecha:</span><span>${new Date(servicio.fechaHora).toLocaleDateString()}</span></div>
                <div class="detail-row"><i class="fas fa-clock"></i><span>Hora:</span><span>${new Date(servicio.fechaHora).toLocaleTimeString()}</span></div>
                <div class="detail-row"><i class="fas fa-map-marker-alt"></i><span>Origen:</span><span>${servicio.origen}</span></div>
                <div class="detail-row"><i class="fas fa-flag-checkered"></i><span>Destino:</span><span>${servicio.destino}</span></div>

                <div class="detail-row"><i class="fas fa-money-bill-wave"></i><span>Precio:</span><span>$${servicio.tarifa.toLocaleString("es-CO")}</span></div>
                ${servicio.calificacionConductor ? `<div class="detail-row"><i class="fas fa-star"></i><span>Tu calificación:</span><span>${servicio.calificacionConductor.toFixed(1)}</span></div>` : ''}
                ${servicio.comentariosConductor ? `<div class="detail-row"><i class="fas fa-comment"></i><span>Tu comentario:</span><span>${servicio.comentariosConductor}</span></div>` : ''}
            `;
            document.getElementById('modalDetallesViaje').classList.add('active');
        })
        .catch(error => {
            console.error('Error al cargar detalles:', error);
            showError("Error al cargar detalles del viaje");
        });
}

// Función para cerrar el modal
function cerrarModalDetalles() {
    document.getElementById('modalDetallesViaje').classList.remove('active');
}

// Inicialización cuando se carga la sección de historial
document.addEventListener('DOMContentLoaded', function() {
    // ... otros listeners ...

    // Cuando se muestra la sección de historial
    document.querySelectorAll('.sidebar ul li[data-section="historial"]').forEach(item => {
        item.addEventListener('click', () => {
            cargarHistorialPasajero();
        });
    });

    // O si usas la función showSection
    window.showSection = function(id) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');

        if (id === 'historial') {
            cargarHistorialPasajero();
        }
    };
});

document.addEventListener('DOMContentLoaded', () => {
  checkDarkMode();
  loadProfileData();
  connectWebSocket();

  const precioInput = document.getElementById('precioInput');
  precioInput.removeAttribute('readonly');

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
    const precioInput = document.getElementById('precioInput').value.replace(/\D/g, '') || estimatedPrice;
    const metodoPago = document.querySelector('.option-card.selected span').textContent;

    const solicitud = {
      origen: origen,
      destino: destino,
      ubicacionOrigen: {
        latitud: originMarker.getPosition().lat(),
        longitud: originMarker.getPosition().lng()
      },
      ubicacionDestino: {
        latitud: destinationMarker.getPosition().lat(),
        longitud: destinationMarker.getPosition().lng()
      },
      distanciaKM: calculatedDistanceKm,
      tarifa: parseFloat(precioInput),
      fechaHora: new Date().toISOString(),
      metodoPago: metodoPago
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
      if (!response.ok) {
        return response.json().then(err => { throw err; });
      }
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

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      hideMotoModal();
    });
  }

  if (motoModal) {
    window.addEventListener('click', (event) => {
      if (event.target === motoModal) {
        hideMotoModal();
      }
    });
  }

  /* Selección de método de pago */
  document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', function() {
      document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
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

// Asignar funciones al objeto 'window' para que los 'onclick' del HTML funcionen
window.openConfirmModal = openConfirmModal;
window.closeConfirmModal = closeConfirmModal;
/* Asegurar que las funciones estén en el ámbito global */
window.initMap = initMap;
window.showSection = showSection;
window.resetPerfil = resetPerfil;
window.calcularRuta = calcularRuta;
window.limpiarRuta = limpiarRuta;
window.centrarMapa = centrarMapa;
window.alternarTrafico = alternarTrafico;
window.toggleDarkMode = toggleDarkMode;
window.guardarCambios = guardarCambios;