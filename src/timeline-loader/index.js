import GithubTimelineLoader from './github-timeline-loader';
import DropboxTimelineLoader from './dropbox-timeline-loader';
import GDriveTimelineLoader from './gdrive-timeline-loader';

export default class AssetLoader {
  constructor(devToolsConfig = {}) {
    this.devToolsConfig = devToolsConfig;
  }

  loadAsset(url) {
    if (url.protocol === 'drive:' || url.hostname === 'drive.google.com') {
      const gDriveTimelineLoader = new GDriveTimelineLoader(url, this.devToolsConfig);
      return gDriveTimelineLoader.fetchTimelineAsset();
    } else if (url.hostname.match('github.com')) {
      const githubTimelineLoader = new GithubTimelineLoader(url, this.devToolsConfig);
      return githubTimelineLoader.fetchTimelineAsset();
    } else if (url.hostname.match('www.dropbox.com')) {
      const dropboxTimelineLoader = new DropboxTimelineLoader(url, this.devToolsConfig);
      return dropboxTimelineLoader.fetchTimelineAsset();
    } else {
      return Promise.reject();
    }
  }
}
