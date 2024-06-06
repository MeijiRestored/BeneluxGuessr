let params = new URLSearchParams(window.location.search);
let maxrand = Object.keys(spawns).length;
let index;
let coords;
let pickcoords = [0, 0];
let interval;
const timer = new Timer();
let txt;
let maplanguage;

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

if (params.get("hl") === "fr") {
  txt = strings.FR;
  maplanguage = "fr";
} else if (params.get("hl") === "lu") {
  txt = strings.LU;
  maplanguage = "_";
} else if (params.get("hl") === "nl") {
  txt = strings.NL;
  maplanguage = "nl";
} else {
  txt = strings.EN;
  maplanguage = "en";
}

$("#titlelink").attr("href", "index.html?hl=" + (maplanguage === "_" ? "lu" : maplanguage));
$("html").attr("lang", maplanguage === "_" ? "lu" : maplanguage);

var map = L.map('map', {zoomControl: false}).setView([51.601, 5.345], 6);

L.tileLayer(`https://tile.tracestrack.com/${maplanguage}/{z}/{x}/{y}.png?key=8c4267e8a3026ab8626b0ef7a7886842`, {
  minZoom: 5,
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const marker = L.icon({
  iconUrl: 'assets/marker.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

const resmarker = L.icon({
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

$("#restart").html(txt.return_start)
$("#guess").html(txt.guess)
$("#next").html(txt.next)
$("#closeStats").html(txt.close);

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

function start() {
  index = randomInt(maxrand);
  coords = spawns[index];

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

start();

function restart() {
  $('#iframePane').html(txt.loading);
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
  $('#restart').toggle();
  $('#guess').toggle();
  $('#next').toggle();
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

function statstoggle() {
  $('#statsWindow').toggle();
  $('#hardcorePane').toggle();

  let str = JSON.parse(localStorage.getItem("bnlg-data"));
  $('#statsContent').html(`<span>${txt.stats}</span><br><br>
    ${txt.nbgames} ${str.nbGames}<br>
    ${txt.scorec} ${str.score}<br>
    ${txt.scoreh} ${str.scoreHardcore}<br>
    ${txt.bestc} ${str.bestDist == null ? txt.none : distFormat(str.bestDist) + " (" + (str.bestTime / 1000).toFixed(1) + "s)"}<br>
    ${txt.besth} ${str.bestDistHardcore == null ? txt.none : distFormat(str.bestDistHardcore) + " (" + (str.bestTimeHardcore / 1000).toFixed(1) + "s)"}<br>
    ${txt.playtime} ${msToTime(str.playtime)}<br>
  `);
}
