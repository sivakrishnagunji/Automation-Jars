/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var caches;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportCaches', 'Export all caches from org ' + apigee.from.org + " environment " + apigee.from.env + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportCaches.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',' + env + ',exportAuditLogs';
		var done_count = 0;
		var done = this.async();
		grunt.verbose.writeln("========================= export Env CACHES ===========================");
		grunt.file.mkdir(filepath);

		var env_url = url + "/v1/organizations/" + org + "/environments/" + env + "/caches";

		grunt.verbose.writeln("Env Caches URL: " + env_url);
		log_file.write(format + ",Env Caches URL: " + env_url + '\n');
		request(env_url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				grunt.verbose.writeln("CACHES" + body);
				caches = JSON.parse(body);

				if (caches.length == 0) {
					log_file.write(format + ',No Caches' + '\n');
					grunt.verbose.writeln("No Cache");
					done();
				}
				for (var i = 0; i < caches.length; i++) {
					var host_url = env_url + "/" + caches[i];
					grunt.file.mkdir(filepath);
					grunt.verbose.writeln("Caches URL : " + host_url);
					log_file.write(format + ",Caches URL : " + host_url + '\n');
					// var env = this.env;

					//Call caches details
					if (host_url.length > 1024) {
						grunt.log.write("SKIPPING Caches, URL too long: ");
						done_count++;
					} else {
						request(host_url, function (error, response, body) {
							if (!error && response.statusCode == 200) {

								var host_detail = JSON.parse(body);
								var host_file = filepath + "/" + host_detail.name;
								grunt.file.write(host_file, body);
								grunt.verbose.writeln("CACHE " + body);
								log_file.write(format + ',' + host_detail.name + ',Success,' + body + '\n');
								log_file.write(format + ',' + host_detail.name + ',Success,' + 'Exported Caches ' + host_detail.name + '\n');
								grunt.verbose.writeln('Exported Caches ' + host_detail.name);
							}
							else {
								log_file.write(format + ',' + host_detail.name + ',Fail,' + 'Error Exporting Caches ' + host_detail.name + '\n' + error + '\n');
								grunt.verbose.writeln('Error Exporting Caches ' + host_detail.name);
								grunt.log.error(error);
							}

							done_count++;
							if (done_count == caches.length) {
								grunt.log.ok('Processed ' + done_count + ' caches');
								grunt.verbose.writeln("================== export caches DONE()");
								done();
							}
						}).auth(userid, passwd, true);
					}
					// End Caches details
				};

			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
	});

};
