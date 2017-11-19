import DevToolsMonkeyPatcher from './devtools-monkey-patcher';
import Config from './config';
import Utils from './utils';

export default class DevTools {
  constructor(options = {}) {
    this.devToolsConfig = new Config();
    this.devToolsConfig.scope = options.scope || window;
    this.devToolsConfig.userAccessToken = options.userAccessToken;
    this.scope = this.devToolsConfig.scope;
    this.utils = new Utils();

    const devToolsMonkeyPatcher = new DevToolsMonkeyPatcher(this.devToolsConfig);
    devToolsMonkeyPatcher.patchDevTools();

    this.showTimelinePanel();
    this.observeIdle();
  }

  updateConfig(options = {}) {
    this.devToolsConfig.scope = options.scope || this.devToolsConfig.scope;
    this.devToolsConfig.userAccessToken = options.userAccessToken || this.devToolsConfig.userAccessToken;
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

    this.utils.dispatchEvent('DevToolsReadyInFrame', this.scope.document, { Timeline: this.scope.Timeline });
  }

  showTimelinePanel() {
    const plzRepeat = () => setTimeout(() => this.showTimelinePanel(), 100);
    if (typeof this.scope.UI === 'undefined' ||
      typeof this.scope.UI.inspectorView === 'undefined'
    ) return plzRepeat();
    this.scope.UI.inspectorView.showPanel('timeline');
  }
}
