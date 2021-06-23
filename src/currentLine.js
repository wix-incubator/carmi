'use strict'

const _ = require('lodash')
const path = require('path')
const carmiRoot = require('../carmiRoot')
const testPaths = [
  '__tests__',
  'babelPlugin'
].map(p => path.resolve(__dirname, p))

function isExternalLine(line) {
  const isCarmi = _.includes(line, carmiRoot)
  const isTest = _.some(testPaths, p => _.includes(line, p))
  const containsLineNumber = _.includes(line, ':')
  return (!isCarmi || isTest) && containsLineNumber
}

let enabled = true
const enableCurrentLine = (value) => {
  enabled = value
}

const getCurrentLine = () => {
  if (!enabled) {
    return 'unknown'
  }

  const firstExternalLine = (new Error()).stack
    .split('\n')
    .slice(1)
    .find(isExternalLine) || 'unknown'

  return firstExternalLine
    .substr(firstExternalLine.indexOf(path.sep))
    .split(':')
    .map((str, idx) => idx > 0 ? `${parseInt(str, 10)}` : str)
    .join(':')
}

module.exports = {getCurrentLine, enableCurrentLine}
