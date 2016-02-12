/**
*author Aaron Butler
*/
$(document).ready(function () {
	var mapApiPromise = getMapApi();
	viewModel = new MarsViewModel(mapApiPromise);
	ko.applyBindings(viewModel);


});

/**
*@author Aaron Butler
*Creates an instance of a MarsViewModel, the VM in knockout's MVVM
@this {MarsViewModel}
@param {mapApiPromise} the promise to asynchronously load the google maps api
*/
function MarsViewModel(mapApiPromise) {
	var self = this;
	self.mapApiPromise = mapApiPromise;
	//appModel
	var d = new Date();
	d.setFullYear(2012, 7, 6);
	self.solendar = new Solendar(0,d);
	self.sols = [];

	self.searchQuery = ko.observable();
	self.solNumber = ko.observable();

	//mapModel
	self.map = '';
	self.points = [];
	self.line = '';
	self.subPoints = [];
	self.subLine = null;
	self.quadInfoWindow = null;

	self.landmarks = ko.observableArray();

	//solModel
	self.currentPicArray = ko.observableArray();
	self.currentPicID = ko.observable();
	self.solPicError = ko.observable();

	self.currentWeatherData = ko.observable();
	self.solWeatherError = ko.observable();

	self.solthText = ko.computed(function() {
		var _s = self.solendar;
		var solth = self.solNumber();
		var d = _s.SolToDate(solth);
		return 'On the '+_s.Solth(solth) + ' sol ('+ d.toLocaleDateString()+'):';
	},this);

	self.picText = ko.computed(function() {
		if(self.currentPicArray() == null || self.currentPicArray().length === 0) {
			return "No pictures available on this sol";
		}
		else {return 'Picture '+(self.currentPicID() + 1) + ' of '+ self.currentPicArray().length;}
	},this);

	//infoModel
	self.wikiTimeMars = ko.observable();
	self.wikiTimeError = ko.observable();
	self.wikiCuriosityRover = ko.observable();
	self.wikiCuriosityError = ko.observable();

	//Style and dom variables/////////////
	self.hideMapSearch = ko.observable(true);
	self.hideInfoSection = ko.observable(true);
	self.hideSolSection = ko.observable(true);

	//Behaviors//////////////////////////////

	self.goToMap = function() { location.hash = 'mmap/'; };
	self.goToInfo = function() { location.hash = 'info/';};
	self.goToSol = function(sol) { location.hash = 'sol/' + sol; };

	self.clickSearchIcon = function() {
		self.hideMapSearch(false);
	}
	
	self.closeSolSection = function() {

		self.goToMap();
	}
	
	self.openInfoSection = function() {

		self.goToInfo();
	}
	
	self.closeInfoSection = function() {
		self.goToMap();
	}

	self.searchSol = function(solnum) {
		var ONAME = 'MarsViewModel';
		var FNAME = 'searchSol';

		log.log(3,ONAME,FNAME,'searching sol');
		if(self.subLine != undefined) {self.subLine.setMap(null);}

		self.mapSetup.then(function(response) {
			Promise.all([fullyAnimateCircle(self.sols.sols.slice(0,self.solNumber()),self.map), 
			  populatePicData(self.solNumber(),self.currentPicArray), 
			  populateWeatherData(self.solNumber(),self.currentWeatherData)]).then(function(arrayOfResults){
				log.log(3,ONAME,FNAME,'results from promise.all',arrayOfResults);
				if(arrayOfResults[1] === false){
					self.solPicError("Sorry, couldn't retrieve Curiosity's pictures. Try again later");
				}
				else {self.solPicError(null);}

				if(arrayOfResults[2] === false){
					self.solWeatherError("Sorry, couldn't retrieve Curiosity's weather. Try again later");
				}
				else if (self.currentWeatherData() === undefined) {
					self.solWeatherError("No weather data available for this sol.");
				}
				else {self.solWeatherError(null);}

				log.log(3,ONAME,FNAME,'solPromises kept');
				self.subLine = arrayOfResults[0];
				self.currentPicID(0);

				self.hideSolSection(false);

			}, function(e){
				log.log(3,ONAME,FNAME,'Something went wrong...',e);
			});
		});
	};

	self.search = function(enter) {

		var q = cleanse(self.searchQuery());

		if(q===null || q===undefined || q==='') {
			showAllLandmarks(self.landmarks());
			return true;
		}

		if(q.startsWith(':')) {
			q=$.trim(q.slice(1));
			self.solNumber(q);

			if(enter===true){self.goToSol(q);}

			return true;

		}
		else {
			filterLandmarks(self.landmarks(), q);
			return true;
		}
	};

	self.onEnter = function(d,e) {
		var keyCode = e.which?e.which:e.keyCode;

		if(keyCode === 13) {
			e.target.blur();
			self.search(true);
		}
		return true;
	};

	self.clickLandmark = function(d,e) {
		d.mapMarker.clicker();
		self.hideMapSearch(true);
	};

	self.prevPic = function(d,e) {
		self.currentPicID(self.currentPicID()-1);
	};

	self.nextPic = function(d,e) {
		self.currentPicID(self.currentPicID()+1);
	};

	//Initializers///////////////////////////
	var locationPromise = getLocations();

	self.mapPromise = self.mapApiPromise.then(function() {
		//return new Promise(function(resolve,request){resolve(buildMap());});
		return buildMap();
	});

	self.mapSetup = Promise.all([locationPromise, self.mapPromise]).then(function(arrayOfResults){
		return new Promise(function(resolve,reject){
			self.sols = arrayOfResults[0];
			self.map = arrayOfResults[1];

			self.points = makePointsArray(self.sols);
			self.line = buildPath(self.map, self.points);
			//self.line.icons = null;
			self.map.roverMarker.setPosition(self.points[0]);
			//$('#map').removeClass('hide');

			resolve(true);
		});
	});

	self.landmarks(initLandmarks());
	self.mapPromise.then(function(response){
		var ONAME = 'MarsViewModel';
		var FNAME = 'anomymous mapPromise.then';
		log.log(3,ONAME,FNAME,'directly calling then seperate from Promise.all',this);
		self.quadInfoWindow = new google.maps.InfoWindow();
		self.landmarks().forEach(function(landmark,i){
			landmark.mapMarker = addLandmark(response,landmark,self.quadInfoWindow);
		});
	});
	
	populateMarsTimeData(self.wikiTimeMars, self.wikiTimeError);
	populateCuriosityData(self.wikiCuriosityRover, self.wikiCuriosityError);




	Sammy(function() {

		this.get('#mmap/', function() {

			self.hideSolSection(true);
			self.hideInfoSection(true);
			self.searchQuery('');

		});

		this.get('#info/', function() {

			self.hideInfoSection(false);


		});

		this.get('#sol/:sol', function() {
			var sol = this.params.sol;

			if(self.solNumber() !== sol) {
				self.solNumber(sol);

			}
			self.searchQuery(':'+sol);

			var q = cleanse(sol);

			self.hideMapSearch(true);
			self.searchSol(q);

		});
		this.get('', function() {});
	}).run(); 

};

