import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

import { GeoSearchControl, PhotonProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow
})

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

const url = 'https://raw.githubusercontent.com/mattw1285/PlotLite/main/assets/output.geojson';
const response = await fetch(url);
const dno = await response.json();

var myLayer = L.geoJSON(dno).addTo(map);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);


const drawControl = new L.Control.Draw({
    position: 'topleft',
    edit: {
        featureGroup: drawnItems
    },
    draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: true,
        marker: true,
        circlemarker: false
    }
});

map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    drawnItems.addLayer(layer);
});

const biasLat = home[0];
const biasLon = home[1];
const provider = new PhotonProvider({
    params: {
        lat: biasLat,
        lon: biasLon,
        limit: 5
    }
});
map.on('moveend', () => {
  const center = map.getCenter();
  provider.options.params.lat = center.lat;
  provider.options.params.lon = center.lng;
});
const searchControl = new GeoSearchControl({
    provider: provider,
    style: 'button',
    keepResult: true,
    searchLabel: 'Search Address...',
    showMarker: true
});
map.addControl(searchControl);
