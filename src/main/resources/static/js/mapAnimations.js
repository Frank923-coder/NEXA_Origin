/**
 * mapAnimations.js — Animaciones para marcadores Leaflet (divIcon)
 *
 * Usa CSS @keyframes inyectado en <style> para animar el contenedor
 * del divIcon sin depender de la API de Google Maps.
 */

// Inyectar los keyframes solo una vez
(function injectAnimationCSS() {
    if (document.getElementById('marker-animation-styles')) return;
    const style = document.createElement('style');
    style.id = 'marker-animation-styles';
    style.textContent = `
    @keyframes markerPulse {
      0%   { transform: scale(1);   opacity: 1; }
      40%  { transform: scale(1.4); opacity: 0.7; }
      80%  { transform: scale(1);   opacity: 1; }
      100% { transform: scale(1);   opacity: 1; }
    }
    @keyframes markerBounce {
      0%   { transform: translateY(0);   }
      30%  { transform: translateY(-12px); }
      60%  { transform: translateY(-4px);  }
      80%  { transform: translateY(-8px);  }
      100% { transform: translateY(0);   }
    }
    .marker-animating    { animation: markerPulse  0.8s ease-in-out infinite; }
    .marker-bounce       { animation: markerBounce 0.6s ease-in-out 3; }
    .marker-drop         { animation: markerBounce 0.4s ease-out 1; }
  `;
    document.head.appendChild(style);
})();

/**
 * Devuelve el elemento DOM raíz del divIcon de un marcador Leaflet.
 * @param {L.Marker} marker
 * @returns {HTMLElement|null}
 */
function getMarkerEl(marker) {
    return marker && marker.getElement ? marker.getElement() : null;
}

/**
 * Anima un marcador Leaflet con efecto "pulse" continuo.
 * Equivalente al antiguo animateMarker de Google Maps.
 * @param {L.Marker} marker
 * @returns {boolean} true si se pudo animar
 */
function animarMarcadorSolicitud(marker) {
    const el = getMarkerEl(marker);
    if (!el) return false;

    el.classList.remove('marker-bounce', 'marker-drop');
    el.classList.add('marker-animating');

    // Guardar referencia al intervalo en el marcador por si se quiere detener
    marker._pulseActive = true;
    return true;
}

/**
 * Detiene la animación de pulse en un marcador.
 * @param {L.Marker} marker
 */
function detenerAnimacion(marker) {
    const el = getMarkerEl(marker);
    if (!el) return;
    el.classList.remove('marker-animating', 'marker-bounce', 'marker-drop');
    marker._pulseActive = false;
}

/**
 * Animación DROP al añadir un marcador (equivalente a google.maps.Animation.DROP).
 * @param {L.Marker} marker
 */
function animarMarcadorDrop(marker) {
    const el = getMarkerEl(marker);
    if (!el) return;
    el.classList.add('marker-drop');
    el.addEventListener('animationend', () => el.classList.remove('marker-drop'), { once: true });
}

/**
 * Animación BOUNCE (equivalente a google.maps.Animation.BOUNCE).
 * Rebota N veces (por defecto 3).
 * @param {L.Marker} marker
 * @param {number} [repeticiones=3]
 */
function animarMarcadorBounce(marker, repeticiones = 3) {
    const el = getMarkerEl(marker);
    if (!el) return;
    el.style.animationIterationCount = String(repeticiones);
    el.classList.add('marker-bounce');
    el.addEventListener('animationend', () => {
        el.classList.remove('marker-bounce');
        el.style.animationIterationCount = '';
    }, { once: true });
}