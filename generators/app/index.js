const util = require('util');
const chalk = require('chalk');
const generator = require('yeoman-generator');
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const fs = require('fs');
const path = require('path');
const formatUtilsJH = require('jhipster-core/lib/utils/format_utils.js');

const JhipsterGenerator = generator.extend({});
util.inherits(JhipsterGenerator, BaseGenerator);

const regex_matches_everything = "[\\s\\S]*";

module.exports = JhipsterGenerator.extend({
    initializing: {
        readConfig() {
            this.jhipsterAppConfig = this.getJhipsterAppConfig();
            if (!this.jhipsterAppConfig) {
                this.error('Can\'t read .yo-rc.json');
            }
        },
        displayLogo() {
            // it's here to show that you can use functions from generator-jhipster
            // this function is in: generator-jhipster/generators/generator-base.js
            this.printJHipsterLogo();

            // Have Yeoman greet the user.
            this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster entity-replacer')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
        },
        checkJhipster() {
            const jhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
            const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
            if (!semver.satisfies(jhipsterVersion, minimumJhipsterVersion)) {
                this.warning(`\nYour generated project used an old JHipster version (${jhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
            }
        }
    },
	getEntitityNames() {
      const existingEntities = [];
      const existingEntityChoices = [];
      let existingEntityNames = [];
      try {
        existingEntityNames = fs.readdirSync('.jhipster');
      } catch (e) {
        this.log(`${chalk.red.bold('ERROR!')} Could not read entities, you might not have generated any entities yet. I will continue to install audit files, entities will not be updated...\n`);
      }

      existingEntityNames.forEach((entry) => {
        if (entry.indexOf('.json') !== -1) {
          const entityName = entry.replace('.json', '');
          existingEntities.push(entityName);
		  this.log(entityName);		   
        }
      });
      this.existingEntities = existingEntities;
    },

    prompting() {
        const prompts = [
            {
                type: 'input',
                name: 'message',
                message: 'Please type any key if you agree to purceed'
            }
        ];

        const done = this.async();
        this.prompt(prompts).then((props) => {
            this.props = props;
            done();
        });
    },
	
    writing() {
        // function to use directly template
        this.template = function (source, destination) {
            this.fs.copyTpl(
                this.templatePath(source),
                this.destinationPath(destination),
                this
            );
        };

        // read config from .yo-rc.json
        this.baseName = this.jhipsterAppConfig.baseName;
        this.packageName = this.jhipsterAppConfig.packageName;
        this.packageFolder = this.jhipsterAppConfig.packageFolder;
        this.clientFramework = this.jhipsterAppConfig.clientFramework;
        this.clientPackageManager = this.jhipsterAppConfig.clientPackageManager;
        this.buildTool = this.jhipsterAppConfig.buildTool;

        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

        // variable from questions
        this.message = this.props.message;

        // show all variables
        this.log('\n--- some config read from config ---');
        this.log(`baseName=${this.baseName}`);
        this.log(`packageName=${this.packageName}`);
        this.log(`clientFramework=${this.clientFramework}`);
        this.log(`clientPackageManager=${this.clientPackageManager}`);
        this.log(`buildTool=${this.buildTool}`);

        this.log('\n--- some function ---');
        this.log(`angularAppName=${this.angularAppName}`);

        this.log('\n--- some const ---');
        this.log(`javaDir=${javaDir}`);
        this.log(`resourceDir=${resourceDir}`);
        this.log(`webappDir=${webappDir}`);

        this.log('\n--- variables from questions ---');
        this.log(`\nmessage=${this.message}`);
        this.log('------\n');

        if (this.clientFramework === 'angular1') {
            this.template('dummy.txt', 'dummy-angular1.txt');
        }
        if (this.clientFramework === 'angular2') {
            this.template('dummy.txt', 'dummy-angular2.txt');
        }
        if (this.buildTool === 'maven') {
            this.template('dummy.txt', 'dummy-maven.txt');
        }
        if (this.buildTool === 'gradle') {
            this.template('dummy.txt', 'dummy-gradle.txt');
        }
		currentEntityReplacerGenerator = this;
		this.log('\n---Updating entities files ---');
		this.existingEntities.forEach((entityName) => {
          var jsonObj = this.fs.readJSON(`.jhipster/${entityName}.json`);
		  fullPath = `${javaDir}domain/${entityName}.java`;
		  this.log(`${chalk.magenta("Processing")} ${fullPath}`);	
		  
		  // @ApiModelProperty("This is a comment bla bla. <jhipster-entity-replacer> // aici avem cod js pe care... </jhipster-entity-replacer>")  becomes @ApiModelProperty("This is a comment bla bla.") 
		  var regexApiModelProp = '(@ApiModelProperty\\(.*?)<jhipster-entity-replacer>.*<\\/jhipster-entity-replacer>(.*?\\))';
		  this.replaceContent(fullPath, regexApiModelProp, "$1$2", true);
		  
		  var javaText = this.fs.read(fullPath);
		  // match the whole text between <jhipster-entity-replacer> tags
		  var re = new RegExp('<jhipster-entity-replacer>(' + regex_matches_everything + '?)<\\/jhipster-entity-replacer>(' + regex_matches_everything + '?)(\\w+);', 'g');
		  // iterate through whole file and get the instructions string between <jhipster-entity-replacer> for each field 
		  do {
			var m = re.exec(javaText);
			if (m) {
				// declared without var as it needs to be available outside this module
				currentField = m[3];
				var currentInstructionsString = m[1];
				// iterate through current instruction string and evaluate each instruction
				var formattedComment = formatUtilsJH.formatComment(currentInstructionsString)
				this.log(`${chalk.blue("Evaluation of ")} ${formattedComment.replace(/\\"/g, '"')}`)
				eval(formattedComment.replace(/\\"/g, '"'));
			}
		} while (m);
        });
    },

   registering () {
		try {
            this.registerModule('generator-jhipster-entity-replacer', 'entity', 'post', 'entity', 'Parses javascript code within tags and executes it as is');
        } catch (err) {
            this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster entity post creation hook...\n`);
        }
	},
    install() {
        let logMsg =
            `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        if (this.clientFramework === 'angular1') {
            logMsg =
                `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
        }
        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.warning('Install of dependencies failed!');
                this.log(logMsg);
            } else if (this.clientFramework === 'angular1') {
                this.spawnCommand('gulp', ['install']);
            }
        };
        const installConfig = {
            bower: this.clientFramework === 'angular1',
            npm: this.clientPackageManager !== 'yarn',
            yarn: this.clientPackageManager === 'yarn',
            callback: injectDependenciesAndConstants
        };
        if (this.options['skip-install']) {
            this.log(logMsg);
        } else {
            this.installDependencies(installConfig);
        }
    },

    end() {
        this.log('End of entity-replacer generator');
    }
});


// array holding for each key a function
registryOfStoredReplacement = [];
var Replacer = {
  replaceRegex: function(expression1, expression2) {
	currentEntityReplacerGenerator.log(`${chalk.green('Replacing first match')} for ${expression1} with ${expression2}`); 
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPath);
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPath), javaTextSync.replace(new RegExp(expression1), expression2));
  },
  replaceRegexAll: function(expression1, expression2) {
	currentEntityReplacerGenerator.log(`${chalk.green('Replacing ALL matches')} for ${expression1} with ${expression2}`);
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPath);	
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPath), javaTextSync.replace(new RegExp(expression1, 'g'), expression2));
  },
  storeReplacements: function (name, func) {
	currentEntityReplacerGenerator.log(`${chalk.green('Storing:')} ${name}`);
	registryOfStoredReplacement[name] = func;
  },
  applyStoredReplacements: function (storedReplacement) {
	var functionToBeEvaled = registryOfStoredReplacement[storedReplacement];
	var that  = this;
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPath);
	// insert `replacer = that` in the code that will be executed in order to have the correct reference for `replacer` param 
	functionToBeEvaled = functionToBeEvaled.toString().replace(new RegExp('(function\\s*\\(replacer\\)\\s*\\{)'), '$1\nreplacer=that;');
	currentEntityReplacerGenerator.log(`${chalk.green('Applying stored replacement:')} ${storedReplacement}`);
	eval('(' + functionToBeEvaled + ')();');
  },
  insertElement: function (insertion) {
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPath);
	currentEntityReplacerGenerator.log(`${chalk.green('Inserting before field')} ${currentField} ${insertion}`); 
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPath), javaTextSync.replace(new RegExp("(.+" + currentField + ";)"), '\t' + insertion + '\n$1'));
  }
};

var replacer = Object.create(Replacer);