/**
*@function
*@name getMapApi
*load the google maps api into the global context
*@return the promise which resolves true
*/
function getMapApi() {

	var ONAME =  'Global';
	var FNAME = 'getMapApi';
	log.log(3,ONAME,FNAME,'loading google maps api',this);
	return new Promise(function(resolve,reject) {
		var apiLink = 'http://maps.googleapis.com/maps/api/js';
		var apiRequestTimeout = setTimeout(function(){resolve(false);},8000);
		$.getScript(apiLink)
			.done(function(script,textStatus){
				clearTimeout(apiRequestTimeout);
				log.log(3,ONAME,FNAME,'the map script:',script);
				log.log(3,ONAME,FNAME,'the text status',textStatus);
				resolve(true);
			});
	});
};

/**
*@function
*@name cleanse
*@param {query} the string to make lowercase and html-safe
*@return the cleansed string
*/
function cleanse(query) {
	var q = $.trim(query);
	q=q.toLowerCase();
	q=escapeHtml(q);
	return q;
}

/**
*@function
*@name getLocations
*creates the webworker which retrieves and parses the location data
*then puts the data in the promise
*@return the promise which resolves with the sols array
*/
function getLocations() {

	var ONAME =  'Global';
	var FNAME = 'getLocations';
	log.log(3,ONAME,FNAME,'entering getLocations',this);
	return new Promise(function(resolve,reject){
		var worker = new Worker('js/locationWorker.js');
		worker.postMessage({});
		worker.onmessage = function(e) {
			var sols = e.data;
			worker.terminate();
			resolve(sols);
		};
	});
};

