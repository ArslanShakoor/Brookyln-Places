'use strict';
//Array of markers with properties
var markers = [
  { name: "Brooklyn Bridge", lat: 40.706086, lng: -73.996864, visible: true },
  { name: "Prospect Park", lat: 40.660204, lng: -73.968956, visible: true },
  { name: "Brooklyn Muesuem", lat: 40.671206, lng: -73.963631, visible: true },
  { name: "East River State Park", lat: 40.721485, lng: -73.962117, visible: true },
  { name: "Brooklyn Botanic Garden", lat: 40.667621, lng: -73.963189, visible: true },
  { name: "Luna Park", lat: 40.574275, lng: -73.978500, visible: true },
  { name: "BAM Rose Cinemas", lat: 40.686679, lng: -73.977521, visible: true },
  { name: "New York Aquarium", lat: 40.574371, lng: -73.9752, visible: true },
  { name: "New York Transit Muesuem", lat: 40.690527, lng: -73.989818, visible: true }
];

//initialization of observableArray
var markersArray = ko.observableArray();

var viewModel = function () {
  //create the map object with pre default center properties
  var map = new google.maps.Map(document.getElementById("map"), {
    zoom: 11,
    center: new google.maps.LatLng(40.706086, -73.996864),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true
  });

  //create the object for infowindowns
  var largeInfoWindow = new google.maps.InfoWindow();

  // call the createMarkers function
  createMarkers();

  //creation of createMarkers function 
  //the function takes the markers array and make the google map markers and put in observable array
  //this function also get the functionaliy to show infowindow when someone click markers 
  function createMarkers() {
    for (var i = 0; i < markers.length; i++) {

      var lat = markers[i].lat;
      var lng = markers[i].lng;
      var name = markers[i].name;

      var marker = new google.maps.Marker({
        lat: lat,
        lng: lng,
        position: { lat, lng },
        name: name,
        animation: google.maps.Animation.DROP,
        map: map,
        clickable: true
      });

      // var infowindow = new google.maps.InfoWindow();

      google.maps.event.addListener(marker, 'click', function () {
        var that = this;
        getContent(this.lat, this.lng, function (content) {
          largeInfoWindow.setContent(content);
        });
        largeInfoWindow.open(map, this);
        map.setZoom(16);
        map.setCenter(this.getPosition());
        this.setAnimation(google.maps.Animation.BOUNCE);

        setTimeout(function () {
          that.setAnimation(null);
        }, 2100);
      });
      markersArray.push(marker);
    }
  }

  //function search the observable array for name and return the index 
  function arrayFirstIndexOf(array, predicate, predicateOwner) {
    
    for (var i = 0, j = array.length; i < j; i++) {
      if (predicate.call(predicateOwner, array[i])) {
        return i;
      }
    }
    return -1;
  }

  // the mehtod is called by maker method this method shows the infowindow when someone click on list of places        
  function populateInfoWindow(lat, lng, name, infowindow) {
    
    var searchName = name;
    var index = (arrayFirstIndexOf(markersArray(), function (mark) {
      return mark.name === searchName;
    }));

    getContent(lat, lng, function (content) {

      infowindow.setContent(content);
      var position = { lat: lat + 0.0006, lng: lng };
      infowindow.setPosition(position);
      infowindow.open(map);
      map.setZoom(16);
      map.setCenter(position);
      markersArray()[index].setAnimation(google.maps.Animation.BOUNCE);

      setTimeout(function () {
        markersArray()[index].setAnimation(null);
      }, 2100);

      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function () {
        infowindow.marker = null;
      });
    });
  }

  //get the data from forusquare api and retun to show in infowindow
  function getContent(lat, lng, callback) {

    var content = 'div';
    var id = 0;
    var urlJSON = "https://api.foursquare.com/v2/venues/search?ll=" + lat + "," + lng + "&client_id=0XZWZNUHOWX5AXLGIULO55IYZ11YVJUTT5GBYPE40ACRHQVR&client_secret=PQO3O0WSRGH04QZN1YWPTOVCK1PLHVJT4GVLOSM51FCK0Q0I&v=20170527";
    $.getJSON(urlJSON, function (json) {
      id = json.response.venues[0].id;
      var idJSON = "https://api.foursquare.com/v2/venues/" + id + "?client_id=0XZWZNUHOWX5AXLGIULO55IYZ11YVJUTT5GBYPE40ACRHQVR&client_secret=PQO3O0WSRGH04QZN1YWPTOVCK1PLHVJT4GVLOSM51FCK0Q0I&v=20170527";
      $.getJSON(idJSON, function (jsonId) {
        var name = (jsonId.response.venue.name);
        var address = (jsonId.response.venue.location.address);
        var city = (jsonId.response.venue.location.city);
        var state = (jsonId.response.venue.location.state);
        var postalCode = (jsonId.response.venue.location.postalCode);
        var rating = (jsonId.response.venue.rating);
        var prefix = (jsonId.response.venue.photos.groups[0].items[0].prefix);
        var suffix = (jsonId.response.venue.photos.groups[0].items[0].suffix);
        var size = "200x110";
        var imgUrl = prefix + size + suffix;

        content = '<div><h2 style="padding:0px; margin:0px">' + name + '</h2>' + '<img src="' + imgUrl + '" ><br>' + address +
          '<br>' + city + ",  " + state + "  " + postalCode + '<br>Rating:<b>' + rating +
          '</b>/10' + '<br><table style="border:0px; margin:-3px"><tr><td style="width: 70px; border:0px">' + "Powered by</td>" + '<td style="width: 20px; border:0px"><img src="img/foursquare.png"</td></tr></table>' + '</div>';

        callback && callback(content);
      }).fail(function () {
        alert("JSON error, Try again later");
      });
    }).fail(function () {
      alert("JSON error, Try again later");
    });
  }


  //search query

  self.searchTerm = ko.observable('');

  //search result are retured
  //show the markers according to search result
  self.searchResults = ko.computed(function () {
    var q = searchTerm();

    return markers.filter(function (z) {
      
      if (z.name.toLowerCase().indexOf(q) >= 0) {
        z.visible = true;
        hideMarkers();
      }
      else {
        
        z.visible = false;
        hideMarkers();
      }

      return z.name.toLowerCase().indexOf(q) >= 0;

    });
  });

  //this function shows the marker according to seacch query
  function hideMarkers() {
    
    for (var i = 0; i < markers.length; i++) {
      if (markers[i].visible === true) {
        markersArray()[i].setMap(map);
      } else {
        markersArray()[i].setMap(null);
      }
    }
  }
  //reset the map  to itz original zoom
  function reZoomMap() {
    
    largeInfoWindow.close();
    var myLatlng = { lat: 40.706086, lng: -73.99686 };
    map.setCenter(myLatlng);
    map.setZoom(11);
  }



  $(window).resize(function () {
    reZoomMap();
  });

  //setMarker function is called when someone click places list
  //create markers object and pass to populateInfoWindow function

  self.setMarker = function (clickedMarker) {

    var lat = clickedMarker.lat;
    var lng = clickedMarker.lng;
    var name = clickedMarker.name;

    // self.currentcat(clickedCat);
    populateInfoWindow(lat, lng, name, largeInfoWindow);
  };

  self.resetZoom = function () {
    
    reZoomMap();
  }
};

function loadMap() {
  
  ko.applyBindings(viewModel);
}


//hide and show div for list of location
$(function () {

  $(".down").hide();
  $(".link1, .link2").bind("click", function () {
    $(".down, .modal").hide();
    if ($(this).attr("class") == "link1") {
      $(".down").show();
    }
    else {
      $(".modal").show();
    }
  });
});

//error handling for google map
function errorHandling() {
  alert("Check you internet. Google Map is facing the problem!");
}