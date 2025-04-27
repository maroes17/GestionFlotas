function doGet(){
    return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Gestion de Flotas');
}

function obtenerDatosHtml(nombre){
    return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

function getData(sheetName) {
    const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
    const sheet = ss.getSheetByName(sheetName);
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
  
    if (lastRow > 0) {
      const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
      const datos = sheet.getRange(2, 1, lastRow - 1, lastColumn).getDisplayValues();
      return { headers, datos };
    } else {
      return { headers: [], datos: [] }; // Hoja vacía
    }
  }

// Para obtener el nombre de la hoja de forma dinámica, puedes crear una función como esta:
function obtenerNombreHoja(sheetName){
    const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
    const sheet = ss.getSheetByName(sheetName);  
    return sheet.getName();
  }

//GENERAR EL ID AUTOAMETICAMENTE DE FLOTA
function generarIdFlota() {
    const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
    const sheet = ss.getSheetByName("Flota");
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      // Si no hay datos todavía (sólo encabezado), partir en 1
      return 1;
    } else {
      const lastId = sheet.getRange(lastRow, 1).getValue(); // columna 1 = ID Flota
      if (!isNaN(lastId)) {
        return Number(lastId) + 1;
      } else {
        // Si por algún motivo el ID anterior no es número (ejemplo error manual), partir de nuevo
        return 1;
      }
    }
  }
  
  function agregarRegistroFlota(registro) {
    const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
    const sheet = ss.getSheetByName("Flota");
  
    // Primero agrega la fila sin la fecha
    sheet.appendRow(registro);
  
    // Ahora insertar la FECHA FIJA en la última fila, columna 12 (por ejemplo)
    const lastRow = sheet.getLastRow();
    const fechaColumna = 12; // Cambia este número si tu columna de fecha no es la 12
  
    // Insertamos la fecha como valor, no como fórmula
    sheet.getRange(lastRow, fechaColumna).setValue(new Date());
  }
  
  function agregarRegistroChofer(registro) {
    const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
    const sheet = ss.getSheetByName("Choferes"); // Asegúrate de que el nombre de tu hoja sea "Choferes"
  
    // Agrega la nueva fila con los datos del registro
    sheet.appendRow(registro);
  
    // Puedes agregar aquí lógica adicional si necesitas registrar la fecha de creación
    // o realizar otras acciones al agregar un chofer.
  }


  function verificarPatenteFlota(patente) {
    const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
    const sheet = ss.getSheetByName("Flota");
    const data = sheet.getDataRange().getDisplayValues();
    const patenteColumnIndex = 2; // Suponiendo que la columna de la patente es la tercera (índice 2)
  
    // Empezar desde la segunda fila para omitir los encabezados
    for (let i = 1; i < data.length; i++) {
      if (data[i][patenteColumnIndex] && data[i][patenteColumnIndex].toUpperCase() === patente.toUpperCase()) {
        return true; // La patente ya existe
      }
    }
    return false; // La patente no existe
  }


//Borrar registro Tabla Flota
  function borrarRegistroFlota(idFlota) {
    const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
    const sheet = ss.getSheetByName("Flota");
    const data = sheet.getDataRange().getValues();
    const idColumnIndex = 0; // Suponiendo que el ID de Flota está en la primera columna (índice 0)
  
    // Empezar desde la segunda fila para omitir los encabezados
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColumnIndex] == idFlota) {
        sheet.deleteRow(i + 1); // Los índices de las filas en Sheets son base 1
        return 'success';
      }
    }
    return 'error'; // No se encontró el ID
  }