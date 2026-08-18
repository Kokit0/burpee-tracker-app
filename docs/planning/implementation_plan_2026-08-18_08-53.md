# Plan Fase 2: Autenticación, Backend y Registros Personales (Actualizado)

Tus observaciones son brillantes y han destrabado la lógica correcta. Tienes toda la razón: si el objetivo psicológico es que **ellos** sientan que están empujando la barra grupal hacia arriba con cada ingreso, no podemos quitarles ese peso de la estadística.

## 1. La Nueva Verdad de los Datos (Adiós al Clash)
El paradigma cambiará. Dejarás de ser el que anota el "Total de la Clase" a mano. En su lugar, el sistema funcionará así:
- **Total Grupal = (Suma de todos los ingresos de los Usuarios) + (Tu Ingreso "Complemento")**

**¿Cómo funciona en la práctica?**
Si en una clase se hicieron 500 burpees en total, pero sabes que 3 alumnos (que hicieron 150 burpees en total) van a registrar sus datos en la app, tú, como administrador (con una cuenta especial llamada "Admin" o "Resto de la Clase"), simplemente ingresas los **350 burpees restantes** correspondientes a la gente que no usa la app. 
De esta forma, cuando los 3 alumnos lleguen a casa e ingresen sus 150 burpees, la barra subirá en tiempo real y el total perfecto de 500 se alcanzará sin ninguna duplicación, sin importar el *timing*.

## 2. Autenticación Inteligente (El Dropdown)
Para evitar el problema de "juan" vs "Juan" y perfiles duplicados, la pantalla de Login tendrá un componente de **Autocompletado (Sugerencias)**.
- Cuando la aplicación cargue, le pedirá silenciosamente a Google Sheets la lista de todos los nombres registrados (sin las contraseñas, por supuesto).
- Al hacer clic en el campo "Nombre", se desplegará la lista. Si el usuario escribe "Ma", le sugerirá "María", "Mario", etc.
- Si selecciona un nombre existente, solo debe poner su clave.
- Si escribe un nombre que *no* está en la lista (ej. "Carlos Nuevo"), la app se dará cuenta y cambiará su botón a "Registrarse y Crear Clave". ¡Fricción cero!

## 3. Arquitectura del Backend (Google Apps Script)
El script que vivirá en Google Sheets tendrá las siguientes funciones (API):
1. `GET /users`: Retorna solo la lista de nombres para el Dropdown.
2. `POST /login`: Recibe Nombre + Clave y responde si es correcto o si debe registrarse.
3. `POST /submit`: Recibe los burpees de un usuario y los anota en la hoja de `Registros`.
4. `GET /data`: Retorna la data consolidada para construir el gráfico.

---

> [!IMPORTANT]
> ## Revisión Final
> ¿Te convence el modelo de "Complemento"? Significa que tú (o tus entrenadores) tendrán una cuenta llamada "Admin" donde solo ingresarán los burpees de la "gente sin app", confiando en que los que sí tienen la app sumarán su parte para completar el puzzle del día.

### Verification Plan
1. Crear el código `Code.gs` para Google Apps Script.
2. Diseñar el modal de Login con soporte para `<datalist>` o dropdown predictivo en React.
3. Re-conectar el "Gran Total" del `App.jsx` para que sea el resultado de esta nueva API unificada.
