function MarsViewModel(a){var b=this;b.mapApiPromise=a;var c=new Date;c.setFullYear(2012,7,6),b.solendar=new Solendar(0,c),b.sols=[],b.searchQuery=ko.observable(),b.solNumber=ko.observable(),b.map="",b.points=[],b.line="",b.subPoints=[],b.subLine=null,b.quadInfoWindow=null,b.landmarks=ko.observableArray(),b.currentPicArray=ko.observableArray(),b.currentPicID=ko.observable(),b.solPicError=ko.observable(),b.currentWeatherData=ko.observable(),b.solWeatherError=ko.observable(),b.solthText=ko.computed(function(){var a=b.solendar,c=b.solNumber(),d=a.SolToDate(c);return"On the "+a.Solth(c)+" sol ("+d.toLocaleDateString()+"):"},this),b.picText=ko.computed(function(){return null==b.currentPicArray()||0===b.currentPicArray().length?"No pictures available on this sol":"Picture "+(b.currentPicID()+1)+" of "+b.currentPicArray().length},this),b.wikiTimeMars=ko.observable(),b.wikiTimeError=ko.observable(),b.wikiCuriosityRover=ko.observable(),b.wikiCuriosityError=ko.observable(),b.hideMapSearch=ko.observable(!0),b.goToMap=function(){location.hash="mmap/"},b.goToInfo=function(){location.hash="info/"},b.goToSol=function(a){location.hash="sol/"+a},b.searchSol=function(a){var c="MarsViewModel",d="searchSol";log.log(3,c,d,"searching sol"),void 0!=b.subLine&&b.subLine.setMap(null),b.mapSetup.then(function(a){Promise.all([fullyAnimateCircle(b.sols.sols.slice(0,b.solNumber()),b.map),populatePicData(b.solNumber(),b.currentPicArray),populateWeatherData(b.solNumber(),b.currentWeatherData)]).then(function(a){log.log(3,c,d,"results from promise.all",a),a[1]===!1?b.solPicError("Sorry, couldn't retrieve Curiosity's pictures. Try again later"):b.solPicError(null),a[2]===!1?b.solWeatherError("Sorry, couldn't retrieve Curiosity's weather. Try again later"):void 0===b.currentWeatherData()?b.solWeatherError("No weather data available for this sol."):b.solWeatherError(null),log.log(3,c,d,"solPromises kept"),b.subLine=a[0],b.currentPicID(0),$("#SolSection").removeClass("hide")},function(a){log.log(3,c,d,"Something went wrong...",a)})})},b.search=function(a){var c=cleanse(b.searchQuery());return null===c||void 0===c||""===c?(showAllLandmarks(b.landmarks()),!0):c.startsWith(":")?(c=$.trim(c.slice(1)),b.solNumber(c),a===!0&&b.goToSol(c),!0):(filterLandmarks(b.landmarks(),c),!0)},b.onEnter=function(a,c){var d=c.which?c.which:c.keyCode;return 13===d&&(c.target.blur(),b.search(!0)),!0},b.clickLandmark=function(a,c){a.mapMarker.clicker(),b.hideMapSearch(!0)},b.prevPic=function(a,c){b.currentPicID(b.currentPicID()-1)},b.nextPic=function(a,c){b.currentPicID(b.currentPicID()+1)};var d=getLocations();b.mapPromise=b.mapApiPromise.then(function(){return buildMap()}),b.mapSetup=Promise.all([d,b.mapPromise]).then(function(a){return new Promise(function(c,d){b.sols=a[0],b.map=a[1],b.points=makePointsArray(b.sols),b.line=buildPath(b.map,b.points),b.line.icons=null,$("#map").removeClass("hide"),c(!0)})}),b.landmarks(initLandmarks()),b.mapPromise.then(function(a){var c="MarsViewModel",d="anomymous mapPromise.then";log.log(3,c,d,"directly calling then seperate from Promise.all",this),b.quadInfoWindow=new google.maps.InfoWindow,b.landmarks().forEach(function(c,d){c.mapMarker=addLandmark(a,c,b.quadInfoWindow)})}),populateMarsTimeData(b.wikiTimeMars,b.wikiTimeError),populateCuriosityData(b.wikiCuriosityRover,b.wikiCuriosityError),$(".solCloser").click(function(){b.goToMap()}),$(".infoCloser").click(function(){b.goToMap()}),$(".infoIcon").click(function(){b.goToInfo()}),$(".searchIcon").click(function(){console.log("caught search icon click"),b.hideMapSearch(!1)}),Sammy(function(){this.get("#mmap/",function(){$("#SolSection").addClass("hide"),$("#InfoSection").addClass("hide"),b.searchQuery("")}),this.get("#info/",function(){$("#InfoSection").removeClass("hide")}),this.get("#sol/:sol",function(){var a=this.params.sol;b.solNumber()!==a&&b.solNumber(a),b.searchQuery(":"+a);var c=cleanse(a);$("#MapSearchSection").addClass("hide"),b.searchSol(c)}),this.get("",function(){})}).run()}function getMapApi(){var a="Global",b="getMapApi";return log.log(3,a,b,"loading google maps api",this),new Promise(function(c,d){var e="http://maps.googleapis.com/maps/api/js",f=setTimeout(function(){c(!1)},8e3);$.getScript(e).done(function(d,e){clearTimeout(f),log.log(3,a,b,"the map script:",d),log.log(3,a,b,"the text status",e),c(!0)})})}function cleanse(a){var b=$.trim(a);return b=b.toLowerCase(),b=escapeHtml(b)}function getLocations(){var a="Global",b="getLocations";return log.log(3,a,b,"entering getLocations",this),new Promise(function(a,b){var c=new Worker("js/locationWorker.js");c.postMessage({}),c.onmessage=function(b){var d=b.data;c.terminate(),a(d)}})}function buildMap(){var a="Global",b="buildMap";return log.log(3,a,b,"entering buildMap",this),new Promise(function(a,b){var c=window.matchMedia("(max-width: 768px)"),d=c.matches?11:13,e=new google.maps.LatLng(-4.63,137.395),f={center:e,zoom:d,mapTypeControl:!1},g=document.getElementById("map"),h=new google.maps.Map(g,f);h.cent=e;new google.maps.KmlLayer({url:"http://aaronbutler.github.io/tallgrass/src/data/quadrants.kml",preserveViewport:!0,map:h});a(h)})}function makePointsArray(a){for(var b=a.sols,c=[],d=0,f=b.length;f>d;d++){var g=b[d].locations;for(j=0,e=g.length;j<e;j++){var h=parseFloat(g[j].lat),i=parseFloat(g[j].lon);c.push({lat:h,lng:i})}}return c}function fullyAnimateCircle(a,b){var c=makePointsArray({sols:a}),d=buildPath(b,c);return new Promise(function(a,b){var c=d instanceof Function?d():d,e=0,f=window.setInterval(function(){e=(e+1)%201;var b=c.get("icons");b[0].offset=e/2+"%",c.set("icons",b),e/2===100&&(window.clearInterval(f),a(c))},20)})}function populatePicData(a,b){var c="picture promise",d="populatePicData";return new Promise(function(e,f){var g=setTimeout(function(){e(!1)},8e3),h="https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?api_key=DEMO_KEY&sol="+a;$.ajax({type:"GET",url:h,contentType:"text/plain",success:function(a){log.log(3,"pa","solPicArrayB","what came back from "+h,a);var f=solPicArrayB(a);log.log(3,"pa","solPicArrayB","what came back from solPicArray",f),b(f.length>=0?f:null),log.log(3,c,d,"after populating currentpicarray"),clearTimeout(g),e(!0)},error:function(a){log.log(3,c,d,"failed to populate picture data",a),e(!1)}})})}function populateWeatherData(a,b){return new Promise(function(c,d){var e="Weather promise",f="populateWeatherData",g="http://marsweather.ingenology.com/v1/archive/?format=jsonp&sol="+a,h=setTimeout(function(){c(!1)},8e3);$.ajax({type:"GET",dataType:"jsonp",url:g,success:function(a){var d=a.results[0];log.log(3,e,f,"Weather data: ",d),b(d),clearTimeout(h),c(!0)},error:function(a){log.log(3,e,f,"failed to populate weather data",a),c(!1)}})})}function initLandmarks(){var a="global",b="initLandmarks";log.log(1,a,b,"Entering initLandmarks");var c=[];return c.push(new Landmark("Yellowknife Bay Quadrant","https://en.wikipedia.org/wiki/Yellowknife_Bay,_Mars","Yellowknife Bay is a geologic formation in Gale Crater on the planet Mars. NASA's Mars Science Laboratory Rover, named Curiosity, arrived at the low lying depression on December 17, 2012, 125 sols, or martian days, into its 668 sol planned mission on the planet. Primary mission goals of the Mars Science Laboratory were to assess the potential habitability of the planet and whether or not the Martian environment is, or has ever been, capable of supporting life. The site was chosen after much study of the region by previous missions. The Mars Reconnaissance Orbiter observed morphological features created by the presence of liquid water, suggesting the presence of an ancient lake which could have sustained microbial life. The geologic depression takes its name from the city Yellowknife, capital of the Canadian Northwest Territories, in honor of the 4 billion year old rock in the region surrounding the city, which matches the approximate age of the uncovered rock in Gale Crater.",137.445,-4.58)),c.push(new Landmark("Mawson Quadrant","?","Martian rollover quadrant? Not much seemed to happen here.",137.445,-4.605)),c.push(new Landmark("Coeymans Quadrant","?","Martian rollover quadrant? Not much seemed to happen here.",137.42,-4.605)),c.push(new Landmark("Kimberley Quadrant","http://www.jpl.nasa.gov/news/news.php?feature=4100",'On Wednesday, NASAs Curiosity Mars rover drove the last 98 feet feet (30 meters) needed to arrive at a site planned since early 2013 as a destination for studying rock clues about ancient environments that may have been favorable for life.The rover reached a vantage point for its cameras to survey four different types of rock intersecting in an area called "the Kimberley," after a region of western Australia."This is the spot on the map weve been headed for, on a little rise that gives us a great view for context imaging of the outcrops at the Kimberley," said Melissa Rice of the California Institute of Technology, Pasadena. Rice is the science planning lead for what are expected to be several weeks of observations, sample-drilling and onboard laboratory analysis of the areas rocks.',137.42,-4.63)),c.push(new Landmark("Hanover Quadrant","http://mars.jpl.nasa.gov/msl/multimedia/images/?ImageID=6354",'This map shows in red the route driven by NASAs Curiosity Mars rover from the "Bradbury Landing" location where it touched down in August 2012 (blue star at upper right) through the 663rd Martian day, or sol, of the rovers work on Mars (June 18, 2014). The white line shows the planned route ahead to reach "Murray Buttes" (at white star), the chosen access point to destinations on Mount Sharp. The rover will complete a mission goal of working for a full Martian year on Sol 669 (June 24, 2014). A Martian year is 687 Earth days. Gridlines indicate quadrants charted before the rovers landing for purposes of geological mapping of the landing region within Mars Gale Crater. The Sol 663 location is within the Hanover quadrant. Next on the rovers route is the Shoshone quadrant.',137.395,-4.63)),c.push(new Landmark("Shoshone Quadrant","http://astrogeology.usgs.gov/news/astrogeology/sol-671-update-on-curiosity-from-usgs-scientist-ryan-anderson-long-drive"," After a 107 m drive on sol 670, we are now in Shoshone quad, and just 160 m from the edge of the landing ellipse! The sol 671 plan is a lot like the sol 670 plan, with a 3 hour drive as the main activity. These long drives often use visual odometry, where the rover takes pictures along the way to monitor how the drive is going and avoid obstacles. This is a great capability, allowing us to drive farther than we could otherwise, but a side effect is that it produces a lot of data. The result: less data available for science observations.All of which is to say that today was another data-constrained sol. There�s always a way to squeeze some science in though! Today�s plan has a color stereo image of a rock dubbed Lost Burro, a ChemCam passive observation of the sky, and a NavCam movie of the sky looking for clouds. (Passive means that we don�t fire the laser, we just passively collect the spectrum of the target.) We also managed to squeeze a ChemCam measurement of our titanium calibration target and a MAHLI end-of-drive stowed image between the orbiter communication passes. And of course, we always do routine environmental monitoring with RAD, REMS, and DAN. Plus, after each drive we take clast survey images of the ground with Mastcam. Not bad for a data-constrained sol! ",137.395,-4.655)),c.push(new Landmark("Arlee Quadrant","http://missoulian.com/news/local/nasa-comes-to-arlee-the-martian-one/article_382792c8-19fd-5320-b1ad-2769c8b5fa53.html",'The Mars rover Curiosity was rolling through Arlee on Friday. Not that Arlee. The one on Mars.�Because western Montana is interesting geologically, it ranked up there to get on the names list,� said Brian Nixon, who operates the Rover�s cameras for Malin Space Science Systems in San Diego. �Those are the formal names we use among team members to reference certain features. "A little while ago, the rover was going up something we called Logan Pass. That turned out to be too difficult to drive up, so I suggested the next gap over, which we called Marias Pass. If you�re going through Glacier (National Park) and you can�t make it up, you go south and go through the year-round pass.�',137.37,-4.655)),c.push(new Landmark("Windhoek Quadrant","http://www.az.com.na/lokales/windhoek-quadrat-auf-dem-mars.425665","Der jahrelange Leiter der Wissenschaftlergruppe, die mit dem Fahrzeug Curiosity den Mars erforscht, weilte wieder einmal in Namibia und findet die Naukluft ebenso interessant wie den Roten Planeten. Bald soll sich das sechsr�drige Forschungslabor in ein Quadrat mit namibischem Namen begeben. Dr. John Grotzinger hielt in Windhoek einen Vortrag und ist Empf�nger der Henno-Martin-Medaille.",137.37,-4.68)),c.push(new Landmark("Bar Harbour Quadrant","Captain Jean-Luc Picard","Five card stud, nothing wild, and the sky is the limit.",137.345,-4.68)),c}function addLandmark(a,b,c){var d=new google.maps.LatLng(b.lat,b.lng),e=new google.maps.Marker({position:d,title:b.name,showme:ko.observable(!0)});return e.infoWindow=c,e.landmark=b,e.contentString="<h2>"+e.landmark.name+"</h2><p>"+e.landmark.description+"</p><h3>From: "+e.landmark.credits+"</h3>",e.map=a,google.maps.event.addListener(c,"closeclick",function(){a.setCenter(a.cent),e.infoWindow.close()}),e.clicker=function(){e.setAnimation(google.maps.Animation.DROP),e.infoWindow.setContent(e.contentString),e.infoWindow.open(a,e)},e.addListener("click",function(){e.clicker()}),e.setMap(a),e}function filterLandmarks(a,b){a.forEach(function(a){var c=a.name.toLowerCase();c.indexOf(b)>=0?(a.showme(!0),a.mapMarker.setVisible(!0)):(a.showme(!1),a.mapMarker.setVisible(!1))})}function showAllLandmarks(a){a.forEach(function(a){a.showme(!0),a.mapMarker.setVisible(!0)})}function solPicArray(a){for(var b=a,c=[],d=["ccam_images","fcam_images","rcam_images","ncam_images","mastcam_left_images","mastcam_right_images","mahli_images","mardi_images"],e=0,f=d.length;f>e;e++)for(var g=d[e],h=b[d[e]],i=0,j=h.length;j>i;i++){var k=h[i].images;if(void 0!=k)for(var l=0,m=k.length;m>l;l++){var n=k[l].url,o={url:n,cam:g};c.push(o)}}return c}function solPicArrayB(a){for(var b=a.photos,c=[],d=0,e=b.length;e>d;d++){var f=b[d].camera.full_name,g=b[d].img_src,h={url:g,cam:f};c.push(h)}return c}function populateMarsTimeData(a,b){var c="global",d="populateMarsTimeData",e=setTimeout(function(){b("Sorry, couldn't reach the wikipedia API. Try again later")},8e3),f="https://en.wikipedia.org/w/api.php?action=opensearch&search=Timekeeping_on_Mars&format=json";$.ajax({type:"GET",dataType:"jsonp",url:f,success:function(f){log.log(3,c,d,"got Mars  time data",f);var g=f[3][0],h=f[2][0];b(null),clearTimeout(e),a({link:g,blurb:h})},error:function(a){log.log(3,c,d,"failed to populate mars time data",a)}})}function populateCuriosityData(a,b){var c="global",d="populateCuriosityData",e=setTimeout(function(){b("Sorry, couldn't reach the wikipedia API. Try again later")},8e3),f="https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=Curiosity_%28rover%29";$.ajax({type:"GET",dataType:"jsonp",url:f,error:function(a,b,e){log.log(3,c,d,"failed to populate curiosity data",a)},success:function(c){var d=c.query.pages,f=Object.keys(d)[0],g=d[f].extract;g=g.replace(/\^/g,""),b(null),clearTimeout(e),a(g)}})}$(document).ready(function(){var a=getMapApi();viewModel=new MarsViewModel(a),ko.applyBindings(viewModel)});var buildPath=function(a,b){var c={path:google.maps.SymbolPath.CIRCLE,scale:8,strokeColor:"#393"},d=b instanceof Function?b():b,e=new google.maps.Polyline({path:d,icons:[{icon:c,offset:"0%"}],map:a});return e};