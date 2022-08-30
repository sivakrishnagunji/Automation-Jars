/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var proxies;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportProxies', 'Export all proxies from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var fs = require('fs');
		var filepath = grunt.config.get("exportProxies.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',exportProxies';
		var done_count = 0;
		var done = this.async();
		var undeployedProxyFilepath = './data/org/' + apigee.from.org + '/undeployedproxies';

		grunt.verbose.writeln("========================= export Proxies ===========================");
		grunt.verbose.writeln("getting proxies..." + url);
		url = url + "/v1/organizations/" + org + "/apis";
		log_file.write(format + ",getting proxies..." + url + '\n');

		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				proxies = JSON.parse(body);

				for (var i = 0; i < proxies.length; i++) {
					var proxy_url = url + "/" + proxies[i];
					grunt.file.mkdir(filepath);

					//Call proxy details
					request(proxy_url, function (proxyError, proxyResponse, proxyBody) {
						if (!proxyError && proxyResponse.statusCode == 200) {
							// grunt.verbose.writeln(body);
							var proxy_detail = JSON.parse(proxyBody);
							// var proxy_file = filepath + "/" + proxy_detail.name;
							// gets max revision - May not be the deployed version
							var max_rev = proxy_detail.revision[proxy_detail.revision.length - 1];
							proxy_url = url + '/' + proxy_detail.name;
							var proxy_download_url = proxy_url + "/revisions/" + max_rev + "?format=bundle";
							var deploymentUrl = proxy_url + "/deployments";
							request(deploymentUrl, function (deployerror, deployresponse, deploybody) {
								grunt.verbose.writeln('inside deployment ' + proxy_detail.name);
								//Get deployment details of the proxy
								if (!deployerror && deployresponse.statusCode == 200) {
									var deploymentDetails = JSON.parse(deploybody);
									var environment = deploymentDetails.environment;
									//If proxy is deployed in any environment 
									if (environment.length != 0) {
										for (var env1 = 0; env1 < environment.length; env1++) {
											var envDetails = environment[env1];
											if (envDetails.name == env) {
												var revisions = envDetails.revision;
												// grunt.verbose.writeln(JSON.parse(revisions));
												//Get the revision of the proxy which is deployed in given environment
												if (revisions.length != 0) {
													// var revisions = deploymentDetails.revision;
													for (var rev = 0; rev < revisions.length; rev++) {
														var revDetails = revisions[rev];
														if (revDetails.name == max_rev && revDetails.state == 'deployed') {
															log_file.write(format + ',DeployedProxy,' + proxy_detail.name + ',Success,' + "Fetching proxy bundle  : " + proxy_download_url + '\n');
															grunt.verbose.writeln("\nFetching deployed proxy bundle  : " + proxy_download_url);
															request(proxy_download_url).auth(userid, passwd, true)
																.pipe(fs.createWriteStream(filepath + "/" + proxy_detail.name + '_rev' + max_rev + '.zip'))
																.on('close', function () {
																	log_file.write(format + ',DeployedProxy,' + proxy_detail.name + ',Success,' + "Fetching proxy bundle  : " + proxy_download_url + '\n');
																	grunt.verbose.writeln('Proxy ' + proxy_detail.name + '_rev' + max_rev + '.zip written!');
																	done_count++;
																	if (done_count == proxies.length) {
																		grunt.log.ok('Exported ' + done_count + ' proxies.');
																		grunt.verbose.writeln("================== export proxies DONE()");
																		done();
																	}
																});
														} else if (revDetails.name != max_rev && revDetails.state == 'deployed') {
															proxy_download_url = url + "/" + proxy_detail.name + "/revisions/" + revDetails.name + "?format=bundle";
															log_file.write(format + ',DeployedProxy,' + proxy_detail.name + ',Success,' + "Fetching proxy bundle  : " + proxy_download_url + '\n');
															grunt.verbose.writeln("\nFetching deployed proxy bundle  : " + proxy_download_url);
															request(proxy_download_url).auth(userid, passwd, true)
																.pipe(fs.createWriteStream(filepath + "/" + proxy_detail.name + '_rev' + revDetails.name + '.zip'))
																.on('close', function () {
																	log_file.write(format + ',DeployedProxy,' + proxy_detail.name + ',Success,' + "Fetching proxy bundle  : " + proxy_download_url + '\n');
																	grunt.verbose.writeln('Proxy ' + proxy_detail.name + '_rev' + revDetails.name + '.zip written!');
																	done_count++;
																	if (done_count == proxies.length) {
																		grunt.log.ok('Exported ' + done_count + ' proxies.');
																		grunt.verbose.writeln("================== export proxies DONE()");
																		done();
																	}
																});
														}
													}

												}
											}
										}
									}
									//If proxy is not deployed in any of the environment 
									// else {
									// 	grunt.verbose.writeln("\nFetching undeployed proxy bundle  : " + proxy_download_url);
									// 	log_file.write(format + ',UnDeployedProxy,' + proxy_detail.name + ',Success,' + "Fetching undeployed proxy bundle  : " + proxy_download_url + '\n');
									// 	grunt.file.mkdir(undeployedProxyFilepath);
									// 	request(proxy_download_url).auth(userid, passwd, true)
									// 		.pipe(fs.createWriteStream(undeployedProxyFilepath + "/" + proxy_detail.name + '_rev' + max_rev + '.zip'))
									// 		.on('close', function () {
									// 			log_file.write(format + ',UnDeployedProxy,' + proxy_detail.name + ',Success,' + 'Proxy ' + proxy_detail.name + '_rev' + max_rev + '.zip written!' + '\n');
									// 			grunt.verbose.writeln('Proxy ' + proxy_detail.name + '_rev' + max_rev + '.zip written!');
									// 			done_count++;
									// 			if (done_count == proxies.length) {
									// 				grunt.log.ok('Exported ' + done_count + ' proxies.');
									// 				grunt.verbose.writeln("================== export proxies DONE()");
									// 				done();
									// 			}
									// 		});
									// }
								}
							}).auth(userid, passwd, true);
						}
						else {
							done_count++;
							if (done_count == proxies.length) {
								log_file.write(format + ',' + proxy_detail.name + ',Fail,' + 'Error exporting ' + done_count + ' proxies.' + '\n');
								grunt.verbose.writeln('Error exporting ' + done_count + ' proxies.');
								// done();
							} else {
								log_file.write(format + ',' + proxy_detail.name + ',Fail,' + 'Error exporting' + proxy_detail.name + '\n' + error + '\n');
								grunt.verbose.writeln('Error exporting' + proxy_detail.name);
							}
							grunt.log.error(error);
						}
					}).auth(userid, passwd, true);
					// End proxy details
				};
			}
			else {
				log_file.write(format + ',Fail,' + error + '\n');
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
		/*
		setTimeout(function() {
			grunt.verbose.writeln("================== Proxies Timeout done" );
			done(true);
		}, 5000);
		grunt.verbose.writeln("========================= export Proxies DONE ===========================" );
		*/

	});

	grunt.registerTask('deployProxies', 'Deploy revision 1 on all proxies for org ' + apigee.to.org + " [" + apigee.to.version + "]", function () {
		var url = apigee.to.url;
		var org = apigee.to.org;
		var env = apigee.to.env;
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var done_count = 0;
		var done = this.async();
		url = url + "/v1/organizations/" + org;
		var proxies_url = url + "/apis";

		request(proxies_url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				//grunt.log.write(body);
				proxies = JSON.parse(body);

				for (var i = 0; i < proxies.length; i++) {
					var proxy_url = url + "/environments/" + env + "/apis/" + proxies[i] + "/revisions/1/deployments";
					grunt.verbose.writeln(proxy_url);
					//Call proxy deploy
					request.post(proxy_url, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							grunt.verbose.writeln('Resp [' + response.statusCode + '] for proxy deployment ' + this.proxy_url + ' -> ' + body);
						}
						else {
							grunt.log.error('ERROR Resp [' + response.statusCode + '] for proxy deployment ' + this.proxy_url + ' -> ' + body);
						}
						done_count++;
						if (done_count == proxies.length) {
							grunt.log.ok('Processed ' + done_count + ' proxies');
							done();
						}
					}).auth(userid, passwd, true);
					// End proxy deploy
				};

			}
			else {
				grunt.log.error(error);
			}
		}.bind({ proxy_url: proxy_url })).auth(userid, passwd, true);
	});

	grunt.registerTask('undeployProxies', 'UnDeploy revision 1 on all proxies for org ' + apigee.to.org + " [" + apigee.to.version + "]", function () {
		var url = apigee.to.url;
		var org = apigee.to.org;
		var env = apigee.to.env;
		var userid = apigee.to.userid;
		var passwd = apigee.to.passwd;
		var done_count = 0;
		var done = this.async();
		url = url + "/v1/organizations/" + org;
		var proxies_url = url + "/apis";

		request(proxies_url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				//grunt.log.write(body);
				proxies = JSON.parse(body);

				for (var i = 0; i < proxies.length; i++) {
					var proxy_url = url + "/environments/" + env + "/apis/" + proxies[i] + "/revisions/1/deployments";
					grunt.verbose.writeln(proxy_url);
					//Call proxy undeploy
					request.del(proxy_url, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							grunt.verbose.writeln(body);
						}
						else {
							grunt.log.error(error);
						}
						done_count++;
						if (done_count == proxies.length) {
							grunt.log.ok('Processed ' + done_count + ' proxies');
							done();
						}
					}).auth(userid, passwd, true);
					// End proxy undeploy
				};

			}
			else {
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
	});

};
