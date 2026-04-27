NEXA - Servicio de MotoTaxis Web App
Aplicación web desarrollada con Spring Boot para el servicio de mototaxis NEXA. Permite a los usuarios registrarse como pasajeros o conductores, reservar viajes, rastrear conductores en tiempo real y ofrece un ChatBot IA para resolver dudas y dar soporte.

🚀 Requisitos Previos
Antes de ejecutar la aplicación, asegúrese de tener instalado:

Java JDK 21 o superior
Maven (o usar el wrapper de maven incluido mvnw)
Una cuenta en MongoDB Atlas o una instancia local de MongoDB
Una API Key de Google Gemini para el ChatBot (Opcional, pero recomendado)
🛠️ Instalación y Configuración
Clonar el repositorio:

git clone https://github.com/Mateo-Vanegas02/NEXA_Origin.git
cd NEXA_Origin
Configurar el archivo application.properties: Ruta: src/main/resources/application.properties. Actualizar los valores con su propia configuración (Variables de entorno son recomendadas en producción):

# MongoDB Connection String
spring.data.mongodb.uri=mongodb+srv://<usuario>:<password>@<cluster-url>?retryWrites=true&w=majority

# JWT Secret Key (Mínimo 256 bits)
jwt.secret=SU_CLAVE_SECRETA_MUY_SEGURA_AQUI_EN_BASE64

# Gemini API Key (Para el chatbot)
spring.ai.google.genai.api-key=AIzaSyB...
Compilar el proyecto:

./mvnw clean install
▶️ Ejecución
Para iniciar la aplicación en desarrollo:

./mvnw spring-boot:run
La aplicación estará disponible en: http://localhost:8080/

🏗️ Estructura del Proyecto y Tecnologías
Framework Principal: Spring Boot 3.4.4
Seguridad: Spring Security (Autenticación basada en Roles y JWT)
Base de Datos: MongoDB (Spring Data MongoDB)
Frontend: Thymeleaf, HTML5, Vanilla JavaScript, CSS3
Inteligencia Artificial: Spring AI con Google GenAI (Gemini)
Machine Learning: Weka (Análisis de satisfacción)
Comunicaciones: WebSockets (STOMP)
🔒 Estructura de Usuarios y Roles
La aplicación implementa herencia en MongoDB y gestión controlada por roles:

ROLE_PASAJERO: Puede solicitar viajes, calificar, ver historial y acceder a las páginas de usuario final.
ROLE_CONDUCTOR: Requiere validación y aprobación por administrador. Puede aceptar solicitudes, finalizar viajes, agregar vehículos.
ROLE_ADMIN: Panel general administrativo con analíticas y aprobación de cuentas.
🤝 Mantenimiento de Ramas y Commits
Este proyecto recomienda seguir la convención de Conventional Commits para facilitar el versionado y el registro de cambios:

feat: Nuevas funcionalidades
fix: Correcciones de errores
docs: Cambios en la documentación
style: Formato o cambios de diseño que no afectan la lógica
refactor: Cambios en el código que no corrigen errores ni añaden funcionalidades
