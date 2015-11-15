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
*A utility to manage events which depend on multiple asynchronous events
*@this {CoincidenceCallbackRegistry}
*@param {none}
*/
var CoincidenceCallbackRegistry = function () {
	this.registry = {};
};

/**
*Register an event as dependent upon multiple asynch events
*@this {CoincidenceCallbackRegistry}
*@param {string} name the identifier for the thing which must happen after other things
*@param {array} reqs the array of strings identifying the asynchronous events which must happen first
*@param {function} callback the callback function which must be run after the reqs have completed
*/
CoincidenceCallbackRegistry.prototype.register = function(name, reqs, callback) {
	var ONAME = 'CoincidenceCallbackRegistry';
	var FNAME = 'register';
	
	this.registry[name] = {reqs: reqs,callback: callback};
	log.log(3,ONAME,FNAME,'registering a callback',this.registry);
};

/**
*Removes a completed event from the registry reqs list
*@this {CoincidenceCallbackRegistry}
*@param {string} name the key in the registry which identifies  the thing which must happen after other things 
*@param {string} member the name of the req event which has completed
*/
CoincidenceCallbackRegistry.prototype.memberReady = function(name, member) {
	var ONAME = 'CoincidenceCallbackRegistry';
	var FNAME = 'memberReady';
	log.log(3,ONAME,FNAME,member+' is ready for '+name,this.registry);
	var entry = this.registry[name];
	if(entry != null) {
		var index = entry.reqs.indexOf(member);
		if(index > -1) {
			entry.reqs.splice(index,1);
			if (entry.reqs.length == 0) {
				entry.callback();
				//this.registry.splice(i,1);
				this.registry[name] = null;
			}
		}
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