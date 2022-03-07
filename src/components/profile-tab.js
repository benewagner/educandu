import by from 'thenby';
import Alert from './alert.js';
import gravatar from 'gravatar';
import memoizee from 'memoizee';
import React, { useState } from 'react';
import Logger from '../common/logger.js';
import localeCompare from 'locale-compare';
import errorHelper from '../ui/error-helper.js';
import { useLocale } from './locale-context.js';
import { useService } from './container-context.js';
import { Trans, useTranslation } from 'react-i18next';
import { useSetUser, useUser } from './user-context.js';
import UserApiClient from '../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import CountryNameProvider from '../data/country-name-provider.js';
import CountryFlagAndName from './localization/country-flag-and-name.js';
import { Form, Input, Avatar, Button, Select, message } from 'antd';
import { formItemLayoutShape, tailFormItemLayoutShape } from '../ui/default-prop-types.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;
const Option = Select.Option;

const AVATAR_SIZE = 256;

const createCountryNames = memoizee((countryNameProvider, uiLanguage) => {
  return Object.entries(countryNameProvider.getData(uiLanguage))
    .map(([key, name]) => ({ key, name }))
    .sort(by(x => x.name, { cmp: localeCompare(uiLanguage) }));
}, { max: 1 });

function ProfileTab({ formItemLayout, tailFormItemLayout }) {
  const user = useUser();
  const setUser = useSetUser();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('profileTab');
  const countryNameProvider = useService(CountryNameProvider);
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  const profile = user.profile || { country: '' };
  const gravatarUrl = gravatar.url(user.email, { s: AVATAR_SIZE, d: 'mp' });
  const gravatarRagistrationUrl = `https://${uiLanguage}.gravatar.com/`;

  const [showAvatarDescription, setShowAvatarDescription] = useState(false);

  const saveProfile = async profileToSave => {
    try {
      const { profile: newProfile } = await userApiClient.saveUserProfile({ profile: profileToSave });
      setUser({ ...user, profile: newProfile });
      message.success(t('updateSuccessMessage'));
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleProfileFinish = values => {
    saveProfile({
      firstName: values.firstName,
      lastName: values.lastName,
      street: values.street,
      streetSupplement: values.streetSupplement,
      postalCode: values.postalCode,
      city: values.city,
      country: values.country
    });
  };

  const handleShowAvatarDescriptionClick = () => {
    setShowAvatarDescription(true);
  };

  const handleAvatarDescriptionAfterClose = () => {
    setShowAvatarDescription(false);
  };

  const avatarDescription = (
    <div>
      <Trans
        t={t}
        i18nKey="avatarDescription"
        components={[<a key="gravatar-link" href={gravatarRagistrationUrl} target="_blank" rel="noopener noreferrer" />]}
        />
    </div>
  );

  return (
    <Form onFinish={handleProfileFinish} scrollToFirstError>
      <FormItem {...tailFormItemLayout}>
        <Avatar className="Avatar" shape="circle" size={AVATAR_SIZE} src={gravatarUrl} alt={user.username} />
        <br />
        <a onClick={handleShowAvatarDescriptionClick}>{t('changePicture')}</a>
        <br />
        {showAvatarDescription && (
        <Alert
          message={t('howToChangePicture')}
          description={avatarDescription}
          type="info"
          showIcon
          closable
          afterClose={handleAvatarDescriptionAfterClose}
          />
        )}
      </FormItem>
      <FormItem {...formItemLayout} label={t('firstName')} name="firstName" initialValue={profile.firstName || ''}>
        <Input type="text" />
      </FormItem>
      <FormItem {...formItemLayout} label={t('lastName')} name="lastName" initialValue={profile.lastName || ''}>
        <Input type="text" />
      </FormItem>
      <FormItem {...formItemLayout} label={t('street')} name="street" initialValue={profile.street || ''}>
        <Input type="text" />
      </FormItem>
      <FormItem {...formItemLayout} label={t('streetSupplement')} name="streetSupplement" initialValue={profile.streetSupplement || ''}>
        <Input type="text" />
      </FormItem>
      <FormItem {...formItemLayout} label={t('postalCode')} name="postalCode" initialValue={profile.postalCode || ''}>
        <Input type="text" />
      </FormItem>
      <FormItem {...formItemLayout} label={t('city')} name="city" initialValue={profile.city || ''}>
        <Input type="text" />
      </FormItem>
      <FormItem {...formItemLayout} label={t('country')} name="country" initialValue={profile.country || ''}>
        <Select
          optionFilterProp="title"
          showSearch
          allowClear
          autoComplete="none"
          >
          {createCountryNames(countryNameProvider, uiLanguage).map(cn => (
            <Option key={cn.key} value={cn.key} title={cn.name}>
              <CountryFlagAndName code={cn.key} name={cn.name} />
            </Option>
          ))}
        </Select>
      </FormItem>
      <FormItem {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit">{t('common:save')}</Button>
      </FormItem>
    </Form>
  );
}

ProfileTab.propTypes = {
  formItemLayout: formItemLayoutShape.isRequired,
  tailFormItemLayout: tailFormItemLayoutShape.isRequired
};

export default ProfileTab;
