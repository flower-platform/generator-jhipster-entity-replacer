const formatUtilsJH = require('jhipster-core/lib/utils/format_utils.js');
const path = require('path');
const chalk = require('chalk');

module.exports = {
    applyModificationsToFile
};

function applyModificationsToFile(entityName, readFrom, writeTo, generator) {
		// !!!all variables declared without `var` need to be available outside this module
		currentEntityReplacerGenerator = generator;
		currentEntity = entityName;
		fullPathReadFrom = readFrom;
		fullPathWriteTo = writeTo;
		var javaText = generator.fs.read(fullPathReadFrom);
		
		// transfer java source code to the root of the project
		currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaText);
		
		// @ApiModelProperty("This is a comment bla bla. {{{// aici avem cod js pe care... }}}")  becomes @ApiModelProperty("This is a comment bla bla.") 		
		var regexApiModelProp = '((?:@ApiModelProperty|@ApiModel)\\(.*?)\\{\\{\\{.*\\}\\}\\}(.*?\\))';
		generator.replaceContent(fullPathWriteTo, regexApiModelProp, "$1$2", true);

		javaText = generator.fs.read(fullPathWriteTo);
		// match the whole text between {{{...}}} tags
		var re = new RegExp('(\\{\\{\\{([\\s\\S]*?)\\}\\}\\})[\\s\\S]*?(?:private|public|protected)(?:(.*class[\\s\\S]*?\\{)|.*?(\\w+)\\s*=.*?;|.*?(\\w+);)', 'g');
		// iterate through whole file and get the instructions string between {{{...}}} for each field which are stored in the array above as key value pairs
		// key - field or class value - instruction
		var bufferOfInstructionsToBeApplied = [];
		do {
		var m = re.exec(javaText);
		if (m) {
			currentFieldOrClass = m[3] ? m[3] : (m[4] ? m[4] : m[5]);
			// delete snippets like {{{ ...}}} from comments
			generator.replaceContent(fullPathWriteTo, m[1], "");
			bufferOfInstructionsToBeApplied[currentFieldOrClass] = m[2];
			}
		} while (m);
		// empty comments may reside after deleting snippets like {{{...}}}
		// from comments if those snippets were the only thing found in comments
		generator.replaceContent(fullPathWriteTo, "\\s*\\/\\*[\\*\\s]+\\*\\/", "\n", true);
		// comments with empty rows may also reside, so we delete the empty rows from comments (the lines which only contain *)
		javaText = generator.fs.read(fullPathWriteTo);
		generator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaText.replace(new RegExp("\n*^\\s*\\*\\s*$", 'mg'), ""));		

		
		// apply instructions (default function and instructions from .jdl)
		
		// HACK: make sure we eval only once the content from jhipster-entity-replacer.js
		// by checking if test function was declared; if it was not, we declare it
		// and so, we never enter again on this branch
		if (!$r.test) {
			generator.log(`${chalk.red("I am executing once")} entity()`);
			eval(generator.fs.read('./jhipster-entity-replacer.js', { defaults: "" }));
			$r.test = function () {};
		}		
		if (typeof $r.entity === "function") {		
			generator.log(`${chalk.red("Executing global default function")} entity()`);
			$r.entity();	
		}
		
		// apply stored instructions from {{{ }}}
		for (currentFieldOrClass in bufferOfInstructionsToBeApplied) {
			var currentInstructionsString = bufferOfInstructionsToBeApplied[currentFieldOrClass];
			// evaluate whole current instruction string
			if (currentInstructionsString != undefined && currentInstructionsString.length != 0){
				var formattedComment = formatUtilsJH.formatComment(currentInstructionsString)
				generator.log(`${chalk.cyan("Evaluation of ")} ${formattedComment.replace(/\\"/g, '"')}`)
				eval(formattedComment.replace(/\\"/g, '"'));
			}
		}
}

var Replacer = {
  replaceRegex: function(replaceWhat, replaceWith, startIndexOfMatchForCurrentFieldOrClass = 0) {
	currentEntityReplacerGenerator.log(`${chalk.green('Replacing first match')} index: ${startIndexOfMatchForCurrentFieldOrClass} for ${replaceWhat} with ${replaceWith}`); 
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPathWriteTo);
	var regex = new RegExp(replaceWhat);
	regex.lastIndex = startIndexOfMatchForCurrentFieldOrClass;
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaTextSync.substr(0, startIndexOfMatchForCurrentFieldOrClass) + javaTextSync.substr(startIndexOfMatchForCurrentFieldOrClass).replace(regex, replaceWith));
  },
  replaceRegexAll: function(replaceWhat, replaceWith) {
	currentEntityReplacerGenerator.log(`${chalk.green('Replacing ALL matches')} for ${replaceWhat} with ${replaceWith}`);
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPathWriteTo);	
	var regex = new RegExp(replaceWhat, 'g');
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaTextSync.replace(regex, replaceWith));
  },
  insertAboveClass: function(insertion) {
	var regex =  new RegExp("(\\s*public class )");
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPathWriteTo);
	currentEntityReplacerGenerator.log(`${chalk.green('Regex searched when inserting above class')} ${regex.toString()}`);	
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaTextSync.replace(regex, "\n" + insertion + '$1'));
  },
  insertElement: function (insertion) {
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPathWriteTo);
	currentEntityReplacerGenerator.log(`${chalk.green('Inserting before field')} ${currentFieldOrClass} ${insertion}`);
	var isClass = currentFieldOrClass.includes("class");
	var regex;
	if (isClass) {
		// make regex just match the begining of the delcaration e.g. public class A instead of public class A implemenets ... extends ...
		// because the extensions may be modified by the entity default function
		var regexWithJustClassName = new RegExp("(class \\w+)");			
		regex = new RegExp("((private|public|protected)\\s*" + regexWithJustClassName.exec(currentFieldOrClass)[1] + ".*{)");
	} else {
		regex = new RegExp("((private|public|protected).*" + currentFieldOrClass + ";)");
		if (javaTextSync.search(regex) == - 1) {
			regex = new RegExp("((private|public|protected).*" + currentFieldOrClass + " = .*?;)")
		}
	}
	var charBeforeInsertion = isClass ? '' : '\t';
	currentEntityReplacerGenerator.log(`${chalk.green('Regex searched when inserting before field')} ${regex.toString()}`);
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaTextSync.replace(regex, insertion + '\n' + charBeforeInsertion + '$1'));
  },
  replaceRegexWithCurlyBraceBlock: function (regexString) {
	currentEntityReplacerGenerator.log(`${chalk.green('Deleting method that matches regex ')} ${regexString}`);
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPathWriteTo);
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
			currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaTextSync.replace(javaTextSync.substring(positionOfMatch, startIndex + 1), ""));	
		}
	}
  },
  replaceType: function(hasInitialization, newType, newIntialization) {
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPathWriteTo);
	var oldType = "";
	// replace in declaration
	if (hasInitialization) {
		var regexDeclarationPattern = new RegExp("((?:private|public|protected).*?)(\\S*)(\\s+" + currentFieldOrClass + ")(\\s*=\\s*)(.*)(;)");
		var match  = regexDeclarationPattern.exec(javaTextSync);
		currentEntityReplacerGenerator.log(`${chalk.green('Replace type')} the old type detected by regex ${regexDeclarationPattern} with new type ${newType}`);
		oldType = match[2];
		if (newIntialization != null && newIntialization.length != 0) {
			this.replaceRegex(regexDeclarationPattern, `$1${newType}$3$4${newIntialization}$6`);
		} else {
			this.replaceRegex(regexDeclarationPattern, `$1${newType}$3$6`);
		}
	} else {
		var regexDeclarationPattern = new RegExp("((?:private|public|protected).*?)(\\S*)(\\s+" + currentFieldOrClass + ")(;)");
		var match  = regexDeclarationPattern.exec(javaTextSync);
		currentEntityReplacerGenerator.log(`${chalk.green('Replace type')} the old type detected by regex ${regexDeclarationPattern} with new type ${newType}`);
		oldType = match[2];
		if (newIntialization != null && newIntialization.length != 0) {
			this.replaceRegex(regexDeclarationPattern, `$1${newType}$3 = ${newIntialization}$4`);
		} else {
			this.replaceRegex(regexDeclarationPattern, `$1${newType}$3$4`);
		}
	}
	var fieldCapitalized = currentFieldOrClass.charAt(0).toUpperCase() + currentFieldOrClass.slice(1);
	//replace getter
	this.replaceRegex(new RegExp('(.*?)(' + oldType + ')(\\s+get' + fieldCapitalized + '\\s*\\()'), `$1${newType}$3`);
	//replace setter
	this.replaceRegex(new RegExp('(set' + fieldCapitalized + '\\s*\\(.*?)(' + oldType + ')(\\s*\\w+\\))'), `$1${newType}$3`);
	//replace factory setter
	this.replaceRegex(new RegExp('(public\\s*' + currentEntity +  '\\s*' + currentFieldOrClass + '\\s*\\(.*?)(' + oldType + ')(\\s*\\w+\\))'), `$1${newType}$3`);
  }
};

