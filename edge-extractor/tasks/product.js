/*jslint node: true */
var request = require('request');
var apigee = require('../config.js');
var products;
var fs = require('fs');
var util = require('util');
var logs = fs.readFileSync('./debug.csv');
var log_file = fs.createWriteStream('./debug.csv', { flags: 'w' });
module.exports = function (grunt) {
	'use strict';
	grunt.registerTask('exportProducts', 'Export all products from org ' + apigee.from.org + " [" + apigee.from.version + "]", function () {
		var data = logs.toString();;
		log_file.write(data);
		var url = apigee.from.url;
		var org = apigee.from.org;
		var userid = apigee.from.userid;
		var passwd = apigee.from.passwd;
		var filepath = grunt.config.get("exportProducts.dest.data");
		var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds();
		var format = date + ',' + org + ',exportProducts';
		var done_count = 0;
		var done = this.async();
		grunt.verbose.writeln("========================= export Products ===========================");

		url = url + "/v1/organizations/" + org + "/apiproducts";
		grunt.verbose.writeln("getting products..." + url);
		log_file.write(format + ",getting products..." + url + '\n');

		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				grunt.log.write("PRODUCTS: " + body);
				products = JSON.parse(body);

				if (products.length == 0) {
					log_file.write(format + ',No Products' + '\n');
					grunt.verbose.writeln("No Products");
					done();
				}
				for (var i = 0; i < products.length; i++) {
					var product_url = url + "/" + products[i];
					grunt.file.mkdir(filepath);

					//Call product details
					grunt.verbose.writeln("PRODUCT URL: " + product_url.length + " " + product_url);
					log_file.write(format + ',' + products[i] + ',Success,' + "PRODUCT URL: " + product_url + '\n');
					// An Edge bug allows products to be created with very long names which cannot be used in URLs.
					if (product_url.length > 1024) {
						grunt.log.write("SKIPPING Product, URL too long: ");
						done_count++;
					} else {
						request(product_url, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var product_detail = JSON.parse(body);
								var dev_file = filepath + "/" + product_detail.name;
								grunt.file.write(dev_file, body);
								log_file.write(format + ',' + product_detail.name + ',Success,' + body + '\n');
								grunt.verbose.writeln("PRODUCT " + body);
								log_file.write(format + ',' + product_detail.name + ',Success,' + 'Exported Product ' + product_detail.name + '\n');
								grunt.verbose.writeln('Exported Product ' + product_detail.name);
							}
							else {
								log_file.write(format + ',' + products[i] + ',Fail,' + 'Error Exporting Product ' + product_detail.name + '\n' + error + '\n');
								grunt.verbose.writeln('Error Exporting Product ' + product_detail.name);
								grunt.log.error(error);
							}

							done_count++;
							if (done_count == products.length) {
								grunt.log.ok('Processed ' + done_count + ' products');
								grunt.verbose.writeln("================== export products DONE()");
								done();
							}
						}).auth(userid, passwd, true);
					}
					// End product details
				};

			}
			else {
				log_file.write(format + ',Fail,' + error);
				grunt.log.error(error);
			}
		}).auth(userid, passwd, true);
		/*
		setTimeout(function() {
			grunt.verbose.writeln("================== Products Timeout done" );
			done(true);
		}, 10000);
		grunt.verbose.writeln("========================= export Products DONE ===========================" );
		*/
	});

};
