/**
 * Integer randomizer
 * @param {number} max Max value
 * @returns {number} Random integer in [0 ; max[
 */
function randomInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Calculate the distance between two coordinates using the Haversine forumla.
 * @param coords1 First point
 * @param coords2 Second point
 * @returns The distance between the two points
 */
function haversineDistance(coords1, coords2) {
  function toRad(x) {
    return x * Math.PI / 180;
  }

  let lon1 = coords1[0];
  let lat1 = coords1[1];

  let lon2 = coords2[0];
  let lat2 = coords2[1];

  const R = 6371; // radius of the Earth in km
  let x1 = lat2 - lat1;
  let dLat = toRad(x1);
  let x2 = lon2 - lon1;
  let dLon = toRad(x2)
  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return d * 1000; // distance in meters
}

let params = new URLSearchParams(window.location.search);
let index;
let coords;
let pickcoords = [0, 0];
let interval;
const timer = new Timer();

var map = L.map('map', {zoomControl: false}).setView([51.601, 5.345], 6);
L.tileLayer('https://tile.tracestrack.com/fr/{z}/{x}/{y}.png?key=8c4267e8a3026ab8626b0ef7a7886842', {
  minZoom: 5,
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var marker = L.icon({
  iconUrl: 'assets/marker.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

var resmarker = L.icon({
  iconUrl: 'assets/res_marker.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

L.geoJSON(benelux.features[0], {
  style: function (feature) {
    return {color: '#454647', weight: 1.5, dashArray: "5, 5", interactive: false, fillOpacity: 0};
  }
}).addTo(map);

const resizeObserver = new ResizeObserver(() => {
  map.invalidateSize();
});

resizeObserver.observe(document.getElementById("map"));

let mrk = L.marker([-200, -200], {
  icon: marker
}).addTo(map);

let resmrk = L.marker([-200, -200], {
  icon: resmarker
}).addTo(map);

let resline;

function hardcore() {
  $('#hardcorePane').toggle();
  $('#hardcoreInfo').html("");

  timer.start();
  timerLoop();

  setTimeout(() => {
    timer.stop();
    clearInterval(interval);
    $('#iframePane').toggle(500);
    $('#hardcorePane').toggle(500);
    $('#hardcorePane').css("z-index", 1)
    $('#hardcoreInfo').html("Time is up!");
    $('#restart').toggle(500);
  }, 10000)
}

function timerLoop() {
  $('#textBox').html("0.0s");
  interval = setInterval(() => {
    const time = (timer.getTime() / 1000).toFixed(1);
    $('#textBox').html(`${time}s`);
  }, 50);
}

function start() {
  index = randomInt(Object.keys(spawns).length);
  coords = spawns[index];

  $('#iframePane').html(`<iframe frameborder="0" id="panoramas" loading="lazy"
          src="https://www.google.com/maps/embed/v1/streetview?location=${coords[0]}%2C${coords[1]}&key=AIzaSyA2Qq9tiWUtSdlkiBJov0EMgRDPTEMKJHw&fov=90&heading=0"></iframe>
  `);

  if (params.has("m", "h")) {
    $('#hardcorePane').toggle();
    $('#hardcoreInfo').html(`<button id="hardcoreStart" onclick="hardcore()">
      Start
    </button><br>
    <button id="noHardcore" onclick="window.location.href = 'play.html?m=c'">
      Return to classic mode
    </button>`);
  } else {
    timer.start();
    timerLoop();
  }

  map.on('click', function (e) {
    mrk.setLatLng(e.latlng);
    pickcoords = [e.latlng.lat.toFixed(7), e.latlng.lng.toFixed(7)];
  });
}

start();

function restart() {
  $('#iframePane').html("Chargement...");
  $('#iframePane').html(`<iframe frameborder="0" id="panoramas" loading="lazy"
          src="https://www.google.com/maps/embed/v1/streetview?location=${coords[0]}%2C${coords[1]}&key=AIzaSyA2Qq9tiWUtSdlkiBJov0EMgRDPTEMKJHw&fov=90&language=ru&heading=0"></iframe>
`);
}

function guess() {
  if (pickcoords[0] + pickcoords[1] === 0) return;
  clearInterval(interval);
  timer.stop();
  $("#map").css({"height": "100%", "width": "100%", right: 0, bottom: 0, cursor: "grab"});

  setTimeout(() => {
    map.flyTo(coords, 13);
  }, 500)
  let dist = haversineDistance(coords, pickcoords);
  if (dist < 1000) {
    dist = Math.floor(dist) + " meters";
  } else if (dist < 10000) {
    dist = Math.floor(dist / 10000) * 10 + " km";
  } else {
    dist = Math.floor(dist / 1000) + " km";
  }

  resmrk.setLatLng(coords);
  resline = L.polyline([coords, pickcoords], {color: '#2c3738', weight: 3, interactive: false}).addTo(map);
  map.off('click');
  $('#textBox').html(`You were <span style="font-size: 110%">${dist}</span> away from the real location, in ${(timer.getTime() / 1000).toFixed(1)}s !<br><span></span>`);
  $('#restart').toggle();
  $('#guess').toggle();
  $('#next').toggle();
}

function next() {
  timer.reset();
  if (params.has("m", "h")) {
    $('#iframePane').toggle();
    $('#hardcorePane').removeAttr("style");
    $('#hardcoreInfo').html("");
    $('#restart').toggle();
  }
  $('#map').removeAttr("style");
  $('#textBox').html("");
  $('#restart').toggle();
  $('#guess').toggle();
  $('#next').toggle();
  mrk.setLatLng([-200, -200]);
  resmrk.setLatLng([-200, -200]);
  resline.removeFrom(map);
  pickcoords = [0, 0];
  setTimeout(() => {
    map.flyTo([51.601, 5.345], 6);
  }, 500)
  start();
}

function maptoggle() {
  $('#map').toggle();
}
