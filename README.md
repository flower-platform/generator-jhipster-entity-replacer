# generator-jhipster-entity-replacer
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> JHipster module, Parses javascript code within &lt;jhipster-entity-replacer&gt; and executes it as is

# Introduction

This is a [JHipster](http://jhipster.github.io/) module, that is meant to be used in a JHipster application.

# Prerequisites

As this is a [JHipster](http://jhipster.github.io/) module, we expect you have JHipster and its related tools already installed:

- [Installing JHipster](https://jhipster.github.io/installation.html) - the Yarn way.

**Note:**
JHipster can be installed via Yarn or NPM. From what we have seen there are big subtle issues if both install methods are used. 

* Did you work with JHipster via NPM in the past? You can verify by looking in ``c:\Users\<USER>\AppData\Roaming\npm\node_modules\`` for something named ``*jhipster*``.
* If YES, then the safest thing to do is to delete the NPM repo: 
  * ``c:\Users\<USER>\AppData\Roaming\npm\``
  * ``c:\Users\<USER>\AppData\Roaming\npm-cache\``
  
Same thing for ``yo``: ```yo``` must come from **Yarn**; type ``which yo``; if it is in *Yarn directory*, is ok, otherwise, if it is in *npm directory*, reinstall it with Yarn

# Installation

To install this module:

```bash
yarn global add https://github.com/flower-platform/generator-jhipster-entity-replacer
```
**Note:**
When installing the generator as global, the directory where it will be found is ``c:\Users\<USER>\AppData\Local\Yarn\config\global\node_modules``

# Update

```bash
yarn global upgrade generator-jhipster-entity-replacer
```

# Usage
```bash
cd <project folder (where .jdl file is)>
```
## First time use
```bash
yo jhipster-entity-replacer
```
This will install a hook in ``<project folder (where .jdl file is)>/jhipster/modules/jhi-hooks.json``, and you will be able to use it with the next method.

## Normal use
```bash
yo jhipster:import-jdl <jdl_file> --force
```
### Notes:

- ``--force`` is an optional parameter that indicates to the importer that all the entities must be re-imported regardless they were updated or not in their .jdl. It's recommended, as you won't be bothered by prompts.

[npm-image]: https://img.shields.io/npm/v/generator-jhipster-entity-replacer.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-entity-replacer
[travis-image]: https://travis-ci.org/entity/generator-jhipster-entity-replacer.svg?branch=master
[travis-url]: https://travis-ci.org/entity/generator-jhipster-entity-replacer
[daviddm-image]: https://david-dm.org/entity/generator-jhipster-entity-replacer.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/entity/generator-jhipster-entity-replacer
