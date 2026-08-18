# Walkthrough: NuFitness Tracker App

## Fase 1: Arquitectura Dinámica y Gráfico (v1.4.3)
- **Eliminación de "Planchas"**: Se simplificó la lógica para enfocarse exclusivamente en Burpees y Squats a través de las disciplinas Hyrox y Funcional.
- **Gráfico Nativo en SVG**: Se construyó un componente `ProgressChart` libre de librerías para renderizar una curva de progreso acumulado vs la meta mensual (Goal Line).
- **Metas Dinámicas (`Promise.all`)**: La aplicación lee un segundo CSV ("Metas") para establecer límites asíncronos y dinámicos para cada servicio y ejercicio.

## Fase 2: Backend, Login y Registros Colaborativos (v2.0.0)
- **Migración a API REST Serverless**: Se abandonó la lectura insegura de CSV publicados. Se programó y conectó un motor de **Google Apps Script (`doGet` / `doPost`)** que actúa como API y Base de Datos, permitiendo operaciones CRUD (Lectura y Escritura) directas a Google Sheets con manejo nativo de CORS.
- **Solución al Conflicto de Timing (Admin Complement)**: Se estableció un modelo en el que el Administrador registra el "resto" de burpees (con la cuenta `Admin`), dejando que el sistema sume automáticamente esto a los aportes personales en vivo realizados por los alumnos logueados.
- **Autenticación Predictiva**: Se creó un `LoginModal` que consulta la base de usuarios en vivo y ofrece un `<datalist>` autocompletable. Si un nombre no existe, se registra automáticamente.
- **Formulario de Aportes In-App**: Se diseñó un `AddModal` accesible desde un botón de acción primaria en la barra inferior (solo para usuarios autenticados). Este formulario inyecta directamente la fila de datos y recarga la gráfica en tiempo real.
- **Historial Individual**: La pestaña "Últimas Clases" fue reformada hacia "Últimos Registros". Ahora itera sobre cada fila de la base de datos (desagregada) mostrando el número aportado y, si corresponde, el **Nombre del Alumno** que ingresó la cifra (ocultando al Administrador).
- **Refactorización de Interfaz (Mobile First)**: Se rediseñó el `header` principal para soportar tamaños de texto responsivos (`clamp`) y se reubicó la botonera principal (`Historial`, `Entrar/Logout`, `Aportar`) en un panel de acciones inferior flotante, previniendo superposiciones visuales y mejorando la ergonomía táctil.
