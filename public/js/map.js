$(document).ready(function(){

	// Starting location is San Francisco
	var startingLocation = {lat: 37.773972, lng: -122.431297};

	/** Map Module **/
	var Map = (function (initialLocation) {
		var module = {};

		// Default starting location is San Francisco
		var startingLocation = initialLocation || {lat: 37.773972, lng: -122.431297};

		// Markers
		var markers = [];

		// One info window for the map
		var infoWindow = new google.maps.InfoWindow();

		// Google Map
		var map = new google.maps.Map(document.getElementById('map'), {
			center: startingLocation,
			zoom: 13
		});

		var addInfoWindow = function(marker, data){
			// Add a listener to the marker to open up an info window
			marker.addListener('click', function() {
				infoWindow.setContent(data);
				infoWindow.open(map, marker);
			});
		};

		/** Public Functions **/
		module.addMarker = function(location, data){
			// Create and add marker to the map		
			var marker = new google.maps.Marker({
				position: location,
				map: map
			});

			// Push marker to markers array
			markers.push(marker);

			// Add info window
			addInfoWindow(marker, data);
		};

		// Clears all markers from map
		module.clearMarkers = function(){
			// Must manuall set references to null to avoid memory leaks
			for (var i = 0; i < markers.length; i++) {
				markers[i].setMap(null);
			}
			markers = [];
		};

		return module;
	}(startingLocation));

	/** Autocomplete **/
	$("#search_input").autocomplete({
		delay: 300, 	// Delay between keystrokes and fetch request
		minLength: 1, // Minimum length of input for autocomplete
		source: function(request, response) {
			var tab = $('.nav-pills .active').attr("value");

			// Make call to server to get autocomplete results
			$.getJSON('/autocomplete', {q:request.term, tab: tab}, function(data, status, xhr){

				// Reformat the results to match the accepted signature of JQuery Autocomplete's Source
				var mappedResults = data.map(function(d){
					d.label = (tab == "title") ? d.title : (d.director || d.name);
					d.value = d.label;
					return d;
				});

				// Load jquery ui results
				response(mappedResults);
			});
		},
		select: function(event, ui) {
			var tab = $('.nav-pills .active').attr("value");

			// Clear all map markers
			Map.clearMarkers();
			// Get all movie locations by title then geocode their addresses to place on map
			getLocations('/search', ui.item._id, tab);
		}
	});

	/** Listeners **/
	
	$("#search_button").click(function(){
		var text = $("#search_input").val();
		var tab = $('.nav-pills .active').attr("value");

		// Clear all map markers
		Map.clearMarkers();

		// Get all movie locations by title then geocode their addresses to place on map
		getLocations('/fullsearch', null, tab, text);
	});

	/** Helpers **/

	/**
		* Searches for all movie locations given an movie id, or director id
		* param {string} endpoint - Server endpoint
		* param {string} id - Movie or direcotr id
		* param {string} tab - Current tab the search is under (ie. Title or Director)
		* param {string} title - Search by movie titles, used for clicking search
		*/
	var getLocations = function(endpoint, id, tab, title) {
		$.getJSON(endpoint, {id: id, tab: tab, title: title}, function(data){
			console.log("Dataaa", data);
			if(data.length == 0){
				// Show help information if no results
				$(".help_container").css('visibility', 'visible');
			}else{
				// Hide help information
				$(".help_container").css('visibility', 'hidden');
				// Add all the movies location top the map
				data.forEach(function(d){
					var point = {
						lat: d.latitude,
						lng: d.longitude
					};
					Map.addMarker(point, d.html);
				});
			}
		});
	};
});