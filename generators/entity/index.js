const util = require('util');
const chalk = require('chalk');
const generator = require('yeoman-generator');
const packagejs = require(__dirname + '/../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');

const JhipsterGenerator = generator.extend({});
util.inherits(JhipsterGenerator, BaseGenerator);

module.exports = JhipsterGenerator.extend({
    initializing: {
		readConfig() {
		  this.entityConfig = this.options.entityConfig;
		  this.jhAppConfig = this.getJhipsterAppConfig();
		  if (!this.jhAppConfig) {
			this.error('Can\'t read .yo-rc.json');
		  }
		},
        displayLogo() {
            this.log(chalk.white('Running ' + chalk.bold('JHipster entity-replacer') + ' Generator! ' + chalk.yellow('v' + packagejs.version + '\n')));
        },
        validate() {
            // this shouldn't be run directly
            if (!this.entityConfig) {
                this.env.error(chalk.red.bold('ERROR!') + ' This sub generator should be used only from JHipster and cannot be run directly...\n');
            }
        }
    },

    prompting() {
	    if (this.abort) {
			return;
		}

        // don't prompt if data are imported from a file
        if (this.entityConfig.useConfigurationFile == true && this.entityConfig.data && typeof this.entityConfig.data.yourOptionKey !== 'undefined') {
            this.yourOptionKey = this.entityConfig.data.yourOptionKey;
            return;
        }
		const done = this.async();
		const entityName = this.entityConfig.entityClass;
		const prompts = [{
		  type: 'confirm',
		  name: 'enableReplacer',
		  message: `Do you want to enable replacer for this entity(${entityName})?`,
		  default: true
		}];

        this.prompt(prompts).then((props) => {
		  this.props = props;
		  // To access props later use this.props.someOption;
		  this.enableReplacer = props.enableReplacer;
		  done();
        });
    },

    writing: {
        updateFiles() {

			if (this.abort) {
				return;
			}
			if (!this.enableReplacer) {
				return;
			}

            // use function in generator-base.js from generator-jhipster
            this.angularAppName = this.getAngularAppName();

            // use constants from generator-constants.js
            const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
  

			if (this.entityConfig.entityClass) {
				this.log(`\n${chalk.bold.green('I\'m updating the entity for audit ')}${chalk.bold.yellow(this.entityConfig.entityClass)}`);
				
				var entityName = this.entityConfig.entityClass;
				
				fullPath = `${javaDir}domain/${entityName}.java`;
				var javaText = this.fs.read(fullPath);
				// match the whole text between <jhipster-entity-replacer> tags
				var re = new RegExp('<jhipster-entity-replacer>([\\s\\S]*?)<\\/jhipster-entity-replacer>[\\s\\S]*?(?:(.*class[\\s\\S]*?\\{)|.*?(\\w+);)', 'g');
				// iterate through whole file and get the instructions string between <jhipster-entity-replacer> for each field 
				do {
				var m = re.exec(javaText);
				if (m) {
					// declared without var as it needs to be available outside this module
					currentFieldOrClass = m[2] ? m[2] : m[3];
					var currentInstructionsString = m[1];
					// eavluate whole current instruction string
					var formattedComment = formatUtilsJH.formatComment(currentInstructionsString)
					this.log(`${chalk.cyan("Evaluation of ")} ${formattedComment.replace(/\\"/g, '"')}`)
					eval(formattedComment.replace(/\\"/g, '"'));
					}
				} while (m);
			}       
        },

        updateConfig() {
            this.updateEntityConfig(this.entityConfig.filename, 'yourOptionKey', this.yourOptionKey);
        }
    },

    end() {
		ncp(`${javaDir}domain/${entityName}`, `../${javaDir}domain/${entityName}, {"clobber": true}, function (err) {
				if (err) {
					return currentEntityReplacerGenerator.log(err);
				}
				currentEntityReplacerGenerator.log(`${chalk.cyan("\nCopying  entity " + entityName)} from jhipster-import-jdl to project root`);
		});
	}
});
