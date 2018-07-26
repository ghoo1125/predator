const transportOptions = {
  'SELECT': -1,
  'WALK': 500,
  'SCOOTER': 2000,
  'CAR': 10000,
}

const typeOptions = {
  'SELECT': -1,
  'Vegan': 0,
  'Random': 1,
}

// The number of retaurants' results that we show
const RESULTS_NUM = 3;

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

function clearMapAndResults(markers, directionsDisplay, clearResults=true) {
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
  let goButton = document.getElementById('btn-go');
  let loading = document.getElementById('loading');

  goButton.style.display = 'none';
  loading.style.display = 'block';
}

function endLoading() {
  // end loading
  let goButton = document.getElementById('btn-go');
  let loading = document.getElementById('loading');

  goButton.style.display = 'block';
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

  return new Promise((resolve, reject) => {
    let request =  {
      origin: origin,
      destination: destination,
      travelMode: 'DRIVING'
    };
    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        resolve({
          'route': response,
          'distance': response.routes[0].legs[0].distance.text,
          'time': response.routes[0].legs[0].duration.text,
        });
      } else {
        alert('Create route failed: ' + status);
      }
    });
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
  if (options.type == typeOptions.Vegan) {
    request.keyword = '素食';
  }
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

  let route;
  let routePromise =
    createRoute(map, directionsDisplay, userPos, details.geometry.location);
  routePromise.then((val) => {
    route = val.route;

    let distance = document.createElement('div');
    distance.className = 'rest-distance';
    restInfo.appendChild(distance);

    let roadIcon = document.createElement('i');
    roadIcon.className = 'fa fa-road';
    distance.appendChild(roadIcon);

    let distanceVal = document.createElement('span');
    distanceVal.innerHTML = val.distance;
    distance.appendChild(distanceVal);

    // Append button after we got the distance
    restInfo.appendChild(routeButton);
  });

  routeButton.addEventListener('click', function () {
    clearMapAndResults(markers, directionsDisplay, false /* clearResults */);
    directionsDisplay.setMap(map);
    directionsDisplay.setDirections(route);
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

function getCustomSelectFieldName(selectName) {
  let select = document.getElementById(selectName);
  while (select.nextSibling) {
    if (select.constructor.name == 'HTMLButtonElement' &&
        select.className == 'custom-button') {
      break;
    }
    select = select.nextSibling;
  }
  return select.innerHTML;
}

function findLocationByText(map, searchText) {
  let request = {
    query: searchText,
  };

  let service = new google.maps.places.PlacesService(map);
  return new Promise((resolve, reject) => {
    service.textSearch(request, function(results, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        resolve(results[0].geometry.location);
      } else {
        alert('Search place failed: ' + status);
      }
    });
  });
}

function startSearch(map, markers, directionsDisplay, userPos, oldOptions) {
  if (!userPos) {
    alert('Please set a poistion.');
    return;
  }

  let transportName = getCustomSelectFieldName('custom-transport');
  if (transportOptions[transportName] < 0) {
    alert('Please choose a transport.')
    return;
  }

  let typeName = getCustomSelectFieldName('custom-type');
  if (typeOptions[typeName] < 0) {
    alert('Please choose a restaurant type.')
    return;
  }

  // Clear markers, routes and restaurants information
  clearMapAndResults(markers, directionsDisplay);

  // Wait for searching
  startLoading();
  if (allPlaces.length < RESULTS_NUM ||
      oldOptions.distance != transportOptions[transportName] ||
      oldOptions.type != typeOptions[typeName]) {

    // SearchRestaurant and show results
    allPlaces = [];
    let options = {
      'distance': transportOptions[transportName],
      'type': typeOptions[typeName],
      // Do not show closed restaurants
      'openNow': true
    };
    let searchPromise = searchRestaurant(map, userPos, options);
    searchPromise.then(() => {
      let restaurants = recommendRestaurants(allPlaces);
      showRestaurantsDetails(map, userPos, restaurants, markers,
                             directionsDisplay);

      // Finish searching
      endLoading();
    });
  } else {
    // Fake loading to prevent OVER_QUERY_LIMIT of routes
    setTimeout(endLoading, 500);

    let restaurants = recommendRestaurants(allPlaces);
    showRestaurantsDetails(map, userPos, restaurants, markers,
                           directionsDisplay);
  }

  oldOptions.distance = transportOptions[transportName];
  oldOptions.type = typeOptions[typeName];
}

function addButtonsEvent(map, markers, directionsDisplay) {
  let userPos = null;
  let userMarker = null;
  let icon = './img/person.png'

  // Register search place event
  let searchBar = document.getElementById('place-search');
  let autocomplete = new google.maps.places.Autocomplete(searchBar);
  document.getElementById('place-button').addEventListener('click', function() {
    let posPromise = findLocationByText(map, searchBar.value);
    posPromise.then((val) => {
      userPos = val;
      map.setCenter(userPos);
      map.setZoom(15);
      if (userMarker) {
        userMarker.setMap(null);
        clearMapAndResults(markers, directionsDisplay);
      }
      userMarker = createMarker(map, userPos, searchBar.value, icon);
    });
  });

  // Register current location button event
  let currentButton = document.getElementById('current-button');
  currentButton.addEventListener('click', function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(curPos) {
        // Set to current position
        userPos = {lat: curPos.coords.latitude, lng: curPos.coords.longitude};
        map.setCenter(userPos);
        map.setZoom(15);
        if (userMarker) {
          userMarker.setMap(null);
          clearMapAndResults(markers, directionsDisplay);
        }
        userMarker = createMarker(map, userPos, '你的位置', icon);
      })
    } else {
      alert('Sorry, please permit accessibility to your current location.');
      return;
    }
  });

  // Register search retaurants event
  let goButton = document.getElementById('btn-go');
  let oldOptions = {
    'distance': -1,
    'type': -1,
  };
  goButton.addEventListener('click', function() {
    startSearch(map, markers, directionsDisplay, userPos, oldOptions);
  });
}

function main() {
  let map = initMap();
  // Preserve markers array since we might want multiple markers
  let markers = [];
  let directionsDisplay = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
  });

  // Register Go button event
  addButtonsEvent(map, markers, directionsDisplay);
}
