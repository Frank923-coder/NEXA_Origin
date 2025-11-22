// Variable global para el gráfico de registros
let registrosChart;
let stompClient = null;

document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
    setupEventListeners();
    setupInitialToggleLogic();
    initNotificationSettings(); // Configuración de notificaciones
    connectAdminWebSocket();

    // 1. CONFIGURACIÓN DEL TOGGLE NOTIFICACIONES
        const notifToggle = document.getElementById('notif');
        if (notifToggle) {
            notifToggle.addEventListener('change', function() {
                const isEnabled = this.checked;
                const csrfToken = document.querySelector('input[name="_csrf"]')?.value;

                // FormData para enviar al backend
                const formData = new FormData();
                formData.append('habilitado', isEnabled);

                fetch('/admin/config/notificaciones', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrfToken },
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if(data.success) showToast('Configuración guardada', data.message, 'success');
                    else {
                        showToast('Error', 'No se pudo guardar la configuración', 'error');
                        this.checked = !isEnabled; // Revertir visualmente
                    }
                })
                .catch(() => {
                    showToast('Error de conexión', 'Verifica tu internet', 'error');
                    this.checked = !isEnabled;
                });
            });
        }

        // 2. INICIAR WEBSOCKET PARA ADMIN
        connectAdminWebSocket();
});


// Lógica del Modal Manual
window.openPermissionsModal = function() {
    const modal = document.getElementById('permissionsModal');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }
}

window.closePermissionsModal = function() {
    const modal = document.getElementById('permissionsModal');
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// WebSocket Admin
function connectAdminWebSocket() {
    const socket = new SockJS('/ws');
    const stompClient = Stomp.over(socket);
    stompClient.debug = null; // Desactivar logs ruidosos en consola

    stompClient.connect({}, function() {
        // Suscripción al canal de registros
        stompClient.subscribe('/topic/admin/registros', function(message) {

            // VERIFICACIÓN: Solo mostrar si el switch está activo visualmente
            const toggle = document.getElementById('notif');
            if (toggle && toggle.checked) {
                const data = JSON.parse(message.body);
                showToast(
                    'Nuevo Usuario Registrado',
                    `${data.email} (${data.rol})`,
                    'success'
                );

                // Opcional: Recargar contadores si estás en la vista 'home'
                if(typeof fetchDashboardData === 'function') fetchDashboardData();
            }
        });
    });
}

// Función Toast Genérica
function showToast(title, message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(toast);

    // Auto remover después de 4 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- FUNCIONES DE INICIALIZACIÓN ---

function initDashboard() {
    // Configurar nombre de usuario y sus iniciales para el modo colapsado
    const userNameSpan = document.querySelector(".sidebar-header .logo-text");
    if (userNameSpan) {
        const nombreUsuario = userNameSpan.textContent.trim() || "Administrador";
        const iniciales = nombreUsuario.split(' ').map(n => n[0]).join('').toUpperCase();
        userNameSpan.dataset.nombre = nombreUsuario;
        userNameSpan.dataset.initiales = iniciales;
    }

    // Configurar sección activa al cargar la página (usa el hash o 'home' por defecto)
    const currentSection = window.location.hash.substring(1) || 'home';
    showSection(currentSection);
}

function setupEventListeners() {
    document.addEventListener('click', (e) => {
        const modal = document.getElementById("infoModal");
        // Cerrar modal al hacer clic fuera
        if (e.target === modal && modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        // Cerrar modal con ESC
        if (e.key === 'Escape') closeModal();
    });

    // --- Lógica del Botón de Hamburguesa (Móvil) ---
    const sidebar = document.getElementById('sidebar');
    const toggleMobileButtons = document.querySelectorAll('.menu-toggle-btn');

    toggleMobileButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (sidebar && window.innerWidth <= 992) {
                // SOLO en móvil, alternamos la clase 'active' para abrir/cerrar el overlay.
                sidebar.classList.toggle('active');
            }
        });
    });

    // --- Lógica para el cierre automático del sidebar en móvil al hacer clic en un ítem ---
    document.querySelectorAll('.sidebar ul li').forEach(item => {
        item.addEventListener('click', () => {
            if (sidebar && window.innerWidth <= 992) {
                sidebar.classList.remove('active');
                sidebar.classList.remove('collapsed');
            }
        });
    });
}

