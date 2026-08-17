# NuFitness Burpee Tracker

Aplicación Web Progresiva (PWA) diseñada como un servicio práctico y motivacional para entrenamiento personalizado y nutrición. 

El objetivo principal de esta herramienta es permitir a la entrenadora mostrar a sus clientes el progreso y avance de sus entrenamientos grupales (específicamente, la suma total de burpees realizados). Al mostrar una métrica de grupo en tiempo real y tener un diseño enfocado en la usabilidad, la aplicación funciona como un poderoso motor para impulsar la motivación de la comunidad.

## 🚀 Características Principales

* **Estadísticas en Tiempo Real**: Sincronización directa con Google Sheets para reflejar los últimos datos cargados por la entrenadora inmediatamente tras cada sesión.
* **Agrupación Inteligente**: La aplicación consolida automáticamente los registros cuando ocurren múltiples clases en un mismo día, y agrupa el progreso a nivel mensual.
* **Instalable (PWA)**: Puede instalarse directamente desde el navegador (Chrome/Safari) al inicio del teléfono, funcionando como una App nativa sin pasar por las App Stores, garantizando 100% de seguridad y ausencia de rastreadores de terceros.
* **Diseño Premium**: Tema oscuro "Dark Mode" diseñado para bajo consumo de batería en pantallas OLED, con acentos color naranja energético propios de la marca.
* **Menú de Historial Dual**: Navegación ágil mediante pestañas para consultar el *Resumen Mensual* y el detalle de las *Últimas Clases*.

## 🛠️ Stack Tecnológico

El proyecto ha sido construido priorizando un alto rendimiento, bajo costo de mantenimiento y máxima flexibilidad:

* **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) para una interfaz de usuario reactiva y compilación ultra-rápida.
* **Estilos**: Vanilla CSS con variables CSS personalizadas, evitando dependencias externas para mantener la ligereza del código.
* **Base de Datos**: [Google Sheets](https://workspace.google.com/products/sheets/) vía exportación CSV pública. Actúa como un backend sin servidor (serverless), gratuito y extremadamente fácil de mantener para la administradora sin requerir conocimientos de bases de datos.
* **Despliegue y Hosting**: Automatizado mediante *gh-pages* y alojado gratuitamente en [GitHub Pages](https://pages.github.com/).
* **Progressive Web App (PWA)**: Configuración nativa mediante `manifest.json` e íconos vectoriales SVG.

## 📦 Instalación Local para Desarrollo

1. Clona el repositorio.
2. Asegúrate de tener Node.js instalado.
3. Ejecuta `npm install` para instalar las dependencias.
4. Ejecuta `npm run dev` para iniciar el servidor de desarrollo local.
5. Ejecuta `npm run build` para generar el código de producción.
