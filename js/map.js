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

function initMap() {
  let pos = {lat: 25.03, lng: 121.30};

  let map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: pos,
  });

  return map
}

function clearMapAndResults(markers, directionsDisplay) {
  if (markers.length > 0) {
    for (let i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
    markers = [];
  }
  directionsDisplay.setMap(null);

  let results = document.getElementById("rest-results");
  while (results.firstChild) {
    results.removeChild(results.firstChild);
  }
}

function createMarker(map, infoWindow, pos, name, icon = '') {
  let marker = new google.maps.Marker({
    map: map,
    icon: icon,
    position: pos,
  });

  google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent(name);
    infoWindow.open(map, this);
  });

  return marker;
}

function createRoute(map, directionsService, directionsDisplay, origin, destination) {
  directionsDisplay.setMap(map);
  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: 'DRIVING'
  }, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
    } else {
      alert('Create route failed: ' + status);
    }
  });
}

function searchRestaurant(map, infoWindow, placesService, pos, option) {
  let allPlaces = []; // maximum 60...

  let request = {
    location: pos,
    radius: option.radius, /* maximum 50,000 meter */
    types: ['restaurant'],
  };
  return new Promise((resolve, reject) => {
    placesService.nearbySearch(request, (places, status, pagination) => {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        // FIXME long delay if search all 60 restaurants
        allPlaces = allPlaces.concat(places);
        if (pagination.hasNextPage) {
          pagination.nextPage();
        } else {
          resolve(allPlaces);
        }
      } else {
        alert('Search nearby restaurants failed: ' + status);
      }
    });
  });
}

function createRestaurantBlock(details) {
  let rest = document.createElement('div');
  rest.className = 'rest';

  let restName = document.createElement('span');
  restName.className = 'rest-name';
  restName.innerHTML = details.name;
  rest.appendChild(restName);

  let restImg = document.createElement('img');
  restImg.className = 'rest-img';
  restImg.src = details.photos[0].getUrl({
    maxHeight: details.photos[0].height,
    maxWidth: details.photos[0].width,
  });
  rest.appendChild(restImg);

  let restInfo = document.createElement('div');
  restInfo.className = 'rest-info';
  rest.appendChild(restInfo);

  let restPhone = document.createElement('div');
  restPhone.className = 'rest-phone';
  restInfo.appendChild(restPhone);

  let phoneIcon = document.createElement('i');
  phoneIcon.className = 'fa fa-phone';
  restPhone.appendChild(phoneIcon);

  let phoneNum = document.createElement('span');
  phoneNum.innerHTML = details.international_phone_number;
  restPhone.appendChild(phoneNum);

  let restAddr = document.createElement('div');
  restAddr.className = 'rest-addr';
  restInfo.appendChild(restAddr);

  let addrIcon = document.createElement('i');
  addrIcon.className = 'fa fa-map-marker';
  restAddr.appendChild(addrIcon);

  let addrName = document.createElement('span');
  addrName.innerHTML = details.formatted_address;
  restAddr.appendChild(addrName);

  let restTime = document.createElement('div');
  restTime.className = 'rest-time';
  restInfo.appendChild(restTime);

  let dropdown = document.createElement('div');
  dropdown.className = 'dropdown';
  restTime.appendChild(dropdown);

  let timeIcon = document.createElement('i');
  timeIcon.className = 'fa fa-clock-o';
  dropdown.appendChild(timeIcon);

  let dropbtn = document.createElement('span');
  dropbtn.className = 'dropbtn';
  dropbtn.innerHTML = details.opening_hours.open_now ? '營業中' : '本日公休';
  dropdown.appendChild(dropbtn);

  let content = document.createElement('ul');
  content.className = 'dropdown-content';
  dropdown.appendChild(content);

  for (let i = 0; i < details.opening_hours.weekday_text.length; i++) {
    let list = document.createElement('li');
    list.innerHTML = details.opening_hours.weekday_text[i];
    content.appendChild(list);
  }

  return rest;
}

function showRestaurantsDetails(places, placesService) {
  let request = {
    placeId: places[0].place_id,
  };

  placesService.getDetails(request, function (details, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      console.log(details);
      let results = document.getElementById('rest-results');
      results.appendChild(createRestaurantBlock(details));
    } else {
      alert('Get restaurant details failed: ' + status);
    }
  });
}

function main() {
  let map = initMap();
  let userPos;
  let markers = [];
  let infoWindow = new google.maps.InfoWindow({map: map});
  let placesService = new google.maps.places.PlacesService(map);
  let directionsService = new google.maps.DirectionsService;
  let directionsDisplay = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
  });

  // Set to current position and register button event
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(curPos) {
      userPos = {lat: curPos.coords.latitude, lng: curPos.coords.longitude};
      map.setCenter(userPos);
      map.setZoom(15);
      let icon = './img/person.png'
      createMarker(map, infoWindow, userPos, '你的位置', icon);
    });

    let btn = document.getElementById('btn-go');
    btn.addEventListener('click', function() {
      let distance = document.getElementById('distance');
      if (distance.value == distanceOptions.NONE) {
        alert('Please choose a distance.')
        return;
      }
/*
      // Few restaurants are ranked
      let price = document.getElementById('price');
      if (price.value == priceOptions.NONE) {
        alert('Please choose a price.')
        return;
      }
*/
      let showResult = document.getElementById('show-result');
      if (showResult.value == showResultOptions.NONE) {
        alert('Please choose a show result method.')
        return;
      }

      // clear map
      clearMapAndResults(markers, directionsDisplay);

      let option = {
        radius: distance.value,
        price: price.value,
      };
      let promise = searchRestaurant(map, infoWindow, placesService, userPos, option);
      promise.then((places) => {
        showResult = parseInt(showResult.value);
        switch (showResult) {
          case showResultOptions.RANDOM: {
            let random = Math.floor((Math.random() * places.length));;
            markers.push(createMarker(map, infoWindow,
                         places[random].geometry.location, places[random].name));
            createRoute(map, directionsService, directionsDisplay, userPos,
                        places[random].geometry.location);
            showRestaurantsDetails(new Array(places[random]), placesService);
            break;
          }
          case showResultOptions.LISTALL: {
            break;
          }
          default:
            alert('Should not reach default case.');
            break;
        }
      });
    });
  }
}
