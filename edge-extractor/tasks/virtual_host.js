/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var virtualhosts;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportVirtualHosts', 'Export all virtualhosts from org ' + apigee.from.org + " environment " + apigee.from.env + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportVirtualHosts.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',' + env + ',exportVirtualHosts';
		var done_count = 0;
		var done = this.async();
		grunt.verbose.writeln("========================= export Env Virtualhosts ===========================");
		grunt.file.mkdir(filepath);

		var env_url = url + "/v1/organizations/" + org + "/environments/" + env + "/virtualhosts";

		grunt.verbose.writeln("Env Virtual host URL: " + env_url);
		log_file.write(format + ",Env Virtual host URL: " + env_url + '\n');

		request(env_url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				grunt.verbose.writeln("VIRTUAL HOSTS" + body);
				virtualhosts = JSON.parse(body);

				if (virtualhosts.length == 0) {
					log_file.write(format + ',No Virtualhosts' + '\n');
					grunt.verbose.writeln("No Virtualhosts");
					done();
				}
				for (var i = 0; i < virtualhosts.length; i++) {
					var host_url = env_url + "/" + virtualhosts[i];
					grunt.file.mkdir(filepath);
					grunt.verbose.writeln("Virtualhost URL : " + host_url);
					log_file.write(format + ',' + virtualhosts[i] + ',Success,' + host_url + '\n');
					// var env = this.env;

					//Call virtualhost details
					if (host_url.length > 1024) {
						grunt.log.write("SKIPPING Virtualhost, URL too long: ");
						done_count++;
					} else {
						request(host_url, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var host_detail = JSON.parse(body);
								var host_file = filepath + "/" + host_detail.name;
								grunt.verbose.writeln("VIRTUALHOST " + body);
								log_file.write(format + ',' + host_detail.name + ',Success,' + body + '\n');
								grunt.file.write(host_file, body);
								log_file.write(format + ',' + host_detail.name + ',Success,' + 'Exported Virtualhost ' + host_detail.name + '\n');
								grunt.verbose.writeln('Exported Virtualhost ' + host_detail.name);
							}
							else {
								log_file.write(format + ',' + virtualhosts[i] + ',Fail,' + 'Error Exporting Virtualhost ' + virtualhosts[i] + '\n' + error + '\n');
								grunt.verbose.writeln('Error Exporting Virtualhost ' + virtualhosts[i]);
								grunt.log.error(error);
							}

							done_count++;
							if (done_count == virtualhosts.length) {
								grunt.log.ok('Processed ' + done_count + ' virtualhosts');
								grunt.verbose.writeln("================== export virtualhosts DONE()");
								done();
							}
						}).auth(userid, passwd, true);
					}
					// End Virtualhost details
				};

			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
	});

};
