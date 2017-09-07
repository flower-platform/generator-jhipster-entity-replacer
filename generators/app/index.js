const util = require('util');
const chalk = require('chalk');
const generator = require('yeoman-generator');
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const fs = require('fs');
const path = require('path');
const ncp = require('ncp').ncp;
const JhipsterGenerator = generator.extend({});
const entityReplacerUtils = require('../../entity-replacer-utils.js');
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
        }
      });
      this.existingEntities = existingEntities;
    },

    prompting() {
        const prompts = [
            {
                type: 'input',
                name: 'message',
                message: 'Please type any key if you agree to proceed'
            }
        ];

        const done = this.async();
        this.prompt(prompts).then((props) => {
            this.props = props;
            done();
        });
    },

    writing() {
		
        // use constants from generator-constants.js
        javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.jhipsterAppConfig.packageFolder}/`;

        // variable from questions
        this.message = this.props.message;
		
		currentEntityReplacerGenerator = this;
		this.log('\n---Updating entities files ---');
		this.existingEntities.forEach((entityName) => {
		  fullPath = `${javaDir}domain/${entityName}.java`;
		  this.log(`${chalk.magenta("Processing")} ${fullPath}`);
		  entityReplacerUtils.applyModificationsToFile(entityName, fullPath, this);
		});
        try {
			this.log("I am registering as a post-entity-hook");
            this.registerModule('generator-jhipster-entity-replacer', 'entity', 'post', 'entity', 'Entity replacer');
        } catch (err) {
            this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster entity post creation hook...\n`);
        }
    },

    end() {
		ncp(`${javaDir}domain/`, `../${javaDir}domain/`, {"clobber": true}, function (err) {
			if (err) {
				return currentEntityReplacerGenerator.log(err);
			}
			currentEntityReplacerGenerator.log(`${chalk.cyan("\nCopying `domain` entities directory ")} from jhipster-import-jdl to project root`);
		});
    }
});


