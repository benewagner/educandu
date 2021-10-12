
import urls from '../utils/urls';
import UserService from '../services/user-service';
import MailService from '../services/mail-service';
import requestHelper from '../utils/request-helper';
import ClientDataMapper from './client-data-mapper';
import { SAVE_USER_RESULT } from '../domain/user-management';

class UserRequestHandler {
  static get inject() { return [UserService, MailService, ClientDataMapper]; }

  constructor(userService, mailService, clientDataMapper) {
    this.userService = userService;
    this.mailService = mailService;
    this.clientDataMapper = clientDataMapper;
  }

  async handlePostUser(req, res) {
    const { username, password, email } = req.body;

    if (email !== email.toLowerCase()) {
      res.status(400).send('The \'email\' field is expected to be in lower case.');
      return;
    }

    const { result, user } = await this.userService.createUser(username, password, email);

    if (result === SAVE_USER_RESULT.success) {
      const { origin } = requestHelper.getHostInfo(req);
      const verificationLink = urls.concatParts(origin, urls.getCompleteRegistrationUrl(user.verificationCode));
      await this.mailService.sendRegistrationVerificationLink(email, verificationLink);
    }

    res.send({ result, user: user ? this.clientDataMapper.dbUserToClientUser(user) : null });
  }

  async handlePostUserAccount(req, res) {
    const userId = req.user._id;
    const { username, email } = req.body;

    if (email !== email.toLowerCase()) {
      res.status(400).send('The \'email\' field is expected to be in lower case.');
      return;
    }

    const { result, user } = await this.userService.updateUserAccount({ userId, username, email });

    res.send({ result, user: user ? this.clientDataMapper.dbUserToClientUser(user) : null });
  }

  async handlePostUserProfile(req, res) {
    const userId = req.user._id;
    const { profile } = req.body;
    const savedProfile = await this.userService.updateUserProfile(userId, profile);
    if (!savedProfile) {
      res.status(404).send('Invalid user id');
      return;
    }

    res.send({ profile: savedProfile });
  }
}

export default UserRequestHandler;
