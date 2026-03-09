document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.rating-container');
    const servicioId = container.getAttribute('data-servicio-id');
    const rol = container.getAttribute('data-rol');
    const stars = document.querySelectorAll('#stars i');
    let rating = 0;

    console.log("Datos recibidos:", { servicioId, rol });

    if (!servicioId || !rol) {
        console.error("Faltan parámetros requeridos");
        alert('Datos de servicio incompletos');
        return;
    }

    // Manejo de estrellas
    stars.forEach(star => {
        star.addEventListener('click', function () {
            rating = parseInt(this.getAttribute('data-rating'));
            stars.forEach((s, index) => {
                s.classList.toggle('fas', index < rating);
                s.classList.toggle('far', index >= rating);
            });
        });

        star.addEventListener('mouseenter', function () {
            const hoverRating = parseInt(this.getAttribute('data-rating'));
            stars.forEach((s, index) => {
                s.classList.toggle('fas', index < hoverRating);
                s.classList.toggle('far', index >= hoverRating);
            });
        });

        star.addEventListener('mouseleave', function () {
            stars.forEach((s, index) => {
                s.classList.toggle('fas', index < rating);
                s.classList.toggle('far', index >= rating);
            });
        });
    });

    document.getElementById('submitRating').addEventListener('click', function () {
        if (rating === 0) {
            alert('Por favor selecciona una calificación');
            return;
        }

        const comentarios = document.getElementById('comentarios').value;
        const csrfToken = document.querySelector('input[name="_csrf"]').value;
        const csrfName = document.querySelector('input[name="_csrf"]').name;

        console.log("Enviando (form):", { servicioId, rating, comentarios, rol });

        // Usamos un form programático para que Spring maneje correctamente la redirección.
        // fetch() no puede seguir redirects server-side sin perder la sesión.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/rating/calificar';

        const fields = {
            servicioId: servicioId,
            calificacion: rating,
            comentarios: comentarios,
            rol: rol,
            [csrfName]: csrfToken
        };

        for (const [name, value] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
    });
});
