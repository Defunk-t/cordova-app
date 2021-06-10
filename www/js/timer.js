/** Controls rate that stopwatch display refreshes. (1000ms / Hz)
 * Faster refreshes come at a performance cost.
 */
const timerRefreshRate = 1000 / 30, // 30 refreshes per second

/** The app will ignore very small GPS movements (i.e. margin of error)
 * to save resources. Increase second number to log more often, decrease
 * to log less often. (default: 5) */
locationPrecisionFactor = Math.pow(10, 5);

/**
 * Tracks a run with timings and location data.
 */
class Timer {
	// _ indicates would-be private members (a note to self since JS
	// doesn't have robust encapsulation)
	_running = false;
	_locationArray = [];
	_periodArray = [];
	_totalTime = 0;
	_lastLong = 0;
	_lastLat = 0;

	/**
	 * Push a new timer period to the array.
	 * @private
	 */
	_newPeriod() {
		this._currentPeriod = new TimerPeriod();
		this._periodArray.push(this._currentPeriod);
	}

	/**
	 * Start a new timer period.
	 */
	start() {
		this._newPeriod();
		this._running = true;
	}

	/**
	 * End the active timer period.
	 */
	pause() {
		this._totalTime += this._currentPeriod.stop();
		this._running = false;
	}

	/**
	 * Gets the current elapsed time.
	 * @returns {number} time elapsed in ms
	 */
	getCurrentTime() {
		if (this._running)
			return Date.now() - this._currentPeriod.startTime.getTime() + this._totalTime;
		else
			return this._totalTime;
	}

	/** Store a geolocation to the array as long as the co-ordinates are
	 * a sufficent distance from previously stored geolocation.
	 * @param geolocationPosition {GeolocationPosition}
	 */
	pushLocation(geolocationPosition) {
		// Rounds the co-ords for comparison according to precision factor
		// configured above
		const roundedLong = Math.round(geolocationPosition.coords.longitude * locationPrecisionFactor),
			  roundedLat = Math.round(geolocationPosition.coords.latitude * locationPrecisionFactor);
		// Checks the geolocation isn't too close to the last one first
		if (
			this._lastLong !== roundedLong
			&& this._lastLat !== roundedLat
		) {
			// Distance is sufficient
			// Update the stored last geolocation
			this._lastLong = roundedLong
			this._lastLat = roundedLat

			// Push the original unrounded co-ords
			this._locationArray.push({
				time: geolocationPosition.timestamp,
				lng: geolocationPosition.coords.longitude,
				lat: geolocationPosition.coords.latitude
			});
		}
	}

	/**
	 * Serialises data into an object for storage.
	 */
	serialise() {
		const output = {
			timing: []
		};
		// Serialise each timer period
		for (const period of this._periodArray)
			output.timing.push(period.serialise());
		// Only output route if there is one
		if (this._locationArray.length > 0)
			output.route = this._locationArray;
		return output
	}
}

/**
 * Tracks a period of time that the timer is active for. Collects two
 * timestamps, one at timer START and the other at timer PAUSE. Tracking
 * start and end timestamps and comparing the difference is less
 * computationally expensive and probably more accurate than incrementing
 * via setInterval().
 */
class TimerPeriod {
	startTime = new Date();
	endTime = new Date();

	/**
	 * Sets the start timestamp
	 */
	constructor() {
		this.startTime.setTime(Date.now());
	}

	/**
	 * Sets the end timestamp and returns the difference between the start
	 * and end timestamps.
	 * @returns {number} total running time.
	 */
	stop() {
		this.endTime.setTime(Date.now());
		return this.endTime.getTime() - this.startTime.getTime();
	}

	/**
	 * Serialises data into an object for storage.
	 */
	serialise() {
		return {
			start: this.startTime.getTime(),
			end: this.endTime.getTime()
		}
	}
}

/************** Variables **************/
let timerButton,
	locationButton,
	locationWatch,
	timerControlsContainer,
	timerObj = new Timer(),
	timerFormatSwapped = false,
	timerRefreshInterval;

/************** Initiate ***************/
window.addEventListener('load', function() {
	timerControlsContainer = document.getElementById('timer-section-controls');
	timerButton = document.getElementById('timer-button');
	timerButton.addEventListener('click', timerStart);
	locationButton = document.getElementById('timer-location-button');
	document.getElementById('timer-reset-button').addEventListener('click', timerConfirmReset);
	document.getElementById('timer-save-button').addEventListener('click', timerSave);
});

/************** Functions **************/

/**
 * Starts the timer and starts watching geolocation if enabled.
 */