/**
*@function
*@name buildMap
*Creates the google map with the quadrants kml overlay
*@return the promise which resolves to the map
*/
function buildMap() {
	var ONAME =  'Global';
	var FNAME = 'buildMap';
	log.log(3,ONAME,FNAME,'entering buildMap',this);
	return new Promise(function(resolve,reject){
//766 799
		var mqSmall = window.matchMedia( "(max-width: 766px)" );
		var mqMedium = window.matchMedia( "(min-width: 767px) and (max-width: 799px)" );
		var z=13;
		if(mqSmall.matches){z=12;}
		if(mqMedium.matches){z=13;}
		var latLng = new google.maps.LatLng(-4.63,137.395);
		var mapOptions = { center: latLng,
			zoom: z,
			mapTypeControl:false
		};

		var el = document.getElementById('map');
		var map = new google.maps.Map(el, mapOptions);
		map.cent = latLng;

		var quadLayer = new google.maps.KmlLayer({
			//url: 'http://aaronbutler.github.io/kmls/quadrants.kml',
			//url: 'http://aaronbutler.github.io/marsmap/kml/quadrants.kml',
			url: 'http://aaronbutler.github.io/tallgrass/src/data/quadrants.kml',
			preserveViewport:true,
			map: map
		});
		
		var roverMarker = new google.maps.Marker({
			icon: 'img/rover.png',
			title: 'Curiosity Rover',
			map: map
		});
		map.roverMarker = roverMarker;
		resolve(map);

	});
};


/**
*@function
*@name makePointsArray
*Take every lat/long point on the sols and put them in an ordered array
*@param {sols} the array of sols which includes location information
*@return the array of point objects for the map to use
*/
function makePointsArray(sols) {
	var solArray = sols.sols;
	var pointArray = [];
	for(var i=0,l=solArray.length;i<l;i++) {
		var locArray = solArray[i].locations;
		for(j=0,e = locArray.length;j<e;j++) {
			var lat = parseFloat(locArray[j].lat);
			var lon = parseFloat(locArray[j].lon);
			pointArray.push({lat: lat, lng: lon});
		}
	}
	return pointArray;
};