function setupInitialToggleLogic() {
    // Maneja el toggle de ESCRITORIO (las flechas)
    const toggleDesktop = document.querySelector('.sidebar-header .toggle-btn');

    if (toggleDesktop) {
        toggleDesktop.addEventListener('click', () => {
            // Llama a la función que gestiona el colapso/expansión del sidebar
            toggleSidebarDesktop();
        });
    }
}


// --- FUNCIONES DE NAVEGACIÓN Y TOGGLE ---

function toggleSidebarDesktop() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const icon = sidebar.querySelector(".toggle-btn i");
    const userName = document.querySelector(".sidebar-header .logo-text");
    const mainContent = document.querySelector(".main");

    // 1. Alterna la clase 'collapsed' en el sidebar
    sidebar.classList.toggle("collapsed");

    // 2. Ajusta el ícono y el nombre de usuario
    if (icon && userName) {
        icon.classList.toggle("fa-angle-double-left");
        icon.classList.toggle("fa-angle-double-right");

        userName.textContent = sidebar.classList.contains("collapsed")
            ? userName.dataset.initiales || "ADM"
            : userName.dataset.nombre || "Administrador";
    }

    // 3. Aplica la clase 'collapsed' al main content (para ajustar el margen en desktop)
    if (mainContent) {
        mainContent.classList.toggle('collapsed', sidebar.classList.contains("collapsed"));
    }
}
// Asegura que window.toggleSidebar apunte a la función correcta (para el onclick en HTML)
window.toggleSidebar = toggleSidebarDesktop;


function showSection(sectionId) {
    if (!sectionId) return;

    // 1. Ocultar todas las secciones
    document.querySelectorAll(".section").forEach((section) => {
        section.classList.remove("active");
    });

    // 2. Mostrar la sección deseada
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add("active");
        window.location.hash = sectionId;
        highlightActiveSidebarItem(sectionId);
    }
}

function highlightActiveSidebarItem(sectionId) {
    if (!sectionId) return;

    const sidebarItems = document.querySelectorAll("#sidebar li");
    if (!sidebarItems.length) return;

    sidebarItems.forEach(item => item.classList.remove("active"));

    // Busca el <li> que tiene el onclick con la función showSection('id')
    const activeItem = document.querySelector(`#sidebar li[onclick*="${sectionId}"]`);
    if (activeItem) activeItem.classList.add("active");
}


// --- FUNCIONES DE UTILIDAD (MODAL, TABLAS, TEMAS, ETC.) ---

function filterTable(status) {
    if (!status) return;

    const rows = document.querySelectorAll("#tabla-conductores tbody tr");
    const buttons = document.querySelectorAll(".btn-filter");

    if (!rows.length || !buttons.length) return;

    buttons.forEach(btn => btn.classList.remove("active"));

    const activeButton = document.querySelector(`.btn-filter[onclick*="${status}"]`);
    if (activeButton) activeButton.classList.add("active");

    rows.forEach(row => {
        const rowStatus = row.dataset.status;
        let shouldShow = false;

        switch(status) {
            case 'all': shouldShow = true; break;
            case 'pending': shouldShow = rowStatus === 'pendiente'; break;
            case 'approved': shouldShow = rowStatus === 'aprobado'; break;
            case 'rejected': shouldShow = rowStatus === 'rechazado'; break;
            default: shouldShow = rowStatus === status;
        }

        row.style.display = shouldShow ? "" : "none";
    });
}

