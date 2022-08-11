/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var resources;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
// var log_stdout = process.stdout;

// console.log = function(d) { //
//   log_file.write(util.format(d) + '\n');
//   log_stdout.write(util.format(d) + '\n');
// };
module.exports = function (grunt) {
    'use strict';
    grunt.registerTask('exportOrgResources', 'Export all org-resources from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
        var data = logs.toString();;
        log_file.write(data);
        var url = apigee.from.url;
        var org = apigee.from.org;
        var userid = apigee.from.userid;
        var passwd = apigee.from.passwd;
        var filepath = grunt.config.get("exportOrgResources.dest.data");
        var done_count = 0;
        var done = this.async();
        // var datetime = new Date();
        var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
        var format = date + ',' + org + ',exportOrgResources';
        grunt.verbose.writeln("========================= export Org RESOURCEs ===========================");
        url = url + "/v1/organizations/" + org + "/resourcefiles";
        // grunt.verbose.writeln("getting Org Resources ..." + url);
        log_file.write(format + ",getting Org Resources ..." + url + '\n');
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // grunt.log.writeln("Org Resources: " + body);
                resources = JSON.parse(body);
                if (resources.length == 0) {
                    grunt.verbose.writeln("No resources for the org " + org);
                    log_file.write(format + ",No resources for the org " + org + '\n');
                    grunt.verbose.writeln("================== export ORG RESOURCES DONE()");
                    done();
                } else {
                    var files = resources.resourceFile;
                    if (files) {
                        for (var i = 0; i < files.length; i++) {
                            var file = files[i];
                            var org_resource_url = url + "/" + file.type + "/" + file.name;
                            grunt.file.mkdir(filepath);

                            //Call resource details
                            grunt.verbose.writeln('RESOURCE URL: ' + org_resource_url);
                            request(org_resource_url, function (resource_error, resource_response, resource_body) {
                                if (!resource_error && resource_response.statusCode == 200) {
                                    // var resource_detail = JSON.parse(resource_body);
                                    var resource_file = filepath + "/" + file.name;
                                    // grunt.verbose.writeln("Org Resource: " + resource_body);
                                    grunt.file.write(resource_file, resource_body);
                                    log_file.write(format + ",RESOURCE " + resource_body + '\n');
                                    grunt.verbose.writeln('RESOURCE ' + file.name + ' written!');
                                    log_file.write(format + ',Success,' + 'RESOURCE ' + file.name + ' written!' + '\n');
                                } else {
                                    grunt.verbose.writeln('Error ' + resource_response.statusCode + ' exporting ' + resource_error);
                                    grunt.log.error(resource_error);
                                    log_file.write(format + resource_error + '\n');
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
            }
            else {
                grunt.log.error(error);
                log_file.write(format + ',' + error);
            }
        }).auth(userid, passwd, true);
    });
};
