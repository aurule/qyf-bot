const { models } = require("./")

describe("all models", () => {
  models.forEach((model) => {
    describe("destroyByPk", () => {
      it("calls destroy with the ids", async () => {
        const destroySpy = jest.spyOn(model, "destroy")

        await model.destroyByPk(5)

        expect(destroySpy).toHaveBeenCalledWith({ where: { id: 5 } })
      })
    })
  })
})

