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
).setView([54.9974, -1.457], 19);

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
