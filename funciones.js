// funciones.gs

function doGet() {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("Gestión de Flotas");
}

function obtenerDatosHtml(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

function getData(sheetName, useCache = false) {
  if (sheetName === "Viajes") {
    verificarEstadosDeTodosLosViajes();
    Utilities.sleep(500);
  }

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
  console.log("🟢 Datos recibidos para Viajes:", result);
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
  const hoja = getSheet(nombreHoja);
  const datos = hoja.getDataRange().getValues();
  const id = registroModificado[0];

  for (let i = 1; i < datos.length; i++) {
    if (String(datos[i][0]) === String(id)) {
      hoja.getRange(i + 1, 1, 1, registroModificado.length).setValues([registroModificado]);
      clearCache(cacheKey);
      return "success";
    }
  }
  return "not found";
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

function generarIdViaje() {
  const hoja = getSheet("Viajes");
  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) return 1;

  const datos = hoja.getRange(2, 1, ultimaFila - 1).getValues();
  const numeros = datos
    .map((row) => {
      const id = row[0];
      const match = typeof id === "string" && id.match(/^V(\d+)$/);
      return match ? parseInt(match[1]) : null;
    })
    .filter((num) => !isNaN(num));

  const max = Math.max(...numeros, 0);
  return max + 1;
}

function agregarRegistroViaje(registro) {
  if (!Array.isArray(registro) || registro.length < 12) {
    throw new Error("Registro inválido para Viaje");
  }

  const id = "V" + generarIdViaje().toString().padStart(3, "0");
  registro[0] = id;

  const hoja = getSheet("Viajes");
  hoja.appendRow(registro);

  clearCache("data_Viajes");
  return true;
}

function obtenerRegistroViaje(idViaje) {
  const { datos } = getData("Viajes", false);
  return (
    datos.find((row) => String(row[0]).trim() === String(idViaje).trim()) ||
    null
  );
}

function actualizarRegistroViaje(registroModificado) {
  return actualizarRegistroEnHoja("Viajes", registroModificado, "data_Viajes");
}

function borrarRegistroViaje(idViaje) {
  return borrarRegistroEnHoja("Viajes", idViaje, "data_Viajes");
}

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
  const estado = "Abierto";
  const usuario = Session.getActiveUser().getEmail(); // Asegúrate de que tienes permisos

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

function buscarChoferPorNombre(nombre) {
  const hoja = getSheet("Choferes");
  const datos = hoja.getDataRange().getValues();
  return (
    datos.find((row) => String(row[1]).trim() === String(nombre).trim()) || null
  );
}

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

  const nombreChofer = viaje[8];
  let patenteCamion = "";

  const choferes = hojaChoferes.getDataRange().getValues();
  const chofer = choferes.find((row) => row[1] === nombreChofer);
  if (chofer) {
    patenteCamion = chofer[10] || "";
  }

  const rowIndexViaje = viajes.findIndex(
    (row) => String(row[0]).trim() === String(idViaje).trim()
  );
  if (rowIndexViaje !== -1) {
    const colEstado = obtenerIndiceColumna(hojaViajes, "Estado");
    hojaViajes.getRange(rowIndexViaje + 1, colEstado).setValue("en mantención");
  }

  if (patenteCamion) {
    const flota = hojaFlota.getDataRange().getValues();
    const rowIndexFlota = flota.findIndex((row) => row[2] === patenteCamion);
    if (rowIndexFlota !== -1) {
      const colEstadoFlota = obtenerIndiceColumna(hojaFlota, "Estado");
      hojaFlota
        .getRange(rowIndexFlota + 1, colEstadoFlota)
        .setValue("mantención");
    }
  }

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
  clearCache("data_Viajes");
  return "success";
}

function registrarIncidente(data) {
  try {
    const hoja = getSheet("Incidentes");
    if (!hoja) throw new Error("Hoja 'Incidentes' no encontrada");

    const idNuevo = generarIdIncidente();
    const fila = [
      idNuevo,
      data.fecha,
      data.idViaje,
      data.patente,
      data.chofer,
      data.tipo,
      data.descripcion,
      "Abierto",
      data.reportadoPor,
      "",
      "",
    ];

    hoja.appendRow(fila);

    clearCache("data_Incidentes");
    clearCache("data_Viajes");

    verificarEstadoViaje(data.idViaje);

    return "success";
  } catch (error) {
    throw new Error("Error al guardar incidente: " + error.message);
  }
}