/**
*@function
*@name buildPath
*Create the polyline on the map
*@param {map} the google map object which will own the polyline
*@param {points} the array of points which will make up the polyline
*@return the generated line
*/
var buildPath = function(map, points) {
	var lineSymbol = {
		//path: google.maps.SymbolPath.CIRCLE,
		path: "m 83.46,66.59 c 4.5,-1.94 10.11,2.76 8.44,7.52 -1.32,4.72 -8.24,6.01 -11.23,2.14 -2.87,-3.07 -1.16,-8.5 2.79,-9.66 z m -37.92,0.14 c 4.13,-1.99 9.67,1.57 9.08,6.26 -0.44,5.22 -7.78,7.51 -11.18,3.57 -3.12,-2.88 -1.72,-8.34 2.1,-9.83 z m -34.06,0.09 c 4.15,-2.19 9.9,1.39 9.27,6.18 -0.42,5.01 -7.26,7.38 -10.83,3.91 C 6.53,74.2 7.57,68.47 11.48,66.82 Z M 55.59,53.73 c 2.2,-1.07 4.43,0.22 6.55,0.86 3.99,1.53 8.3,2.32 12.03,4.5 -2.56,1.28 -5.46,0.66 -8.19,0.77 C 56.46,59.7 46.91,60.18 37.4,59.62 43.48,57.71 49.55,55.75 55.59,53.73 Z M 80.58,51.3 c 1.22,0.49 2.44,0.99 3.66,1.5 -1.19,0.48 -2.39,0.96 -3.58,1.44 -0.04,-0.98 -0.06,-1.96 -0.08,-2.94 z m -4.93,-0.34 c 0.65,-0.03 1.94,-0.08 2.59,-0.11 -0.34,1.43 0.86,4.03 -1.22,4.3 C 74.87,55 76.05,52.35 75.65,50.96 Z M 34.88,45.09 c 2.5,-0.01 5.01,-0.01 7.51,-0.02 0,0.53 0,1.6 0,2.13 -2.5,0 -5,0 -7.5,0 0,-0.53 -0.01,-1.58 -0.01,-2.11 z M 16.19,39.54 c 0.8,0.43 1.6,0.87 2.4,1.31 0.26,2.57 2.48,4.06 4.14,5.75 0,2.67 0.01,5.34 0.04,8.01 -4.01,-2.11 -8.01,-4.23 -12,-6.35 1.83,-2.89 3.63,-5.8 5.42,-8.72 z m 4.98,-0.09 c 1.15,-0.02 2.3,-0.04 3.45,-0.06 2.8,3.33 5.51,6.73 8.32,10.06 13.47,0.03 26.94,-0.01 40.41,0.02 -0.01,2.14 -0.01,4.29 -0.02,6.44 -5.36,-1.6 -10.55,-3.98 -16.04,-5 -7.29,1.96 -14.34,4.74 -21.58,6.86 -3.52,0.76 -7.17,0.04 -10.58,-0.94 0.01,-3.71 0.01,-7.41 0.03,-11.12 -1.32,-1.32 -2.64,-2.63 -3.96,-3.95 -0.01,-0.58 -0.02,-1.73 -0.03,-2.31 z m 0.02,-7.08 c 0.98,0 1.96,0.01 2.94,0.01 -0.01,1.59 -0.01,3.18 -0.02,4.77 -0.72,0 -2.15,0.01 -2.87,0.01 -0.02,-1.6 -0.03,-3.19 -0.05,-4.79 z M 69.72,47.81 C 69.22,40.95 69.39,34.03 69.63,27.16 l 1.34,0.89 c 0.23,6.21 0.32,12.5 -0.04,18.7 l -1.21,1.06 z M 66.2,21.47 c 2.71,-0.01 5.43,-0.01 8.14,-0.01 0,0.97 0.01,2.91 0.01,3.88 -2.72,0 -5.43,0 -8.15,-0.01 0,-0.96 0,-2.89 0,-3.86 z m -2.02,-2.12 c 4.09,-0.3 8.25,-0.42 12.32,0.07 0.35,2.62 0.48,5.35 -0.06,7.95 -0.75,0.12 -2.25,0.37 -3,0.5 0.06,6.31 -0.02,12.62 0.05,18.93 0.98,0.44 1.89,1 2.74,1.66 3.43,0.06 6.7,1.1 9.85,2.35 0.02,0.89 0.06,2.65 0.07,3.54 -2.74,1.32 -5.54,2.55 -8.44,3.51 2.74,0.36 5.5,0.99 7.95,2.31 0.1,2.22 -3.14,2.71 -4.3,4.38 3.52,-0.84 7.62,-1.09 10.41,1.67 3.98,3.29 3.53,10.1 -0.76,12.92 -4.53,3.53 -12.2,1.32 -13.8,-4.31 -1.16,-2.89 0.26,-5.85 1.72,-8.32 0.25,-2.09 1.15,-3.98 2.55,-5.55 -1.87,-0.58 -3.72,-1.19 -5.58,-1.81 0.2,1.89 -0.74,3.57 -2.84,3.04 -10.56,0.04 -21.13,-0.09 -31.69,0.03 1.09,0.74 2.18,1.48 3.28,2.21 3.6,-0.98 7.89,-0.5 10.36,2.57 3.45,3.74 2.19,10.45 -2.38,12.7 -4.68,2.8 -11.55,0.28 -13,-5.05 -1.08,-3.28 0.49,-6.61 2.82,-8.9 -2.53,-1.89 -5.15,-3.86 -8.46,-3.97 -5,-1.77 -10.25,-2.09 -15.5,-2.17 0.79,1.8 1.09,3.75 1.02,5.71 2.96,2.46 4.81,6.67 2.96,10.35 -2.27,5.6 -10.56,6.93 -14.59,2.5 -3.37,-3.14 -3.15,-9.05 0.39,-11.98 2.44,-2.35 6.01,-2.52 9.18,-2.01 -0.32,-2.36 -1.83,-4.18 -3.47,-5.79 2.28,-2.32 6.15,-0.41 9.11,-0.94 -5.13,-2.87 -10.44,-5.39 -15.51,-8.37 2.44,-4.19 5.07,-8.27 7.59,-12.41 1.23,0.51 2.46,1.03 3.68,1.57 0.1,-2.64 -0.46,-5.42 0.35,-7.97 2.36,-0.28 4.75,-0.15 7.13,-0.14 0.17,2.51 0,5.04 0.23,7.54 1.57,2.69 3.92,4.84 5.66,7.43 0.19,-0.56 0.58,-1.67 0.77,-2.22 3.7,-0.26 7.44,-0.26 11.14,-0.04 1.22,1.01 0.41,2.98 0.76,4.36 7.41,0 14.81,0.01 22.22,0 0.01,-6.46 0,-12.92 0.01,-19.38 -1.12,-0.17 -2.24,-0.34 -3.36,-0.51 0.17,-2.63 -0.45,-5.44 0.42,-7.96 z",
		scale: .3,
		strokeColor: '#393'
	};
	var _p = points instanceof Function ? points() : points;
	var line = new google.maps.Polyline({
		path: _p,
		//icons: [{
			//icon: lineSymbol,
			//offset: '0%'
		//}],
		map: map
	});
	return line;
};

