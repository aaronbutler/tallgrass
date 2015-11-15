/**
*@author Aaron Butler
*Creates an instance of a Solendar object, to allow for conversion between Earth days and Mars sols for a rover
*@constructor
*@this {Solendar}
*@param {number} firstSol 0 or 1 depending on the rover
*/
var Solendar = function(firstSol,firstDate) {
	this.firstSol = firstSol; //0 or 1 depending on how the rover clock started
	this.firstDate = firstDate;
};

/**
*Converts a particular Martian sol to an Earth date
*@this {Solendar}
*@param {number} sol the sol number for the associated rover
*@returns {date}
*/
Solendar.prototype.SolToDate = function(sol) {
	//console.log(this.firstSol + ': '+this.firstDate);
	var sols = sol - this.firstSol;
	var day = this.firstDate.getDate();
	var month = this.firstDate.getMonth();
	var year = this.firstDate.getFullYear();
	//console.log(day+' '+month+' '+year);
	
	var days = sols * (1.027492);

	var d = new Date();
	d.setFullYear(year,month,day+days);
	//console.log(this.sol + ': '+d);
	return d;
};

/**
*Converts a particular Earth date to a Martian sol
*@this {Solendar}
*@param {date} date the Earth date in the lifespan of the associated rover
*@returns {number} sol the sol for the associated rover
*/
Solendar.prototype.DateToSol = function(date) {

	var days = (date - this.firstDate)/86400000;
	var sols = days * (.9732439);

	return sols + this.firstSol;
};

/**
*Converts a number to an English string (1 to 1st, 2 to 2nd, 583 to 583rd)
*@this {Solendar}
*@param {number} solnum the number to turn into a string
*/
Solendar.prototype.Solth = function(solnum) {
	if(solnum%100 > 10 && solnum%100 < 20) {
		return solnum + 'th';
	}
	var tens = solnum % 10;
	switch(tens) {
		case 1:
			return solnum+'st';
		case 2:
			return solnum+'nd';
		case 3:
			return solnum+'rd';
		default:
			return solnum+'th';
	}
};

/**
**Creates an instance of a Landmark object, to hold information about Martian landmarks
*@constructor
*@this {Landmark}
*@param {string} name the name of the landmark
*@param {string} credits attribution
*@param {string} description html-safe description of the landmark
*@param {number} lng the longitude coordinate for the landmark
*@param {number} lat the latitude coordinage for the landmark
*/
var Landmark = function(name, credits, description, lng, lat) {
	this.name = name;
	this.credits = credits;
	this.description = description;
	this.lng = lng;
	this.lat = lat;
}





