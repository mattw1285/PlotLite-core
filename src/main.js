const map = L.map('main').setView([54.5,-2.5],6);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{y}/{x}',
    {
        maxZoom:19,
        attribution:'Tiles &copy; OpenStreetMap'
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
