// Copyright (C) 2026 Nikhil
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// map related JS // if anything thing is wrong blame gpt 
let map, marker, accuracyCircle;

let mapVisible = true;
const mapToggleBtn = document.getElementById("map-toggle-btn");
const miniMap = document.getElementById("mini-map");


const FORCED_ZOOM = 16;

const phoneIcon = L.divIcon({
    html: '<i class="fas fa-mobile-alt text-red-500 text-xl"></i>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24]
});

function updateMap(lat, lon, accuracy) {
    if (!map) {
        initMap(lat, lon, accuracy);
        return;
    }

    marker.setLatLng([lat, lon]);
    accuracyCircle.setLatLng([lat, lon]);
    accuracyCircle.setRadius(accuracy || 0);

    map.setView(
        [lat, lon],
        Math.min(FORCED_ZOOM, map.getMaxZoom()),
        { animate: true }
    );
}

function initMap(lat = 0, lon = 0, accuracy = 0) {
    if (map) return;

    map = L.map('mini-map', {
        center: [lat, lon],
        zoom: FORCED_ZOOM,
        minZoom: 1,
        maxZoom: 22,
        zoomControl: false,
    });

    const osm = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
    );

    const satelliteImagery = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 22 }
    );

    const satelliteLabels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 22 }
    );

    const hybrid = L.layerGroup([satelliteImagery, satelliteLabels]);

    hybrid.addTo(map);

    L.control.layers({
        "Street Map": osm,
        "Satellite Only": satelliteImagery,
        "Satellite + Labels": hybrid
    }).addTo(map);

    marker = L.marker([lat, lon], { icon: phoneIcon }).addTo(map);

    accuracyCircle = L.circle([lat, lon], {
        radius: accuracy || 0,
        color: '#3b82f6',
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.2
    }).addTo(map);
}

mapToggleBtn.addEventListener('click', () => {
    mapVisible = !mapVisible;
    miniMap.classList.toggle('hidden', !mapVisible);

    if (mapVisible) {
        setTimeout(() => map.invalidateSize(), 150);
    }
});

const INIT_LAT = 0;
const INIT_LON = 0;
const INIT_ACCURACY = 0;

initMap(INIT_LAT, INIT_LON, INIT_ACCURACY);
