var listMap = L.map('mapList', {zoomControl: false}).setView([51.601, 5.345], 6);
L.tileLayer('https://tile.tracestrack.com/en/{z}/{x}/{y}.png?key=8c4267e8a3026ab8626b0ef7a7886842', {
  minZoom: 5,
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(listMap);

var resmarker = L.icon({
  iconUrl: 'assets/res_marker.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});


L.geoJSON(benelux.features[0], {
  style: function (feature) {
    return {color: '#454647', weight: 1.5, dashArray: "5, 5", interactive: false, fillOpacity: 0};
  }
}).addTo(listMap);

for (let i in spawns) {
  L.marker(spawns[i], {
    icon: resmarker
  }).addTo(listMap);
}