function openDriverModal(element) {
    if (!element) return;

    const modal = document.getElementById("infoModal");
    const modalActions = document.getElementById("modal-actions");
    const row = element.closest('tr');

    if (!modal || !modalActions || !row) return;

    // ... (Tu lógica de extracción de datos se mantiene igual) ...
    const cells = row.querySelectorAll('td');
    const nombre = cells[0]?.textContent.trim();
    const email = cells[1]?.textContent.trim();
    // ... (resto de variables) ...

    // Asignar textos al modal
    document.getElementById("modal-nombre").textContent = nombre;
    document.getElementById("modal-email").textContent = email;
    // ... (asignar resto de campos) ...

    modalActions.innerHTML = '';
    const rowStatus = row.dataset.status;

    // --- AQUÍ ESTÁ LA SOLUCIÓN DEL CSRF ---
    // Buscamos el token que Spring pone en el formulario de logout (o en meta tags)
    const csrfToken = document.querySelector('input[name="_csrf"]')?.value;

    if (rowStatus === 'pendiente') {
        // Formulario Aprobar
        const formApprove = document.createElement("form");
        formApprove.method = "POST";
        formApprove.action = "/admin/aprobar-conductor";

        // Input CSRF (Obligatorio para Spring Security)
        if (csrfToken) {
            const inputCsrf = document.createElement("input");
            inputCsrf.type = "hidden";
            inputCsrf.name = "_csrf";
            inputCsrf.value = csrfToken;
            formApprove.appendChild(inputCsrf);
        }

        const inputEmail = document.createElement("input");
        inputEmail.type = "hidden";
        inputEmail.name = "email";
        inputEmail.value = email;

        const btnApprove = document.createElement("button");
        btnApprove.type = "submit";
        btnApprove.className = "btn-approve";
        btnApprove.innerHTML = '<i class="fas fa-check"></i> Aprobar';

        formApprove.appendChild(inputEmail);
        formApprove.appendChild(btnApprove);
        modalActions.appendChild(formApprove);

        // Formulario Rechazar (Hacemos lo mismo)
        const formReject = document.createElement("form");
        formReject.method = "POST";
        formReject.action = "/admin/rechazar-conductor";

        if (csrfToken) {
            const inputCsrf = document.createElement("input");
            inputCsrf.type = "hidden";
            inputCsrf.name = "_csrf";
            inputCsrf.value = csrfToken;
            formReject.appendChild(inputCsrf);
        }

        const inputReject = document.createElement("input");
        inputReject.type = "hidden";
        inputReject.name = "email";
        inputReject.value = email;

        const btnReject = document.createElement("button");
        btnReject.type = "submit";
        btnReject.className = "btn-reject";
        btnReject.innerHTML = '<i class="fas fa-times"></i> Rechazar';

        formReject.appendChild(inputReject);
        formReject.appendChild(btnReject);
        modalActions.appendChild(formReject);
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeModal() {
    const modal = document.getElementById("infoModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

async function fetchDashboardData() {
    try {
        const response = await fetch('/admin/dashboard/actualizar');
        if (!response.ok) throw new Error('Error en la respuesta del servidor');

        const data = await response.json();

        // Actualizar los contadores
        const pasajerosElement = document.getElementById("count-pasajeros");
        const conductoresElement = document.getElementById("count-conductores");
        const pendientesElement = document.getElementById("count-pendientes");

        if (pasajerosElement) pasajerosElement.textContent = data.pasajeros || 0;
        if (conductoresElement) conductoresElement.textContent = data.conductoresAprobados || 0;
        if (pendientesElement) pendientesElement.textContent = data.conductoresPendientes || 0;

        showToast('Datos actualizados correctamente', 'success');

    } catch (error) {
        console.error("Error al actualizar los datos:", error);
        showToast('Error al actualizar los datos', 'error');
    }
}

async function refreshValidationTable() {
    const btn = document.querySelector('.btn-refresh');
    if(btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';

    try {
        const response = await fetch('/admin/conductores/actualizar');
        if (!response.ok) throw new Error('Error al obtener datos');

        const conductores = await response.json();
        const tbody = document.querySelector("#tabla-conductores tbody");
        tbody.innerHTML = ''; // Limpiar tabla actual

        // 1. OBTENER EL TOKEN CSRF (IMPORTANTE)
        const csrfToken = document.querySelector('input[name="_csrf"]')?.value || '';

        if (conductores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay conductores registrados</td></tr>';
        } else {
            conductores.forEach(c => {
                let estadoClass = '';
                let estadoTexto = c.estadoValidacion;

                if (estadoTexto === 'APROBADO') estadoClass = 'status-approved';
                else if (estadoTexto === 'RECHAZADO') estadoClass = 'status-rejected';
                else estadoClass = 'status-pending';

                let accionesHtml = '';
                // Solo mostramos botones si no está finalizado
                if (estadoTexto !== 'APROBADO' && estadoTexto !== 'RECHAZADO') {
                    // 2. INYECTAMOS EL TOKEN EN LOS FORMULARIOS DINÁMICOS
                    accionesHtml = `
                        <div class="action-buttons">
                            <form action="/admin/aprobar-conductor" method="post" style="display:inline;">
                                <input type="hidden" name="_csrf" value="${csrfToken}">
                                <input type="hidden" name="email" value="${c.email}">
                                <button type="submit" class="btn-approve"><i class="fas fa-check"></i></button>
                            </form>
                            <form action="/admin/rechazar-conductor" method="post" style="display:inline;">
                                <input type="hidden" name="_csrf" value="${csrfToken}">
                                <input type="hidden" name="email" value="${c.email}">
                                <button type="submit" class="btn-reject"><i class="fas fa-times"></i></button>
                            </form>
                        </div>
                    `;
                } else {
                    accionesHtml = `<span class="no-actions">${estadoTexto}</span>`;
                }

                const tr = document.createElement('tr');
                tr.setAttribute('data-status', estadoTexto.toLowerCase());

                // Nota: Asegúrate de manejar los nulls en data attributes para evitar "null" en pantalla
                tr.innerHTML = `
                    <td class="clickable" onclick="openDriverModal(this)"
                        data-nombre="${c.nombre_y_Apellido || ''}"
                        data-email="${c.email}"
                        data-telefono="${c.ntelefono || ''}"
                        data-licencia="${c.licencia || ''}"
                        data-soat="${c.soat || 'No disponible'}"
                        data-tarjeta="${c.tarjeta_de_propiedad || 'No disponible'}">
                        ${c.nombre_y_Apellido || 'Sin Nombre'}
                    </td>
                    <td>${c.email}</td>
                    <td>${c.ntelefono || '-'}</td>
                    <td>${c.licencia || '-'}</td>
                    <td><span class="${estadoClass}">${estadoTexto}</span></td>
                    <td>${accionesHtml}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        const activeFilter = document.querySelector('.btn-filter.active');
        if(activeFilter) {
             // Re-aplicar filtro visual simple si es necesario
             // filterTable('all');
             // O mejor, leer el filtro actual:
             const filterType = activeFilter.textContent.trim().toLowerCase();
             // (Esto requeriría ajustar tu lógica de filterTable, por ahora dejémoslo en all o null)
             filterTable('all');
        }

        showToast('Tabla actualizada', 'success');

    } catch (error) {
        console.error("Error:", error);
        showToast('Error al actualizar tabla', 'error');
    } finally {
        if(btn) btn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
    }
}

function changeTheme(theme) {
    const root = document.documentElement.style;
    const lightOption = document.querySelector('.theme-option.light');
    const darkOption = document.querySelector('.theme-option.dark');

    if (!lightOption || !darkOption) return;

    if (theme === 'light') {
        lightOption.classList.add('active');
        darkOption.classList.remove('active');

        // Tema claro
        root.setProperty('--bg-body', 'linear-gradient(to right, #e2e2e2, #c9d6ff)');
        root.setProperty('--bg-sidebar', 'linear-gradient(180deg, #00c4ff 0%, #004F78 100%)');
        root.setProperty('--bg-main', 'transparent');
        root.setProperty('--bg-card', '#fff');
        root.setProperty('--bg-table-header', '#f8f9fa');
        root.setProperty('--bg-modal', '#fff');
        root.setProperty('--bg-settings', '#fff');
        root.setProperty('--text-primary', '#333');
        root.setProperty('--text-secondary', '#666');
        root.setProperty('--text-light', '#f7f7f7');
        root.setProperty('--border', '#f0f8ff');
        root.setProperty('--shadow', 'rgba(0, 0, 0, 0.05)');
        root.setProperty('--shadow-hover', 'rgba(0, 196, 255, 0.2)');
    } else if (theme === 'dark') {
        darkOption.classList.add('active');
        lightOption.classList.remove('active');

        // Tema oscuro
        root.setProperty('--bg-body', 'linear-gradient(to right, #1a1a1a, #2d2d2d)');
        root.setProperty('--bg-sidebar', 'linear-gradient(180deg, #004F78 0%, #001a2e 100%)');
        root.setProperty('--bg-main', 'transparent');
        root.setProperty('--bg-card', '#2d2d2d');
        root.setProperty('--bg-table-header', '#1a1a1a');
        root.setProperty('--bg-modal', '#2d2d2d');
        root.setProperty('--bg-settings', '#2d2d2d');
        root.setProperty('--text-primary', '#f0f0f0');
        root.setProperty('--text-secondary', '#ccc');
        root.setProperty('--text-light', '#f0f0f0');
        root.setProperty('--border', '#444');
        root.setProperty('--shadow', 'rgba(0, 0, 0, 0.3)');
        root.setProperty('--shadow-hover', 'rgba(0, 196, 255, 0.3)');
    }
}

function showToast(message, type) {
    if (!message || !type) return;

    try {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    } catch (error) {
        console.error("Error al mostrar toast:", error);
    }
}
/* =================================== */
/* ===== LÓGICA DE ML DASHBOARD ===== */
/* =================================== */

// Variable para evitar cargas múltiples si el usuario hace clic rápido
let mlDataLoaded = false;
let isMlLoading = false; // Controla el estado de "cargando"

// Sobrescribimos la función global showSection
// (Asumiendo que 'window.showSection' ya existe en tu script)
const originalShowSection = window.showSection;

window.showSection = function(sectionId) {
    // 1. Llama a la función original que cambia la sección
    if (typeof originalShowSection === 'function') {
        originalShowSection(sectionId);
    } else {
        // Fallback si la función original no fue encontrada
        console.warn("Función original showSection no encontrada. Implementando fallback.");
        document.querySelectorAll(".section").forEach((section) => {
            section.classList.remove("active");
        });
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add("active");
            window.location.hash = sectionId;
            highlightActiveSidebarItem(sectionId); // Asumo que tienes esta función
        }
    }

    // 2. Lógica específica para la sección ML
    // Si entramos a la sección ML y los datos NUNCA se han cargado (o si falló antes)
    if (sectionId === 'ml_dashboard' && !mlDataLoaded && !isMlLoading) {
        cargarDatosML(); // Carga los datos la primera vez
    }
};

/* ================================================== */
/* ===== LÓGICA DE INTERPRETACIÓN DE ML (NUEVO) ===== */
/* ================================================== */

function analizarYMostrarInsights(arbolTexto) {
    if (!arbolTexto) return;

    // 1. Extraer Factor Principal (La Raíz)
    // Buscamos la primera línea que tenga lógica (ej: "duracion <= 5")
    const lineas = arbolTexto.split('\n').filter(l => l.trim() !== '' && !l.startsWith('J48') && !l.includes('---'));

    if (lineas.length > 0) {
        const primeraLinea = lineas[0];
        // Extraer nombre de la variable (ej: "duracion")
        const matchVariable = primeraLinea.match(/([a-zA-Z_]+)\s*[<=>]+/);

        if (matchVariable && matchVariable[1]) {
            const variableRaw = matchVariable[1];
            // Embellecer nombre
            let nombreBonito = variableRaw;
            if(variableRaw === 'duracion') nombreBonito = '⏱ Duración del Viaje';
            if(variableRaw === 'distancia') nombreBonito = '🛣 Distancia Recorrida';
            if(variableRaw === 'tarifa') nombreBonito = '💵 Costo del Viaje';

            document.getElementById('insight-factor-nombre').textContent = nombreBonito;
        }
    }

    // 2. Extraer Regla de Oro (Un camino a "SI")
    // Buscamos una línea simple que termine en ": si" para mostrarla como ejemplo
    const reglaPositiva = lineas.find(l => l.includes(': si'));

    if (reglaPositiva) {
        // Limpiamos el formato técnico "|   duracion <= 5: si (10.0)"
        let textoLimpio = reglaPositiva.trim()
            .replace(/\|\s*/g, '') // Quitar barras
            .replace(': si', '') // Quitar resultado
            .replace(/\(\d+\.?\d*\)/, '') // Quitar números
            .trim();

        // Traducir operadores
        textoLimpio = textoLimpio.replace('<=', 'menor o igual a');
        textoLimpio = textoLimpio.replace('>', 'mayor a');

        // Traducir variables
        textoLimpio = textoLimpio.replace('duracion', 'duración');
        textoLimpio = textoLimpio.replace('distancia', 'distancia');

        document.getElementById('insight-regla-texto').innerHTML =
            `Cuando <b>${textoLimpio}</b>, el cliente suele estar satisfecho.`;
    } else {
        document.getElementById('insight-regla-texto').textContent = "El modelo es complejo, revisa el árbol completo.";
    }
}

// Simulador Local (Aproximación simple basada en lógica JS para feedback instantáneo)
function simularPrediccionLocal() {
    // NOTA: Esto es una simulación visual.
    // En producción, idealmente llamarías a un endpoint /api/ml/predecir.
    // Pero para "jugar" con el dashboard, podemos replicar una lógica simple aquí o llamar al backend.

    const btn = document.querySelector('.btn-simular');
    const resultDiv = document.getElementById('sim-resultado');

    // Efecto visual
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    resultDiv.textContent = '...';

    const duracion = parseFloat(document.getElementById('sim-duracion').value) || 0;
    const tarifa = parseFloat(document.getElementById('sim-tarifa').value) || 0;

    // Simulamos un delay de red
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-magic"></i> Predecir';

        // Lógica MOCKUP basada en lo que suele salir (puedes ajustarla o conectar al backend real)
        // Ejemplo: Si es muy caro y corto -> No satisfecho
        let satisfecho = true;

        // Regla inventada para el ejemplo visual (La real la tiene el J48)
        if (tarifa > 20000 && duracion < 10) satisfecho = false;

        if (satisfecho) {
            resultDiv.textContent = "PREDICCIÓN: SATISFECHO 😊";
            resultDiv.className = "sim-result si";
        } else {
            resultDiv.textContent = "PREDICCIÓN: NO SATISFECHO 😠";
            resultDiv.className = "sim-result no";
        }
    }, 800);
}


/**
 * Carga los datos del modelo (GET /api/admin/ml/resultado)
 * y actualiza la UI. Muestra el loader durante la petición.
 */
async function cargarDatosML() {
    if (isMlLoading) return; // Evita llamadas duplicadas
    isMlLoading = true;
    mlDataLoaded = false; // Forzamos a false hasta que sea exitoso

    // 1. Obtener referencias a elementos de la UI (Loader y Wrappers)
    const elLoader = document.getElementById("ml-loader");
    const elWrapper = document.getElementById("ml-content-wrapper");

    // Referencias a metadatos básicos
    const elInstancias = document.getElementById("ml-instancias");
    const elFecha = document.getElementById("ml-fecha-entrenamiento");
    const elArbol = document.getElementById("ml-arbol-texto");

    // 2. Mostrar loader, ocultar contenido
    if (elLoader) elLoader.style.display = 'flex';
    if (elWrapper) elWrapper.style.display = 'none';

    try {
        // --- USA LA RUTA SEGURA ---
        const response = await fetch('/api/admin/ml/resultado');

        if (response.ok) {
            const data = await response.json(); // Parsea el ModeloInfo completo

            // A. ACTUALIZAR METADATOS BÁSICOS
            const fecha = new Date(data.fechaEntrenamiento);
            if(elInstancias) elInstancias.textContent = `${data.instanciasUsadas} instancias`;
            if(elFecha) elFecha.textContent = `Entrenado el: ${fecha.toLocaleString()}`;
            if(elArbol) elArbol.textContent = data.arbolDecisionTexto; // El texto crudo

            // B. ACTUALIZAR TARJETAS DE INSIGHTS (Factor Principal y Regla de Oro)
            // Llamamos a la función auxiliar que creamos para leer el texto
            if (typeof analizarYMostrarInsights === 'function') {
                analizarYMostrarInsights(data.arbolDecisionTexto);
            }

            // C. ACTUALIZAR ESTADÍSTICAS COMPARATIVAS (La parte que estaba en 0)

            // Creamos un formateador para Pesos Colombianos
            const formatter = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
            });

            // --- LADO IZQUIERDO (SATISFACTORIOS) ---
            const countSi = document.getElementById('stat-count-si');
            const tarifaSi = document.getElementById('stat-tarifa-si');
            const distSi = document.getElementById('stat-distancia-si');

            if(countSi) countSi.textContent = data.totalSatisfactorios || 0;
            if(tarifaSi) tarifaSi.textContent = formatter.format(data.promedioTarifaSi || 0);
            // toFixed(1) para mostrar solo 1 decimal en km
            if(distSi) distSi.textContent = (data.promedioDistanciaSi || 0).toFixed(1) + ' km';

            // --- LADO DERECHO (INSATISFACTORIOS) ---
            const countNo = document.getElementById('stat-count-no');
            const tarifaNo = document.getElementById('stat-tarifa-no');
            const distNo = document.getElementById('stat-distancia-no');

            if(countNo) countNo.textContent = data.totalInsatisfactorios || 0;
            if(tarifaNo) tarifaNo.textContent = formatter.format(data.promedioTarifaNo || 0);
            if(distNo) distNo.textContent = (data.promedioDistanciaNo || 0).toFixed(1) + ' km';

            mlDataLoaded = true; // ¡Éxito!

        } else {
            // Manejar errores de la API (ej: 404, 500)
            const errorTexto = await response.text();
            if(elArbol) elArbol.textContent = `Error ${response.status}: ${errorTexto}`;
            if(elInstancias) elInstancias.textContent = "Error";
            if(elFecha) elFecha.textContent = "No se pudo cargar";
            showToast('Error al cargar el modelo de ML', 'error');
        }
    } catch (error) {
        // Manejar errores de red (ej: fetch falló)
        console.error("Error fatal al cargar ML:", error);
        if(elArbol) elArbol.textContent = `Error de conexión: ${error.message}`;
        showToast('Error de conexión con el servidor de ML', 'error');
    } finally {
        // 3. Ocultar loader, mostrar contenido (SIEMPRE)
        isMlLoading = false;
        if (elLoader) elLoader.style.display = 'none';
        if (elWrapper) elWrapper.style.display = 'block'; // 'block' muestra el div
    }
}


async function entrenarModeloML() {
    console.log("Iniciando entrenamiento...");

    const btn = document.getElementById("btn-entrenar-ml");
    const feedback = document.getElementById("ml-feedback");

    if (!btn || !feedback) return;

    // 1. Deshabilitar botón y mostrar "Iniciando..." DENTRO de la tarjeta
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrenando...';

    feedback.style.display = 'block';
    feedback.className = 'alert alert-success'; // Reutiliza tu clase de alerta
    feedback.innerHTML = '<i class="fas fa-check-circle"></i> Iniciando... El proceso puede tardar varios minutos.';

    try {
        // --- USA LA RUTA SEGURA ---
        const response = await fetch('/api/admin/ml/entrenar');

        if (response.ok) {
            // --- ¡ÉXITO! ---

            // 2. Ocultamos el feedback de "Iniciando..." de la tarjeta
            feedback.style.display = 'none';

            // 3. Mostramos el TOAST estilizado (lo que querías)
            showToast('Modelo re-entrenado con éxito', 'success');

            // 4. Recargamos los datos del modelo en la UI
            mlDataLoaded = false;
            await cargarDatosML();

        } else {
            // --- ERROR DE API ---
            // 5. Mostramos el error DENTRO de la tarjeta para que se quede fijo
            const errorTexto = await response.text();
            feedback.className = 'alert alert-error';
            feedback.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error ${response.status}: ${errorTexto}`;
            showToast('Error durante el entrenamiento', 'error'); // Opcional: mostrar toast de error también
        }

    } catch (error) {
        // --- ERROR DE RED ---
        // 6. Mostramos el error DENTRO de la tarjeta
        console.error("Error fatal al entrenar:", error);
        feedback.className = 'alert alert-error';
        feedback.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error de conexión: ${error.message}`;
        showToast('Error de conexión', 'error'); // Opcional
    } finally {
        // 7. Reactivar el botón (SIEMPRE)
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-play"></i> Entrenar Ahora';
    }
}
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



/* ==========================================
   LÓGICA WEBSOCKET (ADAPTADA PARA ADMIN)
   ========================================== */

function connectAdminWebSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    // stompClient.debug = null; // Descomentar para limpiar consola

    stompClient.connect({}, function(frame) {
        console.log('Admin conectado: ' + frame);

        stompClient.subscribe('/topic/admin/registros', function(message) {
            // Verificar si el switch "notif" está activado en el HTML
            const toggle = document.getElementById('notif');

            if (toggle && toggle.checked) {
                const data = JSON.parse(message.body);

                // Lógica personalizada del mensaje
                let titulo = "Nuevo Registro";
                let texto = `${data.email} (${data.rol})`;

                if(data.rol === 'CONDUCTOR') {
                    titulo = "Nuevo Conductor";
                    texto = `<strong>${data.email}</strong> espera validación.`;
                } else {
                    titulo = "Nuevo Pasajero";
                    texto = `<strong>${data.email}</strong> se ha unido.`;
                }

                // Mostrar el Toast visual
                showAdminToast(titulo, texto);

                // Recargar contadores si estamos en el dashboard
                if(typeof fetchDashboardData === 'function') fetchDashboardData();
                // Recargar tabla si estamos en validaciones
                if(typeof refreshValidationTable === 'function') refreshValidationTable();
            }
        });
    }, function(error) {
        console.error('Error WebSocket:', error);
        setTimeout(connectAdminWebSocket, 5000);
    });
}

function handleAdminNotification(data) {
    console.log("Notificación recibida:", data);

    // Personalizar mensaje según el tipo de notificación
    let titulo = "Nuevo Evento";
    let mensaje = "Tienes una nueva actualización.";

    if (data.tipo === "NUEVO_REGISTRO") {
        titulo = "Nuevo Registro";
        mensaje = `El usuario <strong>${data.email}</strong> se ha registrado como <strong>${data.rol}</strong>.`;
    }

    // Mostrar el Toast
    showAdminToast(titulo, mensaje);

    // Opcional: Recargar tablas automáticamente si es necesario
    // actualizarTablaConductores();
}

function initNotificationSettings() {
    const notifToggle = document.getElementById('notif');

    // 1. Cargar estado guardado (localStorage tiene prioridad visual)
    const savedState = localStorage.getItem('adminNotif');
    if (notifToggle && savedState !== null) {
        notifToggle.checked = (savedState === 'true');
    }

    // 2. Listener de cambio
    if (notifToggle) {
        notifToggle.addEventListener('change', function() {
            localStorage.setItem('adminNotif', this.checked);

            // Enviar preferencia al backend
            const csrfToken = document.querySelector('input[name="_csrf"]')?.value;
            const formData = new FormData();
            formData.append('habilitado', this.checked);

            fetch('/admin/config/notificaciones', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if(data.success && this.checked) {
                    showAdminToast('Sistema', 'Notificaciones activadas');
                }
            })
            .catch(e => console.error("Error guardando config:", e));
        });
    }
}

// --- TOAST VISUAL (Estilo del Conductor adaptado) ---
function showAdminToast(titulo, mensajeHTML) {
    // Limpiar toast anterior
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification'; // Usamos la clase del CSS nuevo
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-bell"></i>
        </div>
        <div class="toast-content">
            <h4>${titulo}</h4>
            <p>${mensajeHTML}</p>
        </div>
    `;

    document.body.appendChild(toast);

    // Animación entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto eliminar
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

function actualizarPreferenciaBackend(estado) {
    // Esta función mantiene tu lógica actual de enviar el POST al backend
    // para que el servidor sepa la preferencia, aunque el JS ya filtra visualmente.
    const formData = new FormData();
    formData.append('activar', estado);

    fetch('/admin/config/notificaciones', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Asegúrate de incluir el token CSRF si Spring Security lo pide
             'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]')?.value
        },
        body: JSON.stringify({ activar: estado }) // O FormData según espere tu controller
    })
    .then(r => console.log("Preferencia actualizada en servidor"))
    .catch(e => console.error("Error actualizando preferencia", e));
}

// Asignar funciones al objeto 'window' para que los 'onclick' del HTML funcionen
window.openConfirmModal = openConfirmModal;
window.closeConfirmModal = closeConfirmModal;

// Asignar al objeto global 'window' para que los onclick() del HTML funcionen
window.cargarDatosML = cargarDatosML;
window.entrenarModeloML = entrenarModeloML;

// Asignar funciones al objeto window para que estén disponibles globalmente (si son usadas en HTML)
window.showSection = showSection;
window.filterTable = filterTable;
window.openDriverModal = openDriverModal;
window.closeModal = closeModal;
window.refreshValidationTable = refreshValidationTable;
window.changeTheme = changeTheme;
window.fetchDashboardData = fetchDashboardData;