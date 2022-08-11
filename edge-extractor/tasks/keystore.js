/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var keystores;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportKeyStores', 'Export all keystores from org ' + apigee.from.org + " environment " + apigee.from.env + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportKeyStores.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',' + env + ',exportKeyStores';
		var done_count = 0;
		var done = this.async();
		grunt.verbose.writeln("========================= export Env KEYSTORES ===========================");
		grunt.file.mkdir(filepath);

		var env_url = url + "/v1/organizations/" + org + "/environments/" + env + "/keystores";

		grunt.verbose.writeln("Env Keystores URL: " + env_url);
		log_file.write(format + ",Env Keystores URL: " + env_url + '\n');
		request(env_url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				grunt.verbose.writeln("Keystores" + body);
				keystores = JSON.parse(body);

				if (keystores.length == 0) {
					log_file.write(format + ',No Keystores' + '\n');
					grunt.verbose.writeln("No Keystores");
					done();
				}
				for (var i = 0; i < keystores.length; i++) {
					var host_url = env_url + "/" + keystores[i];
					grunt.file.mkdir(filepath);
					grunt.verbose.writeln("Keystore URL : " + host_url);
					log_file.write(format + ",Keystore URL : " + host_url + '\n');
					// var env = this.env;

					//Call keystore details
					if (host_url.length > 1024) {
						grunt.log.write("SKIPPING Keystore, URL too long: ");
						done_count++;
					} else {
						request(host_url, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var host_detail = JSON.parse(body);
								var host_file = filepath + "/" + host_detail.name;
								grunt.verbose.writeln("KEYSTORE " + body);
								log_file.write(format + ',' + host_detail.name + ',Success,' + "KEYSTORE " + body + '\n');
								grunt.file.write(host_file, body);
								log_file.write(format + ',' + host_detail.name + ',Success,' + 'Exported Keystore ' + host_detail.name + '\n');
								grunt.verbose.writeln('Exported Keystore ' + host_detail.name);
							}
							else {
								log_file.write(format + ',' + host_detail.name + ',Fail,' + 'Error Exporting Keystore ' + host_detail.name + '\n' + error + '\n');
								grunt.verbose.writeln('Error Exporting Keystore ' + host_detail.name);
								grunt.log.error(error);
							}

							done_count++;
							if (done_count == keystores.length) {
								grunt.log.ok('Processed ' + done_count + ' keystore');
								grunt.verbose.writeln("================== export keystore DONE()");
								done();
							}
						}).auth(userid, passwd, true);
					}
					// End Keystore details
				};

			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
	});

};
