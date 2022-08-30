/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var queries;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportAnalyticQueries', 'Export all analytic queries from org ' + apigee.from.org + " environment " + apigee.from.env + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',exportAnalyticQueries';
		var filepath = grunt.config.get("exportAnalyticQueries.dest.data");
		var host_file = filepath + "/queryFile";
		grunt.verbose.writeln("========================= export Env ANALYTICQUERIES ===========================");
		grunt.file.mkdir(filepath);

		var env_url = url + "/v1/organizations/" + org + "/environments/" + env + "/queries";

		log_file.write(format + ",Env Queries URL: " + env_url + '\n');
		grunt.verbose.writeln("Env Queries URL: " + env_url);

		request(env_url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				grunt.verbose.writeln("QUERIES" + body);
				log_file.write(format + ",QUERIES," + body + '\n');
				queries = JSON.parse(body);

				grunt.file.mkdir(filepath);
				grunt.verbose.writeln("Queries URL : " + env_url);
				grunt.file.write(host_file, body);
				log_file.write(format + ',Success,' + body + '\n');
				grunt.verbose.writeln('Exported Queries');
				log_file.write(format + ',Success,' + 'Exported Queries' + '\n');
			}
			else {
				grunt.log.error(error);
				log_file.write(format + ',Fail,' + error + '\n');
			}
		}).auth(userid, passwd, true);
	});
};