/**
*@function
*@name fullyAnimateCircle
*Take the array of sols, turn them in to a line, and animate the line with the icon
*@param {sols} the array of sols which includes location information
*@param {map} the google map which owns the line
*@return the promise which resolves to the line
*/
function fullyAnimateCircle(sols, map) {

	var pointArray = makePointsArray({sols: sols});

	var line = buildPath(map,pointArray);
	var rover = map.roverMarker;
	/*return new Promise(function(resolve, reject) {

		var _l = line instanceof Function ? line() : line;

			var count = 0;
			var id = window.setInterval(function() {

			  count = (count + 1) % 201;//it should end

			  var icons = _l.get('icons');
			  icons[0].offset = (count / 2) + '%';
			  _l.set('icons', icons);
			  if(count/2 === 100) {window.clearInterval(id);resolve(_l);}
			}, 20);
		});*/
		
	return new Promise(function(resolve, reject) {
		var _l = line instanceof Function ? line() : line;
		var count = 0;
		
			for(var i=0,l=pointArray.length;i<l;i++) {
				//var id = window.setInterval(function(point){
				setTimeout(function(point,j,k){
					//console.log(pointArray[i]);
					moveRover(rover, point);
					//map.roverMarker.setPosition(pointArray[i]);
					if(j==k-1){resolve(_l);}
				},10*i,pointArray[i],i,l);
				//window.clearInterval(id);
			}
			
			//resolve(_l);
		//}, 20);
		
	});

	
};

function moveRover(rover,point){
	rover.setPosition(point);
	//window.clearInterval(intervalId);
}

/**
*@function
*@name populatePicData
*Retrieves the picture data from nasa's web service and populates the picarray object
*@param {solNumber} the sol which requires picture data
*@param {picArray} the knockout observablearray which will hold the picture data
*@return the promise which resolves to true unless it times out, then it resolves to false
*/
function populatePicData(solNumber, picArray) {
	var ONAME = 'picture promise';
	var FNAME = 'populatePicData';

	return new Promise(function(resolve, reject) {
		var picRequestTimeout = setTimeout(function(){resolve(false);},8000);
		//var picLink = 'http://msl-raws.s3.amazonaws.com/images/images_sol'+solNumber+'.json';
		var picLink = 'https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?api_key=DEMO_KEY&sol='+solNumber;

		$.ajax({

			  type: 'GET',

			  url: picLink,


			  contentType: 'text/plain',
			  
			  success: function(result) {
				log.log(3,'pa','solPicArrayB','what came back from '+picLink,result);
				var pa = solPicArrayB(result);
				log.log(3,'pa','solPicArrayB','what came back from solPicArray',pa);

				if(pa.length >= 0) {

					picArray(pa);

				}
				else {

					picArray(null);

				}
				log.log(3,ONAME,FNAME,'after populating currentpicarray');
				clearTimeout(picRequestTimeout);
				resolve(true);
			},

			error: function(e) {
				log.log(3,ONAME,FNAME,'failed to populate picture data',e);
				resolve(false);

			}
		});

	});
};

/**
*@function
*@name populateWeatherData
*Retrieves weather data from the MAAS service for the specified sol
*@param {solNumber} the sol which requires weather data
*@param {weatherData} the knockout observable which will hold the weather data
*@return the promise which resolves  to true unless there is a timeout, in which case it resolves to false
*/
function populateWeatherData(solNumber, weatherData) {
	return new Promise(function(resolve, reject) {
		var ONAME = 'Weather promise';
		var FNAME = 'populateWeatherData';

		var weatherLink = 'http://marsweather.ingenology.com/v1/archive/?format=jsonp&sol='+solNumber;
		var weatherRequestTimeout = setTimeout(function(){resolve(false);},8000);
		$.ajax({
			type: 'GET',
			dataType: 'jsonp',
			url: weatherLink,
			success: function(result) {
				var data = result.results[0];
				log.log(3,ONAME,FNAME,'Weather data: ',data);
				weatherData(data);
				clearTimeout(weatherRequestTimeout);
				resolve(true);

			},
			
			error: function(e) {
				log.log(3,ONAME,FNAME,'failed to populate weather data',e);
				resolve(false);

			}
		});

	});
};

