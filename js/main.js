const distanceOptions = {
  NONE: -1,
  /* options value are set to the distance */
}

// The number of retaurants' results that we show
const RESULTS_NUM = 3;

// FIXME store slide idx as global variable
let slideIndex = new Array(RESULTS_NUM);
(function slideIndexInit() {
  for (let i = 0; i < slideIndex.length; i++) {
    slideIndex[i] = 1;
  }
}) ();

function nextPage(isRight, idx) {
  slideIndex[idx] += isRight ? 1 : -1;

  let imgs = document.getElementsByClassName('slide-img' + idx);
  if (slideIndex[idx] > imgs.length) {
    slideIndex[idx] = 1;
  }

  if (slideIndex[idx] < 1) {
    slideIndex[idx] = imgs.length;
  }

  for (let i = 0; i < imgs.length; i++) {
     imgs[i].style.display = 'none';
  }
  imgs[slideIndex[idx] - 1].style.display = 'block';
}

function initMap() {
  let pos = {lat: 25.03, lng: 121.30};

  let map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: pos,
  });

  return map
}

function clearMapAndResults(markers, directionsDisplay, clearResults = true) {
  if (markers.length > 0) {
    for (let i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
    markers = [];
  }
  directionsDisplay.setMap(null);

  if (clearResults) {
    let results = document.getElementById('rest-results');
    while (results.firstChild) {
      results.removeChild(results.firstChild);
    }
  }
}

function startLoading() {
  // start loading
  let btn = document.getElementById('btn-go');
  let loading = document.getElementById('loading');

  btn.style.display = 'none';
  loading.style.display = 'block';
}

function endLoading() {
  // end loading
  let btn = document.getElementById('btn-go');
  let loading = document.getElementById('loading');

  btn.style.display = 'block';
  loading.style.display = 'none';
}

function createMarker(map, pos, name, icon = '') {
  let infoWindow = new google.maps.InfoWindow({map: map});
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

function createRoute(map, directionsDisplay, origin, destination) {
  let directionsService = new google.maps.DirectionsService;

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

/*
Store the queried restaurants globally since we might asynchronously push and
pop the restaurants. Noted that we can only query at most 60 restaurants.
*/
let allPlaces = [];
function searchRestaurant(map, pos, options) {
  let infoWindow = new google.maps.InfoWindow({map: map});
  let placesService = new google.maps.places.PlacesService(map);

  let request = {
    location: pos,
    radius: options.distance, /* maximum 50,000 meter */
    type: 'restaurant',
    openNow: options.openNow,
  };
  return new Promise((resolve, reject) => {
    placesService.nearbySearch(request, (places, status, pagination) => {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        allPlaces = allPlaces.concat(places);
        // Query next page results after every 2 seconds according to API
        setTimeout(function() {
          if (pagination.hasNextPage) {
            pagination.nextPage();
          }
        }, 2000);
        resolve();
      } else {
        alert('Search nearby restaurants failed: ' + status);
        reject();
      }
    });
  });
}

function createRestaurantBlock(map, userPos, details, markers,
                               directionsDisplay, idx) {
  let rest = document.createElement('div');
  rest.className = 'rest';

  let restName = document.createElement('span');
  let searchName = 'http://www.google.com/search?q=' + details.name;
  restName.className = 'rest-name';
  restName.innerHTML = details.name;
  restName.addEventListener('click', function () {
    window.open(searchName);
  });
  rest.appendChild(restName);

  let row = document.createElement('div');
  row.className = 'row';
  rest.appendChild(row);

  let slideButton = document.createElement('div');
  slideButton.className = 'slide-btn col s1';
  row.appendChild(slideButton);

  let leftButton = document.createElement('button');
  leftButton.addEventListener('click', function () {
    nextPage(false, idx);
  });
  leftButton.innerHTML =
    details.hasOwnProperty('photos') && (details.photos.length != 1) ? '❮' : '';
  slideButton.appendChild(leftButton);

  let slideImg;
  let restImg;
  if (details.hasOwnProperty('photos')) {
    for (let i = 0; i < details.photos.length; i++) {
      slideImg = document.createElement('div');
      slideImg.className = 'slide-img' + idx + ' col s2';i
      slideImg.style.display = 'none';
      if (i == 0) {
        slideImg.style.display = 'block';
      }
      row.appendChild(slideImg);

      restImg = document.createElement('img');
      restImg.className = 'rest-img';
      restImg.src = details.photos[i].getUrl({
        maxHeight: details.photos[i].height,
        maxWidth: details.photos[i].width,
      });
      slideImg.appendChild(restImg);
    }
  } else {
    slideImg = document.createElement('div');
    slideImg.className = 'slide-img' + idx + ' col s2';
    slideImg.style.display = 'block';
    row.appendChild(slideImg);

    restImg = document.createElement('img');
    restImg.className = 'rest-img';
    restImg.src = './img/coming_soon.jpg';
    slideImg.appendChild(restImg);
  }

  slideButton = document.createElement('div');
  slideButton.className = 'slide-btn col s1';
  row.appendChild(slideButton);

  let rightButton = document.createElement('button');
  rightButton.addEventListener('click', function () {
    nextPage(true, idx);
  });
  rightButton.innerHTML =
    details.hasOwnProperty('photos') && (details.photos.length != 1) ? '❯' : '';
  slideButton.appendChild(rightButton);

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
  if (details.hasOwnProperty('international_phone_number')) {
    phoneNum.innerHTML = details.international_phone_number;
  } else {
    phoneNum.innerHTML = '很抱歉，查無聯絡方式。';
  }
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

  let routeButton = document.createElement('button');
  routeButton.innerHTML = 'Go!';
  restInfo.appendChild(routeButton);
  routeButton.addEventListener('click', function () {
    clearMapAndResults(markers, directionsDisplay, false /* clearResults */);
    createRoute(map, directionsDisplay, userPos, details.geometry.location);
    markers.push(createMarker(map, details.geometry.location, details.name));
  });
/*
  let restTime = document.createElement('div');
  restTime.className = 'rest-time';
  restInfo.appendChild(restTime);

  let dropdown = document.createElement('div');
  dropdown.className = 'dropdown';
  restTime.appendChild(dropdown);

  let timeIcon = document.createElement('i');
  timeIcon.className = 'fa fa-clock-o';
  dropdown.appendChild(timeIcon);

  let dropButton = document.createElement('span');
  dropButton.className = 'drop-btn';
  if (details.hasOwnProperty('opening_hours') &&
      details.opening_hours.hasOwnProperty('open_now')) {
    dropButton.innerHTML = details.opening_hours.open_now ? '營業中' : '休息中';
  } else {
    dropButton.innerHTML = '營業時間';
  }
  dropdown.appendChild(dropButton);

  let content = document.createElement('ul');
  content.className = 'dropdown-content';
  dropdown.appendChild(content);

  let list;
  if (details.hasOwnProperty('opening_hours') &&
      details.opening_hours.hasOwnProperty('weekday_text')) {
    for (let i = 0; i < details.opening_hours.weekday_text.length; i++) {
      list = document.createElement('li');
      list.innerHTML = details.opening_hours.weekday_text[i];
      content.appendChild(list);
    }
  } else {
    list = document.createElement('li');
    list.innerHTML = '很抱歉，查無營業時間。';
    content.appendChild(list);
  }
*/
  return rest;
}

function showRestaurantsDetails(map, userPos, places, markers,
                                directionsDisplay) {
  let placesService = new google.maps.places.PlacesService(map);
  let results = document.getElementById('rest-results');

  return new Promise((resolve, reject) => {
    for (let i = 0; i < RESULTS_NUM; i++) {
      let request = {
        placeId: places[i].place_id,
      };

      placesService.getDetails(request, function (details, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          results.appendChild(
            createRestaurantBlock(map, userPos, details, markers,
                                  directionsDisplay, i));
          resolve();
        } else {
          alert('Get restaurant details failed: ' + status);
          reject();
        }
      });
    }
  });
}

function recommendRestaurants(places) {
  let rv = [];

  // Generate RESULTS_NUM random numbers
  let count = 0;
  while (count < RESULTS_NUM) {
    let random = Math.floor((Math.random() * places.length));
    count++;
    rv.push(places[random]);
    places.splice(random, 1);
  }

  return rv;
}

function addGoButtonEvent(map, userPos, markers, directionsDisplay) {
  let btn = document.getElementById('btn-go');
  let oldOptions = {
    'distance': -1,
  };

  btn.addEventListener('click', function() {
    let distance = document.getElementById('distance');
    if (distance.value == distanceOptions.NONE) {
      alert('Please choose a distance.')
      return;
    }

    // Clear markers, routes and restaurants information
    clearMapAndResults(markers, directionsDisplay);

    // Wait for searching
    startLoading();

    if (allPlaces.length < RESULTS_NUM || oldOptions.distance != distance.value) {
      // SearchRestaurant and show results
      let options = {
        'distance': distance.value,
        // Don't show closed restaurants
        'openNow': true
      };
      let searchPromise = searchRestaurant(map, userPos, options);
      searchPromise.then(() => {
        let restaurants = recommendRestaurants(allPlaces);
        return showRestaurantsDetails(map, userPos, restaurants, markers,
                                      directionsDisplay);
      }).finally(function() {
        // Finish searching
        endLoading();
      });
    } else {
      let restaurants = recommendRestaurants(allPlaces);
      showRestaurantsDetails(map, userPos, restaurants, markers,
                             directionsDisplay);
      endLoading();
    }

    oldOptions.distance = distance.value;
  }); // add btn event listener
}

function main() {
  let map = initMap();
  let userPos;
  // Preserve markers array since we might want multiple markers
  let markers = [];
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
      createMarker(map, userPos, '你的位置', icon);

      addGoButtonEvent(map, userPos, markers, directionsDisplay);
    }, function() {
      alert('Sorry, please permit accessibility to your current location.');
      return;
    });
  }
}
