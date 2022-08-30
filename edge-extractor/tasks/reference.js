/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var references;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportReferences', 'Export all references from org ' + apigee.from.org + " environment " + apigee.from.env + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportReferences.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',' + env + ',exportReferences';
		var done_count = 0;
		var done = this.async();
		grunt.verbose.writeln("========================= export Env REFERENCES ===========================");
		grunt.file.mkdir(filepath);

		var env_url = url + "/v1/organizations/" + org + "/environments/" + env + "/references";

		grunt.verbose.writeln("Env References URL: " + env_url);
		log_file.write(format + ",Env References URL: " + env_url + '\n');

		request(env_url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				grunt.verbose.writeln("REFERENCES" + body);
				references = JSON.parse(body);

				if (references.length == 0) {
					log_file.write(format + ',Success,' + 'No references' + '\n');
					grunt.verbose.writeln("No References");
					done();
				}
				for (var i = 0; i < references.length; i++) {
					var host_url = env_url + "/" + references[i];
					grunt.file.mkdir(filepath);
					grunt.verbose.writeln("References URL : " + host_url);
					log_file.write(format + ',' + references[i] + ',Success,' + "References URL : " + host_url + '\n');
					// var env = this.env;

					//Call references details
					if (host_url.length > 1024) {
						log_file.write(format + ',' + references[i] + ',Success,' + "SKIPPING References, URL too long: " + '\n');
						grunt.log.write("SKIPPING References, URL too long: ");
						done_count++;
					} else {
						request(host_url, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var host_detail = JSON.parse(body);
								var host_file = filepath + "/" + host_detail.name;
								grunt.verbose.writeln("REFERENCE " + body);
								grunt.file.write(host_file, body);
								log_file.write(format + ',' + host_detail.name + ',Success,' + body + '\n');
								log_file.write(format + ',' + host_detail.name + ',Success,' + 'Exported References ' + host_detail.name + '\n');
								grunt.verbose.writeln('Exported References ' + host_detail.name);

							}
							else {
								log_file.write(format + ',' + host_detail.name + ',Fail,' + 'Error Exporting References ' + host_detail.name + '\n' + error + '\n');
								grunt.verbose.writeln('Error Exporting References ' + host_detail.name);
								grunt.log.error(error);
							}

							done_count++;
							if (done_count == references.length) {
								grunt.log.ok('Processed ' + done_count + ' references');
								grunt.verbose.writeln("================== export references DONE()");
								done();
							}
						}).auth(userid, passwd, true);
					}
					// End References details
				};

			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
	});

};
