/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var resources;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
    'use strict';
    grunt.registerTask('exportEnvResources', 'Export all env-resources from org ' + apigee.from.org + " environment " + apigee.from.env + " [" + apigee.from.version + "]", function () {
        var data = logs.toString();;
        log_file.write(data);
        var url = apigee.from.url;
        var org = apigee.from.org;
        var env = apigee.from.env;
        var userid = apigee.from.userid;
        var passwd = apigee.from.passwd;
        var filepath = grunt.config.get("exportEnvResources.dest.data");
        var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
        var format = date + ',' + org + ',' + env + ',exportEnvResources';
        var done_count = 0;
        var done = this.async();

        grunt.verbose.writeln("========================= export Environment RESOURCEs ===========================");
        url = url + "/v1/organizations/" + org + "/environments/" + env + "/resourcefiles";
        grunt.verbose.writeln("getting Env Resources ..." + url);
        log_file.write(format + ",getting Env Resources ..." + url + '\n');
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                grunt.file.mkdir(filepath);
                grunt.verbose.writeln("Env Resources: " + body);
                resources = JSON.parse(body);
                var files = resources.resourceFile;
                if (files.length == 0) {
                    log_file.write(format + ',No resources for this environment' + '\n');
                    grunt.verbose.writeln("No resources for this environment");
                    grunt.verbose.writeln("================== export Env RESOURCES DONE()");
                    done();
                } else {
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        var org_resource_url = url + "/" + file.type + "/" + file.name;
                        log_file.write(format + ',' + file.name + ',Success,' + org_resource_url + '\n');
                        grunt.file.mkdir(filepath);

                        //Call resource details
                        grunt.verbose.writeln('RESOURCE URL: ' + org_resource_url);
                        request(org_resource_url, function (resource_error, resource_response, resource_body) {
                            if (!resource_error && resource_response.statusCode == 200) {
                                // var resource_detail = JSON.parse(resource_body);
                                var resource_file = filepath + "/" + file.name;
                                // grunt.verbose.writeln("Org Resource: " + resource_body);
                                grunt.file.write(resource_file, resource_body);
                                log_file.write(format + ',' + file.name + ',Success,' + resource_body + '\n');
                                log_file.write(format + ',' + file.name + ',Success,' + 'RESOURCE ' + file.name + ' written!' + '\n');
                                grunt.verbose.writeln('RESOURCE ' + file.name + ' written!');
                            } else {
                                log_file.write(format + ',' + file.name + ',Fail,' + 'Error ' + resource_response.statusCode + ' exporting ' + resource_error + '\n');
                                grunt.verbose.writeln('Error ' + resource_response.statusCode + ' exporting ' + resource_error);
                                grunt.log.error(resource_error);
                            }

                            done_count++;
                            if (done_count == resources.length) {
                                grunt.log.ok('Exported ' + done_count + ' resources');
                                grunt.verbose.writeln("================== export ORG RESOURCES DONE()");
                                done();
                            }
                        }).auth(userid, passwd, true);
                        // End resources details
                    };
                }

            }
            else {
                log_file.write(format + ',Fail,' + error + '\n');
                grunt.log.error(error);
            }
        }).auth(userid, passwd, true);
    });
};
