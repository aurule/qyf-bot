"use strict"

module.exports = {
  noTests: (str) => !str.endsWith(".test.js"),
  jsNoTests: (str) => str.endsWith(".js") && module.exports.noTests(str),
  noDotFiles: (str) => str.indexOf(".") !== 0,
}
