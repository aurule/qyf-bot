const commandService = require("../services/command-deploy");

(async () => {
  await commandService.deployGlobals()
})()
