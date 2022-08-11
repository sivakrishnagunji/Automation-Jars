/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var async = require('async');
var devs;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportDevs', 'Export all developers from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportDevs.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',exportDevs';
		var dev_count = 0;
		var done_count = 0;
		var done = this.async();
		grunt.verbose.writeln("========================= export Devs ===========================");

		grunt.verbose.writeln("getting developers... " + url);
		url = url + "/v1/organizations/" + org + "/developers";

		var dumpDeveloper = function (email) {
			var dev_url = url + "/" + email;
			grunt.verbose.writeln("getting developer " + dev_url);
			log_file.write(format + ",getting developer " + dev_url + '\n');
			//Call developer details
			request(dev_url, function (dev_error, dev_response, dev_body) {
				if (!dev_error && dev_response.statusCode == 200) {
					// grunt.verbose.writeln(dev_body);
					var dev_detail = JSON.parse(dev_body);
					var dev_file = filepath + "/" + dev_detail.email;
					grunt.file.write(dev_file, dev_body);
					log_file.write(format + ',' + dev_detail.email + ',Success,' + dev_body + '\n');
					log_file.write(format + ',' + dev_detail.email + ',Success' + 'Dev ' + dev_detail.email + ' written!' + '\n');
					grunt.verbose.writeln('Dev ' + dev_detail.email + ' written!');
				}
				else {
					if (error) {
						log_file.write(format + ',' + email + ',Fail,' + dev_error + '\n');
						grunt.log.error(dev_error);
					}
					else
						log_file.write(format + ',' + email + ',Fail,' + dev_body + '\n');
					grunt.log.error(dev_body);
				}
				done_count++;
				if (done_count == dev_count) {
					grunt.log.ok('Exported ' + done_count + ' developers');
					grunt.verbose.writeln("================== export Devs DONE()");
					done();
				}
			}.bind({ dev_url: dev_url })).auth(userid, passwd, true);
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

		// get All developers
		iterateOverDevs(null, url, dumpDeveloper);
		/*
		setTimeout(function() {
			grunt.verbose.writeln("================== Devs Timeout done" );
			done(true);
		}, 3000);
		grunt.verbose.writeln("========================= export Devs DONE ===========================" );
		*/
	});

};
