const formatUtilsJH = require('jhipster-core/lib/utils/format_utils.js');
const path = require('path');
const chalk = require('chalk');

module.exports = {
    applyModificationsToFile
};

function applyModificationsToFile(entityName, fullPathReadFrom, fullPathWriteTo, generator) {
		// !!!all variables declared without `var` need to be available outside this module
		currentEntityReplacerGenerator = generator;
		var javaText = generator.fs.read(fullPathReadFrom);
		
		// transfer java source code to the root of the project
		currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaText);
		
		// @ApiModelProperty("This is a comment bla bla. {{{// aici avem cod js pe care... }}}")  becomes @ApiModelProperty("This is a comment bla bla.") 		
		var regexApiModelProp = '((?:@ApiModelProperty|@ApiModel)\\(.*?)\\{\\{\\{.*\\}\\}\\}(.*?\\))';
		generator.replaceContent(fullPathWriteTo, regexApiModelProp, "$1$2", true);

		javaText = generator.fs.read(fullPathWriteTo);
		// match the whole text between {{{...}}} tags
		var re = new RegExp('(\\{\\{\\{([\\s\\S]*?)\\}\\}\\})[\\s\\S]*?(?:(.*class[\\s\\S]*?\\{)|.*?(\\w+)\\s*=.*?;|.*?(\\w+);)', 'g');
		// iterate through whole file and get the instructions string between {{{...}}} for each field which are stored in the array above as key value pairs
		// key - field or class value - instruction
		var bufferOfInstructionsToBeApplied = [];
		do {
		var m = re.exec(javaText);
		if (m) {
			currentFieldOrClass = m[3] ? m[3] : (m[4] ? m[4] : m[5]);
			generator.log(`${chalk.red("Executing from field/class: ")} ${currentFieldOrClass}`)
			bufferOfInstructionsToBeApplied[currentFieldOrClass] = m[2];
			// delete snippets like {{{ ...}}} from comments
			generator.replaceContent(fullPathWriteTo, m[1], "");
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
  replaceRegex: function(replaceWhat, replaceWith) {
	currentEntityReplacerGenerator.log(`${chalk.green('Replacing first match')} for ${replaceWhat} with ${replaceWith}`); 
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPathWriteTo);
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaTextSync.replace(new RegExp(replaceWhat), replaceWith));
  },
  replaceRegexAll: function(replaceWhat, replaceWith) {
	currentEntityReplacerGenerator.log(`${chalk.green('Replacing ALL matches')} for ${replaceWhat} with ${replaceWith}`);
	var javaTextSync = currentEntityReplacerGenerator.fs.read(fullPathWriteTo);	
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaTextSync.replace(new RegExp(replaceWhat, 'g'), replaceWith));
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
	var regex =  isClass ? new RegExp("(\s*" + currentFieldOrClass + "\\s*)") : new RegExp("(.*" + currentFieldOrClass + "=?.*?;)");
	var charBeforeInsertion = isClass ? '' : '\t';
	currentEntityReplacerGenerator.log(`${chalk.green('Regex searched when inserting before field')} ${regex.toString()}`);	
	currentEntityReplacerGenerator.fs.write(path.join(process.cwd(), fullPathWriteTo), javaTextSync.replace(regex, charBeforeInsertion + insertion + '\n$1'));
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
  }
};

// reused in several regexes
const REGEX_ANNOTATIONS_MODIFIERS = "(\n?(?:.*@.*\\n)*.*)((?:private|protected|public).*?)";


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
		$r.replaceRegex("(@GenEntityDto\\(superClass =) .*?(\\.class)", "$1 " + dto + "$2");
	}
}

$r.excludeDtoField = function() {
	$r.insertElement("@GenEntityDtoField(inclusion=FieldInclusion.EXCLUDE)");	
}

// default function, invoked for each entity
$r.entity = function() {
	$r.insertImport("com.crispico.annotation.definition.GenEntityDto");
	$r.insertImport("com.crispico.annotation.definition.GenEntityDtoField");
	$r.insertImport("com.crispico.foundation.shared.dto_crud.AbstractEntityDto");
	$r.insertImport("com.crispico.foundation.server.domain.AbstractEntity");
	$r.insertImport("com.crispico.foundation.server.domain.AbstractNamedEntity");
	$r.insertImport("com.crispico.annotation.definition.GenDtoCrudRepositoryAndService");
	$r.insertImport("com.crispico.annotation.definition.util.EntityConstants.*");
	$r.insertImport("com.crispico.annotation.definition.dto_crud.DtoDescriptorCustomization");
	 
	$r.insertAboveClass("@GenEntityDto(superClass = AbstractEntityDto.class)");
	$r.insertAboveClass("@GenDtoCrudRepositoryAndService");
	  
	$r.superClass("AbstractEntity");
    
	// replace getters for Boolean from is... to get...
   	// it doesn't seem legal to have is... getters for type Boolean. For boolean it works.
	// I don't understand how jhipster works with this; maybe its libs tolerate this; but not PropertyUtils.
	$r.replaceRegexAll("public Boolean is", "public Boolean get");
	   
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
