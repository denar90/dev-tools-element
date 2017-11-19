import BaseTimelineLoader from './base-timeline-loader';

export default class GithubTimelineLoader extends BaseTimelineLoader {
  constructor(...args) {
    super(...args);
    this.url.hostname = this.url.hostname.replace('github.com', 'githubusercontent.com');
  }
}
