/**
 * Stores a view container HTMLElement and its associated nav button.
 * Tracks the active view and has a method to set the active view.
 */
class AidView {
	static activeView = null;

	/**
	 * @param nav {HTMLElement} navigation button
	 * @param view {HTMLElement} view container
	 */
	constructor(nav, view) {
		this.nav = nav;
		this.view = view;
	}

	/**
	 * Sets the active view.
	 */
	setActive() {
		// Cancel if either element is null
		if (!this.nav || !this.view)
			return;
		// Clear active classes from current active view if one is set
		if (AidView.activeView) {
			AidView.activeView.nav.classList.remove('active');
			AidView.activeView.view.classList.remove('active');
		}
		// Update active view
		AidView.activeView = this;
		this.nav.classList.add('active');
		this.view.classList.add('active');
	}
}

/********************** Variables **********************/
let timerView, listView, allViews;

/********************** Initialise *********************/
window.addEventListener('load', function() {
	// Define the view objects
	timerView = new AidView(
		document.getElementById('timer-nav'),
		document.getElementById('timer-view')
	);
	listView = new AidView(
		document.getElementById('list-nav'),
		document.getElementById('list-view')
	);

	// An array of all views.
	allViews = [timerView, listView];

	// Make the navigation section work.
	for (let i = 0; i < allViews.length; i++)
		allViews[i].nav.addEventListener('click', function() {
			allViews[i].setActive();
		});

	// For activating GPS
	document.getElementById('timer-location-button').addEventListener('click', function() {
		if (this.checked) {
			if (navigator.geolocation) {
				// Disable buttons while testing geolocation
				this.disabled = true;
				document.getElementById('timer-button').disabled = true;
				navigator.geolocation.getCurrentPosition(
					// Geolocation is enabled!
					function (loc) {
						locationButton.disabled = false;
						timerButton.disabled = false;
					},
					// Error occured usually due to permissions
					function (err) {
						locationButton.disabled = false;
						locationButton.checked = false;
						timerButton.disabled = false;
						alert("Location timed out. Check permissions & WiFi connection.");
					},
					// Allowed 10 secs before error triggers
					{
						timeout: 10000,
						enableHighAccuracy: true
					}
				);
			}
			else {
				// Geolocation unavailable
				this.checked = false;
			}
		}
	});

	// For closing the map
	document.getElementById('map-container').addEventListener('click', mapHide);
	document.getElementById('map').addEventListener('click', function(event) {
		event.stopPropagation();
	});

	// Set a view to be active at startup.
	timerView.setActive();

	// Clear saved data at startup (for debug)
	//localStorage.removeItem('savedRuns');
});