function verificarEstadoViaje(idViaje) {
  const hojaIncidentes = getSheet("Incidentes");
  const incidentes = hojaIncidentes.getDataRange().getValues();
  const hojaViajes = getSheet("Viajes");
  const viajes = hojaViajes.getDataRange().getValues();

  const headers = viajes[0];
  const colId = headers.indexOf("ID Viaje");
  const colEstado = headers.indexOf("Estado");
  const colFechaLlegada = headers.indexOf("Fecha Llegada");

  for (let i = 1; i < viajes.length; i++) {
    if (String(viajes[i][colId]) === String(idViaje)) {
      // Filtra incidentes abiertos para este viaje
      const abiertos = incidentes.filter(
        (row) => String(row[2]) === String(idViaje) && (row[7] || "").toLowerCase() === "abierto"
      );
      let nuevoEstado;
      if (abiertos.length > 0) {
        nuevoEstado = "mantención";
      } else if (viajes[i][colFechaLlegada] && String(viajes[i][colFechaLlegada]).trim() !== "") {
        nuevoEstado = "realizado";
      } else {
        nuevoEstado = "en ruta";
      }
      hojaViajes.getRange(i + 1, colEstado + 1).setValue(nuevoEstado);
      break;
    }
  }
}

function marcarIncidenteSolucionado(datos) {
  try {
    const hoja = getSheet("Incidentes");
    const data = hoja.getDataRange().getValues();
    const headers = data[0].map(h => h.trim());
    const idxId = headers.indexOf("ID Incidente");
    const idxEstado = headers.indexOf("Estado");
    const idxFechaSol = headers.indexOf("Fecha Solución");
    const idxObsSol = headers.indexOf("Observación Solución");

    let encontrado = false;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idxId]) === String(datos.idIncidente)) {
        hoja.getRange(i + 1, idxEstado + 1).setValue("Resuelto");
        hoja.getRange(i + 1, idxFechaSol + 1).setValue(datos.fechaSolucion);
        hoja.getRange(i + 1, idxObsSol + 1).setValue(datos.observacion);
        encontrado = true;
        break;
      }
    }

    if (!encontrado) {
      return { exito: false, mensaje: "Incidente no encontrado" };
    }

    // Actualiza el estado del viaje si corresponde
    actualizarEstadoViajeSiNecesario(datos.idViaje);

    return { exito: true, mensaje: "Incidente solucionado correctamente" };
  } catch (e) {
    return { exito: false, mensaje: e.message };
  }
}

function generarIdUnico(prefix = "") {
  const timestamp = new Date().getTime();
  return `${prefix}${timestamp}`;
}

function obtenerIndiceColumna(hoja, nombreColumna) {
  const headers = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  return (
    headers.findIndex(
      (h) => h.trim().toLowerCase() === nombreColumna.toLowerCase()
    ) + 1
  );
}

// Esta función ya existe en tu código - solo verifica que coincida
function obtenerIncidentesPorViaje(idViaje) {
  try {
    const sheet = getSheet("Incidentes");
    const data = sheet.getDataRange().getDisplayValues();

    if (data.length < 2) return [];

    const headers = data[0].map((h) => h.trim());
    const rows = data.slice(1);

    // Índices basados en tus headers reales
    const columnas = {
      id: headers.indexOf("ID Incidente"),
      fecha: headers.indexOf("Fecha"),
      idViaje: headers.indexOf("ID Viaje"),
      patente: headers.indexOf("Patente"),
      chofer: headers.indexOf("Chofer"),
      tipo: headers.indexOf("Tipo"),
      descripcion: headers.indexOf("Descripción"),
      estado: headers.indexOf("Estado"),
      reportadoPor: headers.indexOf("Reportado por"),
    };

    // Verificar que todas las columnas existan
    if (Object.values(columnas).some((index) => index === -1)) {
      console.error("Error en índices de columnas:", columnas);
      return [];
    }

    return rows
      .filter(
        (row) =>
          row[columnas.idViaje] &&
          row[columnas.idViaje].toString().trim() === idViaje.toString().trim()
      )
      .map((row) => ({
        id: row[columnas.id] || "",
        fecha: row[columnas.fecha] || "",
        idViaje: row[columnas.idViaje] || "",
        patente: row[columnas.patente] || "",
        chofer: row[columnas.chofer] || "",
        tipo: row[columnas.tipo] || "",
        descripcion: row[columnas.descripcion] || "",
        estado: row[columnas.estado] || "",
        reportadoPor: row[columnas.reportadoPor] || "",
      }));
  } catch (e) {
    console.error("Error en obtenerIncidentesPorViaje:", e);
    return [];
  }
}

// Función auxiliar para formato de fecha
function formatDateForDisplay(dateValue) {
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue);
    return isNaN(date) ? dateValue : date.toISOString().split("T")[0];
  } catch {
    return dateValue;
  }
}

function testObtenerIncidentes() {
  const testId = "V001";
  console.log("🔍 Testeando con ID:", testId);

  const sheet = getSheet("Incidentes");
  const data = sheet.getDataRange().getDisplayValues();
  console.log("📜 Headers reales:", data[0]);

  const resultados = obtenerIncidentesPorViaje(testId);
  console.log("✅ Resultados del test:", JSON.stringify(resultados, null, 2));

  // Verificar coincidencias exactas
  const idViajeCol = data[0].indexOf("ID Viaje");
  if (idViajeCol !== -1) {
    console.log(
      "🔎 Coincidencias encontradas en filas:",
      data
        .slice(1)
        .map((row, i) => (row[idViajeCol] === testId ? `Fila ${i + 2}` : null))
        .filter(Boolean)
    );
  }

  return resultados;
}

