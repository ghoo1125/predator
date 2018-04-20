function initMap(curPos) {
  let pos = {lat: 25.03, lng: 121.30};

  let map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: pos,
  });

  return map
}

function main() {
  let map = initMap();

  // Set to current position
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(curPos) {
      let infoWindow = new google.maps.InfoWindow({map: map});
      let pos = {lat: curPos.coords.latitude, lng: curPos.coords.longitude};
      infoWindow.setPosition(pos);
      infoWindow.close();
      map.setCenter(pos);
      map.setZoom(17);

      let marker = new google.maps.Marker({
        position: pos,
        map: map,
      });
    });
  }
}
