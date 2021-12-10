module.exports = {
  forceArray(obj) {
    if(obj === null) return []
    return Array.isArray(obj) ? obj : [obj]
  },
}
