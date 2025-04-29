// funciones.gs

// Función principal para cargar la app
function doGet() {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("Gestión de Flotas");
}

// Incluir archivos HTML
function obtenerDatosHtml(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

// Obtener datos desde una hoja
function getData(sheetName, useCache = true) {
  const cacheKey = `data_${sheetName}`;

  if (useCache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  const sheet = getSheet(sheetName);
  const [headers, ...rows] = sheet.getDataRange().getDisplayValues();
  const datos = rows.filter((row) =>
    row.some((cell) => cell.toString().trim() !== "")
  );

  const result = {
    headers: headers || [],
    datos: datos || [],
    lastUpdated: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return result;
}

// Obtener nombre de hoja
function obtenerNombreHoja(sheetName) {
  return getSheet(sheetName).getName();
}

// Generar nuevo ID Flota
function generarIdFlota() {
  const sheet = getSheet("Flota");
  const lastRow = sheet.getLastRow();
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return !isNaN(lastId) ? Number(lastId) + 1 : 1;
}

// Agregar registro de Flota
function agregarRegistroFlota(registro) {
    if (!Array.isArray(registro) || registro.length < 8) {
      throw new Error("Formato de registro inválido");
    }
  
    if (verificarPatenteFlota(registro[2])) {
      throw new Error("La patente ya existe en el sistema");
    }
  
    clearCache("data_Flota");
  
    getSheet("Flota").appendRow(registro); // 🔥 Ya no aplicamos parseDate
    
    return true;
  }
  
  

// Verificar patente única en Flota
function verificarPatenteFlota(patente) {
  const { datos } = getData("Flota");
  return datos.some(
    (row) =>
      row[2] &&
      row[2].toString().toUpperCase() === patente.toString().toUpperCase()
  );
}

// Borrar registro Flota
function borrarRegistroFlota(idFlota) {
  const sheet = getSheet("Flota");
  const data = sheet.getDataRange().getValues();
  const idCol = 0;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(idFlota)) {
      sheet.deleteRow(i + 1);
      clearCache("data_Flota");
      return "success";
    }
  }
  return "error";
}

// Obtener registro individual Flota
function obtenerRegistroFlota(idFlota) {
  const cacheKey = `flota_${idFlota}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const { datos } = getData("Flota", false);
  const registro = datos.find(
    (row) => String(row[0]).trim() === String(idFlota).trim()
  );

  if (registro) {
    setCache(cacheKey, registro);
    return registro;
  }
  return null;
}

// Actualizar registro Flota
function actualizarRegistroFlota(registroModificado) {
  if (!registroModificado || registroModificado.length === 0) {
    throw new Error("Datos de registro vacíos o inválidos");
  }

  const sheet = getSheet("Flota");
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(registroModificado[0]).trim();
  let encontrado = false;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idBuscado) {
      for (let j = 0; j < registroModificado.length; j++) {
        if (j !== 11) {
          // No tocar "Creación de Registro"
          sheet
            .getRange(i + 1, j + 1)
            .setValue(parseDate(registroModificado[j]));
        }
      }
      encontrado = true;
      break;
    }
  }

  if (encontrado) {
    clearCache("data_Flota");
    clearCache(`flota_${idBuscado}`);
    return "success";
  } else {
    throw new Error("ID de Flota no encontrado en la hoja.");
  }
}

//-------------------------------------------
// CHoferes
//-------------------------------------------

function agregarRegistroChofer(registro) {
  clearCache("data_Choferes");
  getSheet("Choferes").appendRow(registro.map(parseDate));
  return true;
}

function obtenerRegistroChofer(idChofer) {
  const { datos } = getData("Choferes", false);
  return (
    datos.find((row) => String(row[0]).trim() === String(idChofer).trim()) ||
    null
  );
}

function actualizarRegistroChofer(registroModificado) {
  const sheet = getSheet("Choferes");
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(registroModificado[0]).trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idBuscado) {
      for (let j = 0; j < registroModificado.length; j++) {
        sheet.getRange(i + 1, j + 1).setValue(parseDate(registroModificado[j]));
      }
      clearCache("data_Choferes");
      return "success";
    }
  }
  return "error";
}

function borrarRegistroChofer(idChofer) {
  const sheet = getSheet("Choferes");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idChofer)) {
      sheet.deleteRow(i + 1);
      clearCache("data_Choferes");
      return "success";
    }
  }
  return "error";
}

function generarIdChofer() {
  const sheet = getSheet("Choferes");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    // Solo tiene encabezados
    return 1;
  }
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return !isNaN(lastId) && lastId != "" ? Number(lastId) + 1 : 1;
}

