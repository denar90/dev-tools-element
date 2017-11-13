import BaseTimelineLoader from './base-timeline-loader';

export default class DropBoxTimelineLoader extends BaseTimelineLoader {
  constructor(...args) {
    super(...args);
    this.url.hostname = this.url.hostname.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }
}
