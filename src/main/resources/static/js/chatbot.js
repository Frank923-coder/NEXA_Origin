/**
 * NEXA Chatbot Widget - JavaScript
 * Widget de chat reutilizable para las páginas públicas de NEXA.
 * Usa la API /public/chat para comunicarse con Gemini AI.
 */
(function () {
    'use strict';

    // Detectar el contexto automáticamente desde un data attribute del body o parámetro
    const chatContext = document.body.dataset.chatContext || 'pasajero';

    // ========== Crear el HTML del widget ==========
    function createChatWidget() {
        // Botón flotante
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'chatbot-toggle';
        toggleBtn.id = 'chatbot-toggle';
        toggleBtn.setAttribute('aria-label', 'Abrir chat de ayuda');
        toggleBtn.innerHTML = `
            <svg class="chat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
            </svg>
            <svg class="close-icon" style="display:none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        `;

        // Ventana del chat
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chatbot-window';
        chatWindow.id = 'chatbot-window';

        const contextLabel = chatContext === 'conductor' ? 'Conductores' : 'Pasajeros';

        chatWindow.innerHTML = `
            <div class="chatbot-header">
                <div class="chatbot-avatar">🏍️</div>
                <div class="chatbot-header-info">
                    <h4>NEXA Bot</h4>
                    <span>En línea · ${contextLabel}</span>
                </div>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chat-welcome">
                    <p>Inicio de conversación</p>
                </div>
                <div class="chat-message bot">
                    ¡Hola! 👋 Soy NEXA Bot, tu asistente virtual. Puedo ayudarte con información sobre ${chatContext === 'conductor' ? 'los beneficios para conductores' : 'nuestros servicios y beneficios'}, contacto y más. ¿En qué puedo ayudarte?
                </div>
            </div>
            <div class="chatbot-input">
                <input type="text" id="chatbot-input-field" placeholder="Escribe tu pregunta..." autocomplete="off" />
                <button id="chatbot-send-btn" aria-label="Enviar mensaje">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(chatWindow);
        document.body.appendChild(toggleBtn);

        // ========== Event Listeners ==========
        const inputField = document.getElementById('chatbot-input-field');
        const sendBtn = document.getElementById('chatbot-send-btn');
        const messagesContainer = document.getElementById('chatbot-messages');
        let isProcessing = false;

        // Toggle abrir/cerrar
        toggleBtn.addEventListener('click', function () {
            const isOpen = chatWindow.classList.toggle('open');
            toggleBtn.classList.toggle('active');

            const chatIcon = toggleBtn.querySelector('.chat-icon');
            const closeIcon = toggleBtn.querySelector('.close-icon');

            if (isOpen) {
                chatIcon.style.display = 'none';
                closeIcon.style.display = 'block';
                inputField.focus();
            } else {
                chatIcon.style.display = 'block';
                closeIcon.style.display = 'none';
            }
        });

        // Enviar con Enter
        inputField.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Enviar con botón
        sendBtn.addEventListener('click', sendMessage);

        // ========== Funciones ==========
        function sendMessage() {
            const message = inputField.value.trim();
            if (!message || isProcessing) return;

            // Agregar mensaje del usuario
            appendMessage(message, 'user');
            inputField.value = '';
            isProcessing = true;
            sendBtn.disabled = true;

            // Mostrar indicador de typing
            const typingEl = showTyping();

            // Enviar al backend
            fetch('/public/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    context: chatContext
                })
            })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    removeTyping(typingEl);
                    const botResponse = data.response || 'Lo siento, no pude procesar tu mensaje.';
                    appendMessage(formatResponse(botResponse), 'bot');
                })
                .catch(function() {
                    removeTyping(typingEl);
                    appendMessage('Lo siento, hubo un error de conexión. Intenta de nuevo. 😅', 'bot');
                })
                .finally(function() {
                    isProcessing = false;
                    sendBtn.disabled = false;
                    inputField.focus();
                });
        }

        function appendMessage(content, type) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message ' + type;

            if (type === 'bot') {
                msgDiv.innerHTML = content;
            } else {
                msgDiv.textContent = content;
            }

            messagesContainer.appendChild(msgDiv);
            scrollToBottom();
        }

        function showTyping() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-typing';
            typingDiv.id = 'chat-typing-indicator';
            typingDiv.innerHTML = '<span></span><span></span><span></span>';
            messagesContainer.appendChild(typingDiv);
            scrollToBottom();
            return typingDiv;
        }

        function removeTyping(el) {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        }

        function scrollToBottom() {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        /**
         * Formatea la respuesta del bot convirtiendo markdown básico a HTML.
         */
        function formatResponse(text) {
            if (!text) return '';

            // Escapar HTML primero
            var formatted = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Bold: **texto**
            formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // Italic: *texto*
            formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

            // Listas con - o *
            formatted = formatted.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
            formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

            // Saltos de línea
            formatted = formatted.replace(/\n/g, '<br>');

            // Limpiar <br> redundantes dentro de listas
            formatted = formatted.replace(/<br><ul>/g, '<ul>');
            formatted = formatted.replace(/<\/ul><br>/g, '</ul>');
            formatted = formatted.replace(/<br><li>/g, '<li>');

            return formatted;
        }
    }

    // ========== Inicializar cuando el DOM esté listo ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatWidget);
    } else {
        createChatWidget();
    }
})();
