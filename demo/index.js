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

  doCORSRequest(url, method='GET', body, addRequestHeaders, onprogress) {
    return new Promise((resolve, reject) => {
      // Use an XHR rather than fetch so we can have progress events
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      addRequestHeaders && addRequestHeaders(xhr);
      // show progress only while getting data
      if (method === 'GET') {
        xhr.onprogress = onprogress;
      }
      xhr.onload = _ => {
        resolve(xhr);
      };
      xhr.onerror = error => {
        reject(error, xhr);
      };
      xhr.send(body);
    });
  }
}

class DevTools {
  constructor(options) {
    this.window = options.window;
    this.devtoolsBase = this.window.document.getElementById('devtoolsscript').src.replace(/inspector\.js.*/, '');
    this.monkeyPatchRuntime();
    this.monkeyPatchCommon();
    this.attachMonkeyPatchListeners();
    this.monkeypatchLoadResourcePromise();
    this.showTimelinePanel();
  }

  loadTimelineDataFromUrl(timelineURL) {
    const plzRepeat = _ => setTimeout(_ => this.loadTimelineDataFromUrl(timelineURL), 100);
    if (typeof this.window.Timeline === 'undefined' ||
      typeof this.window.Timeline.TimelinePanel === 'undefined'
    ) return plzRepeat();

    this.window.Timeline.TimelinePanel.instance()._loadFromURL(timelineURL);
  }

  monkeyPatchRuntime() {
    this.window.Runtime.experiments._supportEnabled = true;
    this.window.Runtime.experiments.isEnabled = name => {
      return name == 'timelineV8RuntimeCallStats';
    };
  }

  monkeyPatchCommon() {
    this.window.Common.moduleSetting = function(module) {
      const ret = {
        addChangeListener: _ => { },
        removeChangeListener: _ => { },
        get: _ => new Map(),
        set: _ => { },
        getAsArray: _ => []
      };
      if (module === 'releaseNoteVersionSeen')
        ret.get = _ => Infinity;
      if (module === 'showNativeFunctionsInJSProfile')
        ret.get = _ => true;
      return ret;
    };

    // don't send application errors to console drawer
    this.window.Common.Console.prototype.addMessage = function(text, level, show) {
      level = level || Common.Console.MessageLevel.Info;
      const message = new Common.Console.Message(text, level, Date.now(), show || false);
      this._messages.push(message);
      this.dispatchEventToListeners(this.window.Common.Console.Events.MessageAdded, message);
      this.window.console[level](text);
    };

    // Common.settings is created in a window onload listener
    window.addEventListener('load', _ => {
      this.window.Common.settings.createSetting('timelineCaptureNetwork', true).set(true);
      this.window.Common.settings.createSetting('timelineCaptureFilmStrip', true).set(true);
    });
  }

  attachMonkeyPatchListeners() {
    // don't let devtools trap ctrl-r
    this.window.document.addEventListener('keydown', event => {
      if (self.UI && UI.KeyboardShortcut.eventHasCtrlOrMeta(event) && String.fromCharCode(event.which).toLowerCase() === 'r') {
        event.handled = true;
      }
    });
  }

  monkeypatchLoadResourcePromise() {
    this.origLoadResourcePromise = this.window.Runtime.loadResourcePromise;
    this.window.Runtime.loadResourcePromise = this.loadResource.bind(this);
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

    //@todo add gdrive support
    /*if (this.timelineProvider === 'drive')
      return this.driveAssetLoaded.then(payload => payload);*/

    // adjustments for CORS
    url.hostname = url.hostname.replace('github.com', 'githubusercontent.com');
    url.hostname = url.hostname.replace('www.dropbox.com', 'dl.dropboxusercontent.com');

    return this.fetchTimelineAsset(url.href).then(payload => payload);
  }

  fetchTimelineAsset(url, addRequestHeaders = Function.prototype, method = 'GET', body) {
    this.netReqMuted = false;
    this.loadingStarted = false;
    const utils = new Utils();
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
      this.window.UI.inspectorView.showPanel('timeline').then(_ => {
        const panel = this.window.Timeline.TimelinePanel.instance();
        // start progress
        if (!this.loadingStarted) {
          this.loadingStarted = true;
          panel && panel.loadingStarted();
        }

        // update progress
        panel && panel.loadingProgress(evt.loaded / (evt.total || this.totalSize));

        // flip off filmstrip or network if theres no data in the trace
        if (!this.netReqMuted) {
          this.netReqMuted = true;
          this.monkepatchSetMarkers();
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

  monkepatchSetMarkers() {
    const panel = this.window.Timeline.TimelinePanel.instance();
    const oldSetMarkers = panel._setMarkers;
    panel._setMarkers = () => {
      if (panel._performanceModel._timelineModel.networkRequests().length === 0)
        this.window.Common.settings.createSetting('timelineCaptureNetwork', true).set(false);
      if (panel._performanceModel.filmStripModel()._frames.length === 0)
        this.window.Common.settings.createSetting('timelineCaptureFilmStrip', true).set(false);
      oldSetMarkers.call(panel, panel._performanceModel._timelineModel);
    };
  }

  showTimelinePanel() {
    const plzRepeat = _ => setTimeout(_ => this.showTimelinePanel(), 100);
    if (typeof this.window.UI === 'undefined' ||
      typeof this.window.UI.inspectorView === 'undefined'
    ) return plzRepeat();

    this.window.UI.inspectorView.showPanel('timeline');
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
          <script src="https://chrome-devtools-frontend.appspot.com/serve_file/@14fe0c24836876e87295c3bd65f8482cffd3de73/inspector.js" id="devtoolsscript"><\/script>
          <script>
              document.addEventListener('DOMContentLoaded', () => {
                window.devtools = new window.IframeDevTools({ window: window });
                if (this.timelineURL) {
                  window.devtools.loadTimelineDataFromUrl(this.timelineURL);
                }
              });
              const DOMContentLoadedEvent = document.createEvent('Event');
              DOMContentLoadedEvent.initEvent('DOMContentLoaded', true, true);
              window.document.dispatchEvent(DOMContentLoadedEvent);
          <\/script>
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
