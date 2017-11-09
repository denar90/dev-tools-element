import BaseTimelineLoader from './base-timeline-loader';

export default class DropBoxTimelineLoader extends BaseTimelineLoader {
  constructor(url) {
    super(url);
    this.url.hostname = this.url.hostname.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }
}
