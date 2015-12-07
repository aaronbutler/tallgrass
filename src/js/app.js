/**
*author Aaron Butler
*/
$(document).ready(function () {
	viewModel = new MarsViewModel();
	ko.applyBindings(viewModel);
	
	$('.markerTitles').click(function(){$('#MapSearchSection').toggleClass('hide');});
});

/**
*@author Aaron Butler
*Creates an instance of a MarsViewModel, the VM in knockout's MVVM
@this {MarsViewModel}
*/
function MarsViewModel() {
	var self = this;
	
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
	
	//Behaviors//////////////////////////////
	
	self.goToMap = function() { location.hash = 'mmap/'; };
	self.goToInfo = function() { location.hash = 'info/';};
	self.goToSol = function(sol) { location.hash = 'sol/' + sol; };
	
	self.searchSol = function(solnum) {
		var ONAME = 'MarsViewModel';
		var FNAME = 'searchSol';

		log.log(3,ONAME,FNAME,'searching sol');
		if(self.subLine != undefined) {self.subLine.setMap(null);}

		self.mapSetup.then(function(response) {
			Promise.all([fullyAnimateCircle(self.sols.sols.slice(0,self.solNumber()),self.map), 
			  populatePicData(self.solNumber(),self.currentPicArray), 
			  populateWeatherData(self.solNumber(),self.currentWeatherData)]).then(function(arrayOfResults){
				console.dir(arrayOfResults);
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
				$('#SolSection').removeClass('hide');

			
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
	};
	
	self.prevPic = function(d,e) {
		self.currentPicID(self.currentPicID()-1);
	};
	
	self.nextPic = function(d,e) {
		self.currentPicID(self.currentPicID()+1);
	};
	
	//Initializers///////////////////////////
	var locationPromise = getLocations();
	self.mapPromise = buildMap();
	self.mapSetup = Promise.all([locationPromise, self.mapPromise]).then(function(arrayOfResults){
		return new Promise(function(resolve,reject){
			self.sols = arrayOfResults[0];
			self.map = arrayOfResults[1];
			
			self.points = makePointsArray(self.sols);
			self.line = buildPath(self.map, self.points);
			self.line.icons = null;
			$('#map').removeClass('hide');

			resolve(true);
		});
	});
	
	self.landmarks(initLandmarks());
	self.mapPromise.then(function(response){
		var ONAME = 'MarsViewModel';
		var FNAME = 'anomymous mapPromise.then';
		log.log(3,ONAME,FNAME,'directly calling then seperate from Promise.all',this);
		self.landmarks().forEach(function(landmark,i){
			landmark.mapMarker = addLandmark(response,landmark);
		});
	});
	
	populateMarsTimeData(self.wikiTimeMars, self.wikiTimeError);
	populateCuriosityData(self.wikiCuriosityRover, self.wikiCuriosityError);
	
	//client-side routes
	
	$('.solCloser').click(function(){
		self.goToMap();
	});
	
	$('.infoCloser').click(function(){
		self.goToMap();
	});
	$('.infoIcon').click(function(){
		self.goToInfo();
	});
	
	$('.searchIcon').click(function(){
		$('#MapSearchSection').toggleClass('hide');
	});
	
	Sammy(function() {

		this.get('#mmap/', function() {

			$('#SolSection').addClass('hide');
			$('#InfoSection').addClass('hide');
			self.searchQuery('');

		});
		
		this.get('#info/', function() {

			$('#InfoSection').removeClass('hide');

		});

		this.get('#sol/:sol', function() {
			var sol = this.params.sol;

			if(self.solNumber() !== sol) {
				self.solNumber(sol);
				
			}
			self.searchQuery(':'+sol);

			var q = cleanse(sol);
			$('#MapSearchSection').addClass('hide');
			self.searchSol(q);

		});
		this.get('', function() { this.app.runRoute('get', '#mmap'); });
	}).run(); 
	
	
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
	
		var mq = window.matchMedia( "(max-width: 768px)" );
		var z=mq.matches?11:13;
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
		path: google.maps.SymbolPath.CIRCLE,
		scale: 8,
		strokeColor: '#393'
	};
	var _p = points instanceof Function ? points() : points;
	var line = new google.maps.Polyline({
		path: _p,
		icons: [{
			icon: lineSymbol,
			offset: '0%'
		}],
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
	return new Promise(function(resolve, reject) {

		var _l = line instanceof Function ? line() : line;

			var count = 0;
			var id = window.setInterval(function() {

			  count = (count + 1) % 201;//it should end

			  var icons = _l.get('icons');
			  icons[0].offset = (count / 2) + '%';
			  _l.set('icons', icons);
			  if(count/2 === 100) {window.clearInterval(id);resolve(_l);}
			}, 20);
		});

	
};

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
		var picLink = 'http://msl-raws.s3.amazonaws.com/images/images_sol'+solNumber+'.json';
		
		$.ajax({

			  type: 'GET',

			  url: picLink,


			  contentType: 'text/plain',
			  
			  success: function(result) {
				var pa = solPicArray(result);
				log.log(3,'pa','solPicArray','what came back from solPicArray',pa);
				
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
*@return the marker
*/
function addLandmark(map, landmark) {
	var latlng = new google.maps.LatLng(landmark.lat,landmark.lng);
	var marker = new google.maps.Marker({
		position: latlng,
		title:landmark.name,
		showme: ko.observable(true),
		clicker: function() {
			this.setAnimation(google.maps.Animation.DROP);
			this.infowindow.open(this.map, this);
		}
	});
	
	var contentString = '<h2>'+landmark.name+'</h2><p>'+landmark.description+'</p><h3>From: '+landmark.credits+'</h3>';
	var infowindow = new google.maps.InfoWindow({content: contentString});

	marker.infowindow = infowindow;
	marker.map = map;
	google.maps.event.addListener(infowindow, 'closeclick', function() {
		map.setCenter(map.cent);
		infowindow.close();
	});
	
	marker.addListener('click', function(){
		marker.setAnimation(google.maps.Animation.DROP);
		infowindow.open(map,marker);
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