/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var kvms;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportOrgKVM', 'Export all org-kvm from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportOrgKVM.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',exportOrgKVM';
		var done_count = 0;
		var done = this.async();

		grunt.verbose.writeln("========================= export Org KVMs ===========================");

		url = url + "/v1/organizations/" + org + "/keyvaluemaps";
		grunt.verbose.writeln("getting Org KVMs ..." + url);
		log_file.write(format + ",getting Org KVMs ..." + url + '\n');
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				grunt.verbose.writeln("Org KVMs: " + body);
				kvms = JSON.parse(body);

				if (kvms.length == 0) {
					grunt.verbose.writeln("exportOrgKVM: No KVMs");
					log_file.write(format + ",exportOrgKVM: No KVMs" + '\n');
					grunt.verbose.writeln("================== export ORG KVM DONE()");
					done();
				} else {
					for (var i = 0; i < kvms.length; i++) {
						// Custom report KVMs have '#'
						var org_kvm_url = url + "/" + encodeURIComponent(kvms[i]);
						grunt.file.mkdir(filepath);

						//Call kvm details
						grunt.verbose.writeln('KVM URL: ' + org_kvm_url);
						request(org_kvm_url, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var kvm_detail = JSON.parse(body);
								var kvm_file = filepath + "/" + kvm_detail.name;
								grunt.verbose.writeln("Org KVM: " + body);
								grunt.file.write(kvm_file, body);
								log_file.write(format + ',' + kvm_detail.name + ',Success,' + body + '\n');
								log_file.write(format + ',' + kvm_detail.name + ',Success,' + 'KVM ' + kvm_detail.name + ' written!' + '\n');
								grunt.verbose.writeln('KVM ' + kvm_detail.name + ' written!');
							} else {
								log_file.write(format + ',' + kvm_detail.name + ',Fail,' + 'Error ' + response.statusCode + ' exporting ' + error + '\n');
								grunt.verbose.writeln('Error ' + response.statusCode + ' exporting ' + error);
								grunt.log.error(error);
							}

							done_count++;
							if (done_count == kvms.length) {
								grunt.log.ok('Exported ' + done_count + ' kvms');
								grunt.verbose.writeln("================== export ORG KVM DONE()");
								done();
							}
						}).auth(userid, passwd, true);
						// End kvm details
					};
				}
			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
		/*
		setTimeout(function() {
			grunt.verbose.writeln("================== Org KVMs Timeout done" );
			done(true);
		}, 3000);
		grunt.verbose.writeln("========================= export Org KVMs DONE ===========================" );
		*/
	});

};
