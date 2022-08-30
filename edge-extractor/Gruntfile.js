
var apigee = require('./config.js');
module.exports = function(grunt) {
  //var date = new Date().getFullYear() + '-' + new Date().getMonth() + '-' + new Date().getDate()+ '(' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds() + ')';
 //require('time-grunt')(grunt);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    availabletasks: {           // task
            tasks: {options: {
            filter: 'exclude',
            tasks: ['mkdir', 'availabletasks', 'warn', 'default']
        }}               // target
        },
    exportDevs: {
       dest: './edge-extracted-data/org/'+apigee.from.org+'/devs'
    },
    exportProducts: {
       dest: './edge-extracted-data/org/'+apigee.from.org+'/products'
    },
    exportApps: {
       dest: './edge-extracted-data/org/'+apigee.from.org+'/apps'
    },
    exportProxies: {
       dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/proxies'
    },
    exportTargetServers: {
       dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/targetservers'
    },
    exportOrgKVM: {
       dest: './edge-extracted-data/kvm/org'
    },
    exportEnvKVM: {
       dest: './edge-extracted-data/kvm/env'
    },
    exportProxyKVM: {
       dest: './edge-extracted-data/kvm/proxy'
    },
    exportSharedFlows: {
       dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/sharedflows'
    },
    exportFlowHooks: {
       dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/flowhooks/flow_hook_config'
    },
    exportAllSpecs: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/specs'
    },
    exportReports: {
       dest: './edge-extracted-data/org/'+apigee.from.org+'/reports'
    },
    exportVirtualHosts: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/virtualhosts'
    },
    exportKeyStores: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/keystores'
    },
    exportReferences: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/references'
    },
    exportCaches: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/caches'
    },
    exportRoles: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/userroles'
    },
    exportCollections: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/collections'
    },
    exportAlerts: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/alerts'
    },
    // exportCompanies: {
    //   dest: './edge-extracted-data/org/'+apigee.from.org+'/companies'
    // },
    exportExtensions: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/extensions'
    },
    exportAnalyticQueries: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/queries'
    },
    exportAnalyticExports: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/environment/'+apigee.from.env+'/queries'
    },
    exportAuditLogs: {
      dest: './edge-extracted-data/org/'+apigee.from.org+'/audits'
    },
    exportOrgResources: {
      dest: './edge-extracted-data/resources/org'
    },
    exportEnvResources: {
      dest: './edge-extracted-data/resources/env'
    },
    readCSVDevs: {
        in_devs: './input/devs.csv',
        out_devs: './edge-extracted-data/devs/'
      },
    readCSVApps: {
        in_apps: './input/apps.csv',
        out_apps: './edge-extracted-data/apps/'
    }

  });

  require('load-grunt-tasks')(grunt);
  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-commands');
 
  grunt.registerTask('default', ['availabletasks']);
  grunt.registerTask('exportAll', ['exportProxies', 'exportProducts', 'exportDevs', 'exportApps', 'exportFlowHooks', 'exportTargetServers', 'exportOrgKVM','exportEnvKVM','exportProxyKVM', 'exportReports', 'exportSharedFlows', 'exportKeyStores', 'exportVirtualHosts', 'exportReferences', 'exportCaches', 'exportRoles', 'exportCollections', 'exportAlerts', 'exportExtensions', 'exportAnalyticQueries', 'exportAnalyticExports', 'exportAuditLogs', 'exportOrgResources', 'exportEnvResources', 'exportAllSpecs']);
  // grunt.registerTask('exportTasks', ['exportCollections', 'exportAlerts', 'exportExtensions', 'exportAnalyticQueries', 'exportAnalyticExports', 'exportAuditLogs', 'exportAllSpecs']);
  // grunt.registerTask('exportTasksList', ['exportAnalyticQueries', 'exportAnalyticExports', 'exportOrgResources', 'exportEnvResources', 'exportAuditLogs', 'exportAllSpecs']);
  grunt.registerTask('tasks', ['availabletasks']);
  grunt.registerTask('warn', 'Display Warning', function() {
      var readline = require('readline');
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      var done = this.async();
      rl.question('THIS SCRIPT WILL DELETE ONE OR MORE RESOURCES FROM THE ORG - ' + apigee.to.org + ' [' + apigee.to.version + '].' + ' THIS ACTION CANNOT BE ROLLED BACK. Do you want to continue (yes/no) ? ', function(answer) {
        if (answer.match(/^y(es)?$/i))
          done(true);
        else
           done(false);
      });
  });
  

};
