import HttpClient from './http-client.js';

class NotificationsApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getNotificationGroups() {
    return this.httpClient
      .get(
        '/api/v1/notifications/groups',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default NotificationsApiClient;