/**
*@function
*@name initLandmarks
*Creates the {Landmark} objects for the quadrants
*@return the array of landmarks
*/
function initLandmarks() {
	var ONAME = 'global';
	var FNAME = 'initLandmarks';
	log.log(1,ONAME,FNAME,'Entering initLandmarks');

	var landmarks = [];
	landmarks.push(new Landmark('Yellowknife Bay Quadrant','https://en.wikipedia.org/wiki/Yellowknife_Bay,_Mars',"Yellowknife Bay is a geologic formation in Gale Crater on the planet Mars. NASA's Mars Science Laboratory Rover, named Curiosity, arrived at the low lying depression on December 17, 2012, 125 sols, or martian days, into its 668 sol planned mission on the planet. Primary mission goals of the Mars Science Laboratory were to assess the potential habitability of the planet and whether or not the Martian environment is, or has ever been, capable of supporting life. The site was chosen after much study of the region by previous missions. The Mars Reconnaissance Orbiter observed morphological features created by the presence of liquid water, suggesting the presence of an ancient lake which could have sustained microbial life. The geologic depression takes its name from the city Yellowknife, capital of the Canadian Northwest Territories, in honor of the 4 billion year old rock in the region surrounding the city, which matches the approximate age of the uncovered rock in Gale Crater.",137.445,-4.58));

	landmarks.push(new Landmark('Mawson Quadrant','?','Martian rollover quadrant? Not much seemed to happen here.',137.445,-4.605));

	landmarks.push(new Landmark('Coeymans Quadrant','?','Martian rollover quadrant? Not much seemed to happen here.',137.42,-4.605));

	landmarks.push(new Landmark('Kimberley Quadrant','http://www.jpl.nasa.gov/news/news.php?feature=4100','On Wednesday, NASAs Curiosity Mars rover drove the last 98 feet feet (30 meters) needed to arrive at a site planned since early 2013 as a destination for studying rock clues about ancient environments that may have been favorable for life.The rover reached a vantage point for its cameras to survey four different types of rock intersecting in an area called "the Kimberley," after a region of western Australia."This is the spot on the map weve been headed for, on a little rise that gives us a great view for context imaging of the outcrops at the Kimberley," said Melissa Rice of the California Institute of Technology, Pasadena. Rice is the science planning lead for what are expected to be several weeks of observations, sample-drilling and onboard laboratory analysis of the areas rocks.',137.42,-4.63));

	landmarks.push(new Landmark('Hanover Quadrant','http://mars.jpl.nasa.gov/msl/multimedia/images/?ImageID=6354','This map shows in red the route driven by NASAs Curiosity Mars rover from the "Bradbury Landing" location where it touched down in August 2012 (blue star at upper right) through the 663rd Martian day, or sol, of the rovers work on Mars (June 18, 2014). The white line shows the planned route ahead to reach "Murray Buttes" (at white star), the chosen access point to destinations on Mount Sharp. The rover will complete a mission goal of working for a full Martian year on Sol 669 (June 24, 2014). A Martian year is 687 Earth days. Gridlines indicate quadrants charted before the rovers landing for purposes of geological mapping of the landing region within Mars Gale Crater. The Sol 663 location is within the Hanover quadrant. Next on the rovers route is the Shoshone quadrant.',137.395,-4.63 ));

	landmarks.push(new Landmark('Shoshone Quadrant','http://astrogeology.usgs.gov/news/astrogeology/sol-671-update-on-curiosity-from-usgs-scientist-ryan-anderson-long-drive',' After a 107 m drive on sol 670, we are now in Shoshone quad, and just 160 m from the edge of the landing ellipse! The sol 671 plan is a lot like the sol 670 plan, with a 3 hour drive as the main activity. These long drives often use visual odometry, where the rover takes pictures along the way to monitor how the drive is going and avoid obstacles. This is a great capability, allowing us to drive farther than we could otherwise, but a side effect is that it produces a lot of data. The result: less data available for science observations.All of which is to say that today was another data-constrained sol. There’s always a way to squeeze some science in though! Today’s plan has a color stereo image of a rock dubbed Lost Burro, a ChemCam passive observation of the sky, and a NavCam movie of the sky looking for clouds. (Passive means that we don’t fire the laser, we just passively collect the spectrum of the target.) We also managed to squeeze a ChemCam measurement of our titanium calibration target and a MAHLI end-of-drive stowed image between the orbiter communication passes. And of course, we always do routine environmental monitoring with RAD, REMS, and DAN. Plus, after each drive we take clast survey images of the ground with Mastcam. Not bad for a data-constrained sol! ',137.395,-4.655));

	landmarks.push(new Landmark('Arlee Quadrant','http://missoulian.com/news/local/nasa-comes-to-arlee-the-martian-one/article_382792c8-19fd-5320-b1ad-2769c8b5fa53.html','The Mars rover Curiosity was rolling through Arlee on Friday. Not that Arlee. The one on Mars.“Because western Montana is interesting geologically, it ranked up there to get on the names list,” said Brian Nixon, who operates the Rover’s cameras for Malin Space Science Systems in San Diego. “Those are the formal names we use among team members to reference certain features. "A little while ago, the rover was going up something we called Logan Pass. That turned out to be too difficult to drive up, so I suggested the next gap over, which we called Marias Pass. If you’re going through Glacier (National Park) and you can’t make it up, you go south and go through the year-round pass.”',137.37,-4.655));

	landmarks.push(new Landmark('Windhoek Quadrant','http://www.az.com.na/lokales/windhoek-quadrat-auf-dem-mars.425665','Der jahrelange Leiter der Wissenschaftlergruppe, die mit dem Fahrzeug Curiosity den Mars erforscht, weilte wieder einmal in Namibia und findet die Naukluft ebenso interessant wie den Roten Planeten. Bald soll sich das sechsrädrige Forschungslabor in ein Quadrat mit namibischem Namen begeben. Dr. John Grotzinger hielt in Windhoek einen Vortrag und ist Empfänger der Henno-Martin-Medaille.',137.37,-4.68));

	landmarks.push(new Landmark('Bar Harbour Quadrant','Captain Jean-Luc Picard','Five card stud, nothing wild, and the sky is the limit.',137.345,-4.68));

	return landmarks;
};

