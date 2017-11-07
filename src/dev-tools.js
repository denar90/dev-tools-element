import Utils from './utils';

export default class DevTools {
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