// reused in several regexes;
const REGEX_ANNOTATIONS_MODIFIERS = "(\n?(?:.*@.*\\n)*.*)((?:private|protected|public).*?)";
const REGEX_GEN_ENTITY_DTO = "(@GenEntityDto\\(.*)\\)";

var $r = Object.create(Replacer);

$r.insertImport = function(importedPackage) {
	$r.replaceRegex("(package\s*.*;)", "$1\nimport " + importedPackage + ";");
}

$r.insertAboveMember = function(memberName, insertion) {
	$r.replaceRegex(REGEX_ANNOTATIONS_MODIFIERS + "(" + memberName + ")", "$1" + insertion + "\n\t$2$3");
}

$r.removeField = function(fieldName) {
	$r.replaceRegex(REGEX_ANNOTATIONS_MODIFIERS + fieldName + ";\\s*(\\S)", "\t$3");
}
  
$r.removeMethod = function(methodName) {
	$r.replaceRegexWithCurlyBraceBlock(REGEX_ANNOTATIONS_MODIFIERS + methodName + "\\s*\\(");
}
  
$r.superClass = function(superClass, updateClass = true, updateDto = true) {
	if (updateClass) {
		$r.replaceRegex("(public class\\s*\\w+\\s*)(?:extends\\s*\\S+\\s*)?", "$1extends " + superClass + " ");	
	}
	if (updateDto) {
		var dto;
		if (typeof updateDto === 'string') {
			dto = updateDto;
		} else {
			dto = superClass + "Dto";
		}
		$r.replaceRegex("(@GenEntityDto\\(superClassAsString =) .*?(AbstractEntityDto_Basic)", "$1 \"" + dto + "");
	}
}

