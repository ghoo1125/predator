function initMap(curPos) {
  let pos = {lat: 25.03, lng: 121.30};

  let map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: pos,
  });

  return map
}

function createMarker(map, infoWindow, pos, name) {
  let marker = new google.maps.Marker({
    map: map,
    position: pos,
  });

  google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent(name);
    infoWindow.open(map, this);
  });
}

function createPath(map, infoWindow, places) {
  createMarker(map, infoWindow, places[0].geometry.location, places[0].name);
}

function searchRestaurant(map, infoWindow, pos) {
  let service = new google.maps.places.PlacesService(map);

  let request = {
    location: pos,
    radius: '500', /* maximum 50,000 meter */
    types: ['restaurant'],
  };
  service.nearbySearch(request, (places, status) => {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      createPath(map, infoWindow, places);
    }
  });
}

function main() {
  let btn = document.getElementById('btn-go');
  let map = initMap();
  let infoWindow = new google.maps.InfoWindow({map: map});
  let pos;

  // Set to current position and register btn event
  if (navigator.geolocation) {
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(function(curPos) {
        pos = {lat: curPos.coords.latitude, lng: curPos.coords.longitude};
        map.setCenter(pos);
        map.setZoom(15);
        let name = ;
        createMarker(map, infoWindow, pos, '你的位置');
        resolve();
      });
    }).then(() => {
      btn.addEventListener('click', function() {
        searchRestaurant(map, infoWindow, pos);
      });
    });
  }
}