function timerStart() {
	// Make sure the timer button isn't disabled
	if (!this.disabled) {

		timerObj.start();

		// Start updating the stopwatch
		timerRefreshInterval = setInterval(timerDisplayRefresh, timerRefreshRate);

		// HTML element changes
		timerButton.removeEventListener('click', timerStart);
		timerButton.addEventListener('click', timerPause);
		timerButton.classList.add('running');
		timerControlsContainer.classList.remove('hide');
		locationButton.disabled = true;

		// Start collecting location data (if enabled)
		if (locationButton.checked)
			locationWatch = navigator.geolocation.watchPosition(
				// Push location to an array upon success
				function (loc) {
					timerObj.pushLocation(loc);
				},
				function (err) {
					console.log(err);
				},
				// Allow 10 secs before error
				{timeout: 10000, enableHighAccuracy: true}
			);
	}
}

/**
 * Stops the timer and any watching of geolocation.
 */
function timerPause() {
	// Make sure the timer button isn't disabled
	if (!this.disabled) {

		timerObj.pause();

		// Stop updating the stopwatch
		clearInterval(timerRefreshInterval);

		// One last stopwatch refresh
		timerDisplayRefresh();

		// HTML element changes
		timerButton.removeEventListener('click', timerPause);
		timerButton.addEventListener('click', timerStart);
		timerButton.classList.remove('running');

		// Stop collecting location data
		if (locationButton.checked)
			navigator.geolocation.clearWatch(locationWatch);
	}
}

/**
 * Brings up a confirm dialog to confirm resetting the timer.
 * If confirm dialog isn't available (i.e. browser) just do it
 * anyway.
 */
function timerConfirmReset() {
	if (navigator.notification)
		navigator.notification.confirm(
			"Reset the timer without saving?",	// message
			buttonIndex => {					// callback
				if (buttonIndex === 1)
					timerReset();
			},
			"Confirm Reset"						// title
		);
	else
		timerReset();
}

/**
 * Start a fresh timer.
 */
function timerReset() {
	if (timerObj._running)
		timerPause();
	timerObj = new Timer();
	if (timerFormatSwapped)
		timerToggleFormat();
	timerDisplayRefresh();
	timerControlsContainer.classList.add('hide');
	locationButton.disabled = false;
}

/**
 * Save the timer to localstorage. Serialises timing and location
 * to JSON string Local storage usually has 5MB
 * available so it should be fine.
 */
function timerSave() {
	if (timerObj._running)
		timerPause();
	let saveData = localStorage.getItem('savedRuns');
	if (saveData === null)
		saveData = [];
	else
		// Clear the saveData if it cannot be parsed
		try {
			saveData = JSON.parse(saveData);
		} catch {
			saveData = [];
		}
	saveData.push(timerObj.serialise());
	localStorage.setItem('savedRuns', JSON.stringify(saveData));
	listLoaded = false; // List view will reload when opened
	timerReset();
}

/**
 * Toggles the format of the stopwatch display.
 * Starts off as m:s:ms and eventually switches to h:m:s.
 */
function timerToggleFormat() {
	timerFormatSwapped = !timerFormatSwapped;
	if (timerFormatSwapped) {
		// hide ms and show hours
		document.getElementById('timer-h-num').classList.remove('hide');
		document.getElementById('timer-h-div').classList.remove('hide');
		document.getElementById('timer-ms-num').classList.add('hide');
		document.getElementById('timer-ms-div').classList.add('hide');

		// switch to 1 display refresh per second
		if (timerObj._running) {
			clearInterval(timerRefreshInterval);
			timerRefreshInterval = setInterval(timerDisplayRefresh, 1000);
		}
	} else {
		// hide hours and show ms
		document.getElementById('timer-h-num').classList.add('hide');
		document.getElementById('timer-h-div').classList.add('hide');
		document.getElementById('timer-ms-num').classList.remove('hide');
		document.getElementById('timer-ms-div').classList.remove('hide');
	}
}

/**
 * Refreshes the stopwatch display so long as the timer view is open.
 * Doesn't actually increment timer, just calculates time for display purposes.
 * Emulator in task manager shows ~15% CPU usage (3.9GHz 8thread) when
 * running this method 30 times per second.
 */
function timerDisplayRefresh() {
	// Only execute if the stopwatch is actually visible
	if (AidView.activeView === timerView) {

		// time calculations
		let currentTime = timerObj.getCurrentTime();
		let ms = currentTime % 1000,
			s = Math.floor((currentTime % 60000) / 1000),
			m = Math.floor((currentTime % 3600000) / 60000),
			h = Math.floor((currentTime % 86400000) / 3600000);

		// leading 0s
		if (s < 10)
			s = '0' + s;
		if (m < 10)
			m = '0' + m;

		// swap format if >1hr
		if (h > 0 && !timerFormatSwapped)
			timerToggleFormat();

		// format dependant processing
		if (timerFormatSwapped)
			// update hour
			document.getElementById('timer-h-num').innerText = h;
		else {
			// leading 0s for ms
			if (ms < 100)
				ms = ('00' + ms).substr(-3);
			// update ms
			document.getElementById('timer-ms-num').innerText = ms;
		}

		// update secs and mins
		document.getElementById('timer-s-num').innerText = s;
		document.getElementById('timer-m-num').innerText = m;
	}
}