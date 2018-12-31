'use strict'
const _ = require('lodash')
const estraverse = require('estraverse')
const esprima = require('esprima')

function unsafeParse(text, filename) {
    return esprima.parseModule(text, {loc: true, range: true, raw: true, tokens: true, comment: true, attachComment: true, source: filename})
}

/**
 * returns the AST of the text, or null if the text isn't valid javascript.
 * @param {string} text The text to parse.
 * @param {string?} filename
 * @returns {Syntax.Program} The AST if successful or null if not.
 * @private
 */
function tryParse(text, filename) {
    try {
        return unsafeParse(text.toString(), filename)
    } catch (e) {
        return null
    }
}

/**
 * Traverse an abstract syntax tree created by esprima
 * @param {*} ast
 * @param {Function} enter
 */
function traverseAst(ast, enter) {
    estraverse.traverse(ast, {enter})
    return ast
}

module.exports = {
    tryParse,
    traverseAst
}
