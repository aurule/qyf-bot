const { models } = require("./")

describe("all models", () => {
  describe("destroyByPk", () => {
    models.forEach((model) => {
      it(`${model.name} calls destroy with the ids`, async () => {
        const destroySpy = jest.spyOn(model, "destroy")

        await model.destroyByPk(5)

        expect(destroySpy).toHaveBeenCalledWith({ where: { id: 5 } })
      })
    })
  })
})

