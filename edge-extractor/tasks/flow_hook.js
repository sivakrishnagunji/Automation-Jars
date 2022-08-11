/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var flow_hook_config = {};
var flow_hook_type = ["PreProxyFlowHook", "PostProxyFlowHook", "PreTargetFlowHook", "PostTargetFlowHook"];
var configured_flow_hooks;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportFlowHooks', 'Export all configured flow hooks from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var base_url = apigee.from.url;
		var org = apigee.from.org;
		var env = apigee.from.env;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var fs = require('fs');
		var done_count = 0;
		var done = this.async();
		var flow_hook_file = grunt.config.get("exportFlowHooks.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',' + env + ',exportFlowHooks';
		grunt.verbose.writeln("========================= export Flow Hooks ===========================");

		for (var i = 0; i < flow_hook_type.length; i++) {
			var url = base_url + "/v1/organizations/" + org + "/environments/" + env + "/flowhooks/" + flow_hook_type[i];
			grunt.verbose.writeln("Getting flow hook (Type: ", flow_hook_type[i], ")..." + url + "\n");
			log_file.write(format + ',' + flow_hook_type[i] + ',' + url + "\n");
			request(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					grunt.verbose.writeln("Processing response for flow hook type: " + this.cur_flow_hook_type + " ...\n")
					var flow_hook_detail = JSON.parse(body);
					log_file.write(format + ',' + flow_hook_type[i] + ',Success,' + JSON.stringify(flow_hook_detail) + "\n");
					grunt.verbose.writeln("flow_hook_detail = " + JSON.stringify(flow_hook_detail) + "\n");
					var shared_flow_name = ("sharedFlow" in flow_hook_detail) ? flow_hook_detail.sharedFlow : "";
					flow_hook_config[this.cur_flow_hook_type] = shared_flow_name;

				} else {
					grunt.verbose.writeln(error);
					log_file.write(format + ',' + flow_hook_type[i] + ',Fail,' + error);
					grunt.log.error(error);
				}
				done_count++;
				if (done_count == flow_hook_type.length) {
					// Write the configuration file
					grunt.verbose.writeln("About to write to file: " + flow_hook_file + " - Contents: " + JSON.stringify(flow_hook_config) + "\n");
					grunt.file.write(flow_hook_file, JSON.stringify(flow_hook_config));
					log_file.write(format + ',' + flow_hook_type[i] + ',Success,' + JSON.stringify(flow_hook_config) + '\n');
					grunt.log.ok('Found ' + done_count + ' flow hooks. Configuration exported');
					grunt.verbose.writeln("================== export flow_hook DONE()");
					done();
				}
			}.bind({
				cur_flow_hook_type: flow_hook_type[i]
			})).auth(userid, passwd, true);
		}
		/*
		setTimeout(function() {
			grunt.verbose.writeln("================== Flow Hooks Timeout done" );
			done(true);
		}, 3000);
		grunt.verbose.writeln("========================= export Flow Hooks DONE ===========================" );
		*/

	});

};
