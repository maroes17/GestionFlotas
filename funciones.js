// funciones.gs

function doGet() {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("Gestión de Flotas");
}

function obtenerDatosHtml(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

function getData(sheetName, useCache = true) {
  const cacheKey = `data_${sheetName}`;
  if (useCache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  const sheet = getSheet(sheetName);
  const [headers, ...rows] = sheet.getDataRange().getDisplayValues();
  const datos = rows.filter((row) =>
    row.some((cell) => String(cell).trim() !== "")
  );

  const result = { headers, datos, lastUpdated: new Date().toISOString() };
  setCache(cacheKey, result);
  return result;
}

function generarIdFlota() {
  return generarNuevoId("Flota");
}

function generarIdChofer() {
  return generarNuevoId("Choferes");
}

function generarIdSemirremolque() {
  return generarNuevoId("Semirremolque");
}

function generarIdPoliza() {
  const sheet = getSheet("Polizas");
  const lastRow = sheet.getLastRow();
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return !isNaN(lastId) && lastId !== "" ? Number(lastId) + 1 : 1;
}

function generarNuevoId(hoja) {
  const sheet = getSheet(hoja);
  const lastRow = sheet.getLastRow();
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return !isNaN(lastId) && lastId !== "" ? Number(lastId) + 1 : 1;
}

//-----------------------------
// CRUD Flota
//-----------------------------

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
  return datos.some(
    (row) => row[2] && row[2].toString().toUpperCase() === patente.toUpperCase()
  );
}

function obtenerRegistroFlota(idFlota) {
  const { datos } = getData("Flota", false);
  return (
    datos.find((row) => String(row[0]).trim() === String(idFlota).trim()) ||
    null
  );
}

function actualizarRegistroFlota(registroModificado) {
  return actualizarRegistroEnHoja("Flota", registroModificado, "data_Flota");
}

function borrarRegistroFlota(idFlota) {
  return borrarRegistroEnHoja("Flota", idFlota, "data_Flota");
}

//-----------------------------
// CRUD Choferes
//-----------------------------

function agregarRegistroChofer(registro) {
  clearCache("data_Choferes");
  getSheet("Choferes").appendRow(registro);
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
  return actualizarRegistroEnHoja(
    "Choferes",
    registroModificado,
    "data_Choferes"
  );
}

function borrarRegistroChofer(idChofer) {
  return borrarRegistroEnHoja("Choferes", idChofer, "data_Choferes");
}

//-----------------------------
// CRUD Semirremolque
//-----------------------------

function agregarRegistroSemirremolque(registro) {
  clearCache("data_Semirremolque");
  getSheet("Semirremolque").appendRow(registro);
  return true;
}

function obtenerRegistroSemirremolque(id) {
  const { datos } = getData("Semirremolque", false);
  return (
    datos.find((row) => String(row[0]).trim() === String(id).trim()) || null
  );
}

function actualizarRegistroSemirremolque(registroModificado) {
  return actualizarRegistroEnHoja(
    "Semirremolque",
    registroModificado,
    "data_Semirremolque"
  );
}

function borrarRegistroSemirremolque(id) {
  return borrarRegistroEnHoja("Semirremolque", id, "data_Semirremolque");
}

//-----------------------------
// CRUD Pólizas
//-----------------------------

function agregarRegistroPoliza(registro) {
  if (!Array.isArray(registro) || registro.length < 12) {
    throw new Error("Registro de póliza inválido");
  }

  const sheet = getSheet("Polizas");
  clearCache("data_Polizas");

  sheet.appendRow(registro);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 8).setNumberFormat('"$"#,##0');

  return true;
}

function obtenerRegistroPoliza(idPoliza) {
  const { datos } = getData("Polizas", false);
  return (
    datos.find((row) => String(row[0]).trim() === String(idPoliza).trim()) ||
    null
  );
}

function actualizarRegistroPoliza(registroModificado) {
  return actualizarRegistroEnHoja(
    "Polizas",
    registroModificado,
    "data_Polizas"
  );
}

function borrarRegistroPoliza(idPoliza) {
  return borrarRegistroEnHoja("Polizas", idPoliza, "data_Polizas");
}

function actualizarEstadoPolizaRenovada(idPoliza) {
  const hoja = getSheet("Polizas");
  const datos = hoja.getDataRange().getValues();

  const fila = datos.findIndex((row) => String(row[0]) === String(idPoliza));
  if (fila === -1) throw new Error("No se encontró la póliza a renovar.");

  hoja.getRange(fila + 1, 10).setValue("renovada"); // Columna 10 = Estado
}

//-----------------------------
// Helpers de actualización y eliminación
//-----------------------------

