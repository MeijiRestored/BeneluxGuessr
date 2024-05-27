let curlang;

function setlang(lang) {
  curlang = lang;
  $(".btnactive").removeClass("btnactive");
  $(`#${lang}`).addClass("btnactive")
  $("#classiclink").attr("href", "play.html?m=c&hl=" + lang);
  $("#hardcorelink").attr("href", "play.html?m=h&hl=" + lang);
}

let params = new URLSearchParams(window.location.search);
if (params.get('hl')) {
  curlang = params.get('hl');
  $(`#${curlang}`).addClass("btnactive")
  $("#classiclink").attr("href", "play.html?m=c&hl=" + curlang);
  $("#hardcorelink").attr("href", "play.html?m=h&hl=" + curlang);
} else {
  curlang = "en"
  $(`#${curlang}`).addClass("btnactive")
}