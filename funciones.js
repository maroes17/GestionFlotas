// funciones.gs

// 🔵 Renderizar página principal
function doGet() {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("Gestión de Flotas");
}

// 🔵 Incluir HTML dinámico
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

// 🔵 Obtener objeto Sheet
function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

// 🔵 Cache helpers
function clearCache(cacheKey) {
  CacheService.getScriptCache().remove(cacheKey);
}

function getFromCache(cacheKey) {
  const value = CacheService.getScriptCache().get(cacheKey);
  return value ? JSON.parse(value) : null;
}

function setCache(cacheKey, value) {
  CacheService.getScriptCache().put(cacheKey, JSON.stringify(value), 1500);
}

// 🔵 Generadores de ID
function generarIdFlota() {
  return generarNuevoId("Flota");
}

function generarIdChofer() {
  return generarNuevoId("Choferes");
}

function generarIdSemirremolque() {
  return generarNuevoId("Semirremolque");
}

function generarNuevoId(hoja) {
  const sheet = getSheet(hoja);
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

function obtenerRegistroFlota(idFlota) {
  const { datos } = getData("Flota", false);
  return datos.find(row => String(row[0]).trim() === String(idFlota).trim()) || null;
}

function actualizarRegistroFlota(registroModificado) {
  return actualizarRegistroEnHoja("Flota", registroModificado, "data_Flota");
}

function borrarRegistroFlota(idFlota) {
  return borrarRegistroEnHoja("Flota", idFlota, "data_Flota");
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
  return actualizarRegistroEnHoja("Choferes", registroModificado, "data_Choferes");
}

function borrarRegistroChofer(idChofer) {
  return borrarRegistroEnHoja("Choferes", idChofer, "data_Choferes");
}

//-------------------------------------------
// CRUD Semirremolque
//-------------------------------------------

function agregarRegistroSemirremolque(registro) {
  clearCache("data_Semirremolque");
  getSheet("Semirremolque").appendRow(registro);
  return true;
}

function obtenerRegistroSemirremolque(idSemirremolque) {
  const { datos } = getData("Semirremolque", false);
  return datos.find(row => String(row[0]).trim() === String(idSemirremolque).trim()) || null;
}

function actualizarRegistroSemirremolque(registroModificado) {
  return actualizarRegistroEnHoja("Semirremolque", registroModificado, "data_Semirremolque");
}

function borrarRegistroSemirremolque(idSemirremolque) {
  return borrarRegistroEnHoja("Semirremolque", idSemirremolque, "data_Semirremolque");
}

//-------------------------------------------
// Helpers de actualización / eliminación
//-------------------------------------------

function actualizarRegistroEnHoja(nombreHoja, registroModificado, cacheKey) {
  const sheet = getSheet(nombreHoja);
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(registroModificado[0]).trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idBuscado) {
      for (let j = 0; j < registroModificado.length; j++) {
        sheet.getRange(i + 1, j + 1).setValue(registroModificado[j]);
      }
      clearCache(cacheKey);
      return "success";
    }
  }
  throw new Error(`ID no encontrado en ${nombreHoja}`);
}

function borrarRegistroEnHoja(nombreHoja, id, cacheKey) {
  const sheet = getSheet(nombreHoja);
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(id).trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idBuscado) {
      sheet.deleteRow(i + 1);
      clearCache(cacheKey);
      return "success";
    }
  }
  return "error";
}