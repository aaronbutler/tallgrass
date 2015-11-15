$(document).ready(function () {
	viewModel = new MarsViewModel();
	ko.applyBindings(viewModel);
});

function MarsViewModel() {
	var self = this;
	
	/***********************************/
	/****Behaviors****/
	/***********************************/
	
	self.buildLandmarks = function() {
		var ONAME =  'MarsViewModel';
		var FNAME = 'buildLandmarks';
		log.log(3,ONAME,FNAME,'building landmarks',self);
		var landmarks = self.mapModel().landmarks();
		for(var i=0,l=landmarks.length;i<l;i++) {
			self.mapModel().landmarkers().push(addLandmark(self.map, landmarks[i]));
		}	
	}
	
	self.makePath = function() {

		self.mapModel().line(buildPath(self.map, self.mapModel().points));
		self.mapModel().line().icons = null;
	};
	
	self.searchEnter = function(d,e) {
		/*if($('#searchQuery').is(':focus')) {
			$('#menuPanel').addClass('widen');
		}*/
		var keyCode = e.which?e.which:e.keyCode;
		if (keyCode === 13) {
			//$('#menuPanel').removeClass('widen');
			if(self.infoWindow != undefined) {
				google.maps.event.trigger(self.infoWindow, "closeclick");
			}
			e.target.blur();
			self.executeSearch();
			return true;
		}
		else {
			return true;
		}
	};
	
	self.executeSearch = function() {	
		var q = $.trim(self.appModel().searchQuery());
		q=q.toLowerCase();
		q=escapeHtml(q);
		if(q.startsWith('sol:')) {
			q=$.trim(q.slice(4));
			self.appModel().solNumber(q);
			self.changeSol();
		}
		else {
			for(var i=0,l=self.mapModel().landmarkers().length;i<l;i++) {
				var title=self.mapModel().landmarkers()[i].title.toLowerCase();
				if(title.indexOf(q) >=0) {
					self.mapModel().landmarkers()[i].showme(true);
					self.mapModel().landmarkers()[i].setVisible(true);
				}
				else {
					self.mapModel().landmarkers()[i].showme(false);
					self.mapModel().landmarkers()[i].setVisible(false);
				}
			}
		}
	};
	
	self.asdf = function() {
			log.log(3,'viewmodel.changeSol','asdf','attempted callback function',self);
		};
		
	self.changeSol = function() {
		
		self.coincidenceCallbackRegistry.register('solInfoBubble',['pictures','weather'],self.buildSolBubble);

		if(self.mapModel().subLine() != undefined) {self.mapModel().subLine().setMap(null);}
		var solArray = self.appModel().sols().sols;

		self.mapModel().subPoints(makePointsArray({sols: solArray.slice(0,self.appModel().solNumber())}));
		self.mapModel().subLine(buildPath(self.map, self.mapModel().subPoints));
		animateCircle(self.mapModel().subLine, self.asdf);
		
		var picLink = 'http://msl-raws.s3.amazonaws.com/images/images_sol'+self.appModel().solNumber()+'.json';
		//var _this = self;
				
		$.ajax({
			  // The 'type' property sets the HTTP method.
			  // A value of 'PUT' or 'DELETE' will trigger a preflight request.
			  type: 'GET',

			  // The URL to make the request to.
			  url: picLink,

			  // The 'contentType' property sets the 'Content-Type' header.
			  // The JQuery default for this property is
			  // 'application/x-www-form-urlencoded; charset=UTF-8', which does not trigger
			  // a preflight. If you set this value to anything other than
			  // application/x-www-form-urlencoded, multipart/form-data, or text/plain,
			  // you will trigger a preflight request.
			  contentType: 'text/plain',
			  
			  success: function(result) {
				var pa = solPicArray(result);
				log.log(3,'pa','solPicArray','what came back from solPicArray',pa);
				self.solModel().currentPicId(null);
				self.solModel().currentPicArray(null);
				
				if(pa.length > 0) {
					self.solModel().currentPicId(0);
					self.solModel().currentPicArray(pa);
					
				}
				else {
					self.solModel().currentPicId(null);
					self.solModel().currentPicArray(null);
					
				}
				log.log(3,'solModel().currentPicArray()','changeSol-pictures','after populating currentpicarray',self.solModel().currentPicArray());
			  },
			  
			  error: function(e) {
				console.dir(e);
				alert("Sorry, couldn't reach the pictures");
			  }
		});
		
		var weatherLink = 'http://marsweather.ingenology.com/v1/archive/?format=jsonp&sol='+self.appModel().solNumber();
		$.ajax({
			type: 'GET',
			dataType: 'jsonp',
			url: weatherLink,
			success: function(result) {	
				self.solModel().weatherData(result.results[0]);
				//self.coincidenceCallbackRegistry.memberReady('solInfoBubble','weather');
				
			},
			
			error: function(e) {
				console.dir(e);
				alert("Sorry, couldn't reach the weather");
			  }
		});
	};
	
	self.prevPic = function() {
		self.solModel().currentPicId(self.solModel().currentPicId()-1);
	};
	
	self.nextPic = function() {
	console.log('going to next pic maybe...');
		self.solModel().currentPicId(self.solModel().currentPicId()+1);
	};
			
	
	
	/******************************************************************************/
	
	
	self.coincidenceCallbackRegistry = new CoincidenceCallbackRegistry();
	self.coincidenceCallbackRegistry.register('landmarks',['initLandmarks','buildMap'], self.buildLandmarks);
	self.coincidenceCallbackRegistry.register('path',['locationWorker','buildMap'],self.makePath);
	self.map = buildMap(self.coincidenceCallbackRegistry, ['landmarks','path']);
	
	
	
	/***********************************/
	/****MODELS****/
	/***********************************/
	self.appModel = ko.observable(new Object());
	self.mapModel = ko.observable(new Object());
	self.solModel = ko.observable(new Object());
	
	var d = new Date();
	d.setFullYear(2012, 7, 6);
	//self.solendar = ko.observable(new Solendar(0,d));
	self.appModel().solendar = ko.observable(new Solendar(0,d));
	self.appModel().searchQuery = ko.observable();
	self.appModel().solNumber = ko.observable();
	self.appModel().sols = ko.observable();
	
	
	self.mapModel().points = ko.observableArray();
	self.mapModel().line = ko.observable();
	self.mapModel().subPoints = ko.observableArray();
	self.mapModel().subLine = ko.observable();
	self.mapModel().landmarkers = ko.observableArray();
	self.mapModel().landmarks = ko.observableArray(initLandmarks(self.coincidenceCallbackRegistry, 'landmarks'));
	self.coincidenceCallbackRegistry.memberReady('landmarks', 'initLandmarks');//have to wait until the observable is actually made to call memberready
	log.log(3,'MarsViewModel','models section','trying to make landmarks',self);
	
	
	self.solModel().currentPicArray = ko.observableArray();
	self.solModel().currentPicId = ko.observable();
	self.solModel().weatherData = ko.observable();	
	
	self.solModel().solthText = ko.computed(function() {
		var _s = self.appModel().solendar();
		var solth = self.appModel().solNumber();
		var d = _s.SolToDate(solth);
		return 'On the '+_s.Solth(solth) + ' sol ('+ d.toLocaleDateString()+'):';
	},this);
	
	self.solModel().picText = ko.computed(function() {
		if(self.solModel().currentPicId() == undefined || self.solModel().currentPicId() == null || self.solModel().currentPicArray() == undefined) {return '';}
		var id = self.solModel().currentPicId();
		var t = 'Picture '+ (self.solModel().currentPicId()+1) + ' of '+ (self.solModel().currentPicArray().length) +
			', camera '+self.solModel().currentPicArray()[id]['cam']; 
		return t;
	});
	
	self.solModel().picZero = ko.computed(function() {
		if (self.solModel().currentPicId() == undefined || self.solModel().currentPicId()==null){return true;}
		return self.solModel().currentPicId() == 0;
	});
	self.solModel().picLast = ko.computed(function() {
		if(self.solModel().currentPicId() == undefined||self.solModel().currentPicId() == null||self.solModel().currentPicArray() == null) {return true;}
		return self.solModel().currentPicId() + 1 == self.solModel().currentPicArray().length;
	});
	
	self.solModel().currentPicSrc = ko.computed(function() {
		var _s = self.solModel().currentPicArray();
		var _id = self.solModel().currentPicId();
		var src;
		if(_s != undefined && _id != undefined) {
			src = _s[_id]['url'];
		}
		else {
			src='';
		}
		return src;
	},this);
	
	var worker = new Worker('js/locationWorker.js');
	worker.postMessage({});
	worker.onmessage = function(e) {
		log.log(1,'worker','onmessage','what came back from the worker',e.data);
		self.appModel().sols(e.data);
		worker.terminate();

		self.mapModel().points(makePointsArray(self.appModel().sols()));
		self.coincidenceCallbackRegistry.memberReady('path','locationWorker');

	};
	
};

