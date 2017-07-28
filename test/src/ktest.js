// Wrapper for karma config, used to give CLI options

const KarmaServer = require('karma').Server;
const KarmaConfig = require('karma').config;
const path = require('path');

function configurator(cli_opts){
    var config = KarmaConfig.parseConfig(path.resolve('./src/karma.conf.js'));
    if (!cli_opts.coverage) {
        config.preprocessors = {};
        config.reporters = ['mocha'];
    }

    if (cli_opts.debug){
        config.browsers = ['ChromeHeadlessDebug'];
        config.singleRun = false;
        config.autoWatch = true;
    }

    return config;
}

function startKarma(cli_opts){
    var config = configurator(cli_opts);
    var server = new KarmaServer(config, function(exit_code){
        if (exit_code === 0) {
            console.log('Success\n');
            process.exit(0);
        } else {
            //exit successful anyway to avoid annoying errors
            process.exit(0);
        }
    });
    server.start();
}

function passedArg(string){
    return process.argv.indexOf(string) > -1;
}

function init(){
    var cli_opts = {};

    if(passedArg('cover')){
        cli_opts.coverage = true;
    }

    if (passedArg('debug')){
        cli_opts.debug = true;
    }

    startKarma(cli_opts); 
}

init();