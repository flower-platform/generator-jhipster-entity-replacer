const util = require('util');
const chalk = require('chalk');
const generator = require('yeoman-generator');
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const fs = require('fs');
const glob = require('glob');
const jhipsterUtils = require('generator-jhipster/generators/utils');
const path = require('path');

const JhipsterGenerator = generator.extend({});
util.inherits(JhipsterGenerator, BaseGenerator);

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
          existingEntityChoices.push({
            name: entityName,
            value: entityName
          });
		   
        }
      });
      this.existingEntities = existingEntities;
      this.existingEntityChoices = existingEntityChoices;
    },

    prompting() {
        const prompts = [
            {
                type: 'input',
                name: 'message',
                message: 'Please put something here',
                default: 'hello world!'
            }
        ];

        const done = this.async();
        this.prompt(prompts).then((props) => {
            this.props = props;
            // To access props later use this.props.someOption;

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
        try {
            this.registerModule('generator-jhipster-entity-replacer', 'entity', 'post', 'entity', 'Parses javascript code within &lt;jhipster-entity-replacer&gt; and executes it as is');
        } catch (err) {
            this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster entity post creation hook...\n`);
        }
		currentGenerator = this;
		this.existingEntities.forEach((entityName) => {
          jsonObj = this.fs.readJSON(`.jhipster/${entityName}.json`);
          this.replaceContent(`${javaDir}domain/${entityName}.java`, '(@ApiModelProperty\\(".*)<jhipster-entity-replacer>.*<\\/jhipster-entity-replacer>(.*\\))', "$1$2", true);
		  javaText = this.fs.read(`${javaDir}domain/${entityName}.java`);
		  fullPath = `${javaDir}domain/${entityName}.java`;
		  this.log(`${javaDir}domain/${entityName}.java`);
		  var re = new RegExp('<jhipster-entity-replacer>((?:\\S|\\s)*?)<\\/jhipster-entity-replacer>((?:\\S|\\s)*?)(\\w+);', 'g');
		  var replacerCallRegex = new RegExp('(replacer.\\w+\\(.*\\);)|(replacer.\\w+\\(.[\\s\\S]*?function\\s*\\([\\s\\S]*?\\)\\s*\\{[\\s\\S]*?\\}\s*?\\));', 'g');
		  do {
			m = re.exec(javaText);
			if (m) {
				this.log('matched1');
				this.log(m[1]);
				this.log(m[3]);
				currentField = m[3];
				do {
					q = replacerCallRegex.exec(m[1]);
					if (q) {
						if (q[1]) {
							expressionToBeEval = q[1];
						} else {
							expressionToBeEval = q[2];
						}
						this.log('matched2');
						this.log(q[0]);
						
						eval(q[0]);
					}
				} while (q);
			}
		} while (m);
        });
    },
	
	updateEntityFiles() {
      // Update existing entities to enable audit
      /*if (this.updateType === 'all') {
        this.entitiesToUpdate = this.existingEntities;
      }
      if (this.entitiesToUpdate && this.entitiesToUpdate.length > 0 && this.entitiesToUpdate !== 'none') {
        this.log(`\n${chalk.bold.green('I\'m Updating selected entities ')}${chalk.bold.yellow(this.entitiesToUpdate)}`);
        this.log(`\n${chalk.bold.yellow('Make sure these classes does not extend any other class to avoid any errors during compilation.')}`);
        let jsonObj = null;
*/
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



registryOfStoredReplacement = [];
var Replacer = {
  replaceRegex: function(expression1, expression2) {
	currentGenerator.fs.write(path.join(process.cwd(), fullPath), javaText.replace(new RegExp(expression1), expression2));
  },
  replaceRegexAll: function(expression1, expression2) {
	currentGenerator.fs.write(path.join(process.cwd(), fullPath), javaText.replace(new RegExp(expression1, 'g'), expression2));
  },
  storeReplacements: function (name, func) {
	currentGenerator.log("Storing this:" + name);
	registryOfStoredReplacement[name] = func;
  },
  applyStoredReplacements: function (storedReplacement) {
	var functionToBeEvaled = registryOfStoredReplacement[storedReplacement];
	var that  = this;
	functionToBeEvaled = functionToBeEvaled.toString().replace(new RegExp('(function\\s*\\(replacer\\)\\s*\\{)'), '$1\nreplacer=that;');
	currentGenerator.log("APPLY STORED REPLS");
	currentGenerator.log(functionToBeEvaled);
	eval('(' + functionToBeEvaled + ')();');
  },
  insertElement: function (insertion) {
	currentGenerator.fs.write(path.join(process.cwd(), fullPath), javaText.replace(new RegExp("(.+" + currentField + ";)"), '\t' + insertion + '\n$1'));
  }
};

var replacer = Object.create(Replacer);