import Utils from '../utils';
import config from '../config';

export default class BaseTimelineLoader {
  constructor(url) {
    this.scope = config.scope;
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
