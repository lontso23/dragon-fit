# DragonFit PRD (Product Requirements Document)

## Problema Original
App móvil para iPhone para registrar entrenamientos de gimnasio. Cada entrenamiento dividido en días con ejercicios (series, repeticiones, peso, notas). Múltiples usuarios con su propio listado de entrenamientos. Tema oscuro combinando negro y verde con logo de dragón proporcionado.

## Arquitectura

### Tech Stack
- **Frontend**: React (PWA) con CSS personalizado
- **Backend**: FastAPI (Python)
- **Base de Datos**: MongoDB
- **Autenticación**: JWT + Google OAuth (Emergent Auth)

### Estructura de Datos
```
Usuario
├── Entrenamientos[]
│   ├── Días[]
│   │   └── Ejercicios[] (nombre, series, notas)
│   └── Sesiones[] (registros de entrenamiento)
│       └── Ejercicios[] (peso, reps, notas)
```

## User Personas

### Usuario Principal
- Persona que entrena en gimnasio regularmente
- Quiere llevar registro de pesos y repeticiones
- Necesita ver progreso a lo largo del tiempo
- Usa iPhone como dispositivo principal

## Requisitos Core (Implementados ✅)

### Autenticación
- [x] Registro con email/password
- [x] Login con email/password  
- [x] Login con Google OAuth
- [x] JWT tokens con 7 días de expiración
- [x] Logout

### Gestión de Entrenamientos
- [x] Crear rutinas con nombre y descripción
- [x] Agregar múltiples días a cada rutina
- [x] Agregar ejercicios con series/reps objetivo
- [x] Editar rutinas existentes
- [x] Eliminar rutinas

### Registro de Sesiones
- [x] Seleccionar día de entrenamiento
- [x] Registrar peso y repeticiones por ejercicio
- [x] Agregar notas por ejercicio
- [x] Guardar fecha automáticamente

### Progreso y Estadísticas
- [x] Dashboard con estadísticas (rutinas, sesiones, volumen)
- [x] Gráficos de peso por ejercicio
- [x] Historial de sesiones por fecha

### Exportación
- [x] Exportar a Excel (.xlsx)
- [x] Exportar a PDF

### UI/UX
- [x] Tema oscuro (negro #09090b)
- [x] Acentos verdes (#22c55e)
- [x] Logo de dragón personalizado
- [x] PWA instalable en iPhone
- [x] Navegación inferior móvil

## Lo Implementado (Enero 2025)

1. Backend completo con FastAPI
2. Frontend React con PWA manifest
3. Sistema de autenticación dual (JWT + Google)
4. CRUD completo de entrenamientos
5. Registro de sesiones
6. Gráficos de progreso con Recharts
7. Exportación Excel/PDF
8. Tema oscuro con branding del dragón
9. Guía de despliegue para iPhone

## Backlog (Futuras Mejoras)

### P1 - Alta Prioridad
- [ ] Modo offline con sincronización
- [ ] Notificaciones push para recordar entrenamientos
- [ ] Plantillas de entrenamientos predefinidas

### P2 - Media Prioridad  
- [ ] Compartir rutinas entre usuarios
- [ ] Importar entrenamientos desde Excel
- [ ] Calculadora de 1RM
- [ ] Timer de descanso entre series

### P3 - Baja Prioridad
- [ ] Integración con Apple Health
- [ ] Badges y logros
- [ ] Modo competición entre usuarios
- [ ] Versión Android nativa

## Próximos Pasos Recomendados
1. Probar la app completamente en iPhone real
2. Agregar modo offline para uso sin conexión
3. Implementar plantillas de entrenamientos populares (PPL, Full Body, etc.)

---
*Última actualización: 4 Febrero 2026*
