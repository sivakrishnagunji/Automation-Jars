/*jslint node: true */
var apigee = require('../config.js');
var SpecStore = require('../util/specstore.lib.js');
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
    'use strict';
    /**
     * This will export out all the specifications with the folder structure from Apigee Edge spec store
     *
     */
    grunt.registerTask('exportAllSpecs', 'Export all Specs from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
        var data = logs.toString();;
        log_file.write(data);
        var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
        var format = date + ',' + apigee.from.org + ',exportAllSpecs';
        if (apigee.from.url !== 'https://api.enterprise.apigee.com') {
            log_file.write(format + ',Fail,' + "This will only works with Apigee Edge (Cloud)" + '\n');
            throw new Error("This will only works with Apigee Edge (Cloud)");
        }

        var filepath = grunt.config.get("exportAllSpecs.dest.data");
        var done = this.async();
        var specstoreObj = new SpecStore(apigee.from);
        specstoreObj.getHomeFolderURI(function (json) {
            specstoreObj.downloadFolderContents(json.self, filepath);
        });
        log_file.write(format + ',Success,' + 'Exported All Specs');
        grunt.verbose.writeln('Exported All Specs');
    });
}