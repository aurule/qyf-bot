module.exports = {
  forceArray(obj) {
    return Array.isArray(obj) ? obj : [obj]
  },
}