function actualizarRegistroEnHoja(nombreHoja, registroModificado, cacheKey) {
  const sheet = getSheet(nombreHoja);
  const data = sheet.getDataRange().getValues();
  const idBuscado = String(registroModificado[0]).trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idBuscado) {
      for (let j = 0; j < registroModificado.length; j++) {
        sheet.getRange(i + 1, j + 1).setValue(registroModificado[j]);
        if (nombreHoja === "Polizas" && j === 7) {
          sheet.getRange(i + 1, j + 1).setNumberFormat('"CLP $"#,##0');
        }
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

// --------------------------------------
// Módulo Viajes
// --------------------------------------

// 🔢 Generar ID automático: V001, V002, ...
function generarIdViaje() {
  const hoja = getSheet("Viajes");
  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) return 1; // Si no hay datos

  const datos = hoja.getRange(2, 1, ultimaFila - 1).getValues(); // columna A, excluye encabezado
  const numeros = datos
    .map((row) => {
      const id = row[0]; // Ej: V001
      const match = typeof id === "string" && id.match(/^V(\d+)$/);
      return match ? parseInt(match[1]) : null;
    })
    .filter((num) => !isNaN(num));

  const max = Math.max(...numeros, 0);
  return max + 1;
}

// 📥 Agregar nuevo registro de viaje
function agregarRegistroViaje(registro) {
  if (!Array.isArray(registro) || registro.length < 13) {
    throw new Error("Registro inválido para Viaje");
  }

  const hoja = getSheet("Viajes");
  hoja.appendRow(registro);

  clearCache("data_Viajes");
  return true;
}

// 🧾 Obtener registro único por ID
function obtenerRegistroViaje(idViaje) {
  const { datos } = getData("Viajes", false);
  return (
    datos.find((row) => String(row[0]).trim() === String(idViaje).trim()) ||
    null
  );
}

// ♻️ Actualizar viaje existente
function actualizarRegistroViaje(registroModificado) {
  return actualizarRegistroEnHoja("Viajes", registroModificado, "data_Viajes");
}

// 🗑️ Borrar viaje por ID
function borrarRegistroViaje(idViaje) {
  return borrarRegistroEnHoja("Viajes", idViaje, "data_Viajes");
}

// Incidentes
function generarIdIncidente() {
  const hoja = getSheet("Incidentes");
  const datos = hoja.getDataRange().getValues();
  const total = datos.length;
  return "INC" + String(total).padStart(3, "0");
}

function agregarIncidente(idViaje, patente, chofer, descripcion) {
  const hoja = getSheet("Incidentes");
  const nuevoId = generarIdIncidente();
  const fecha = new Date();
  const estado = "abierto";
  const usuario = Session.getActiveUser().getEmail();

  const fila = [
    nuevoId,
    fecha,
    idViaje,
    patente,
    chofer,
    descripcion,
    estado,
    usuario,
  ];

  hoja.appendRow(fila);
  return "success";
}

//Buscar Chofer por nombre
function buscarChoferPorNombre(nombre) {
  const hoja = getSheet("Choferes");
  const datos = hoja.getDataRange().getValues();
  return (
    datos.find((row) => String(row[1]).trim() === String(nombre).trim()) || null
  );
}

//Reportar Incidentes
function reportarIncidente(idViaje, descripcion) {
  const hojaViajes = getSheet("Viajes");
  const hojaFlota = getSheet("Flota");
  const hojaChoferes = getSheet("Choferes");
  const hojaIncidentes = getSheet("Incidentes");

  const viajes = hojaViajes.getDataRange().getValues();
  const viaje = viajes.find(
    (row) => String(row[0]).trim() === String(idViaje).trim()
  );

  if (!viaje) {
    throw new Error("Viaje no encontrado.");
  }

  const nombreChofer = viaje[8]; // Columna 9 = Conductor
  let patenteCamion = "";

  // Buscar la patente asignada al chofer
  const choferes = hojaChoferes.getDataRange().getValues();
  const chofer = choferes.find((row) => row[1] === nombreChofer);
  if (chofer) {
    patenteCamion = chofer[10] || ""; // Columna 11 = Flota asignada
  }

  // 🟡 Cambiar estado del viaje a "en mantención"
  const rowIndexViaje = viajes.findIndex(
    (row) => String(row[0]).trim() === String(idViaje).trim()
  );
  if (rowIndexViaje !== -1) {
    const colEstado = obtenerIndiceColumna(hojaViajes, "Estado");
    Logger.log(
      "🟢 Cambio de estado del viaje en fila:",
      rowIndexViaje + 1,
      "columna:",
      colEstado
    );
    hojaViajes.getRange(rowIndexViaje + 1, colEstado).setValue("en mantención");
  } else {
    Logger.log("🔴 No se encontró la fila del viaje para cambiar estado.");
  }

  // Cambiar estado de flota a "mantención" si hay patente
  if (patenteCamion) {
    const flota = hojaFlota.getDataRange().getValues();
    const rowIndexFlota = flota.findIndex((row) => row[2] === patenteCamion); // Columna 3 = Patente
    if (rowIndexFlota !== -1) {
      const colEstadoFlota = obtenerIndiceColumna(hojaFlota, "Estado");
      hojaFlota
        .getRange(rowIndexFlota + 1, colEstadoFlota)
        .setValue("mantención");
    }
  }

  // Generar nuevo ID incidente: INC001, INC002, ...
  const incidentes = hojaIncidentes.getDataRange().getValues();
  const nuevoId = "INC" + String(incidentes.length).padStart(3, "0");

  const fila = [
    nuevoId,
    new Date(),
    idViaje,
    patenteCamion,
    nombreChofer,
    descripcion,
    "abierto",
    Session.getActiveUser().getEmail(),
  ];

  hojaIncidentes.appendRow(fila);

  clearCache("data_Viajes"); // 🔥 ESTA LÍNEA SOLUCIONA TU PROBLEMA
  return "success";
}

function obtenerIndiceColumna(hoja, nombreColumna) {
  const headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  return (
    headers.findIndex(
      (h) => h.trim().toLowerCase() === nombreColumna.toLowerCase()
    ) + 1
  );
}
