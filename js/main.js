let params = new URLSearchParams(window.location.search);
let coords;
let pickcoords = [0, 0];
let interval;
const timer = new Timer();
let txt;
let maplanguage;
let strings;
let benelux;
let belgium;
let netherlands;
let luxembourg;

if (localStorage.getItem("bnlg-data") == null) {
  let da = {
    "score": 0,
    "scoreHardcore": 0,
    "bestDist": null,
    "bestTime": null,
    "bestDistHardcore": null,
    "bestTimeHardcore": null,
    "playtime": 0,
    "nbGames": 0
  }
  localStorage.setItem("bnlg-data", JSON.stringify(da))
}

switch (params.get("hl")) {
  case "fr":
    maplanguage = "fr";
    break;
  case "lu":
    maplanguage = "_";
    break;
  case "nl":
    maplanguage = "nl";
    break;
  default:
    maplanguage = "en";
    break;
}

$("#titlelink").attr("href", "index.html?hl=" + (maplanguage === "_" ? "lu" : maplanguage));
$("html").attr("lang", maplanguage === "_" ? "lu" : maplanguage);

var map = L.map('map', {zoomControl: false}).setView([51.601, 5.345], 6);
const MAIN_TILE_URL = `https://tile.tracestrack.com/${maplanguage}/{z}/{x}/{y}.png?key=8c4267e8a3026ab8626b0ef7a7886842`;
const FALLBACK_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

