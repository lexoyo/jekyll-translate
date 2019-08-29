#!/usr/bin/env node

const assert = require('assert');
const Translate = require('./Translate');

const [nodeArg, scriptName, path, outPath, regExp, langIn, langOut, gTransKey ] = process.argv;
console.log('Starting with params:', {path, outPath, regExp, langIn, langOut, gTransKey});

assert(path !== undefined, 'Argument path is missing');
assert(outPath !== undefined, 'Argument outPath is missing');
assert(regExp !== undefined, 'Argument regExp is missing');
assert(langIn !== undefined, 'Argument langIn is missing');
assert(langOut !== undefined, 'Argument langOut is missing');
assert(gTransKey !== undefined, 'Argument gTransKey is missing');


const reg = new RegExp(regExp, 'g');
const t = new Translate({apiKey:gTransKey, preservedProperties: ['date', 'permalink', 'Call To Action', 'Language']});

t.translateJekyll(path, outPath, langIn, langOut, reg)
.then(text => {
  console.log('******SUCCESS******', text);
})
.catch(e => {
  console.log('******ERROR******', e.message);
})
