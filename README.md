# generator-jhipster-entity-replacer
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> JHipster module, Parses javascript code within &lt;jhipster-entity-replacer&gt; and executes it as is

# Introduction

This is a [JHipster](http://jhipster.github.io/) module, that is meant to be used in a JHipster application.

# Prerequisites

As this is a [JHipster](http://jhipster.github.io/) module, we expect you have JHipster and its related tools already installed:

- [Installing JHipster](https://jhipster.github.io/installation.html)

# Installation

## With Yarn

To install this module:

```bash
yarn global add https://github.com/flower-platform/generator-jhipster-entity-replacer
```

To update this module:

```bash
yarn global upgrade generator-jhipster-entity-replacer
```

## With NPM

To install this module:

```bash
npm install -g generator-jhipster-entity-replacer
```

To update this module:

```bash
npm update -g  https://github.com/flower-platform/generator-jhipster-entity-replacer
```

# Usage
```bash
cd <project folder (where .jdl file is>
```
## Running for all existing entities:
```bash
yo jhipster-entity-replacer
```


## Running for new/updated entities as hook:
```bash
yo jhipster:import-jdl <jdl_file> <--force>
```
# License



[npm-image]: https://img.shields.io/npm/v/generator-jhipster-entity-replacer.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-entity-replacer
[travis-image]: https://travis-ci.org/entity/generator-jhipster-entity-replacer.svg?branch=master
[travis-url]: https://travis-ci.org/entity/generator-jhipster-entity-replacer
[daviddm-image]: https://david-dm.org/entity/generator-jhipster-entity-replacer.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/entity/generator-jhipster-entity-replacer
