/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var userroles;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportRoles', 'Export all userroles from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportRoles.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',exportRoles';
		var done_count = 0;
		var done = this.async();
		grunt.verbose.writeln("========================= export USERROLES ===========================");
		grunt.file.mkdir(filepath);

		url = url + "/v1/organizations/" + org + "/userroles";

		grunt.verbose.writeln("Userroles URL: " + url);
		log_file.write(format + ",Userroles URL: " + url + '\n');
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				grunt.verbose.writeln("USERROLES" + body);
				userroles = JSON.parse(body);

				if (userroles.length == 0) {
					log_file.write(format + ',No Roles' + '\n');
					grunt.verbose.writeln("No Roles");
					done();
				}
				for (var i = 0; i < userroles.length; i++) {
					var roles_url = url + "/" + userroles[i];
					if (userroles[i] != "devadmin") {
						grunt.file.mkdir(filepath);
						grunt.verbose.writeln("Userroles URL : " + roles_url);
						log_file.write(format + ',' + userroles[i] + ',Success,' + "Userroles URL : " + roles_url + '\n');
						// var env = this.env;

						//Call role details
						if (roles_url.length > 1024) {
							grunt.log.write("SKIPPING Userroles, URL too long: ");
							done_count++;
						} else {
							request(roles_url, function (error, response, body) {
								if (!error && response.statusCode == 200) {
									var host_detail = JSON.parse(body);
									var host_file = filepath + "/" + host_detail.name;
									grunt.verbose.writeln("USERROLES " + body);
									log_file.write(format + ',' + host_detail.name + ',Success,' + body + '\n');
									grunt.file.write(host_file, body);
									log_file.write(format + ',' + host_detail.name + ',Success,' + 'Exported Userroles ' + host_detail.name + '\n');
									grunt.verbose.writeln('Exported Userroles ' + host_detail.name);
								}
								else {
									log_file.write(format + ',' + userroles[i] + ',Fail,' + 'Error Exporting Userroles ' + userroles[i] + '\n');
									grunt.verbose.writeln('Error Exporting Userroles ' + userroles[i]);
									grunt.log.error(error);
								}

								done_count++;
								if (done_count == userroles.length) {
									grunt.log.ok('Processed ' + done_count + ' Userroles');
									grunt.verbose.writeln("================== export Userroles DONE()");
									done();
								}
							}).auth(userid, passwd, true);
						}
					}
					// End Userroles details
				};

			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
	});

};
