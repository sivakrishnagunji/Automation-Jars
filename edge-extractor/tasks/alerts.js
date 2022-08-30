var request = require('request');
var apigee = require('../config.js');
var SpecStore = require('../util/specstore.lib.js');
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
var alerts;
var options = new Object();
module.exports = function (grunt) {
    'use strict';

    grunt.registerTask('exportAlerts', 'Export Alerts from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
        var data = logs.toString();;
        log_file.write(data);
        if (apigee.from.url !== 'https://api.enterprise.apigee.com') {
            throw new Error("This will only works with Apigee Edge (Cloud)");
        }
        var url = apigee.from.url;
        var org = apigee.from.org;
        var env = apigee.from.env;
        var userid = apigee.from.userid;
        var passwd = apigee.from.passwd;
        var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
        var format = date + ',' + org + ',exportAlerts';
        var done_count = 0;
        var filepath = grunt.config.get("exportAlerts.dest.data");
        var done = this.async();
        var specstoreObj = new SpecStore(apigee.from);
        grunt.verbose.writeln("========================= export Alerts ===========================");
        grunt.file.mkdir(filepath);

        var env_url = "https://apimonitoring.enterprise.apigee.com/alerts";
        var alerts_url = env_url + "?org=" + org;
        grunt.verbose.writeln("Alerts URL: " + alerts_url);
        specstoreObj.generateAccessToken(function (token) {
            if (token != null) {
                if (!options.headers) {
                    options.headers = [];
                }
                if (!options.method) {
                    options.method = "GET";
                }
                options.headers.Authorization = "Bearer " + token;
                request(alerts_url, options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        // grunt.verbose.writeln("ALERTS" + body);
                        alerts = JSON.parse(body);
                        grunt.file.mkdir(filepath);
                        if (alerts.length == 0) {
                            grunt.verbose.writeln("No Alerts");
                            log_file.write(format + ",No Alerts" + '\n');
                            done();
                        }
                        for (var i = 0; i < alerts.length; i++) {
                            var alert = alerts[i];
                            // grunt.verbose.writeln(JSON.stringify(alert));
                            log_file.write(format + ',' + JSON.stringify(alert) + '\n')
                            var host_url = env_url + "/" + alert.uuid;
                            grunt.verbose.writeln("Alerts URL : " + host_url);
                            log_file.write(format + ',' + alert.uuid + ',' + "Alerts URL : " + host_url + '\n');
                            // var env = this.env;

                            //Call alerts details
                            if (host_url.length > 1024) {
                                grunt.log.write("SKIPPING ALERTS, URL too long: ");
                                log_file.write(format + ',' + alert.uuid + ',' + "SKIPPING ALERTS, URL too long: " + '\n');
                                done_count++;
                            } else {
                                request(host_url, function (error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        var host_detail = JSON.parse(body);
                                        var host_file = filepath + "/" + host_detail.uuid;
                                        grunt.file.write(host_file, JSON.stringify(host_detail));
                                        log_file.write(format + ',' + host_detail.uuid + ',' + ',Success,' + 'Exported alerts ' + host_detail.uuid + '\n');
                                        grunt.verbose.writeln('Exported alerts ' + host_detail.uuid);
                                    }
                                    else {
                                        grunt.verbose.writeln('Error Exporting alerts ' + host_detail.uuid);
                                        log_file.write(format + ',' + host_detail.uuid + ',Fail,' + 'Error Exporting alerts ' + host_detail.uuid + '\n');
                                        grunt.log.error(error);
                                    }

                                    done_count++;
                                    if (done_count == alerts.length) {
                                        grunt.log.ok('Processed ' + done_count + ' alerts');
                                        grunt.verbose.writeln("================== export alerts DONE()");
                                        done();
                                    }
                                }).auth(userid, passwd, true, token);
                            }
                            // End alerts details

                        };

                    }
                    else {
                        grunt.log.error(error);
                        log_file.write(format + error + '\n');
                    }
                }).auth(userid, passwd, true, token);
            } else {
                log_file.write(format + 'Access token could not be generated' + '\n');
                throw new Error("Access token could not be generated");
            }
            // grunt.verbose.writeln('Exported All alerts');
        });
    });
};