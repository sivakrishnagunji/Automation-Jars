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
	grunt.registerTask('exportProxyKVM', 'Export all proxy-kvm from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportProxyKVM.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',exportProxyKVM';
		var done_count = 0;
		var done = this.async();
		var proxies_url = url + "/v1/organizations/" + org + "/apis";
		grunt.verbose.writeln("========================= export Proxy KVMs ===========================");

		grunt.verbose.writeln(proxies_url);
		log_file.write(format + ',' + proxies_url + '\n');
		grunt.file.mkdir(filepath);
		request(proxies_url, function (proxy_error, proxy_response, proxy_body) {
			if (!proxy_error && proxy_response.statusCode == 200) {
				grunt.verbose.writeln("PROXY body: " + proxy_body);
				var proxies = JSON.parse(proxy_body);
				for (var j = 0; j < proxies.length; j++) {
					var proxy = proxies[j];
					// grunt.verbose.writeln("PROXY name: " + proxy);
					var proxy_url = url + "/v1/organizations/" + org + "/apis/" + proxy + "/keyvaluemaps";
					grunt.verbose.writeln("Proxy KVMs URL: " + proxy_url);
					log_file.write(format + ",Proxy KVMs URL: " + proxy_url + '\n');
					// BUG
					// This won't work as is, need to wait for all proxy KVMs to be written
					//
					request(proxy_url, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							grunt.verbose.writeln("PROXY KVMs: " + this.proxy + " : " + body);
							kvms = JSON.parse(body);
							if (kvms.length != 0) {
								for (var i = 0; i < kvms.length; i++) {
									var proxy_kvm_url = this.proxy_url + "/" + kvms[i];
									grunt.verbose.writeln("KVM URL : " + proxy_kvm_url);
									log_file.write(format + ',' + kvms[i] + ',Success,' + proxy_kvm_url + '\n');
									var proxy = this.proxy;
									//Call kvm details
									request(proxy_kvm_url, function (error, response, body) {
										if (!error && response.statusCode == 200) {
											var kvm_detail = JSON.parse(body);
											var kvm_file = filepath + "/" + this.proxy + "/" + kvm_detail.name;
											grunt.verbose.writeln(body);
											log_file.write(format + ',' + kvm_detail.name + ',Success,' + body + '\n');
											grunt.file.write(kvm_file, body);
											log_file.write(format + ',' + kvm_detail.name + ',Success,' + 'Proxy KVM ' + kvm_detail.name + ' written!' + '\n');
											grunt.verbose.writeln('Proxy KVM ' + kvm_detail.name + ' written!');

										}
										else {
											log_file.write(format + ',' + kvms[i] + ',Fail,' + error + '\n');
											grunt.log.error(error);
										}
									}.bind({ proxy: proxy })).auth(userid, passwd, true);
									// End kvm details
								};
							} else {
								log_file.write(format + ',' + this.proxy + ',Success,' + 'No KVMs for the proxy ' + this.proxy + '\n');
								grunt.verbose.writeln('No KVMs for the proxy ' + this.proxy);
							}
						}
						else {
							log_file.write(format + ',Fail,' + error + '\n');
							grunt.log.error(error);
						}
						done_count++;
						if (done_count == proxies.length) {
							grunt.log.ok('Exported ' + done_count + ' proxy KVMs.');
							grunt.verbose.writeln("================== export Proxy KVMs DONE()");
							done();
						}
					}.bind({ proxy_url: proxy_url, proxy: proxy })).auth(userid, passwd, true);
				}
			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);

		// setTimeout(function () {
		// 	grunt.verbose.writeln("================== Proxy KVMs Timeout done");
		// 	done(true);
		// }, 3000);
		// grunt.verbose.writeln("========================= export Proxy KVMs DONE ===========================");

	});

};
