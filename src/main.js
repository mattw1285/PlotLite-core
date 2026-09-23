const map = L.map('map').setView([54.5,-2.5],6);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{y}/{x},png',
    {
        maxZoom:19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'     
    }
).addTo(map);

map.pm.addControls({
  position:'topleft',
  drawMarker:true,
  drawPolyline:true,
  drawPolygon:true,
  drawRectangle:true,
  drawCircle:false,
  drawCircleMarker:false,
  drawText:false,
  editMode:true,
  dragMode:true,
  cutPolygon:false,
  removalMode:true,
  rotateMode:false
});

map.getContainer().style.height = "500px";
