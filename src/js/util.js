/**
*@author Aaron Butler
*Creates an instance of a Log object, to allow for more efficient debugging
@constructor
@this {Log}
@param {number} level the runtime log level for the {Log} instance 
*/
var Log = function(level) {
	this.level = level;
};

/**
*Generates a log to the console, a single line string and an optional console.dir of an object
*@this {Log}
*@param {number} level the log level for this particular log entry, will only occur if it is >= {Log.level}
*@param {string} objname the  name of the object invoking the log entry
*@param {string} methodname the method which is invoking the log entry
*@param {string} message the log message
*@param {object} object (optional) the object which will be logged in its entirety, if included
*/
Log.prototype.log = function(level, objname, methodname, message, object) {
	if(level < this.level) {
		return;
	}
	console.log(objname + '-' + methodname + ':' + message);
	if(object != null) {
		console.dir(object);
	}
};

/**
*Escapes characters which are reserved in html
*@author stolen from http://stackoverflow.com/questions/24816/escaping-html-strings-with-jquery
*@param string the string whose characters should be made html-safe
*@returns html escaped string
*/
function escapeHtml(string) {
	var entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': '&quot;',
		"'": '&#39;',
		"/": '&#x2F;'
	};
	return String(string).replace(/[&<>"'\/]/g, function (s) {
		return entityMap[s];
	});
};