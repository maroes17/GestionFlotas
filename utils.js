// utils.gs
/**
 * Obtiene una instancia de la hoja de cálculo.
 */
function getSpreadsheet() {
    return SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
  }
  
  /**
   * Obtiene una hoja específica por nombre.
   * @param {string} sheetName 
   */
  function getSheet(sheetName) {
    const ss = getSpreadsheet();
    return ss.getSheetByName(sheetName);
  }
  
  /**
   * Manejo de cache script
   */
  function getCache() {
    return CacheService.getScriptCache();
  }
  
  /**
   * Limpia el cache de una key
   */
  function clearCache(key) {
    const cache = getCache();
    cache.remove(key);
  }
  
  /**
   * Guarda un objeto en cache
   */
  function setCache(key, value, seconds = 300) {
    const cache = getCache();
    cache.put(key, JSON.stringify(value), seconds);
  }
  
  /**
   * Obtiene un objeto desde el cache
   */
  function getFromCache(key) {
    const cache = getCache();
    const data = cache.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  /**
   * Valida si un valor es una fecha
   */
  function parseDate(value) {
    if (value === null || value === undefined) {
      return ""; // 🔵 Si es nulo, devolver texto vacío
    }
  
    if (typeof value === "string" && value.includes("/")) {
      const parts = value.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
  
    return value.toString(); // Si no es fecha, devuelve texto
  }
  