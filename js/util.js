/**
 * Integer randomizer
 * @param {number} max Max value
 * @returns {number} Random integer in [0; max[
 */
function randomInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Calculate the distance between two coordinates using the Haversine formula.
 * @param coords1 First point
 * @param coords2 Second point
 * @returns {number} The distance between the two points
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

/**
 * Calculate a score based on a distance.
 * @param dist {number} Distance in meters
 * @returns {number} Score between 0 and 300
 */
function calcScore(dist) {
  let s = Math.floor(((700 / ((dist / 1000) + 8.17) * 3) - 6.8) * 1.2);
  s = s > 300 ? 300 : (s < 0 ? 0 : s);
  return s;
}

/**
 * Formats distance in a human-readable way.
 * @param dist {number} Distance in meters
 * @returns {string} Formatted string
 */
function distFormat(dist) {
  let d;
  if (dist < 1000) {
    d = Math.floor(dist) + " " + txt.meters;
  } else if (dist < 100000) {
    d = (Math.floor(dist) / 1000).toFixed(1) + " km";
  } else {
    d = Math.floor(dist / 1000) + " km";
  }

  return d;
}

/**
 * Convert ms to hh:mm:ss
 * @param {number} ms Number of ms
 * @returns {string} hh:mm:ss format
 */
function msToTime(ms) {
  let seconds = Math.floor((ms / 1000) % 60);
  let minutes = Math.floor((ms / (1000 * 60)) % 60);
  let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds;
}

/**
 * Get a random country between NL, BE and LU.
 * @returns {string} Random country
 */
function getRandCountry() {
  let i = randomInt(10);
  if (i < 2) {
    return "luxembourg";
  }
  if (i < 6) {
    return "belgium";
  }
  return "netherlands";
}

/**
 * Get coordinates of a random StreetView in the specified bounds.
 */
async function getSpawn(bounds, country) {
  const b = {
    benelux: {
      bottomLeft: {lat: 49.465, lng: 2.335},
      topRight: {lat: 53.635, lng: 7.256}
    },
    netherlands: {
      bottomLeft: {lat: 50.740, lng: 3.071},
      topRight: {lat: 53.635, lng: 7.256}
    },
    belgium: {
      bottomLeft: {lat: 49.465, lng: 2.335},
      topRight: {lat: 51.507, lng: 6.710}
    },
    luxembourg: {
      bottomLeft: {lat: 49.436, lng: 5.659},
      topRight: {lat: 50.190, lng: 6.626}
    },
  }

  function checkInArea(pt, area) {
    let point = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [pt.lng, pt.lat]
      }
    };

    return turf.booleanPointInPolygon(point, area);
  }

  function getRandomCoordinates(lat1, lng1, lat2, lng2) {
    const minLat = Math.min(lat1, lat2);
    const maxLat = Math.max(lat1, lat2);
    const minLng = Math.min(lng1, lng2);
    const maxLng = Math.max(lng1, lng2);

    const randomLat = Math.random() * (maxLat - minLat) + minLat;
    const randomLng = Math.random() * (maxLng - minLng) + minLng;

    return {
      lat: randomLat,
      lng: randomLng
    };
  }

  function bindToStreetview(lat, lng) {
    return new Promise((resolve, reject) => {
      let sv = new google.maps.StreetViewService();
      let latLng = {lat: lat, lng: lng};

      sv.getPanorama({location: latLng, radius: 500}, (data, status) => {
        if (status === 'OK') {
          let gotlat = data.location.latLng.lat();
          let gotlng = data.location.latLng.lng();
          resolve({lat: gotlat, lng: gotlng, ok: true});
        } else {
          resolve({lat: 0, lng: 0, ok: false});
        }
      });
    });
  }

  while(true) {
    let c = getRandomCoordinates(b[country].bottomLeft.lat, b[country].bottomLeft.lng, b[country].topRight.lat, b[country].topRight.lng);
    if (checkInArea(c, bounds.features[0])) {
      let sv = await bindToStreetview(c.lat, c.lng);
      if (sv.ok) {
        if (checkInArea(sv, bounds.features[0])) {
          return [sv.lat, sv.lng];
        }
      }
    }
  }
}
