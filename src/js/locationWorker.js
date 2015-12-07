/**
*@author Aaron Butler
*@copyright 2015
*@function
*@name onmessage
*a webworker external file which retrieves Curiosity rover location data and converts the xml to json format, organized by sol
*The returned json object looks like:
*{sols: [{locations: [{	
*arrivalTime: "2012-08-05T13:49:59Z"
*contributor: "Team MSLICE"
*dateAdded: "2015-09-30T19:28:30Z"
*drive: "00000"
*endSol: "00000"
*itemName: "0000000000"
*lat: "-4.5894669521344875"
*lon: "137.4416334989196"
*mapPixelH: "82253.03164549096"
*mapPixelV: "123500.99039381815"
*rot: "0.014572, -0.034982, 0.831579, 0.554112"
*site: "00000"
*startSol: "00000"
*x: "0.0"
*y: "0.0"
*z: "0.0"
*}]}]}
*where the initial sols array has an entry for every sol, whether or not the rover moved that sol
*and most of the data is irrelevant to me, but there in case I change my mind.
*@param {object} optional param which I do not use
*/
self.onmessage = function(e) {

	//makes the ajax request to get the locations.xml data
	var xhttp = new XMLHttpRequest();
	var ab;
	xhttp.responseType = 'text';
	xhttp.onreadystatechange = function() {

		if (xhttp.readyState === 4 && xhttp.status === 200) {
		   ab = xhttp.responseText;

			var obj = parseXMLLocationStr(ab);

			self.postMessage(obj);

		}
	};
	//xhttp.open("GET", "../../kml/locations.xml", true);
	//xhttp.open('GET','../kml/locations.xml',true);
	//xhttp.open("GET","http://mars.jpl.nasa.gov/msl-raw-images/locations.xml",true);
	xhttp.open('GET','../data/locations.xml',true);
	xhttp.send();
};

locationTag = {
	open: '<location>',
	close: '</location>'
};

/**
*@function
*@name parseXMLLocationStr
*Takes the entire locations.xml data as a string and returns a javascript object {sols: [array of sols data]}
*/
function parseXMLLocationStr(xString) {
	var startLocIndex, endLocIndex, currentLocTag;
	var allSols = [];
	var currentLoc;
	do {
		startLocIndex = xString.indexOf(locationTag.open) + locationTag.open.length;
		endLocIndex = xString.indexOf(locationTag.close);
		currentLocTag = xString.substr(startLocIndex, endLocIndex-startLocIndex);

		currentLoc = genericTagsToJson(currentLocTag);
		
		buildSols(allSols,currentLoc);

		xString = xString.substring(endLocIndex + locationTag.close.length);
	} while (xString.indexOf(locationTag.open) !== -1);

	return {sols: allSols};
	
};

/**
*@function
*@name buildSols
*Takes an array of sols and a location object and adds that object to any relevant sol, creating sols as needed
*@param {array} allSols modifies and/or adds entries to his array based on the start and end date in the loc object
*@param {object} loc an object of a single location's data
*/
function buildSols(allSols, loc) {
	var firstSol = parseInt(loc['startSol']);
	var lastSol = parseInt(loc['endSol']);

	var currentSol;

	for(var i=firstSol;i<=lastSol;i++) {
		if(allSols.length > 0) {
			if(allSols.length > i) {

				currentSol = allSols[i];
			}
			else {

				currentSol = {};
				currentSol.locations = [];
				allSols.push(currentSol);
			}
		}
		else {

			currentSol = {};
			currentSol.locations = [];
			allSols.push(currentSol);
		}
		currentSol.locations.push(loc);
	}
	
	
}

/**
*@function
*@name genericTagsToJson
*Takes xml elements of the form <a_name>a_value</a_name><b_name>b_value</b_name>
*and returns a javascript object of the form {a_name: a_value, b_name: b_value}
*@param {string} xString the xml elements in string format
*/
function genericTagsToJson(xString) {

	var genericTag = {
		left: '<',
		right: '>',
		leftClose: '</'
	};
	var json = {};
	var startIndex,endIndex,currentTag;
	var startLeft,startRight,endLeft,endRight;
	var currentTagStart, currentTagEnd;
	var currentSlice = xString;
	var currentContent;
	var i = 0;
	do {
		startLeft = currentSlice.indexOf(genericTag.left);
		startRight = currentSlice.indexOf(genericTag.right);
		
		currentTagStart = currentSlice.substr(startLeft+1,startRight-startLeft-1);
		currentTagEnd = genericTag.leftClose+currentTagStart+genericTag.right;
		endLeft = currentSlice.indexOf(currentTagEnd);
		endRight = endLeft+currentTagEnd.length;

		currentContent = currentSlice.substring(startRight+1,endLeft);

		json[currentTagStart] = currentContent;

		currentSlice = currentSlice.substring(endRight);
		i++;

	} while ((currentSlice.indexOf(genericTag.left) !== -1) && (i<40));

	return json;
}
