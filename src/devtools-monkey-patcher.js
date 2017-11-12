import TimelineLoader from './timeline-loader';
import config from './config';

export default class DevToolsMonkeyPatcher {
  constructor() {
    this.scope = config.scope;
    this.devtoolsBase = this.scope.document.getElementById('devtoolsscript').src.replace(/inspector\.js.*/, '');
    this.timelineLoader = new TimelineLoader();
  }

  patchDevTools() {
    this.monkeyPatchInspectorBackend();
    this.monkeyPatchRuntime();
    this.monkeyPatchCommon();
    this.attachMonkeyPatchListeners();
    this.monkeypatchLoadResourcePromise();
  }

  monkeyPatchInspectorBackend() {
    const AgentPrototype = this.scope.Protocol.InspectorBackend._AgentPrototype;
    AgentPrototype.prototype._sendMessageToBackendPromise = () => Promise.resolve();
  }

  monkeyPatchRuntime() {
    this.scope.Runtime.experiments._supportEnabled = true;
    this.scope.Runtime.experiments.isEnabled = name => {
      return name == 'timelineV8RuntimeCallStats';
    };
  }

  monkeyPatchCommon() {
    this.scope.Common.moduleSetting = function(module) {
      const ret = {
        addChangeListener: () => { },
        removeChangeListener: () => { },
        get: () => new Map(),
        set: () => { },
        getAsArray: () => []
      };
      if (module === 'releaseNoteVersionSeen')
        ret.get = () => Infinity;
      if (module === 'showNativeFunctionsInJSProfile')
        ret.get = () => true;
      return ret;
    };

    // don't send application errors to console drawer
    this.scope.Common.Console.prototype.addMessage = (text, level, show) => {
      level = level || this.scope.Common.Console.MessageLevel.Info;
      const message = new this.scope.Common.Console.Message(text, level, Date.now(), show || false);
      this._messages.push(message);
      this.dispatchEventToListeners(this.scope.Common.Console.Events.MessageAdded, message);
      this.scope.console[level](text);
    };

    // Common.settings is created in a window onload listener
    window.addEventListener('load', () => {
      this.scope.Common.settings.createSetting('timelineCaptureNetwork', true).set(true);
      this.scope.Common.settings.createSetting('timelineCaptureFilmStrip', true).set(true);
    });
  }

  attachMonkeyPatchListeners() {
    // don't let devtools trap ctrl-r
    this.scope.document.addEventListener('keydown', event => {
      if (self.UI && this.scope.UI.KeyboardShortcut.eventHasCtrlOrMeta(event) &&
        String.fromCharCode(event.which).toLowerCase() === 'r') {
        event.handled = true;
      }
    });
  }

  monkeypatchLoadResourcePromise() {
    this.origLoadResourcePromise = this.scope.Runtime.loadResourcePromise;
    this.scope.Runtime.loadResourcePromise = this.loadResource.bind(this);
  }

  loadResource(requestedURL) {
    return this.loadResourcePromise(requestedURL);
  }

  // monkeypatched method for devtools
  loadResourcePromise(requestedURL) {
    const url = new URL(requestedURL);
    const URLofViewer = new URL(location.href);

    // hosted devtools gets confused
    // if DevTools is requesting a file thats on our origin, we'll redirect it to devtoolsBase
    if (url && url.origin === URLofViewer.origin) {
      const relativeurl = url.pathname.replace(URLofViewer.pathname, '').replace(/^\//, '');
      const redirectedURL = new URL(relativeurl, this.devtoolsBase);
      return this.origLoadResourcePromise(redirectedURL.toString());
    }

    return this.timelineLoader.loadAsset(url, this.scope);
  }
}
