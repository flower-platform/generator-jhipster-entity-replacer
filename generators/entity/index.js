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
		  if (!this.jhAppConfig) {
			this.error('Can\'t read .yo-rc.json');
		  }		  
		  this.packageFolder = this.jhAppConfig.packageFolder;
		  this.generatedEntitiesFolder  = this.jhAppConfig.generatedEntitiesFolder;
		  entityName = this.entityConfig.entityClass;
		  // this option forces overwriting of files without user being prompted
		  this.conflicter.force = true
        },
        displayLogo() {
            this.log(chalk.white('Running21 ' + chalk.bold('JHipster entity-replacer') + ' Generator! ' + chalk.yellow('v' + packagejs.version + '\n')));
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

            // use constants from generator-constants.js or configuration from .yo-rc.json
			javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
			if(this.generatedEntitiesFolder != null && this.generatedEntitiesFolder.length > 0) {
				generatedEntitiesJavaDir = `${this.generatedEntitiesFolder + this.packageFolder}/`;
			} else {
				generatedEntitiesJavaDir = javaDir;
			}
			if (entityName) {	
				this.log(`\n${chalk.bold.green('I\'m updating the entity for audit ')}${chalk.bold.yellow(this.entityConfig.entityClass)}`);		
				fullPathReadFrom = `${javaDir}domain/${entityName}.java`;
				fullPathWriteTo = `../${generatedEntitiesJavaDir}domain/${entityName}.java`;
				entityReplacerUtils.applyModificationsToFile(entityName, fullPathReadFrom, fullPathWriteTo, this);
			}       
        }/*,

        writeFiles() {
			if (this.abort) {
				return;
			}
			var javaTextSync = this.fs.read(fullPath);
			this.fs.write(path.join(process.cwd(), `../${fullPath}`), javaTextSync);
			currentEntityReplacerGenerator.log(`${chalk.cyan("\nCopying entity ")} from jhipster-import-jdl to project root`);
		}*/
    }	
});