function buildMap(registry, rNames) {
	var ONAME = 'global';
	var FNAME = 'buildMap';
	log.log(1, ONAME, FNAME, 'Entering buildMap...');
	
	var mq = window.matchMedia( "(max-width: 768px)" );
	var z=mq.matches?11:13;
	var latLng = new google.maps.LatLng(-4.63,137.395)
	var mapOptions = { center: latLng,
		zoom: z,
		mapTypeControl:false	
	};

	var el = document.getElementById('map');
	var map = new google.maps.Map(el, mapOptions);
	map.cent = latLng;
	
	var quadLayer = new google.maps.KmlLayer({
		//url: 'http://aaronbutler.github.io/kmls/quadrants.kml',
		url: 'http://aaronbutler.github.io/marsmap/kml/quadrants.kml',
		preserveViewport:true,
		map: map
	});
	log.log(2, ONAME, FNAME, 'Made the map, attached the cent, added the quadLayer', map);
	for(var i=0,l=rNames.length;i<l;i++) {
		registry.memberReady(rNames[i],FNAME);
	}
	return map;
	
}

function initLandmarks(registry, rName) {
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
	
	landmarks.push(new Landmark('Bar Harbour Quadrant','Captain Jean-Luc Picard','Five card draw, nothing wild, and the sky is the limit.',137.345,-4.68));
	
	
	return landmarks;
};

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
	var contentString = '<h2>'+landmark.name+'</h2><p>'+landmark.description+'</p>';
	
	var infowindow = new InfoBubble({minWidth: '400px', maxWidth: '400px'});
	infowindow.addTab('TAB',contentString);
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

