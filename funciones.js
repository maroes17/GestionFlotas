function doGet(){
    return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Gestion de Flotas');
}

function obtenerDatosHtml(nombre){
    return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

function getData(){
    const ss = SpreadsheetApp.openById("1RqztNinU7VGagy8P2wrTLqtXsXLr1W-Dlo_72c5OxiY");
    const sheet = ss.getSheetByName('Flota');
    const [headers, ...datos] = sheet.getDataRange().getDisplayValues();

    // console.log({headers,datos});

    return {headers,datos};
}