/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var async = require('async');
var apps;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportApps', 'Export all apps from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportApps.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',exportApps';
		var done_count = 0;
		var dev_count = 0;
		var total_apps = 0;
		var dev_url;
		var done = this.async();
		grunt.verbose.writeln("========================= export Apps ===========================");
		grunt.verbose.writeln("getting developers..." + url);
		url = url + "/v1/organizations/" + org + "/developers";


		var dumpApps = function (email) {
			dev_url = url + "/" + email;
			//Call developer details
			request(dev_url, function (dev_error, dev_response, dev_body) {
				if (!dev_error && dev_response.statusCode == 200) {
					// grunt.verbose.write("Dev body = " + dev_body);
					var dev_detail = JSON.parse(dev_body);
					var last = dev_detail.email;
					var dev_folder = filepath + "/" + dev_detail.email;
					grunt.file.mkdir(dev_folder);
					//Get developer Apps
					var apps_url = url + "/" + dev_detail.email + "/apps?expand=true";
					log_file.write(format + ',' + apps_url + '\n');
					grunt.verbose.writeln(apps_url);
					request(apps_url, function (app_error, app_response, app_body) {
						if (!app_error && app_response.statusCode == 200) {

							var apps_detail = JSON.parse(app_body);
							// log_file.write(format + app_body + '\n');
							grunt.verbose.writeln(app_body);
							var apps = apps_detail.app;
							//grunt.verbose.writeln(apps);
							if (apps) {
								for (var j = 0; j < apps.length; j++) {
									var app = apps[j];
									grunt.verbose.writeln(JSON.stringify(app));
									var file_name = dev_folder + "/" + app.name;
									grunt.verbose.writeln("writing file: " + file_name);
									grunt.file.write(file_name, JSON.stringify(app));
									log_file.write(format + ',' + app.name + ',Success,' + JSON.stringify(app) + '\n');
									grunt.verbose.writeln('App ' + app.name + ' written!');
								};
							}
							total_apps += apps.length;

							if (apps.length > 0) {
								grunt.log.ok('Retrieved ' + apps.length + ' apps for ' + dev_detail.email);
							} else {
								grunt.verbose.writeln('Retrieved ' + apps.length + ' apps for ' + dev_detail.email);
							}
						}
						else {
							log_file.write(format + ',' + app.name + ',Fail,' + 'Error Exporting ' + app.name + '\n');
							grunt.verbose.writeln('Error Exporting ' + app.name);
							grunt.log.error(body);
						}
						done_count++;
						if (done_count == dev_count) {
							grunt.log.ok('Exported ' + total_apps + ' apps for ' + done_count + ' developers');
							grunt.verbose.writeln("================== export Apps DONE()");
							done();
						}
					}).auth(userid, passwd, true);
				}
				else {
					if (dev_error) {
						log_file.write(format + ',Fail,' + dev_error + '\n');
						grunt.log.error(dev_error);
					}
					else {
						log_file.write(format + ',Fail,' + dev_body + '\n');
						grunt.log.error(dev_body);
					}
				}
			}).auth(userid, passwd, true);
			// End Developer details
		}

		var iterateOverDevs = function (start, base_url, callback) {
			var url = base_url;

			if (start) {
				url += "?startKey=" + encodeURIComponent(start);
			}
			grunt.verbose.writeln("getting developers..." + url);
			request(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var devs = JSON.parse(body);
					var last = null;

					// detect none and we're done
					if (devs.length == 0) {
						grunt.log.ok('No developers, done');
						done();
						// detect the only developer returned is the one we asked to start with; that's the end game, but wait.
					} else if ((devs.length == 1) && (devs[0] == start)) {
						grunt.log.ok('Retrieved TOTAL of ' + dev_count + ' developers, waiting for callbacks to complete');
					} else {
						dev_count += devs.length;
						if (start)
							dev_count--;

						for (var i = 0; i < devs.length; i++) {
							// If there was a 'start', don't do it again, because it was processed in the previous callback.
							if (!start || devs[i] != start) {
								callback(devs[i]);
								last = devs[i];
							}
						}

						grunt.log.ok('Retrieved ' + devs.length + ' developers');

						// Keep on calling getDevs() as long as we're getting new developers back
						iterateOverDevs(last, base_url, callback);
					}
				}
				else {
					if (error)
						grunt.log.error(error);
					else
						grunt.log.error(body);
				}

			}).auth(userid, passwd, true);
		}

		iterateOverDevs(null, url, dumpApps);
		/*
		setTimeout(function() {
			grunt.verbose.writeln("================== Apps Timeout done" );
			done(true);
		}, 3000);
		grunt.verbose.writeln("========================= export Apps DONE ===========================" );
		*/
	});

};


Array.prototype.unique = function () {
	var a = this.concat();
	for (var i = 0; i < a.length; ++i) {
		for (var j = i + 1; j < a.length; ++j) {
			if (a[i].name === a[j].name)
				a.splice(j--, 1);
		}
	}
	return a;
};
