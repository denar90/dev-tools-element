let scope = null;
let userAccessToken = null;

// @todo fixme, I'm global config overridden by each new custom element instance
export default class Config {
  constructor() {
    this.userAccessToken = null;
  }

  set scope(val) {
    scope = val;
  }

  get scope() {
    if (!scope) throw new Error('set "scope" first');
    return scope;
  }

  set userAccessToken(value) {
    userAccessToken = value;
  }

  get userAccessToken() {
    if (!userAccessToken) throw new Error('set userAccessToken first');
    return userAccessToken;
  }
}