/**
*@function
*@name addLandmark
*Takes the array of landmarks and plots them on the map
*Also creates the infowindow and tells its closeclick to recenter the map
*And animates the marker on click
*@param {map} the map which will hold the markers/infowindows
*@param {landmark} the landmark to be added to the map
*@param {infoWindow} the infowindow to be opened on clicking the marker, and referenced in marker.clicker
*@return the marker
*/
function addLandmark(map, landmark, infoWindow) {
	var latlng = new google.maps.LatLng(landmark.lat,landmark.lng);
	var marker = new google.maps.Marker({
		position: latlng,
		title:landmark.name,
		showme: ko.observable(true),
		//clicker: function() {
			//this.setAnimation(google.maps.Animation.DROP);
			//this.infowindow.open(this.map, this);
		//}
	});
	
	marker.infoWindow = infoWindow;
	marker.landmark = landmark;
	marker.contentString = '<h2>'+marker.landmark.name+'</h2><p>'+marker.landmark.description+'</p><h3>From: '+marker.landmark.credits+'</h3>';
	//var infowindow = new google.maps.InfoWindow({content: contentString});

	//marker.infowindow = infowindow;
	marker.map = map;
	google.maps.event.addListener(infoWindow, 'closeclick', function() {
		map.setCenter(map.cent);
		marker.infoWindow.close();
	});
	marker.clicker = function() {
		marker.setAnimation(google.maps.Animation.DROP);
		marker.infoWindow.setContent(marker.contentString)
		marker.infoWindow.open(map,marker);
	}
	
	marker.addListener('click', function(){
		//marker.setAnimation(google.maps.Animation.DROP);
		//infowindow.open(map,marker);
		marker.clicker();
	});

	marker.setMap(map);

	return marker;
};

/**
*@function
*@name filterLandmarks
*Sets the visibility on the map and on the list of the landmarks based  on the search query
*@param {landmarks} the array of landmarks
*@param {q} the search query
*/
function filterLandmarks(landmarks, q) {
	landmarks.forEach(function(landmark){
		var name=landmark.name.toLowerCase();
		if(name.indexOf(q) >=0) {
			landmark.showme(true);
			landmark.mapMarker.setVisible(true);
		}
		else {
			landmark.showme(false);
			landmark.mapMarker.setVisible(false);
		}
	});
};

/**
*@function
*@name showAllLandmarks
*Makes all landmarks visible
*@param {landmarks} the array of landmarks which should be visible
*/
function showAllLandmarks(landmarks) {
	landmarks.forEach(function(landmark){

			landmark.showme(true);
			landmark.mapMarker.setVisible(true);

	});
};

