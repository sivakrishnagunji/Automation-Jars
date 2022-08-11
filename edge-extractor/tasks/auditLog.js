/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var audits;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportAuditLogs', 'Export auditLogs of org ' + apigee.from.org + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportAuditLogs.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',exportAuditLogs';
		var done_count = 0;
		var done = this.async();
		grunt.verbose.writeln("========================= export AUDITLOGS ===========================");
		grunt.file.mkdir(filepath);

		var env_url = url + "/v1/audits/organizations/" + org + "?expand=true&timeline=month";

		grunt.verbose.writeln("Audit URL: " + env_url);
		log_file.write(format + ",Audit URL: " + env_url + '\n');
		request(env_url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				audits = JSON.parse(body);
				grunt.file.mkdir(filepath);
				grunt.verbose.writeln("audits URL : " + env_url);
				var host_file = filepath + "/auditLog";
				grunt.verbose.writeln("AUDITLOGS" + body);
				log_file.write(format + ",AuditLogs " + body + '\n');
				grunt.file.write(host_file, body);
				log_file.write(format + ',Success,' + 'Exported audits successfully' + '\n');
				grunt.verbose.writeln('Exported audits');
			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
	});
};
