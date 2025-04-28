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
    if (value instanceof Date) {
      // Formatea como dd-mm-yyyy
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = value.getFullYear();
      return `${day}-${month}-${year}`;
    }
    if (typeof value === 'string') {
      // Si ya viene como string yyyy-mm-dd, lo reordeno a dd-mm-yyyy
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = value.split("-");
        return `${day}-${month}-${year}`;
      }
      // Si viene como dd/mm/yyyy (Google Forms típico), lo limpio igual
      if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = value.split("/");
        return `${day}-${month}-${year}`;
      }
    }
    return value;
  }
  