//Take every lat/long point on the sols and put them in an ordered array, and return
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

// Create the polyline and add the symbol to it via the 'icons' property.
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

// Use the DOM setInterval() function to change the offset of the symbol
// at fixed intervals.
function animateCircle(line, asdf) {
	var _l = line instanceof Function ? line() : line;
	var a = asdf;
	var count = 0;
	var id = window.setInterval(function() {
		//if(_l.getPath())
	  count = (count + 1) % 201;//it should end

	  var icons = _l.get('icons');
	  icons[0].offset = (count / 2) + '%';
	  _l.set('icons', icons);
	  if(count/2 == 100) {window.clearInterval(id);asdf();}
  }, 20);
};

function solPicArray(text) {
	var obj = text;
	//var pics = [];
	var picObjs = [];
	var instruments = ['ccam_images','fcam_images','rcam_images','ncam_images','mastcam_left_images','mastcam_right_images','mahli_images','mardi_images'];

	for(var i=0,l=instruments.length;i<l;i++) {
		var cam = instruments[i]
		var instData = obj[instruments[i]];
		for(var m=0,n=instData.length;m<n;m++) {
			var instPics = instData[m]['images'];
			if(instPics != undefined) {					
				for (var j=0,k=instPics.length;j<k;j++) {
					var url = instPics[j]['url'];
					var picObj = {url: url, cam: cam};
					//pics.push(instPics[j]['url']);
					picObjs.push(picObj);
				}
			}
		}
	}

	return picObjs;
}