$r.superClassAsString = function(updateDto) {
	$r.replaceRegex("(@GenEntityDto\\(superClass) .*?(\\.class)", "$1AsString = \"" + updateDto + "\"");
}

$r.includeDtoField = function() {
	$r.insertElement('@GenEntityDtoField(inclusion="include")'); 
}

$r.excludeDtoField = function() {
	$r.insertElement('@GenEntityDtoField(inclusion="exclude")');	
}

$r.delegateToCustomCode = function(withReturn, accessModifier, returnType, methodName, params) {
	var paramsAsString = "";
	var paramsAsStringForMethodCall = "";
	for (var parameterName in params) {
		paramsAsString += params[parameterName] + " " + parameterName + ", ";
		paramsAsStringForMethodCall += ", " + parameterName;
	}
	paramsAsString = paramsAsString.trim().slice(0, -1);
	paramsAsStringForMethodCall = paramsAsStringForMethodCall.trim();
	
	var firstMethodRow = "\t" + accessModifier + " " + returnType + " " + methodName + "(" + paramsAsString + ") {";
	
	var callToCustomCode = "\n\t\t";
	if (withReturn) {
		callToCustomCode += "return ";		
	}
	callToCustomCode += currentEntity + "CustomCode."  + methodName + "(this"  + paramsAsStringForMethodCall + ");"
	
	var endMethod = "\n\t}\n";	
	$r.insertCode(firstMethodRow + callToCustomCode + endMethod);
}

