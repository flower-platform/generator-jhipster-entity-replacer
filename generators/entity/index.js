const util = require('util');
const generator = require('yeoman-generator');
const packagejs = require(__dirname + '/../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const path = require('path');
const ncp = require('ncp').ncp;
const chalk = require('chalk');
const entityReplacerUtils = require('../../entity-replacer-utils.js');

const JhipsterGenerator = generator.extend({});
util.inherits(JhipsterGenerator, BaseGenerator);

module.exports = JhipsterGenerator.extend({
    initializing: {
        readConfig() {
		  this.entityConfig = this.options.entityConfig;
		  this.jhAppConfig = this.getJhipsterAppConfig();
		  this.packageFolder = this.jhAppConfig.packageFolder;
            this.jhipsterAppConfig = this.getJhipsterAppConfig();
            if (!this.jhipsterAppConfig) {
                this.error('Can\'t read .yo-rc.json');
            }
		  entityName = this.entityConfig.entityClass;
		  // this option forces overwriting of files without user being prompted
		  this.conflicter.force = true
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

    writing: {
        updateFiles() {
			if (this.abort) {
				return;
			}

            // use constants from generator-constants.js
            javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;

			if (entityName) {
				this.log(`\n${chalk.bold.green('I\'m updating the entity for audit ')}${chalk.bold.yellow(this.entityConfig.entityClass)}`);				
				fullPath = `${javaDir}domain/${entityName}.java`;
				entityReplacerUtils.applyModificationsToFile(entityName, fullPath, this);
			}       
        },

        writeFiles() {
			if (this.abort) {
				return;
			}
			var javaTextSync = this.fs.read(fullPath);
			this.fs.write(path.join(process.cwd(), `../${fullPath}`), javaTextSync);
			currentEntityReplacerGenerator.log(`${chalk.cyan("\nCopying entity ")} from jhipster-import-jdl to project root`);
		}
    }	
});

