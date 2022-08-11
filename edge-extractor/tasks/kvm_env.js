/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var async = require('async');
var kvms;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportEnvKVM', 'Export all env-kvm from org ' + apigee.from.org + " environment " + apigee.from.env + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportEnvKVM.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',' + env + ',exportEnvKVM';
		var done_count = 0;
		var done = this.async();
		grunt.verbose.writeln("========================= export Env KVMs ===========================");
		grunt.file.mkdir(filepath);

		var env_url = url + "/v1/organizations/" + org + "/environments/" + env + "/keyvaluemaps";

		grunt.verbose.writeln("Env KVM URL: " + env_url);
		log_file.write(format + ",Env KVM URL: " + env_url + '\n');

		request(env_url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				grunt.verbose.writeln(body);
				kvms = JSON.parse(body);
				for (var i = 0; i < kvms.length; i++) {
					var env_kvm_url = this.env_url + "/" + kvms[i];
					grunt.verbose.writeln("KVM URL : " + env_kvm_url);
					log_file.write(format + ',Success,' + "KVM URL : " + env_kvm_url + '\n');
					var env = this.env;

					//Call kvm details
					request(env_kvm_url, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							var kvm_detail = JSON.parse(body);
							var kvm_file = filepath + "/" + this.env + "/" + kvm_detail.name;
							grunt.verbose.writeln(body);
							log_file.write(format + ',' + kvm_detail.name + ',Success,' + body + '\n');
							grunt.file.write(kvm_file, body);
						}
						else {
							log_file.write(format + ',Fail,' + error + '\n');
							grunt.log.error(error);
						}
						done_count++;
						if (done_count == kvms.length) {
							grunt.log.ok('Exported ' + done_count + ' kvms');
							grunt.verbose.writeln("================== export ENV KVM DONE()");
							done();
						}
					}.bind({ env: env })).auth(userid, passwd, true);
					// End kvm details
				};
			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}.bind({ env_url: env_url, env: env })).auth(userid, passwd, true);
		/*
		setTimeout(function() {
			grunt.verbose.writeln("================== ENV KVMs Timeout done" );
			done(true);
		}, 3000);
		grunt.verbose.writeln("========================= export Env KVMs DONE ===========================" );
		*/
	});

};