/**
*@function
*@name solPicArray
*Converts the json object from the picture service  into array of objects containing a url and a cam
*Note: this is specific to the AWS service which stopped working in December 2015
*@param {text} the json object to  be converted
*@return the array of {url: ,cam:} objects
*/
function solPicArray(text) {
	var obj = text;

	var picObjs = [];
	var instruments = ['ccam_images','fcam_images','rcam_images','ncam_images','mastcam_left_images','mastcam_right_images','mahli_images','mardi_images'];

	for(var i=0,l=instruments.length;i<l;i++) {
		var cam = instruments[i];
		var instData = obj[instruments[i]];
		for(var m=0,n=instData.length;m<n;m++) {
			var instPics = instData[m]['images'];
			if(instPics != undefined) {
				for (var j=0,k=instPics.length;j<k;j++) {
					var url = instPics[j]['url'];
					var picObj = {url: url, cam: cam};

					picObjs.push(picObj);
				}
			}
		}
	}

	return picObjs;
};

/**
*@function
*@name solPicArrayB
*Converts the json object from the picture service  into array of objects containing a url and a cam
*Note: this is specific to the AWS service which stopped working in December 2015
*@param {text} the json object to  be converted
*@return the array of {url: ,cam:} objects
*/
function solPicArrayB(text) {
	var obj = text['photos'];

	var picObjs = [];
	//var instruments = ['ccam_images','fcam_images','rcam_images','ncam_images','mastcam_left_images','mastcam_right_images','mahli_images','mardi_images'];

	for(var i=0,l=obj.length;i<l;i++) {
		var cam = obj[i].camera.full_name;
		var url  = obj[i].img_src;
		//var instData = obj[instruments[i]];
		var picObj = {url: url, cam: cam};
		picObjs.push(picObj);
		/*for(var m=0,n=instData.length;m<n;m++) {
			var instPics = instData[m]['images'];
			if(instPics != undefined) {
				for (var j=0,k=instPics.length;j<k;j++) {
					var url = instPics[j]['url'];
					var picObj = {url: url, cam: cam};

					picObjs.push(picObj);
				}
			}
		}*/
	}

	return picObjs;
};

/**
*@function
*@name populateMarsTimeData
*Retrieves an intro blurb and link from wikipedia for information about timekeeping on Mars
*@param {wikiMarsTime} knockout observable which will hold the {link:, blurb:} object
*@param {timeError} knockout observable which will  hold a user readable error message on timeout
*/
function populateMarsTimeData(wikiMarsTime, timeError) {
	var ONAME = 'global';
	var FNAME = 'populateMarsTimeData';
	var timeRequestTimeout = setTimeout(function(){timeError("Sorry, couldn't reach the wikipedia API. Try again later");},8000);
	var wikiApiLink = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=Timekeeping_on_Mars&format=json';
	$.ajax({
		type: 'GET',
		dataType: 'jsonp',
		url: wikiApiLink,
		success: function(result) {	
			log.log(3,ONAME,FNAME,'got Mars  time data',result);

			var link = result[3][0];
			var blurb = result[2][0];
			timeError(null);
			clearTimeout(timeRequestTimeout);
			wikiMarsTime({link: link, blurb: blurb});
		},
		
		error: function(e) {
			log.log(3,ONAME,FNAME,'failed to populate mars time data',e);

		  }
	});

};

/**
*@function
*@name populateCuriosityData
*Retrieves an intro paragraph from wikipedia for information about the Curiosity rover
*@param {wikiCuriosity} knockout observable which will hold the plain text paragraph
*@param {curiosityError} knockout observable which will  hold a user readable error message on timeout
*/
function populateCuriosityData(wikiCuriosity, curiosityError) {
	var ONAME = 'global';
	var FNAME = 'populateCuriosityData';
	var curiosityRequestTimeout = setTimeout(function(){curiosityError("Sorry, couldn't reach the wikipedia API. Try again later");},8000);
	var wikiApiLink = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=Curiosity_%28rover%29';
	$.ajax({
		type: 'GET',
		dataType: 'jsonp',
		url: wikiApiLink,

		error: function(jqxhr, textstatus, e) {
			log.log(3,ONAME,FNAME,'failed to populate curiosity data',jqxhr);


		},
		success: function(result) {	

			var pages = result.query.pages;
			var pageid = Object.keys(pages)[0];
			var extract = pages[pageid].extract;
			extract = extract.replace(/\^/g, '');
			curiosityError(null);
			clearTimeout(curiosityRequestTimeout);
			wikiCuriosity(extract);

		}

	});


};