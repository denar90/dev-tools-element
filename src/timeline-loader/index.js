import GithubTimelineLoader from './github-timeline-loader';
import DropboxTimelineLoader from './dropbox-timeline-loader';

export default class AssetLoader {
  loadAsset(url) {
    //@todo add gdrive support
    /*if (this.timelineProvider === 'drive')
      return this.driveAssetLoaded.then(payload => payload);*/

    if (url.hostname.match('github.com')) {
      const githubTimelineLoader = new GithubTimelineLoader(url);
      return githubTimelineLoader.fetchTimelineAsset();
    } else if (url.hostname.match('www.dropbox.com')) {
      const dropboxTimelineLoader = new DropboxTimelineLoader(url);
      return dropboxTimelineLoader.fetchTimelineAsset();
    } else {
      return Promise.reject();
    }
  }
}
