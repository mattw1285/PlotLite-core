const home = [54.99768, -1.45737]
const map = L.map(
    'map',
    {
        zoomControl: false,
        maxBounds: [
            [-85.05, -180],
            [85.05, 180]
        ],
        maxBoundsViscosity: 1.0
    }
).setView(home, 19);

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19,
        minZoom: 3,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'     
    }
).addTo(map);

L.control.zoom({
    position: 'bottomright'
}).addTo(map);

const marker = L.marker(home).addTo(map);

marker.bindPopup(
    "<p align='center'>Hello and welcome to the sunny sights. </br>My home is in North Shields.</p>"
).openPopup();