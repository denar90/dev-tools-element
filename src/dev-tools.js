import DevToolsMonkeyPatcher from './devtools-monkey-patcher';
import Config from './config';
import Utils from './utils';

let devToolsConfig = null;

class DevTools {
  constructor(options = {}) {
    devToolsConfig = new Config();
    devToolsConfig.scope = options.scope || window;
    devToolsConfig.userAccessToken = options.userAccessToken;
    this.scope = devToolsConfig.scope;
    this.utils = new Utils();

    const devToolsMonkeyPatcher = new DevToolsMonkeyPatcher();
    devToolsMonkeyPatcher.patchDevTools();

    this.observeIdle();
  }

  updateConfig(options = {}) {
    devToolsConfig.scope = options.scope || devToolsConfig.scope;
    devToolsConfig.userAccessToken = options.userAccessToken || devToolsConfig.scope;
  }

  loadTimelineDataFromUrl(timelineURL) {
    const plzRepeat = () => setTimeout(() => this.loadTimelineDataFromUrl(timelineURL), 100);
    if (typeof this.scope.Timeline === 'undefined' ||
      typeof this.scope.Timeline.TimelinePanel === 'undefined'
    ) return plzRepeat();

    this.scope.Timeline.TimelinePanel.instance()._loadFromURL(timelineURL);
  }

  observeIdle() {
    const plzRepeat = () => setTimeout(() => this.observeIdle(), 100);
    if (typeof this.scope.Timeline === 'undefined' ||
      typeof this.scope.Timeline.TimelinePanel === 'undefined' ||
      typeof this.scope.Timeline.TimelinePanel.State === 'undefined' ||
      this.scope.Timeline.TimelinePanel.instance()._state !== this.scope.Timeline.TimelinePanel.State.Idle
    ) return plzRepeat();

    this.showTimelinePanel();
    this.utils.dispatchEvent('DevToolsReadyInFrame', this.scope.document);
  }

  showTimelinePanel() {
    this.scope.UI.inspectorView.showPanel('timeline');
  }
}

export {
  DevTools,
  devToolsConfig
};
