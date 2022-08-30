/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var extensions;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
var SpecStore = require('../util/specstore.lib.js');
// var options = new Object();
module.exports = function (grunt) {
    'use strict';
    grunt.registerTask('exportExtensions', 'Export all extensions from org ' + apigee.from.org + " environment " + apigee.from.env + " [" + apigee.from.version + "]", function () {
        var data = logs.toString();;
        log_file.write(data);
        var url = apigee.from.url;
        var org = apigee.from.org;
        var env = apigee.from.env;
        var userid = apigee.from.userid;
        var passwd = apigee.from.passwd;
        var filepath = grunt.config.get("exportExtensions.dest.data");
        var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
        var format = date + ',' + org + ',' + env + ',exportExtensions';
        var done_count = 0;
        var done = this.async();
        var specstoreObj = new SpecStore(apigee.from);
        grunt.verbose.writeln("========================= export Env EXTENSIONS ===========================");
        // grunt.file.mkdir(filepath);

        var env_url = url + "/v1/organizations/" + org + "/environments/" + env + "/extensions";

        grunt.verbose.writeln("Env Extensions URL: " + env_url);
        log_file.write(format + ",Env Extensions URL: " + env_url + '\n');
        specstoreObj.generateAccessToken(function (token) {
            // grunt.verbose.writeln(token);
            if (token != null) {
                // if (!options.headers) {
                //     options.headers = [];
                //     options.headers.Authorization = "Bearer " + token;
                // }
                // if (!options.method) {
                //     options.method = "GET";
                // }
                const options = {
                    url: env_url,
                    method: 'GET',
                    headers: {
                        'Accept': '*/*',
                        // 'Accept-Encoding': 'gzip, deflate, br',
                        'Connection': 'keep-alive',
                        'Authorization': 'Bearer ' + token
                    },
                    // authorization: 'Bearer ' + token
                };
                // options.headers.Authorization = "Bearer " + token;
                // grunt.verbose.writeln("Outside Request  " + options.method + options.headers.Authorization);

                request(env_url, options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        grunt.verbose.writeln("EXTENSIONS" + body);
                        extensions = JSON.parse(body);
                        grunt.file.mkdir(filepath);
                        grunt.verbose.writeln("Extensions URL : " + env_url);
                        var host_file = filepath + "/extensions";
                        grunt.file.write(host_file, body);
                        log_file.write(format + ',Success,' + body + '\n');
                        log_file.write(format + ',Success,' + 'Exported Extenions' + '\n');
                        grunt.verbose.writeln('Exported Extenions');
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
            // grunt.verbose.writeln('Exported All alerts');
        });
    });
};
