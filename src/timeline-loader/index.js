import GithubTimelineLoader from './github-timeline-loader';
import DropboxTimelineLoader from './dropbox-timeline-loader';
import GDriveTimelineLoader from './gdrive-timeline-loader';
import { devToolsConfig } from '../dev-tools';

export default class AssetLoader {
  loadAsset(url) {
    if (url.protocol === 'drive:' || url.hostname === 'drive.google.com') {
      const gDriveTimelineLoader = new GDriveTimelineLoader(url, devToolsConfig);
      return gDriveTimelineLoader.fetchTimelineAsset();
    } else if (url.hostname.match('github.com')) {
      const githubTimelineLoader = new GithubTimelineLoader(url, devToolsConfig);
      return githubTimelineLoader.fetchTimelineAsset();
    } else if (url.hostname.match('www.dropbox.com')) {
      const dropboxTimelineLoader = new DropboxTimelineLoader(url, devToolsConfig);
      return dropboxTimelineLoader.fetchTimelineAsset();
    } else {
      return Promise.reject();
    }
  }
}
