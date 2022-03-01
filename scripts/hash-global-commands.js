const commandService = require("../services/command-deploy");

(async () => {
  console.log(commandService.hashGlobalCommandJSON())
})()
