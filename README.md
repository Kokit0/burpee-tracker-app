# NuFitness Tracker App

Aplicación Web Progresiva (PWA) de nivel empresarial diseñada para la motivación y el tracking de entrenamiento colaborativo (Burpees y Squats) a través de disciplinas como Hyrox y Funcional.

NuFitness actúa como el núcleo interactivo de la comunidad: no solo permite a la administración llevar el control histórico de las clases, sino que autoriza a los usuarios a registrar sus propios números en tiempo real para empujar juntos la meta mensual del grupo.

## 🚀 Arquitectura y Tecnologías (Fase 2)

El proyecto emplea una arquitectura moderna, sin servidor (serverless) y de alta rentabilidad:

* **Frontend**: SPA construida en [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) garantizando extrema velocidad y una interfaz responsiva *Mobile-First*.
* **Base de Datos / Backend**: API construida sobre **Google Apps Script** (doGet/doPost) que transforma un Google Sheet privado en un endpoint REST full-duplex con capacidades CRUD y validación de usuarios.
* **Autenticación**: Sistema de auto-registro colaborativo mediante cuentas de acceso seguro.
* **Estilos y Gráficos**: CSS Modular sin dependencias externas (incluyendo un motor propio de gráficos paramétricos SVG).
* **Despliegue y Hosting**: CI/CD configurado sobre Github Actions despachando automáticamente hacia GitHub Pages.

## ✨ Características Principales

* **Entrada de Datos Colaborativa (Admin Complement Model)**: Los clientes ingresan sus aportes personales tras cada clase. La administración complementa el resto, asegurando una estadística perfecta y en tiempo real sin duplicaciones.
* **Metas Dinámicas Separadas**: Lógica asíncrona que calcula y dibuja la línea de progreso contra objetivos dinámicos configurables por clase y ejercicio.
* **Historial Individualizado**: Las listas de registros reconocen y premian individualmente el aporte nominal de cada usuario con la etiqueta comunitaria.
* **Aplicación Instalable (PWA)**: Iconos nativos, caché en dispositivos móviles y modo inmersivo sin barra de navegador.

## 🛠️ Instalación y Desarrollo

1. Clona el repositorio: git clone https://github.com/Kokit0/burpee-tracker-app.git
2. Instala los paquetes: 
pm install
3. Despliega en modo local: 
pm run dev
4. Compila para producción: 
pm run build

> **Nota para el Backend**: Para instanciar tu propia base de datos, debes ejecutar el script Code.gs documentado en el directorio docs/planning/ de este repositorio en un entorno de Google Sheets y obtener tu propia URL de API.
