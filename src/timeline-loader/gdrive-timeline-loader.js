import Utils from '../utils';
import { devToolsConfig } from '../dev-tools';
import BaseTimelineLoader from './base-timeline-loader';

export default class GDriveTimelineLoader extends BaseTimelineLoader {
  constructor(...args) {
    super(...args);
    this.utils = new Utils();
    this.userAccessToken = devToolsConfig.userAccessToken;

    try {
      if (this.url.protocol === 'drive:') {
        this.timelineId = this.url.pathname.replace(/^\/+/, '');
      }
      if (this.url.hostname === 'drive.google.com') {
        this.timelineId = this.url.pathname.match(/\b[0-9a-zA-Z]{5,40}\b/)[0];
      }
    } catch (e) {
      // legacy URLs, without a drive:// prefix.
      this.timelineId = this.url;
    }
  }

  fetchTimelineAsset() {
    return this.requestDriveFileMeta().then(response => {
      document.title = `${response.originalFilename} | ${document.title}`;
      const error = response.error;

      if (error) {
        const reasons = error.errors.map(e => e.reason);
        let fileUnavailableStr = '';
        fileUnavailableStr += reasons.includes('notFound') ? 'Confirm you have Edit permissions to the file. ' : '';
        if (reasons.includes('authError')) {
          fileUnavailableStr += 'Please sign in. ';
        }
        console.log(`${fileUnavailableStr} Drive API error: ${error.message}. (${reasons.join(', ')})`);
        throw new Error(response.message, response.error);
      }

      if (!response.downloadUrl) {
        throw new Error(response.message, response.error);
      }

      // alt=media forces file contents in response body.
      this.url = new URL(`${response.downloadUrl}&alt=media`);

      return BaseTimelineLoader.prototype.fetchTimelineAsset.apply(this, [this.setAuthHeaders.bind(this)]);
    });
  }

  setAuthHeaders(xhr) {
    xhr.setRequestHeader('Authorization', `Bearer ${this.userAccessToken}`);
  }

  requestDriveFileMeta() {
    // if there's no this.timelineId then let's skip all this drive API stuff.
    if (!this.timelineId) return;

    const url = new URL(`https://www.googleapis.com/drive/v2/files/${this.timelineId}`);
    url.searchParams.append('fields', 'version, downloadUrl, copyable, title, originalFilename, fileSize');

    const headers = new Headers();
    headers.append('Authorization', `Bearer ${this.userAccessToken}`);

    return this.utils.fetch(url.toString(), {headers})
      .then(resp => resp.json());
  }
}
