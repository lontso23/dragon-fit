# DragonFit - Guía de Despliegue para iPhone (PWA)

## ¿Qué es una PWA?
DragonFit es una Progressive Web App (PWA), lo que significa que funciona como una app nativa pero se instala desde el navegador. No necesitas publicar en la App Store ni pagar la suscripción de desarrollador de Apple ($99/año).

## Cómo Instalar en iPhone

### Paso 1: Abrir en Safari
1. Abre **Safari** en tu iPhone (importante: solo funciona con Safari, no Chrome ni otros navegadores)
2. Visita la URL de tu aplicación: `https://tu-dominio.com`

### Paso 2: Añadir a Pantalla de Inicio
1. Toca el botón de **Compartir** (cuadrado con flecha hacia arriba) en la barra inferior
2. Desplázate hacia abajo y selecciona **"Añadir a pantalla de inicio"**
3. Edita el nombre si lo deseas (por defecto será "DragonFit")
4. Toca **"Añadir"**

### Paso 3: ¡Listo!
La app aparecerá como un icono en tu pantalla de inicio con el logo del dragón verde. Al abrirla, se comportará como una app nativa sin barra de navegador.

## Desplegar tu Propia Instancia

### Opción 1: Usando Emergent (Recomendado)
Si estás usando Emergent Platform, tu app ya está desplegada en:
```
https://[tu-id].preview.emergentagent.com
```

Para despliegue en producción, usa la opción de "Deploy" en Emergent.

### Opción 2: Despliegue Manual

#### Requisitos
- Servidor con Python 3.11+
- MongoDB
- Node.js 18+
- Dominio con SSL (HTTPS obligatorio para PWA)

#### Backend
```bash
cd backend
pip install -r requirements.txt
# Configurar variables de entorno
export MONGO_URL="mongodb://tu-servidor:27017"
export DB_NAME="dragonfit"
export JWT_SECRET="tu-secreto-seguro"
uvicorn server:app --host 0.0.0.0 --port 8001
```

#### Frontend
```bash
cd frontend
yarn install
# Configurar la URL del backend
echo "REACT_APP_BACKEND_URL=https://tu-api.com" > .env
yarn build
# Servir los archivos estáticos con nginx o similar
```

### Opción 3: Vercel + MongoDB Atlas

1. **MongoDB Atlas** (Base de datos gratuita)
   - Crea cuenta en https://mongodb.com/atlas
   - Crea un cluster gratuito
   - Obtén la URL de conexión

2. **Vercel** (Hosting gratuito)
   - Conecta tu repositorio GitHub
   - Configura las variables de entorno:
     - `MONGO_URL`
     - `JWT_SECRET`
     - `DB_NAME`

## Funcionalidades de la App

### Para Usuarios
- ✅ Crear múltiples rutinas de entrenamiento
- ✅ Organizar por días (Pull, Push, Pierna, etc.)
- ✅ Registrar ejercicios con series y repeticiones
- ✅ Guardar peso utilizado en cada sesión
- ✅ Ver historial de entrenamientos
- ✅ Gráficos de progreso
- ✅ Exportar a Excel y PDF
- ✅ Login con email/password o Google

### Características PWA
- 📱 Se instala como app nativa en iPhone
- 🌙 Tema oscuro optimizado para pantalla
- ⚡ Funciona sin conexión (próximamente)
- 🔔 Notificaciones push (próximamente)

## Distribución a Otros Usuarios

### Sin App Store
1. Comparte la URL de tu app
2. Envía estas instrucciones de instalación
3. Los usuarios pueden instalarla en cualquier iPhone con Safari

### Ventajas sobre App Store
- ✅ Sin costo de desarrollador ($99/año)
- ✅ Sin proceso de revisión de Apple
- ✅ Actualizaciones instantáneas
- ✅ Compatible con todos los iPhones modernos

## Soporte

Si tienes problemas:
1. Asegúrate de usar Safari (no Chrome)
2. Verifica que la URL sea HTTPS
3. Limpia caché si hay problemas de carga

---

*DragonFit - Tu compañero de entrenamiento* 🐉
