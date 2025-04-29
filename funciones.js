// funciones.gs

// 🔵 Renderizar página principal
function doGet() {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("Gestión de Flotas");
}

// 🔵 Incluir archivos HTML dinámicamente
function obtenerDatosHtml(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

// 🔵 Leer datos de una hoja
function getData(sheetName, useCache = true) {
  const cacheKey = `data_${sheetName}`;

  if (useCache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  const sheet = getSheet(sheetName);
  const [headers, ...rows] = sheet.getDataRange().getDisplayValues();
  const datos = rows.filter(row => row.some(cell => String(cell).trim() !== ""));

  const result = { headers, datos, lastUpdated: new Date().toISOString() };
  setCache(cacheKey, result);

  return result;
}

// 🔵 Obtener nombre real de la hoja
function obtenerNombreHoja(sheetName) {
  return getSheet(sheetName).getName();
}

// 🔵 Utilidades comunes
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function clearCache(cacheKey) {
  const cache = CacheService.getScriptCache();
  cache.remove(cacheKey);
}

function getFromCache(cacheKey) {
  const cache = CacheService.getScriptCache();
  const value = cache.get(cacheKey);
  return value ? JSON.parse(value) : null;
}

function setCache(cacheKey, value) {
  const cache = CacheService.getScriptCache();
  cache.put(cacheKey, JSON.stringify(value), 1500);
}

// 🔵 Generadores de ID
function generarIdFlota() {
  const sheet = getSheet("Flota");
  const lastRow = sheet.getLastRow();
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return !isNaN(lastId) && lastId !== "" ? Number(lastId) + 1 : 1;
}

function generarIdChofer() {
  const sheet = getSheet("Choferes");
  const lastRow = sheet.getLastRow();
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return !isNaN(lastId) && lastId !== "" ? Number(lastId) + 1 : 1;
}

//--------------------------------------
// CRUD Flota
//--------------------------------------

function agregarRegistroFlota(registro) {
  if (!Array.isArray(registro) || registro.length < 8) {
    throw new Error("Formato de registro inválido");
  }
  if (verificarPatenteFlota(registro[2])) {
    throw new Error("La patente ya existe en el sistema");
  }
  clearCache("data_Flota");
  getSheet("Flota").appendRow(registro);
  return true;
}

function verificarPatenteFlota(patente) {
  const { datos } = getData("Flota");
  return datos.some(row => row[2] && row[2].toString().toUpperCase() === patente.toUpperCase());
}

function borrarRegistroFlota(idFlota) {
  const sheet = getSheet("Flota");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idFlota)) {
      sheet.deleteRow(i + 1);
      clearCache("data_Flota");
      return "success";
    }
  }
  return "error";
}