function testIncidentes() {
  const resultado = obtenerIncidentesPorViaje("V001");
  console.log("✅ Resultado final:", JSON.stringify(resultado, null, 2));
  return resultado;
}

function getSheetHeaders(sheetName) {
  const sheet = getSheet(sheetName);
  return sheet.getDataRange().getDisplayValues()[0];
}

function marcarIncidenteResuelto(datos) {
  const hoja = getSheet("Incidentes");
  const data = hoja.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(datos.idIncidente)) {
      hoja.getRange(i + 1, 8).setValue("Resuelto");
      hoja.getRange(i + 1, 10).setValue(datos.fechaSolucion);
      hoja.getRange(i + 1, 11).setValue(datos.observacion);

      // ✅ Verificación correcta del estado del viaje
      actualizarEstadoViajeSiNecesario(data[i][2]);
      break;
    }
  }
}

// Función para actualizar estado del viaje si todos los incidentes están resueltos
function actualizarEstadoViajeSiNecesario(idViaje) {
  const hojaIncidentes = getSheet("Incidentes");
  const hojaViajes = getSheet("Viajes");

  // Obtener todos los incidentes del viaje
  const incidentes = obtenerIncidentesPorViaje(idViaje);
  const todosResueltos =
    incidentes.length > 0 &&
    incidentes.every((inc) => (inc.estado || '').toString().trim().toLowerCase() === "resuelto");

  if (!todosResueltos) return false;

  // Actualizar estado en hoja Viajes
  const datosViajes = hojaViajes.getDataRange().getValues();
  const headers = datosViajes[0];
  const idxId = headers.indexOf("ID Viaje");
  const idxEstado = headers.indexOf("Estado");

  for (let i = 1; i < datosViajes.length; i++) {
    if (String(datosViajes[i][idxId]) === String(idViaje)) {
      hojaViajes.getRange(i + 1, idxEstado + 1).setValue("En ruta");
      return true;
    }
  }

  return false;
}

/**
 * Obtiene el estado actual de un viaje específico
 * @param {string} idViaje - ID del viaje a consultar
 * @returns {string} Estado del viaje (ej: "Mantención", "En ruta")
 */
function obtenerEstadoViaje(idViaje) {
  try {
    const sheet = getSheet("Viajes");
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map((h) => h.trim()); // Limpia espacios en los headers

    // Usa los nombres exactos de tus columnas
    const idCol = headers.indexOf("ID Viaje"); // Ajustado a tu nombre real
    const estadoCol = headers.indexOf("Estado"); // Asegúrate que coincida exactamente

    if (idCol === -1) throw new Error("Columna 'ID Viaje' no encontrada");
    if (estadoCol === -1) throw new Error("Columna 'Estado' no encontrada");

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === idViaje) {
        return data[i][estadoCol].toString();
      }
    }

    throw new Error(`Viaje con ID ${idViaje} no encontrado`);
  } catch (e) {
    console.error("Error en obtenerEstadoViaje:", e);
    throw e;
  }
}

function verificarEstadosDeTodosLosViajes() {
  var hojaViajes = getSheet("Viajes");
  var hojaIncidentes = getSheet("Incidentes");

  var datosViajes = hojaViajes.getDataRange().getValues();
  var datosIncidentes = hojaIncidentes.getDataRange().getValues();

  var headerViajes = datosViajes[0];
  var headerIncidentes = datosIncidentes[0];

  var idxIdViaje = headerViajes.indexOf("ID Viaje");
  var idxEstadoViaje = headerViajes.indexOf("Estado");
  var idxIdViajeInc = headerIncidentes.indexOf("ID Viaje");
  var idxEstadoInc = headerIncidentes.indexOf("Estado");

  for (var i = 1; i < datosViajes.length; i++) {
    var idViaje = datosViajes[i][idxIdViaje];
    var incidentesAbiertos = datosIncidentes.slice(1).filter(function(inc) {
      // Compara insensible a mayúsculas/minúsculas y elimina espacios
      return inc[idxIdViajeInc] === idViaje &&
        (inc[idxEstadoInc] || "").toString().trim().toLowerCase() !== "resuelto";
    });
    var nuevoEstado = "en ruta";
    if (incidentesAbiertos.length > 0) {
      nuevoEstado = "mantención";
    } else if (datosViajes[i][idxEstadoViaje] === "realizado") {
      nuevoEstado = "realizado";
    }
    if (datosViajes[i][idxEstadoViaje] !== nuevoEstado) {
      hojaViajes.getRange(i + 1, idxEstadoViaje + 1).setValue(nuevoEstado);
    }
  }
}
