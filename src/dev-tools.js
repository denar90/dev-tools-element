import DevToolsMonkeyPatcher from './devtools-monkey-patcher';
import config from './config';

export default class DevTools {
  constructor(options = {}) {
    config.scope = options.scope || window;
    config.userAccessToken = options.userAccessToken;
    this.scope = config.scope;
    const devToolsMonkeyPatcher = new DevToolsMonkeyPatcher();
    devToolsMonkeyPatcher.patchDevTools();

    this.showTimelinePanel();
  }

  updateConfig(options = {}) {
    config.scope = options.scope || config.scope;
    config.userAccessToken = options.userAccessToken || config.scope;
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