function obtenerRegistroFlota(idFlota) {
  const cacheKey = `flota_${idFlota}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const { datos } = getData("Flota", false);
  const registro = datos.find(row => String(row[0]).trim() === String(idFlota).trim());

  if (registro) {
    setCache(cacheKey, registro);
    return registro;
  }
  return null;
}

function actualizarRegistroFlota(registroModificado) {
  const sheet = getSheet("Flota");
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(registroModificado[0]).trim();

  for (let i = 1; i < data.length; i++) {
    const idActual = String(data[i][0]).trim(); // 🔥 Siempre tratar ambos como texto
    if (idActual === idBuscado) {
      for (let j = 0; j < registroModificado.length; j++) {
        sheet.getRange(i + 1, j + 1).setValue(registroModificado[j]);
      }
      clearCache("data_Flota");
      clearCache(`flota_${idBuscado}`);
      return "success";
    }
  }
  throw new Error(`ID de Flota ${idBuscado} no encontrado en la hoja.`);
}

//--------------------------------------
// CRUD Choferes
//--------------------------------------

function agregarRegistroChofer(registro) {
  clearCache("data_Choferes");
  getSheet("Choferes").appendRow(registro);
  return true;
}

function obtenerRegistroChofer(idChofer) {
  const { datos } = getData("Choferes", false);
  return datos.find(row => String(row[0]).trim() === String(idChofer).trim()) || null;
}

function actualizarRegistroChofer(registroModificado) {
  const sheet = getSheet("Choferes");
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(registroModificado[0]).trim();

  for (let i = 1; i < data.length; i++) {
    const idActual = String(data[i][0]).trim(); // 🔥
    if (idActual === idBuscado) {
      for (let j = 0; j < registroModificado.length; j++) {
        sheet.getRange(i + 1, j + 1).setValue(registroModificado[j]);
      }
      clearCache("data_Choferes");
      return "success";
    }
  }
  throw new Error(`ID de Chofer ${idBuscado} no encontrado en la hoja.`);
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


//-------------------------------------------
// SEMIRREMOLQUES
//-------------------------------------------

function generarIdSemirremolque() {
  const sheet = getSheet("Semirremolque");
  const lastRow = sheet.getLastRow();
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return !isNaN(lastId) ? Number(lastId) + 1 : 1;
}

function agregarRegistroSemirremolque(registro) {
  if (!Array.isArray(registro) || registro.length < 8) {
    throw new Error("Formato de registro inválido para Semirremolque");
  }
  clearCache("data_Semirremolque");
  getSheet("Semirremolque").appendRow(registro);
  return true;
}

function obtenerRegistroSemirremolque(idSemirremolque) {
  const { datos } = getData("Semirremolque", false);
  return (
    datos.find(
      (row) => String(row[0]).trim() === String(idSemirremolque).trim()
    ) || null
  );
}

function actualizarRegistroSemirremolque(registroModificado) {
  const sheet = getSheet("Semirremolque");
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(registroModificado[0]).trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idBuscado) {
      for (let j = 0; j < registroModificado.length; j++) {
        sheet.getRange(i + 1, j + 1).setValue(registroModificado[j]);
      }
      clearCache("data_Semirremolque");
      return "success";
    }
  }
  throw new Error("ID de Semirremolque no encontrado en la hoja.");
}

function actualizarRegistroSemirremolque(registroModificado) {
  const sheet = getSheet("Semirremolque");
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(registroModificado[0]).trim();

  for (let i = 1; i < data.length; i++) {
    const idActual = String(data[i][0]).trim(); // 🔥
    if (idActual === idBuscado) {
      for (let j = 0; j < registroModificado.length; j++) {
        sheet.getRange(i + 1, j + 1).setValue(registroModificado[j]);
      }
      clearCache("data_Semirremolque");
      return "success";
    }
  }
  throw new Error(`ID de Semirremolque ${idBuscado} no encontrado en la hoja.`);
}

// Generar nuevo ID Semirremolque
function generarIdSemirremolque() {
  const sheet = getSheet("Semirremolque");
  const lastRow = sheet.getLastRow();
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return !isNaN(lastId) && lastId !== "" ? Number(lastId) + 1 : 1;
}

// Agregar Semirremolque
function agregarRegistroSemirremolque(registro) {
  if (!Array.isArray(registro) || registro.length < 5) {
    throw new Error("Registro inválido");
  }

  clearCache("data_Semirremolque");
  getSheet("Semirremolque").appendRow(registro.map(parseDate));
  return true;
}

// Obtener un registro específico de Semirremolque
function obtenerRegistroSemirremolque(id) {
  const { datos } = getData("Semirremolque", false);
  return datos.find((row) => String(row[0]) === String(id)) || null;
}

// Actualizar registro Semirremolque
function actualizarRegistroSemirremolque(registroModificado) {
  const sheet = getSheet("Semirremolque");
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(registroModificado[0]);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === idBuscado) {
      for (let j = 0; j < registroModificado.length; j++) {
        sheet.getRange(i + 1, j + 1).setValue(parseDate(registroModificado[j]));
      }
      clearCache("data_Semirremolque");
      return "success";
    }
  }
  return "error";
}

// Eliminar registro Semirremolque
function borrarRegistroSemirremolque(id) {
  const sheet = getSheet("Semirremolque");
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(id);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === idBuscado) {
      sheet.deleteRow(i + 1);
      clearCache("data_Semirremolque");
      return "success";
    }
  }
  return "error";
}