let mapLayer = L.tileLayer(MAIN_TILE_URL, {
  minZoom: 5,
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

function handleTileError(evt) {
  if (evt.tile._hasError) return;

  let si = Math.floor((Math.random() * 3));
  let tileSrc = FALLBACK_TILE_URL.replace(/{s}/g, 'abc'.substring(si, si + 1));
  tileSrc = tileSrc.replace(/{x}/g, evt.coords.x);
  tileSrc = tileSrc.replace(/{y}/g, evt.coords.y);
  tileSrc = tileSrc.replace(/{z}/g, evt.coords.z);
  evt.tile._hasError = true;
  evt.tile.src = tileSrc;
}

mapLayer.on('tileerror', handleTileError);

const marker = L.icon({
  iconUrl: 'assets/img/marker.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

const resmarker = L.icon({
  iconUrl: 'assets/img/res_marker.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

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

init();

async function init() {
  await $.getJSON('../assets/strings.json', function (data) {
    strings = data;
  });

  await $.getJSON('../assets/bounds/belgium.json', function (data) {
    belgium = data;
  });

  await $.getJSON('../assets/bounds/netherlands.json', function (data) {
    netherlands = data;
  });

  await $.getJSON('../assets/bounds/luxembourg.json', function (data) {
    luxembourg = data;
  });

  await $.getJSON('../assets/bounds/benelux.json', function (data) {
    benelux = data;
  });

  switch (params.get("hl")) {
    case "fr":
      txt = strings.FR;
      break;
    case "lu":
      txt = strings.LU;
      break;
    case "nl":
      txt = strings.NL;
      break;
    default:
      txt = strings.EN;
      break;
  }

  L.geoJSON(benelux.features[0], {
    style: function () {
      return {color: '#454647', weight: 1.5, dashArray: "5, 5", interactive: false, fillOpacity: 0};
    }
  }).addTo(map);

  $("#restart").html(txt.return_start)
  $("#guess").html(txt.guess)
  $("#next").html(txt.next)
  $("#closeStats").html(txt.close);

  start();
}

function hardcore() {
  $('#hardcorePane').toggle();
  $('#hardcoreInfo').html("");

  timer.start();
  timerLoop();

  setTimeout(() => {
    timer.stop();
    clearInterval(interval);
    $('#iframePane, #hardcorePane').toggle(500);
    $('#hardcorePane').css("z-index", 1)
    $('#hardcoreInfo').html(txt.time_up);
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

async function start() {
  let country = getRandCountry();
  coords = await getSpawn(country === "netherlands" ? netherlands : (country === "belgium" ? belgium : luxembourg), country);

  $('#iframePane').html(`<iframe frameborder="0" id="panoramas" loading="lazy"
          src="https://www.google.com/maps/embed/v1/streetview?location=${coords[0]}%2C${coords[1]}&key=AIzaSyA2Qq9tiWUtSdlkiBJov0EMgRDPTEMKJHw&fov=90&heading=0"></iframe>
  `);

  if (params.get("m") === "h") {
    $('#hardcorePane').toggle();
    $('#hardcoreInfo').html(`<button id="hardcoreStart" onclick="hardcore()">
      ${txt.start}
    </button><br>
    <button id="noHardcore" onclick="window.location.href = 'play.html?m=c'">
      ${txt.return_classic}
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

function restart() {
  $('#iframePane').html(txt.loading);
  $('#iframePane').html(`<iframe frameborder="0" id="panoramas" loading="lazy"
          src="https://www.google.com/maps/embed/v1/streetview?location=${coords[0]}%2C${coords[1]}&key=AIzaSyA2Qq9tiWUtSdlkiBJov0EMgRDPTEMKJHw&fov=90&heading=0"></iframe>
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

  let sc = calcScore(dist);
  let str = JSON.parse(localStorage.getItem("bnlg-data"));
  if (params.get("m") === "h") {
    str.scoreHardcore += sc;

    if (str.bestDistHardcore == null || dist < str.bestDistHardcore) {
      str.bestDistHardcore = dist;
      str.bestTimeHardcore = timer.getTime();
    }
  } else {
    str.score += sc;

    if (str.bestDist == null || dist < str.bestDist) {
      str.bestDist = dist;
      str.bestTime = timer.getTime();
    }
  }

  str.nbGames += 1;
  str.playtime += timer.getTime();

  localStorage.setItem("bnlg-data", JSON.stringify(str));

  resmrk.setLatLng(coords);
  resline = L.polyline([coords, pickcoords], {color: '#2c3738', weight: 3, interactive: false}).addTo(map);
  map.off('click');
  let resultstr = txt.results;
  resultstr = resultstr.replace("\${dist}", distFormat(dist));
  resultstr = resultstr.replace("\${timer}", (timer.getTime() / 1000).toFixed(1));
  $('#textBox').html(resultstr);
  $('#textBox span + br + span').html(txt.score + sc);
  $('#restart, #guess, #next').toggle();
}

function next() {
  timer.reset();
  if (params.get("m") === "h") {
    $('#iframePane').toggle();
    $('#hardcorePane').removeAttr("style");
    $('#hardcoreInfo').html("");
    $('#restart').toggle();
  }
  $('#map').removeAttr("style");
  $('#textBox').html("");
  $('#restart, #guess, #next').toggle();
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

function statstoggle() {
  $('#statsWindow').toggle();
  $('#hardcorePane').toggle();

  let str = JSON.parse(localStorage.getItem("bnlg-data"));
  $('#statsContent').html(`<span class="statTitle">${txt.stats}</span><br><br>
    ${txt.nbgames} <span class="statNumber">${str.nbGames}</span><br>
    ${txt.scorec} <span class="statNumber">${str.score}</span><br>
    ${txt.scoreh} <span class="statNumber">${str.scoreHardcore}</span><br>
    ${txt.bestc} <span class="statNumber">${str.bestDist == null ? txt.none : distFormat(str.bestDist) + " (" + (str.bestTime / 1000).toFixed(1) + "s)"}</span><br>
    ${txt.besth} <span class="statNumber">${str.bestDistHardcore == null ? txt.none : distFormat(str.bestDistHardcore) + " (" + (str.bestTimeHardcore / 1000).toFixed(1) + "s)"}</span><br>
    ${txt.playtime} <span class="statNumber">${msToTime(str.playtime)}</span><br>
  `);
}
