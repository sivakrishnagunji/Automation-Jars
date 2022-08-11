/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var targetServers;
var APIGEE_ENTITY_SINGULAR = 'Target Server';
var APIGEE_ENTITY_PLURAL = 'Target Servers';
var ENTITY_COMMAND_NAME = 'TargetServers'; //used to create exportTargetServers, importTargetServers, deleteTargetServers
var APIGEE_ENTITY_REQUEST_PATH = '/targetservers';
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
  'use strict';
  grunt.registerTask('export' + ENTITY_COMMAND_NAME, 'Export all ' + APIGEE_ENTITY_PLURAL.toLowerCase() + ' from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
    var data = logs.toString();;
    log_file.write(data);
    var org = apigee.from.org;
    var env = apigee.from.env;
    var url = apigee.from.url;
    var userid = apigee.from.userid;
    var passwd = apigee.from.passwd;
    var filepath = grunt.config.get("export" + ENTITY_COMMAND_NAME + ".dest.data");
    var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
    var format = date + ',' + org + ',' + env + ',exportTargetServers';
    var done_count = 0;
    var done = this.async();

    grunt.verbose.writeln("========================= export " + APIGEE_ENTITY_PLURAL + " ===========================");

    url = url + "/v1/organizations/" + org + "/environments/" + env + APIGEE_ENTITY_REQUEST_PATH;
    grunt.verbose.writeln("getting " + APIGEE_ENTITY_PLURAL + " ..." + url);
    log_file.write(format + ",getting " + APIGEE_ENTITY_PLURAL + " ..." + url + '\n');
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        grunt.verbose.writeln(APIGEE_ENTITY_PLURAL + " " + body);
        targetServers = JSON.parse(body);

        if (targetServers.length == 0) {
          log_file.write(format + ',Success,' + "export" + ENTITY_COMMAND_NAME + ": No " + APIGEE_ENTITY_PLURAL + '\n');
          grunt.verbose.writeln("export" + ENTITY_COMMAND_NAME + ": No " + APIGEE_ENTITY_PLURAL);
          grunt.verbose.writeln("================== export " + APIGEE_ENTITY_PLURAL + " DONE()");
          done();
        } else {
          for (var i = 0; i < targetServers.length; i++) {
            // Custom report
            var target_server_url = url + "/" + encodeURIComponent(targetServers[i]);
            grunt.file.mkdir(filepath);

            //Call target server details
            grunt.verbose.writeln(APIGEE_ENTITY_SINGULAR + ' URL: ' + target_server_url);
            log_file.write(format + ',Success,' + APIGEE_ENTITY_SINGULAR + ' URL: ' + target_server_url + '\n');
            request(target_server_url, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                var target_server_detail = JSON.parse(body);
                var target_server_file = filepath + "/" + target_server_detail.name;
                grunt.verbose.writeln(APIGEE_ENTITY_SINGULAR + ": " + body);
                log_file.write(format + ',' + target_server_detail.name + ',Success,' + body + '\n');
                grunt.file.write(target_server_file, body);
                log_file.write(format + ',' + target_server_detail.name + ',Success,' + APIGEE_ENTITY_SINGULAR + ' ' + target_server_detail.name + ' written!' + '\n');
                grunt.verbose.writeln(APIGEE_ENTITY_SINGULAR + ' ' + target_server_detail.name + ' written!');
              } else {
                log_file.write(format + ',Fail,' + 'Error ' + response.statusCode + ' exporting ' + error + '\n');
                grunt.verbose.writeln('Error ' + response.statusCode + ' exporting ' + error);
                grunt.log.error(error);
              }

              done_count++;
              if (done_count == targetServers.length) {
                grunt.log.ok('Exported ' + done_count + ' ' + APIGEE_ENTITY_PLURAL);
                grunt.verbose.writeln("================== export " + APIGEE_ENTITY_PLURAL + " DONE()");
                done();
              }
            }).auth(userid, passwd, true);
            // End target_server details
          };
        }
      } else {
        log_file.write(format + ',Fail,' + error + '\n');
        grunt.log.error(error);
      }
    }).auth(userid, passwd, true);
  });

};
