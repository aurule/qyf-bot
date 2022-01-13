const MemberInjector = require("./member-injector")

describe("anonymousMember", () => {
  it("uses our client id", () => {
    expect(MemberInjector.anonymousMember.user.id).toEqual(process.env.CLIENT_ID)
  })

  it("has a unique 'anonymous' attribute", () => {
    expect(MemberInjector.anonymousMember.anonymous).toBeTruthy()
    expect(MemberInjector.anonymousMember.user.anonymous).toBeTruthy()
  })
})

describe("memberOrAnonymous", () => {
  it("returns the anon object when user matches our client id", () => {
    const user = {
      id: process.env.CLIENT_ID
    }

    return expect(MemberInjector.memberOrAnonymous(null, user)).resolves.toEqual(MemberInjector.anonymousMember)
  })

  it("looks up the user member from the guild otherwise", () => {
    const user = {
      id: 1
    }
    const guild = {
      members: {
        fetch: (user) => user
      }
    }

    return expect(MemberInjector.memberOrAnonymous(guild, user)).resolves.toEqual(user)
  })
})
