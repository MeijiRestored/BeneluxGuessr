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

/**
 * Calculate a score based on a distance.
 * @param dist {number} Distance in meters
 * @returns {number} Score between 0 and 300
 */
function calcScore(dist) {
  let s = Math.floor(((700 / ((dist / 1000) + 8.17)) - 6.8) * 1.2);
  s = s > 300 ? 300 : (s < 0 ? 0 : s);
  return s;
}
