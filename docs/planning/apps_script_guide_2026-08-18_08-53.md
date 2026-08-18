# Guía de Instalación del Servidor (Google Apps Script)

Esta guía contiene el código que transformará tu hoja de cálculo en una base de datos interactiva y segura. Al hacer esto, **tú como Admin podrás registrar tus datos desde la app, y tus usuarios podrán crear su cuenta e ingresar sus propios datos.** Todos sumarán al total.

## PASO 1: Pegar el Código

1. Abre tu archivo de Google Sheets.
2. En el menú superior, haz clic en **Extensiones > Apps Script**.
3. Se abrirá una nueva pestaña con un editor de código. Borra todo lo que haya ahí.
4. Copia el siguiente código y pégalo en ese editor:

```javascript
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function buildSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

function buildError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: msg }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'getUsers') {
      const sheet = ss.getSheetByName('Usuarios');
      if (!sheet) return buildSuccess([]);
      const data = sheet.getDataRange().getValues();
      const users = data.slice(1).map(row => row[0]); // Retorna solo nombres
      return buildSuccess(users);
    } 
    else if (action === 'getData') {
      const sheetDatos = ss.getSheets()[0]; // La Hoja 1
      const sheetMetas = ss.getSheetByName('Metas') || ss.getSheetByName('Hoja 2');
      
      const datos = sheetDatos.getDataRange().getValues();
      const metas = sheetMetas ? sheetMetas.getDataRange().getValues() : [];
      
      return buildSuccess({ datos: datos, metas: metas });
    }
    
    return buildError('Acción GET inválida');
  } catch (error) {
    return buildError(error.toString());
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'login') {
      const username = payload.username.trim();
      const password = payload.password.trim();
      
      let sheet = ss.getSheetByName('Usuarios');
      if (!sheet) {
        sheet = ss.insertSheet('Usuarios');
        sheet.appendRow(['Nombre', 'Password']);
      }
      
      const data = sheet.getDataRange().getValues();
      let userFound = false;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0].toString().toLowerCase() === username.toLowerCase()) {
          userFound = true;
          if (data[i][1].toString() === password) {
             return buildSuccess({ message: 'Login exitoso', isNew: false, username: data[i][0] });
          } else {
             return buildError('Contraseña incorrecta');
          }
        }
      }
      
      if (!userFound) {
        sheet.appendRow([username, password]);
        return buildSuccess({ message: 'Usuario registrado exitosamente', isNew: true, username: username });
      }
    }
    else if (action === 'addEntry') {
      const sheetDatos = ss.getSheets()[0];
      const headers = sheetDatos.getDataRange().getValues()[0];
      
      const newRow = new Array(headers.length).fill("");
      
      headers.forEach((h, i) => {
        const lowerH = h.toString().toLowerCase();
        if (lowerH.includes('fecha') || lowerH.includes('mes')) newRow[i] = payload.date;
        else if (lowerH.includes('servicio') || lowerH.includes('clase')) newRow[i] = payload.service;
        else if (lowerH.includes('burpees')) newRow[i] = payload.burpees;
        else if (lowerH.includes('squats')) newRow[i] = payload.squats;
        else if (lowerH.includes('usuario')) newRow[i] = payload.username;
      });
      
      // Crear columna "Usuario" si no existe
      let userColIdx = headers.findIndex(h => h.toString().toLowerCase().includes('usuario'));
      if (userColIdx === -1) {
        sheetDatos.getRange(1, headers.length + 1).setValue("Usuario");
        newRow.push(payload.username);
      }
      
      sheetDatos.appendRow(newRow);
      return buildSuccess({ message: 'Ingreso guardado exitosamente' });
    }
    
    return buildError('Acción POST inválida');
  } catch (error) {
    return buildError(error.toString());
  }
}
```

5. Haz clic en el ícono del **Disquete** (Guardar) arriba en la barra de herramientas.

## PASO 2: Publicar la API
1. En la esquina superior derecha, haz clic en el botón azul **"Implementar"** (Deploy) y luego en **"Nueva implementación"**.
2. Haz clic en el ícono de la rueda dentada (⚙️) junto a "Seleccionar tipo" y elige **"Aplicación web"**.
3. Llena la configuración así:
   - **Descripción**: API NuFitness
   - **Ejecutar como**: "Yo" (Tu correo)
   - **Quién tiene acceso**: **Cualquier persona** *(¡Muy importante!)*
4. Haz clic en **Implementar**. 
   *(Nota: Google te pedirá "Autorizar accesos". Haz clic ahí, selecciona tu cuenta, ve a "Configuración avanzada" abajo y dale a "Ir a proyecto (inseguro)". Finalmente, haz clic en "Permitir").*
5. ¡Listo! Te aparecerá un cuadro con una **"URL de la aplicación web"**. Cópiala.

## PASO 3: Pasarme la URL
Vuelve al chat conmigo y envíame esa URL. Con ella conectaré la aplicación React a este nuevo motor.
