import DevToolsMonkeyPatcher from './devtools-monkey-patcher';
import devToolsScope from './devtools-scope';

export default class DevTools {
  constructor(options = {}) {
    devToolsScope.globalScope = options.scope || window;
    this.scope = devToolsScope.scope;
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