$r.defaultConstructor = function() {
	$r.insertCode("\tpublic " + currentEntity +  "() {} ");
}

$r.insertCode = function(code) {
	$r.replaceRegex("(}\\s*)$", code + "\n$1");
}

$r.toString = function(instr, simpleMode = true) {
	var code = "public String toString() {\n";
	if (simpleMode) {
		code += "return ";
	}
	code += instr;
	if (simpleMode) {
		code += ";"
	}
	code += "\n}";
	$r.insertCode(code);
}

$r.dto = function(params) {
	var result = "\n\t\t dtoDescriptorCustomization = @DtoDescriptorCustomization(";
	for (key in params) {
		result += key + " = " + params[key];
	}
	$r.replaceRegex(REGEX_GEN_ENTITY_DTO, "$1, " + result + "))");	
}

// default function, invoked for each entity
$r.entity = function() {
	$r.insertImport("com.crispico.foundation.shared.dto_crud.AbstractEntityDto");
	$r.insertImport("com.crispico.foundation.shared.dto_crud.AbstractNamedEntityDto");
	$r.insertImport("com.crispico.foundation.server.domain.AbstractEntity");
	$r.insertImport("com.crispico.foundation.server.domain.AbstractNamedEntity");
	$r.insertImport("com.crispico.foundation.annotation.definition.*");
	$r.insertImport("com.crispico.foundation.annotation.definition.constants.FoundationAnnotationDefinitionConstants");
	 
	const DONT_EDIT = 
		"/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////\n" +
		"// DON'T EDIT. This file is automatically generated by jhipster import-jdl + entity-replacer.\n" +
		"// Edit the .jdl file and then run the launch config 'Update entities from JDL'.\n" +
		"/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////\n";
	// after last import and beginning of doc or annotation
	$r.replaceRegex("(import .*\\s*)(/\\*|@)", "$1\n" + DONT_EDIT + "\n$2");

	$r.insertAboveClass("@TriggerFoundationAnnotationProcessor");
	$r.insertAboveClass("@GenEntityDto(superClass = AbstractEntityDto.class)");
	$r.insertAboveClass("@GenRepository");
	$r.insertAboveClass("@GenService");
	  
	$r.superClass("AbstractEntity");
    
	// GWT doesn't support LocalDate; and JHipster doesn't support old date
	$r.replaceRegex("java\.time\.LocalDate", "java\.util\.Date");
	$r.replaceRegexAll("LocalDate", "Date");

	// not needed any more, thanks to the Spring Boot naming strategy
	// TODO: see if the strategy applies to tables and join columns; probably yes; and apply replacement there as well
	$r.replaceRegexAll(".*@Column.*\\n", "");
	
	// not needed for the moment, and upsets the legagcy code
	$r.replaceRegexAll("import.*ApiModel.*\n", "");
	$r.replaceRegexAll(".*@ApiModel.*\n", "");
	
	// replace getters for Boolean from is... to get...
   	// it doesn't seem legal to have is... getters for type Boolean. For boolean it works.
	// I don't understand how jhipster works with this; maybe its libs tolerate this; but not PropertyUtils.
	$r.replaceRegexAll("public Boolean is", "public Boolean get");
	
	// replace private access member modifiers with protected in order to be able to access them from CustomCode classes
	// which are located in the same package
	$r.replaceRegexAll("\s*private(.*;\\n)", "protected$1");
	   
	$r.removeField("id");
	$r.removeMethod("getId");
	$r.removeMethod("setId");
	$r.removeMethod("equals");
	$r.removeMethod("hashCode");
	$r.removeMethod("toString"); 
}

// additional code can be written in "jhipster-entity-replacer.js" of the current execution dir,
// (e.g. "<project>jhipster-import-jdl/jhipster-entity-replacer.js"). Use jhipster-entity-replacer.js to
// fine tune the desired additional functions. And if the new functions are of general interest for other
// projects (which is almost always the case) => migrate them here.

// use `generatedEntitiesFolder` property from yo.rc.json's of the current execution directory if you
// want your files to be generated somewhere else
