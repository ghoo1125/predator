const distanceOptions = {
  NONE: -1,
  /* options value are set to the distance */
}

const priceOptions = {
  NONE: -1,
  /* start from 1 to align with price_level defined in PlaceResult */
  INEXPENSIVE: 1,
  MODERATE: 2,
  EXPENSIVE: 3,
}

const showResultOptions = {
  NONE: -1,
  RANDOM: 0,
  LISTALL: 1,
}

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

  return marker;
}

function createPath(map, infoWindow, places) {
  let markers = [];
  for (let i = 0; i < places.length; i++) {
    markers.push(createMarker(
      map, infoWindow, places[i].geometry.location, places[i].name));
  }

  return markers;
}

function searchRestaurant(map, infoWindow, pos, option) {
  let allPlaces = []; // maximum 60...
  let service = new google.maps.places.PlacesService(map);

  let request = {
    location: pos,
    radius: option.radius, /* maximum 50,000 meter */
    types: ['restaurant'],
  };
  return new Promise((resolve, reject) => {
    service.nearbySearch(request, (places, status, pagination) => {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        // FIXME long delay if search all 60 restaurants
        allPlaces = allPlaces.concat(places);
        if (pagination.hasNextPage) {
          pagination.nextPage();
        } else {
          resolve(createPath(map, infoWindow, allPlaces));
        }
      } else {
        console.log('search nearby restaurants error: ' + status);
      }
    });
  });
}

function main() {
  let btn = document.getElementById('btn-go');
  let map = initMap();
  let infoWindow = new google.maps.InfoWindow({map: map});
  let pos;
  let markers = [];

  // Set to current position and register btn event
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(curPos) {
        pos = {lat: curPos.coords.latitude, lng: curPos.coords.longitude};
        map.setCenter(pos);
        map.setZoom(15);
        createMarker(map, infoWindow, pos, '你的位置');
      });

      btn.addEventListener('click', function() {
        let distance = document.getElementById("distance");
        if (distance.value == distanceOptions.NONE) {
          alert("Please choose a distance.")
          return;
        }
        // Few restaurants are ranked
/*
        let price = document.getElementById("price");
        if (price.value == priceOptions.NONE) {
          alert("Please choose a price.")
          return;
        }
*/
        let showResult = document.getElementById("show-result");
        if (showResult.value == showResultOptions.NONE) {
          alert("Please choose a show result method.")
          return;
        }

        if (markers.length > 0) {
          for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
          }
          markers = [];
        }

        let option = {
          radius: distance.value,
          price: price.value,
          showResult: showResult.value,
        };
        let promise = searchRestaurant(map, infoWindow, pos, option);
        promise.then((value) => {
          markers = value;
        });
      });
  }
}
