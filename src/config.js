export default class Config {
  constructor() {
    this._scope = null;
    this._userAccessToken = null;
  }

  set scope(val) {
    this._scope = val;
  }

  get scope() {
    if (!this._scope) throw new Error('set "scope" first');
    return this._scope;
  }

  set userAccessToken(value) {
    this._userAccessToken = value;
  }

  get userAccessToken() {
    if (!this._userAccessToken) throw new Error('set userAccessToken first');
    return this._userAccessToken;
  }
}
