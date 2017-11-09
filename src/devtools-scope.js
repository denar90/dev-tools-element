class GlobalScope {
  constructor() {
    this.globalScope = null;
  }

  set scope(value) {
    return value;
  }

  get scope() {
    if (!this.globalScope) throw new Error('set globalScope  first');
    return this.globalScope;
  }
}

export default new GlobalScope();
