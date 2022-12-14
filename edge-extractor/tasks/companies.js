// /*jslint node: true */
// var request = require('request');
// var apigee = require('../config.js');
// var companies;
// var fs = require('fs');
// var util = require('util');
// var logs = fs.readFileSync('./debug.csv');
// var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
// module.exports = function (grunt) {
//     'use strict';
//     grunt.registerTask('exportCompanies', 'Export all companies from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
//         var data = logs.toString();;
//         log_file.write(data);
//         var url = apigee.from.url;
//         var org = apigee.from.org;
//         var userid = apigee.from.userid;
//         var passwd = apigee.from.passwd;
//         var filepath = grunt.config.get("exportCompanies.dest.data");
//         var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
//         var format = date + ',' + org + ',exportCompanies';
//         var done_count = 0;
//         var done = this.async();
//         grunt.verbose.writeln("========================= export Companies ===========================");
//         grunt.file.mkdir(filepath);

//         var env_url = url + "/v1/organizations/" + org + "/companies";

//         log_file.write(format + ',' + url + '\n');
//         // grunt.verbose.writeln("Companies URL: " + env_url);

//         request(env_url, function (error, response, body) {
//             if (!error && response.statusCode == 200) {
//                 // grunt.verbose.writeln("Companies" + body);
//                 companies = JSON.parse(body);

//                 if (companies.length == 0) {
//                     grunt.verbose.writeln("No companies");
//                     log_file.write(format + ",No companies");
//                     done();
//                 }
//                 for (var i = 0; i < companies.length; i++) {
//                     var host_url = env_url + "/" + companies[i];
//                     grunt.file.mkdir(filepath);
//                     grunt.verbose.writeln("companies URL : " + host_url);
//                     log_file.write(format + ",companies URL : " + host_url + '\n');
//                     // var env = this.env;

//                     //Call companies details
//                     if (host_url.length > 1024) {
//                         grunt.log.write("SKIPPING companies, URL too long: ");
//                         done_count++;
//                     } else {
//                         request(host_url, function (error, response, body) {
//                             if (!error && response.statusCode == 200) {
//                                 grunt.verbose.writeln("COMPANY " + body);
//                                 var host_detail = JSON.parse(body);
//                                 var host_file = filepath + "/" + host_detail.name;
//                                 grunt.file.write(host_file, body);
//                                 log_file.write(format + ',' + host_detail.name + ',Success,' + body + '\n');
//                                 log_file.write(format + ',' + host_detail.name + ',Success,' + 'Exported companies ' + host_detail.name + '\n');
//                                 grunt.verbose.writeln('Exported companies ' + host_detail.name);
//                             }
//                             else {
//                                 log_file.write(format + ',' + host_detail.name + ',Fail,' + 'Error Exporting companies ' + host_detail.name + '\n' + error + '\n');
//                                 grunt.verbose.writeln('Error Exporting companies ' + host_detail.name);
//                                 grunt.log.error(error);
//                             }

//                             done_count++;
//                             if (done_count == companies.length) {
//                                 grunt.log.ok('Processed ' + done_count + ' companies');
//                                 grunt.verbose.writeln("================== export companies DONE()");
//                                 done();
//                             }
//                         }).auth(userid, passwd, true);
//                     }
//                     // End companies details
//                 };

//             }
//             else {
//                 log_file.write(format + ',Fail,' + error + '\n');
//                 grunt.log.error(error);
//             }
//         }).auth(userid, passwd, true);
//     });

// };
