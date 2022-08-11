/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
var exports;
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportAnalyticExports', 'Export all analytic Exports data from org ' + apigee.from.org + " environment " + apigee.from.env + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',' + env + ',exportAnalyticExports';
		var filepath = grunt.config.get("exportAnalyticExports.dest.data");
		grunt.verbose.writeln("========================= export Env ANALYTICEXPORTS ===========================");
		grunt.file.mkdir(filepath);

		var env_url = url + "/v1/organizations/" + org + "/environments/" + env + "/analytics/exports";

		grunt.verbose.writeln("Env Exports URL: " + env_url);
		log_file.write(format + ",Env Exports URL: " + env_url + '\n');

		request(env_url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				grunt.verbose.writeln("EXPORTS" + body);
				log_file.write(format + ",EXPORTS" + body + '\n');
				exports = JSON.parse(body);

				grunt.file.mkdir(filepath);
				grunt.verbose.writeln("Exports URL : " + env_url);
				var host_file = filepath + "/exportsData";
				grunt.file.write(host_file, body);
				grunt.verbose.writeln('Exported Analytics exports');
				log_file.write(format + ',Success,' + 'Exported Analytics exports' + '\n');
			}
			else {
				grunt.log.error(error);
				log_file.write(format + ',Fail,' + error + '\n')
			}
		}).auth(userid, passwd, true);
	});
};
