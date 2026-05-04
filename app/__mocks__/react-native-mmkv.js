// Minimal in-memory MMKV mock for unit tests.
class MMKV {
  constructor() {
    this.s = new Map();
  }
  set(k, v) { this.s.set(k, v); }
  getString(k) { return this.s.get(k); }
  getBoolean(k) { return this.s.get(k); }
  delete(k) { this.s.delete(k); }
}
module.exports = { MMKV };
