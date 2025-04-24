function doGet(){
    return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Gestion de Flotas');
}

function obtenerDatosHtml(nombre){
    return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}