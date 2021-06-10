// TODO: Delete buttons
// TODO: Dedicated map buttons
// TODO: Calculate distance
// TODO: Sort (newest/oldest/longest)

/************* Variables *************/
let listLoaded = false,
	listElement;

/************* Initialise ************/
window.addEventListener('load', function() {
	listElement = document.getElementById('events-list');
	document.getElementById('list-nav').addEventListener('click', function() {
		if (!listLoaded)
			listLoad();
	});
});

/************* Functions *************/

/**
 * Populate the list.
 */
function listLoad() {
	// Clear list
	listElement.innerHTML = "";

	// Grab data from localstorage
	let saveData = localStorage.getItem('savedRuns');

	// Abort if JSON fails to parse
	try {
		saveData = JSON.parse(saveData).reverse();
	} catch {
		return;
	}

	// Process each saved run
	for (const savedRun of saveData) {
		let startTime = new Date(),
			totalTime = 0,
			once = false,
			doContinue = false;

		// Process timing information
		// Time period contains two timestamps collected at START and PAUSE
		for (const timePeriod of savedRun.timing) {

			// Error control
			if (typeof timePeriod.start === 'undefined' || typeof timePeriod.end === 'undefined') {
				doContinue = true;
				break;
			}

			// Pick the smallest start time as the start time of the whole run
			if (!once || timePeriod.start < startTime.getTime()) {
				startTime.setTime(timePeriod.start);
				once = true;
			}

			// Keep a sum of the total time of all time periods
			totalTime += timePeriod.end - timePeriod.start;
		}

		// Skip if above error control was triggered
		if (doContinue)
			continue;

		// HTMLElements
		let eContainer = document.createElement('div'),
			eStart = document.createElement('p'),
			eTotal = document.createElement('p');
		eStart.classList.add('run-start-time');
		eTotal.classList.add('run-total-time');
		listElement.appendChild(eContainer);
		eContainer.appendChild(eStart);
		eContainer.appendChild(eTotal);

		// Format the start time
		eStart.innerText = new Intl.DateTimeFormat('default', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric'
		}).format(startTime);

		// Format the total time
		const h = Math.floor((totalTime % 216000000) / 3600000),
			  m = Math.floor((totalTime % 3600000) / 60000),
			  s = Math.floor((totalTime % 60000) / 1000);
		eTotal.innerText = "Total time: " +
			(h > 0 ? h + " hour" + (h !== 1 ? "s, " : ", ") : "") +
			(h > 0 || m > 0 ? m + " minute" + (m !== 1 ? "s, " : ", ") : "") +
			s + " second" + (s !== 1 ? "s." : ".");

		// Let the user tap to open map if applicable
		if (savedRun.route) {
			eTotal.innerHTML += "<br>Route Available. Tap to open map.";
			eContainer.addEventListener('click', function () {
				// Map API will give an error if only one co-ord is given
				// so center on location instead
				if (savedRun.route.length === 1)
					mapDraw(
						savedRun.route[0].lng,
						savedRun.route[0].lat
					);
				else
					mapRoute(savedRun.route);
			});
		}
	}
}