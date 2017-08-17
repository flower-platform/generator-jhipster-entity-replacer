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
const ncp = require('ncp').ncp;
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
        javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

        // variable from questions
        this.message = this.props.message;
		
		currentEntityReplacerGenerator = this;
		this.log('\n---Updating entities files ---');
		this.existingEntities.forEach((entityName) => {
          var jsonObj = this.fs.readJSON(`.jhipster/${entityName}.json`);
		  fullPath = `${javaDir}domain/${entityName}.java`;
		  this.log(`${chalk.magenta("Processing")} ${fullPath}`);
		  
		  // @ApiModelProperty("This is a comment bla bla. <jhipster-entity-replacer> // aici avem cod js pe care... </jhipster-entity-replacer>")  becomes @ApiModelProperty("This is a comment bla bla.") 
		  var regexApiModelProp = '((?:@ApiModelProperty|@ApiModel)\\(.*?)<jhipster-entity-replacer>.*<\\/jhipster-entity-replacer>(.*?\\))';
		  this.replaceContent(fullPath, regexApiModelProp, "$1$2", true);
		  
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
		} while (m);});
    },
	// temporary deactivated
   registering () {
		try {
            this.registerModule('generator-jhipster-entity-replacer', 'entity', 'post', 'entity', 'Parses javascript code within tags and executes it as is');
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
	//currentEntityReplacerGenerator.log(`${chalk.green('Storing:')} ${name}`);
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
	currentEntityReplacerGenerator.log(`${chalk.green('Inserting before field')} ${currentFieldOrClass} ${insertion}`);
	var isClass = currentFieldOrClass.includes("class");
	var regex =  isClass ? new RegExp("(\s*" + currentFieldOrClass + "\\s*)") : new RegExp("(.*" + currentFieldOrClass + "\\s*;)");
	var charBeforeInsertion = isClass ? '' : '\t';
	currentEntityReplacerGenerator.log(`${chalk.green('Inserting:Regex')} ${regex.toString()}`);	
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPath), javaTextSync.replace(regex, charBeforeInsertion + insertion + '\n$1'));
  },
  replaceRegexWithCurlyBraceBlock: function (regexString) {
	currentEntityReplacerGenerator.log(`${chalk.green('Deleting method that matches regex ')} ${regexString}`);
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPath);
	var curlyBracesStack = [];
	// where method starts
	var positionOfMatch = javaTextSync.search(new RegExp(regexString));
	if (positionOfMatch != -1) {
		indexOfFirstBracket = javaTextSync.indexOf("{", positionOfMatch);
		if (indexOfFirstBracket != -1) {
			curlyBracesStack.push("{");
			// will be incremented as long as each bracket has a match and 
			// it will denote the end of method, at the end of this loop
			var startIndex = indexOfFirstBracket;
			// brackets must not be taken into consideration if we are inside " or '
			var isInSingleQuotation = false;
			var isInDoubleQuotation = false;
			while (curlyBracesStack.length != 0) {
				++startIndex;
				if (javaTextSync.charAt(startIndex) == '"') {
					isInDoubleQuotation =  !isInDoubleQuotation;
				} else if (javaTextSync.charAt(startIndex) == "'") {
					isInSingleQuotation = !isInSingleQuotation;
				} else if (!isInDoubleQuotation && !isInSingleQuotation && javaTextSync.charAt(startIndex) == "{") {
					curlyBracesStack.push("{");
				} else if (!isInDoubleQuotation && !isInSingleQuotation && javaTextSync.charAt(startIndex) == "}") {
					curlyBracesStack.pop();
				}
			}
			currentEntityReplacerGenerator.log(`${chalk.green('Matched full method body from ')} ${positionOfMatch} to ${startIndex}`); 
			currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPath), javaTextSync.replace(javaTextSync.substring(positionOfMatch, startIndex + 1), ""));	
		}
	}
  },
  insertBeforeElement: function (elementName, insertion) {
	currentEntityReplacerGenerator.log(`${chalk.green('Inserting before element ')} ${elementName} ${insertion}`);	
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPath);
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPath), javaTextSync.replace(new RegExp("(.*private.*" + elementName + ".*;)"), '\t' + insertion + '\n$1'));
  }
};

var replacer = Object.create(Replacer);

// predefined commands
replacer.storeReplacements("insertAnnotGenEntityDtoAboveClass", function(replacer) {
	replacer.insertElement("@GenEntityDto(superClass = TempAbstractDto.class)");
	replacer.replaceRegex("(package\s*.*;)", "$1\nimport com.crispico.annotation.definition.GenEntityDto;");
	replacer.replaceRegex("(package\s*.*;)", "$1\nimport com.crispico.absence_management.shared.dto.TempAbstractDto;");
});

replacer.storeReplacements("insertAnnotGenDtoCrudRepositoryAndServiceAboveClass", function(replacer) {
	replacer.insertElement("@GenDtoCrudRepositoryAndService");
	replacer.replaceRegex("(package\s*.*;)", "$1\nimport com.crispico.annotation.definition.GenDtoCrudRepositoryAndService;");
});

replacer.storeReplacements("addImportForGenEntityDtoField", function(replacer) {
	replacer.replaceRegex("(package\s*.*;)", "$1\nimport com.crispico.annotation.definition.GenEntityDtoField;");
});

replacer.storeReplacements("addImportForFieldInclusion", function(replacer) {
	replacer.replaceRegex("(package\s*.*;)", "$1\nimport com.crispico.annotation.definition.util.EntityConstants.FieldInclusion;");
});
replacer.storeReplacements("insertAnotGenEntityDtoFieldAboveField", function(replacer) {
	replacer.insertElement("@GenEntityDtoField(inclusion=FieldInclusion.EXCLUDE)");
});