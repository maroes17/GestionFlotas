function doGet(){
    return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Gestion de Flotas');
}

function obtenerDatosHtml(nombre){
    return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

function getData(sheetName){
    const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
    const sheet = ss.getSheetByName(sheetName);  // Tomamos el nombre de la hoja
    const [headers, ...datos] = sheet.getDataRange().getDisplayValues();

    return {headers, datos}; // Retornamos los datos de la hoja
}