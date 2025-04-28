function doGet() {
    return HtmlService.createTemplateFromFile("index")
  
      .evaluate()
  
      .setTitle("Gestion de Flotas");
  }
  
  function obtenerDatosHtml(nombre) {
    return HtmlService.createHtmlOutputFromFile(nombre).getContent();
  }
  
  // Cache para almacenar datos de hojas
const cache = CacheService.getScriptCache();

function getData(sheetName, useCache = true) {
  const cacheKey = `data_${sheetName}`;
  
  // Intentar obtener del cache primero
  if (useCache) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);
  }

  const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
  const sheet = ss.getSheetByName(sheetName);
  const [headers, ...datos] = sheet.getDataRange().getDisplayValues();

  // Filtrar filas vacías
  const filteredData = datos.filter(row => row.some(cell => cell.toString().trim() !== ''));

  const result = { 
    headers: headers || [], 
    datos: filteredData || [],
    lastUpdated: new Date().toISOString()
  };

  // Almacenar en cache por 5 minutos (300 segundos)
  cache.put(cacheKey, JSON.stringify(result), 300);
  
  return result;
}
  
  // Para obtener el nombre de la hoja de forma dinámica, puedes crear una función como esta:
  
  function obtenerNombreHoja(sheetName) {
    const ss = SpreadsheetApp.openById(
      "1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY"
    );
  
    const sheet = ss.getSheetByName(sheetName);
  
    return sheet.getName();
  }
  
  //GENERAR EL ID AUTOAMETICAMENTE DE FLOTA
  
  function generarIdFlota() {
    const ss = SpreadsheetApp.openById(
      "1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY"
    );
  
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
    // Validación robusta
    if (!Array.isArray(registro) || registro.length < 8) {
      throw new Error("Formato de registro inválido");
    }
  
    const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
    const sheet = ss.getSheetByName("Flota");
    
    // Validar patente única
    if (verificarPatenteFlota(registro[2])) {
      throw new Error("La patente ya existe en el sistema");
    }
  
    // Limpiar cache
    cache.remove("data_Flota");
    
    // Insertar con formato
    sheet.appendRow(registro.map(formatCellValue));
    return true;
  }

  function formatCellValue(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(value);
    }
    return value;
  }
  
  function agregarRegistroChofer(registro) {
    const ss = SpreadsheetApp.openById(
      "1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY"
    );
  
    const sheet = ss.getSheetByName("Choferes"); // Asegúrate de que el nombre de tu hoja sea "Choferes"
  
    // Agrega la nueva fila con los datos del registro
  
    sheet.appendRow(registro);
  
    // Puedes agregar aquí lógica adicional si necesitas registrar la fecha de creación
  
    // o realizar otras acciones al agregar un chofer.
  }
  
  function verificarPatenteFlota(patente) {
    const { datos } = getData("Flota");
    return datos.some(row => 
      row[2] && row[2].toString().toUpperCase() === patente.toString().toUpperCase()
    );
  }
  
  //Borrar registro Tabla Flota
  
  function borrarRegistroFlota(idFlota) {
    const ss = SpreadsheetApp.openById(
      "1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY"
    );
  
    const sheet = ss.getSheetByName("Flota");
  
    const data = sheet.getDataRange().getValues();
  
    const idColumnIndex = 0; // Suponiendo que el ID de Flota está en la primera columna (índice 0)
  
    // Empezar desde la segunda fila para omitir los encabezados
  
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColumnIndex] == idFlota) {
        sheet.deleteRow(i + 1); // Los índices de las filas en Sheets son base 1
  
        return "success";
      }
    }
  
    return "error"; // No se encontró el ID
  }
  
  function obtenerRegistroFlota(idFlota) {
    const cacheKey = `flota_${idFlota}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);
  
    const { datos } = getData("Flota", false);
    const registro = datos.find(row => String(row[0]).trim() === String(idFlota).trim());
  
    if (registro) {
      cache.put(cacheKey, JSON.stringify(registro), 300);
      return registro;
    }
    return null;
  }
  
  function actualizarRegistroFlota(registroModificado) {
    try {
      // Verificar que el registro tenga datos
      if (!registroModificado || registroModificado.length === 0) {
        throw new Error("Datos de registro vacíos o inválidos");
      }
  
      // Obtener la hoja de cálculo con manejo de errores
      let ss;
      try {
        ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
      } catch (e) {
        throw new Error("No se pudo acceder a la hoja de cálculo. Verifica el ID y los permisos");
      }
  
      const sheet = ss.getSheetByName("Flota");
      if (!sheet) {
        throw new Error("No se encontró la hoja 'Flota'");
      }
  
      const data = sheet.getDataRange().getValues();
      const idBuscado = String(registroModificado[0]).trim();
      let filaActualizada = false;
  
      // Buscar y actualizar el registro
      for (let i = 1; i < data.length; i++) {
        const idActual = String(data[i][0]).trim();
        
        if (idActual === idBuscado) {
          // Actualizar cada campo excepto creación
          for (let j = 0; j < registroModificado.length; j++) {
            if (j !== 11) { // Asumiendo columna 11 es creación
              sheet.getRange(i+1, j+1).setValue(registroModificado[j]);
            }
          }
          filaActualizada = true;
          break;
        }
      }
  
      if (!filaActualizada) {
        throw new Error("Registro no encontrado en la hoja");
      }
  
      // Limpiar caché si estás usando CacheService
      try {
        const cache = CacheService.getScriptCache();
        cache.remove("data_Flota");
        cache.remove(`flota_${idBuscado}`);
      } catch (e) {
        console.warn("No se pudo limpiar caché:", e);
      }
  
      return "success";
      
    } catch (error) {
      console.error("Error en actualizarRegistroFlota:", error);
      throw error;
    }
  }

function validarFormularioFlota(formId) {
    const form = document.getElementById(formId);
    let isValid = true;

    // Validar campos requeridos
    Array.from(form.querySelectorAll('[required]')).forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });

    return isValid;
}