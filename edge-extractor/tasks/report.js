/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var reports;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportReports', 'Export all reports from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportReports.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',exportReports';
		var done_count = 0;
		var done = this.async();

		grunt.verbose.writeln("========================= export Reports ===========================");
		grunt.verbose.writeln("getting reports..." + url);
		url = url + "/v1/organizations/" + org + "/reports?expand=true";
		log_file.write(format + ',reports url ' + url + '\n');
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// grunt.verbose.writeln(body);
				reports = JSON.parse(body).qualifier;

				grunt.file.mkdir(filepath);
				for (var i = 0; i < reports.length; i++) {
					var report_file = filepath + "/" + reports[i].name;
					log_file.write(format + ',' + reports[i].name + ',Success,' + JSON.stringify(reports[i]) + '\n');
					grunt.file.write(report_file, JSON.stringify(reports[i]));
					done_count++;
					if (done_count == reports.length) {
						grunt.log.ok('Exported ' + done_count + ' reports');
						grunt.verbose.writeln("================== export reports DONE()");
						done();
					}
				}
			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
		/*
		setTimeout(function() {
			grunt.verbose.writeln("================== Reports Timeout done" );
			done(true);
		}, 3000);
		grunt.verbose.writeln("========================= export Reports DONE ===========================" );
		*/
	});


};
