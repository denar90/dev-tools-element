import DevToolsMonkeyPatcher from './devtools-monkey-patcher';
import Config from './config';

let devToolsConfig = null;

class DevTools {
  constructor(options = {}) {
    devToolsConfig = new Config();
    devToolsConfig.scope = options.scope || window;
    devToolsConfig.userAccessToken = options.userAccessToken;
    this.scope = devToolsConfig.scope;

    const devToolsMonkeyPatcher = new DevToolsMonkeyPatcher();
    devToolsMonkeyPatcher.patchDevTools();

    this.showTimelinePanel();
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

  showTimelinePanel() {
    const plzRepeat = () => setTimeout(() => this.showTimelinePanel(), 100);
    if (typeof this.scope.UI === 'undefined' ||
      typeof this.scope.UI.inspectorView === 'undefined'
    ) return plzRepeat();

    this.scope.UI.inspectorView.showPanel('timeline');
  }
}

export {
  DevTools,
  devToolsConfig
};
