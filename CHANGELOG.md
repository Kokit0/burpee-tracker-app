# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.0.0] - Versión UAT (User Acceptance Testing) - 2026-08-17

### Añadido
- **Aplicación Web Progresiva (PWA)**: Implementación de PWA con `manifest.json` y logo de marca ("Llama/Gota") para permitir a los usuarios instalar la aplicación directamente en la pantalla de inicio de dispositivos móviles (Android/iOS) sin pasar por App Stores.
- **Backend Integrado con Google Sheets**: Conexión de solo lectura en tiempo real con una hoja de cálculo pública de Google (CSV) para obtener y actualizar el conteo de burpees sin necesidad de una base de datos compleja.
- **Diseño Premium "Dark Mode"**: Estructura visual moderna orientada al fitness usando estilos CSS nativos, con paleta de colores oscuro y acento naranja (`#FF4D00`).
- **Lógica Inteligente de Agrupación de Fechas**:
  - *Soporte multiformato*: El analizador ('parser') procesa fechas en formato `DD-MM-YYYY` y `D/M/YYYY` (resolviendo la diferencia entre el formato ingresado por el usuario y el formato exportado por Google Sheets).
  - *Agrupación Diaria*: Cuando hay múltiples sesiones en la misma fecha, el sistema las agrupa y consolida automáticamente en un único valor diario.
  - *Agrupación Mensual*: Clasificación automática de días en sus respectivos meses y años para el cálculo acumulado a largo plazo.
- **Menú de Historial Avanzado (Bottom Sheet)**: Panel deslizable fluido con navegación por pestañas:
  - Pestaña *Resumen Mensual*: Listado de todos los meses con datos históricos registrados. Al seleccionar un mes, la pantalla principal se actualiza y viaja en el tiempo a ese periodo.
  - Pestaña *Últimas Clases*: Listado detallado de los burpees consolidados día a día.
- **Despliegue Continuo (CI/CD)**: Flujo de trabajo configurado para el despliegue automático hacia GitHub Pages (`gh-pages`) tras ejecutar el script de *build*.

### Modificado
- Se reemplazó el icono y logotipo genérico (Vite) por el branding oficial de **NuFitness**.
- Se estandarizó la información visual central: El número en gran formato muestra ahora el acumulado histórico de todo el grupo para el mes activo, y el texto secundario indica la fecha y contribución de la última sesión ingresada.
