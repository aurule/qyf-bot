"use strict";

module.exports = {
    jsNoTests: (str) => (str.endsWith('.js') && !str.endsWith('test.js')),
}
