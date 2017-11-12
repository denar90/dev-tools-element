import GithubTimelineLoader from './github-timeline-loader';
import DropboxTimelineLoader from './dropbox-timeline-loader';
import GDriveTimelineLoader from './gdrive-timeline-loader';

export default class AssetLoader {
  loadAsset(url) {
    if (url.protocol === 'drive:' || url.hostname === 'drive.google.com') {
      const gDriveTimelineLoader = new GDriveTimelineLoader(url);
      return gDriveTimelineLoader.fetchTimelineAsset(url);
    } else if (url.hostname.match('github.com')) {
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
