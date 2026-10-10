# Universidad Auth API (FastAPI + MySQL)

API de inicio de sesión, sesión de usuario (cookie HttpOnly) y cierre de sesión.

## Requisitos
- Python 3.11+
- MySQL 8 accesible desde la máquina

## Instalación
```bash
cd auth_api
python -m venv env
source env/bin/activate        # Windows: env\Scripts\activate
pip install -r requirements.txt
```

## Configuración
```bash
cp .env.example .env   # y edita los valores
```
| Variable | Descripción |
|---|---|
| DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | Conexión MySQL |
| SECRET_KEY | Secreto largo aleatorio (`python -c "import secrets;print(secrets.token_urlsafe(48))"`) |
| SESSION_EXPIRE_MINUTES | Duración de la sesión |
| COOKIE_SECURE | `true` en producción (HTTPS) |
| CORS_ORIGINS | Orígenes permitidos separados por coma |

Crea la BD con `mysql -u <usuario> -p < scripts/schema.sql` (las tablas también se crean solas al arrancar).

## Ejecutar
```bash
uvicorn app.main:app --reload
```
Docs interactivas: http://localhost:8000/docs

Para acceder desde otro equipo de la red de la universidad: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
y abre `http://<IP-del-servidor>:8000/docs` (requiere que la red/firewall lo permita).

## Endpoints
- `GET /health` — `SELECT 1` contra la BD
- `POST /auth/register` — `{email, nombre, password}`
- `POST /auth/login` — `{email, password}` → cookie `session_token`
- `POST /auth/logout`
- `GET /users/me` — protegido

## Tests
```bash
pytest -q
```
Usan SQLite en memoria; no requieren MySQL.
