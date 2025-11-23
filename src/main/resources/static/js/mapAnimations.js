/**
 * mapAnimations.js
 * Lógica para animaciones de marcadores de Google Maps.
 * Versión 2: Anima el tamaño ('scaledSize') y opacidad ('opacity')
 * de un marcador con icono de imagen (PNG o SVG).
 */

function animarMarcadorSolicitud(marker) {
    const originalIcon = marker.getIcon();
    if (!originalIcon || !originalIcon.scaledSize) {
        // No se puede animar si el ícono no es de tipo imagen con scaledSize
        return;
    }

    let width = originalIcon.scaledSize.width;
    let height = originalIcon.scaledSize.height;
    let direction = 1; // 1 = creciendo, -1 = decreciendo

    // Definimos los límites del pulso
    const baseWidth = originalIcon.scaledSize.width;   // Tamaño base, ej: 32
    const baseHeight = originalIcon.scaledSize.height; // Tamaño base, ej: 32
    const maxWidth = baseWidth * 1.4;                  // 40% más grande
    const maxHeight = baseHeight * 1.4;

    // Pasos de animación
    const stepW = (maxWidth - baseWidth) / 15;
    const stepH = (maxHeight - baseHeight) / 15;

    marker.animationInterval = setInterval(() => {
        if (!marker.getMap()) {
            // Limpiar si el marcador se elimina
            clearInterval(marker.animationInterval);
            return;
        }

        // 1. Calcular nuevo tamaño
        if (direction === 1) {
            width += stepW;
            height += stepH;
            if (width >= maxWidth) {
                width = maxWidth;
                height = maxHeight;
                direction = -1; // Invertir
            }
        } else {
            width -= stepW;
            height -= stepH;
            if (width <= baseWidth) {
                width = baseWidth;
                height = baseHeight;
                direction = 1; // Invertir
            }
        }

        // 2. Calcular la opacidad (más sutil cuando es más grande)
        // Opacidad va de 1 (en tamaño base) a 0.7 (en tamaño máximo)
        const opacity = 1 - 0.3 * ((width - baseWidth) / (maxWidth - baseWidth));

        // 3. Aplicar el nuevo ícono modificado
        // Debemos crear un nuevo objeto de ícono y establecerlo
        marker.setIcon({
            url: originalIcon.url,
            scaledSize: new google.maps.Size(width, height),
            // El ancla debe ajustarse al nuevo tamaño para que el centro no se mueva
            anchor: new google.maps.Point(width / 2, height / 2)
        });

        // 4. Aplicar la opacidad al marcador general
        marker.setOpacity(opacity);

    }, 50); // 50ms (20fps) para una animación fluida
}