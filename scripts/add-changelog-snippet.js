const fs = require("fs")
const path = require("path")

const prompts = require("prompts");

(async () => {
  const questions = [
    {
      type: "select",
      name: "type",
      message: "What type of change is this?",
      choices: [
        { title: "Addition", value: "added" },
        { title: "Change", value: "changed" },
        { title: "Removal", value: "removed" },
        { title: "Fix", value: "fixed" },
      ],
    },
    {
      type: "text",
      name: "message",
      message: "One-line summary of the change",
    },
    {
      type: "text",
      name: "label",
      message: "Shorthand reference to jog your memory",
    },
  ]

  const response = await prompts(questions)

  fs.writeFileSync(
    path.join(__dirname, "../changes", `${response.label}.${response.type}`),
    response.message
  )
})()
