# DECISIONS
- El repo NEXA_Origin es una app Java/Spring (MongoDB). Para no mezclar stacks, la API FastAPI vive en `auth_api/` (subdirectorio autocontenido).
- No se migran datos de NEXA (MongoDB) a MySQL: el esquema `users` es nuevo; no se copian ni exponen credenciales existentes del proyecto.
- `bcrypt<4.1` fijado por compatibilidad con passlib 1.7.4.
- `email-validator` añadido para `EmailStr`.
