/************** Variables ***************/
let platform, defaultLayers, map;

/************** Initialise **************/
window.addEventListener('load', function() {
	platform = new H.service.Platform({
		'apikey': '{REDACTED}'
	});
	defaultLayers = platform.createDefaultLayers();
});

/************** Functions ***************/

/**
 * Open the map and center on coordinates.
 * @param longitude {number}
 * @param latitude {number}
 */
function mapDraw(longitude = 0, latitude = 0) {
	const mapElement = document.getElementById('map');
	mapElement.innerHTML = "";
	map = new H.Map(
		mapElement,
		defaultLayers.vector.normal.map,
		{
			zoom: 14,
			center: {
				lng: longitude,
				lat: latitude
			}
		}
	);
	mapShow();
}

/**
 * Open the map and plot a route. Center on the midpoint of the route.
 * @param route {[{lng, lat}]}
 */
function mapRoute(route) {

	// Temporarily center on co-ords at the midpoint of the route
	// until I figure out the bounding box method below
	const midpointIndex = Math.round(route.length / 2 - 1);
	mapDraw(
		route[midpointIndex].lng,
		route[midpointIndex].lat
	);

	// Push co-ordinates into HERE Map API linestring object
	const linestring = new H.geo.LineString();
	route.forEach(point => {
		linestring.pushPoint({
			lng: point.lng,
			lat: point.lat
		});
	});

	// Create a HERE Map API polyline object and add it to the map
	map.addObject(new H.map.Polyline(linestring, {
		style: {
			lineWidth: 3
		}
	}));

	/* FIXME: Zoom the map to fit using a bounding box
	map.getViewModel().setLookAtData({
		bounds: polyline.getBoundingBox()
	});
	*/
}

/**
 * Show the map.
 */
function mapShow() {
	document.getElementById('map-container').classList.remove('invisible');
}

/**
 * Hide and clear the map to save resources.
 */
function mapHide() {
	document.getElementById('map').innerHTML = "";
	document.getElementById('map-container').classList.add('invisible');
}