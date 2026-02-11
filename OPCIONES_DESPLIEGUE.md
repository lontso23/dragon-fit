# DragonFit - Opciones de Despliegue

## Opción 1: Vercel + MongoDB Atlas (GRATIS - Recomendado)

### Paso 1: Crear base de datos en MongoDB Atlas
1. Ve a https://mongodb.com/atlas
2. Crea cuenta gratuita
3. Crea un cluster "M0 Free"
4. En "Database Access", crea un usuario con contraseña
5. En "Network Access", añade `0.0.0.0/0` para permitir conexiones
6. Copia la URL de conexión: `mongodb+srv://usuario:password@cluster.xxxxx.mongodb.net/dragonfit`

### Paso 2: Desplegar Backend en Vercel
1. Ve a https://vercel.com y crea cuenta con GitHub
2. Descarga el código de tu app (usa "Download Code" en Emergent)
3. Sube la carpeta `backend` a un repositorio en GitHub
4. En Vercel, importa el repositorio
5. Configura las variables de entorno:
   - `MONGO_URL` = tu URL de MongoDB Atlas
   - `DB_NAME` = dragonfit
   - `JWT_SECRET` = una-clave-secreta-larga-y-segura
6. Despliega

### Paso 3: Desplegar Frontend en Vercel
1. Sube la carpeta `frontend` a otro repositorio en GitHub
2. Importa en Vercel
3. Configura variable de entorno:
   - `REACT_APP_BACKEND_URL` = https://tu-backend.vercel.app
4. Despliega

---

## Opción 2: Railway (FÁCIL - $5/mes después de trial)

### Todo en un solo lugar
1. Ve a https://railway.app
2. Crea cuenta con GitHub
3. Nuevo proyecto → "Deploy from GitHub"
4. Importa tu código
5. Railway detectará Python (backend) y Node (frontend)
6. Añade MongoDB como servicio adicional
7. Configura variables de entorno automáticamente

---

## Opción 3: Render (GRATIS con limitaciones)

### Backend
1. Ve a https://render.com
2. New → Web Service
3. Conecta tu repositorio de GitHub con el backend
4. Configura:
   - Runtime: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Añade variables de entorno

### Frontend
1. New → Static Site
2. Conecta el repositorio del frontend
3. Build Command: `yarn build`
4. Publish Directory: `build`

### Base de datos
- Usa MongoDB Atlas (gratuito) como en Opción 1

---

## Opción 4: Netlify + Heroku

### Frontend en Netlify (GRATIS)
1. Ve a https://netlify.com
2. Arrastra la carpeta `build` del frontend
3. O conecta con GitHub para deploys automáticos

### Backend en Heroku
1. Ve a https://heroku.com
2. Crea una app nueva
3. Conecta con GitHub
4. Añade add-on de MongoDB

---

## Opción 5: VPS Propio (DigitalOcean, Linode, etc.)

### Costo: ~$5-10/mes
1. Crea un droplet Ubuntu
2. Instala Docker
3. Usa el docker-compose.yml incluido
4. Configura nginx con SSL (Let's Encrypt)

---

## Opción 6: Ejecutar Localmente (GRATIS - Solo tu red)

### Requisitos
- Mac/PC con Python 3.11+ y Node.js 18+
- MongoDB instalado o MongoDB Atlas

### Pasos
```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="dragonfit"
export JWT_SECRET="mi-secreto"
python server.py

# Terminal 2 - Frontend
cd frontend
yarn install
REACT_APP_BACKEND_URL="http://localhost:8001" yarn start
```

Luego accede desde tu iPhone en la misma red WiFi usando la IP de tu ordenador: `http://192.168.x.x:3000`

---

## Resumen de Recomendaciones

| Opción | Costo | Dificultad | Mejor para |
|--------|-------|------------|------------|
| Vercel + Atlas | Gratis | Media | Producción seria |
| Railway | $5/mes | Fácil | Todo en uno |
| Render | Gratis* | Media | Proyectos pequeños |
| Local | Gratis | Fácil | Solo pruebas |

*Render tiene límites en el plan gratuito (se apaga tras inactividad)

---

## Siguiente Paso Recomendado

**Si quieres la forma más rápida:**
1. Descarga tu código desde Emergent ("Download Code")
2. Crea cuenta en Railway.app
3. Sube el código y despliega

¿Necesitas ayuda con alguna opción específica?
