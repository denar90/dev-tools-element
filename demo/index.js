(function () {
'use strict';

class Utils {
  fetch(url, params, CORSFlag = false) {
    if (CORSFlag) {
      return this.doCORSRequest(url, params.method, params.body, params.addRequestHeaders, params.onprogress);
    } else {
      return fetch(url, params);
    }
  }

  doCORSRequest(url, method = 'GET', body, addRequestHeaders, onprogress) {
    return new Promise((resolve, reject) => {
      // Use an XHR rather than fetch so we can have progress events
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      addRequestHeaders && addRequestHeaders(xhr);
      // show progress only while getting data
      if (method === 'GET') {
        xhr.onprogress = onprogress;
      }
      xhr.onload = () => {
        resolve(xhr);
      };
      xhr.onerror = error => {
        reject(error, xhr);
      };
      xhr.send(body);
    });
  }
}

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

var devtoolsScope = new GlobalScope();

class ThirdPartyAssetLoader {
  constructor(url) {
    this.scope = devtoolsScope.scope;
    this.url = url;
  }

  fetchTimelineAsset(addRequestHeaders = Function.prototype, method = 'GET', body) {
    const utils = new Utils();
    const url = this.url.href;
    this.loadingStarted = false;

    return utils.fetch(url, {
      url, addRequestHeaders: addRequestHeaders.bind(this), method, body,
      onprogress: this.updateProgress.bind(this),
    }, true)
      .then(xhr => xhr.responseText)
      .catch(error => {
        console.log(error);
      });
  }

  updateProgress(evt) {
    try {
      this.scope.UI.inspectorView.showPanel('timeline').then(() => {
        const panel = this.scope.Timeline.TimelinePanel.instance();
        // start progress
        if (!this.loadingStarted) {
          this.loadingStarted = true;
          panel && panel.loadingStarted();
        }

        // update progress
        panel && panel.loadingProgress(evt.loaded / (evt.total || this.totalSize));
      });
    } catch (e) {
      console.log(e);
    }
  }

}

class GithubTimelineLoader extends ThirdPartyAssetLoader {
  constructor(url) {
    super(url);
    this.url.hostname = this.url.hostname.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }
}

class DropBoxTimelineLoader extends ThirdPartyAssetLoader {
  constructor(url) {
    super(url);
    this.url.hostname = this.url.hostname.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }
}

class AssetLoader {
  loadAsset(url) {
    //@todo add gdrive support
    /*if (this.timelineProvider === 'drive')
      return this.driveAssetLoaded.then(payload => payload);*/

    if (url.hostname.match('github.com')) {
      const githubTimelineLoader = new GithubTimelineLoader(url);
      return githubTimelineLoader.fetchTimelineAsset();
    } else if (url.hostname.match('www.dropbox.com')) {
      const dropboxTimelineLoader = new DropBoxTimelineLoader(url);
      return dropboxTimelineLoader.fetchTimelineAsset();
    } else {
      return Promise.reject();
    }
  }
}

class DevToolsMonkeyPatcher {
  constructor() {
    this.scope = devtoolsScope.scope;
    this.devtoolsBase = this.scope.document.getElementById('devtoolsscript').src.replace(/inspector\.js.*/, '');
    this.timelineLoader = new AssetLoader();
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

class DevTools {
  constructor(options = {}) {
    devtoolsScope.globalScope = options.scope || window;
    this.scope = devtoolsScope.scope;
    const devToolsMonkeyPatcher = new DevToolsMonkeyPatcher();
    devToolsMonkeyPatcher.patchDevTools();

    this.showTimelinePanel();
  }

  loadTimelineDataFromUrl(timelineURL) {
    const plzRepeat = () => setTimeout(() => this.loadTimelineDataFromUrl(timelineURL), 100);
    if (typeof this.scope.Timeline === 'undefined' ||
      typeof this.scope.Timeline.TimelinePanel === 'undefined'
    ) return plzRepeat();

    this.scope.Timeline.TimelinePanel.instance()._loadFromURL(timelineURL);
  }

  showTimelinePanel() {
    const plzRepeat = () => setTimeout(() => this.showTimelinePanel(), 100);
    if (typeof this.scope.UI === 'undefined' ||
      typeof this.scope.UI.inspectorView === 'undefined'
    ) return plzRepeat();

    this.scope.UI.inspectorView.showPanel('timeline');
  }
}

customElements.define('dev-tools-element', class extends HTMLElement {
  constructor() {
    super();
    this._iframe = document.createElement('iframe');
    this._contentWindow = null;
    this._iframe.onload = () => {
      this._contentWindow = this._iframe.contentWindow;
      // pass global params to iframe
      this._contentWindow.IframeDevTools = class IframeDevTools extends DevTools {};
      this._contentWindow.timelineURL = this.getAttribute('src');
      this._contentWindow.document.write(`
        <body>
          <script src="https://chrome-devtools-frontend.appspot.com/serve_file/@14fe0c24836876e87295c3bd65f8482cffd3de73/inspector.js" id="devtoolsscript"></script>
          <script>
              document.addEventListener('DOMContentLoaded', () => {
                window.devtools = new window.IframeDevTools({ scope: window });
                if (this.timelineURL) {
                  window.devtools.loadTimelineDataFromUrl(this.timelineURL);
                }
              });
              const DOMContentLoadedEvent = document.createEvent('Event');
              DOMContentLoadedEvent.initEvent('DOMContentLoaded', true, true);
              window.document.dispatchEvent(DOMContentLoadedEvent);
          </script>
        </body>
      `);
    };
  }

  static get observedAttributes() {
    return Object.keys(HTMLIFrameElement.prototype);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name == 'src') {
      if (this._contentWindow && this._contentWindow.devtools) {
        this._contentWindow.devtools.loadTimelineDataFromUrl(newValue);
      }
      return;
    }
    this._iframe.setAttribute(name, newValue);
  }

  connectedCallback() {
    if (!this.closest(':root')) return;
    this.append(this._iframe);
  }
});

}());
