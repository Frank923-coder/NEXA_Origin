# BLOCKERS
- MySQL no está instalado en el entorno de desarrollo (contenedor sin `mysqld`). La app arranca, `/docs` responde 200 y `/health` responde 503 "Base de datos no disponible" (comportamiento esperado sin BD). `/health` devuelve 200 con BD en SQLite en los tests. Para validarlo con MySQL real: crear `.env` y ejecutar `scripts/schema.sql`.
