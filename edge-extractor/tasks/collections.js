var request = require('request');
var apigee = require('../config.js');
var SpecStore = require('../util/specstore.lib.js');
var collections;
var options = new Object();
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
    'use strict';

    grunt.registerTask('exportCollections', 'Export Collections from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
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
        var done_count = 0;
        var filepath = grunt.config.get("exportCollections.dest.data");
        var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
        var format = date + ',' + org + ',' + env + ',exportCollections';
        var done = this.async();
        var specstoreObj = new SpecStore(apigee.from);
        grunt.verbose.writeln("========================= export Collections ===========================");
        // grunt.file.mkdir(filepath);

        var env_url = "https://apimonitoring.enterprise.apigee.com/collections";
        var collection_url = env_url + "?org=" + org;
        grunt.verbose.writeln("Collections URL: " + collection_url);
        log_file.write(format + ",Collections URL: " + collection_url + '\n');
        specstoreObj.generateAccessToken(function (token) {
            if (token != null) {
                if (!options.headers) {
                    options.headers = [];
                }
                if (!options.method) {
                    options.method = "GET";
                }
                options.headers.Authorization = "Bearer" + token;
                request(collection_url, options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        // grunt.verbose.writeln("COLLECTIONS" + body);
                        collections = JSON.parse(body);
                        grunt.file.mkdir(filepath);
                        if (collections.length == 0) {
                            grunt.verbose.writeln("No Collections");
                            log_file.write(format + ',Success,' + 'No Collections');
                            done();
                        }
                        for (var i = 0; i < collections.length; i++) {
                            var collection = collections[i];
                            grunt.verbose.writeln(JSON.stringify(collection));
                            var host_url = env_url + "/" + collection.uuid;

                            grunt.verbose.writeln("Collections URL : " + host_url);
                            log_file.write(format + ",Collections URL : " + host_url + '\n');
                            // var env = this.env;

                            //Call collections details
                            if (host_url.length > 1024) {
                                grunt.log.write("SKIPPING COLLECTION, URL too long: ");
                                done_count++;
                            } else {
                                request(host_url, function (error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        var host_detail = JSON.parse(body);
                                        var host_file = filepath + "/" + host_detail.uuid;
                                        grunt.file.write(host_file, JSON.stringify(host_detail));
                                        log_file.write(format + ',' + host_detail.uuid + ',Success,' + JSON.stringify(host_detail) + '\n');
                                        log_file.write(format + ',' + host_detail.uuid + ',Success,' + 'Exported Collection ' + host_detail.uuid + '\n');
                                        grunt.verbose.writeln('Exported Collection ' + host_detail.uuid);
                                    }
                                    else {
                                        log_file.write(format + ',' + host_detail.uuid + ',Fail,' + 'Error Exporting Collection ' + host_detail.uuid + '\n' + error + '\n');
                                        grunt.verbose.writeln('Error Exporting Collection ' + host_detail.uuid);
                                        grunt.log.error(error);
                                    }
                                    done_count++;
                                    if (done_count == collections.length) {
                                        grunt.log.ok('Processed ' + done_count + ' collections');
                                        grunt.verbose.writeln("================== export collections DONE()");
                                        done();
                                    }
                                }).auth(userid, passwd, true, token);
                            }
                            // End Collection details
                        };

                    }
                    else {
                        log_file.write(format + ',Fail,' + error + '\n');
                        grunt.log.error(error);
                    }
                }).auth(userid, passwd, true, token);
            } else {
                log_file.write(format + ',Fail,' + "Access token could not be generated" + '\n');
                throw new Error("Access token could not be generated");
            }
            // grunt.verbose.writeln('Exported All Collections');
        });
    });
};