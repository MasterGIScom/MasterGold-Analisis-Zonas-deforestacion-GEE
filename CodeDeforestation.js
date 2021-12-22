//Link: https://code.earthengine.google.com/c6495964e168c3a08b259dc99df4e0ea
//======== Analisis de zonas de deforestacion ================

//Definir area de trabajo 
Map.addLayer(cuencas);
var cuen_aguay = cuencas.filter(ee.Filter.eq('NOMBRE','Cuenca Aguaytia'));


//Cambio forestal a nivel global
var GFC = ee.Image("UMD/hansen/global_forest_change_2020_v1_8").clip(cuen_aguay);

//Cobertura forestal 'treecover2000'
var treecoverParam ={
  bands: ['treecover2000'], 
  min:0,
  max: 100, 
  palette: ['black', 'green']
};

Map.addLayer(GFC, treecoverParam, 'cubiertaForestal');

//Perdida de covertura forestal 'lossyear'
var treeLossVisParam = {
  bands: ['lossyear'], 
  min: 0,
  max: 20, 
  palette: ['yellow', 'red']
};

Map.addLayer(GFC, treeLossVisParam, 'Perdida total por año');

//Perdida de cobertura forestal hasta el 2019
var losscover2019 = GFC.select('lossyear').eq(19);
var L19 = losscover2019.mask(losscover2019);
var Vloss19 = {
  opacity:1,
  bands:["lossyear"],
  palette:["23ffff", "ff1212"]};

Map.addLayer(losscover2019,Vloss19,'Perdida hasta 2019');
Map.addLayer(L19,{"palette":["ff1212"]},'Perdida Solo 2019');
Map.addLayer(cuen_aguay, {color:'red'}, 'Aguaytia', false)

//Calculo de area de deforestacion en el año 2019 (HA)
var area_pixel = losscover2019.multiply(ee.Image.pixelArea())
                 .reduceRegion(ee.Reducer.sum(),cuen_aguay,30,null,null,false,1e13)
                 .get('lossyear');

var Area_ha = ee.Number(area_pixel).divide(10000);

print ('Área en (ha) para el 2019',Area_ha);

//Grafico de perdida forestal en la cuenca aguaytia 

var lossImage = GFC.select(['loss']);
var lossAreaImage = lossImage.multiply(ee.Image.pixelArea());
var lossYear = GFC.select(['lossyear']);
var lossByYear = lossAreaImage.addBands(lossYear).reduceRegion({
       reducer: ee.Reducer.sum().group({
        groupField: 1
        }),
       geometry: cuen_aguay,
       scale: 30,
       maxPixels: 1e9
});

print(lossByYear);

var statsFormatted = ee.List(lossByYear.get('groups'))
 .map(function(el) {
  var d = ee.Dictionary(el);
  return [ee.Number(d.get('group')).format("20%02d"), d.get('sum')];
 });

var statsDictionary = ee.Dictionary(statsFormatted.flatten());

print(statsDictionary);

//Grafico 
var chart = ui.Chart.array.values({
   array: statsDictionary.values(),
   axis: 0,
   xLabels: statsDictionary.keys()
}).setChartType('ColumnChart').setOptions({
  title: 'Pérdida anual de bosques',
  hAxis: {title: 'Año', format: '####'},
  vAxis: {title: 'Area (m2)'},
  legend: { position: "none" },
  lineWidth: 1,
  pointSize: 3
 });

print(chart);
