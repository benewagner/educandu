import Info from './info.js';
import PropTypes from 'prop-types';
import { Form, Modal } from 'antd';
import Logger from '../common/logger.js';
import { useIsMounted } from '../ui/hooks.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { handleApiError } from '../ui/error-helper.js';
import inputValidators from '../utils/input-validators.js';
import RoomApiClient from '../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

const normalizeEmails = value => value.toLowerCase();
const extractEmails = value => value.match(/[^\s;,]+/g) || [];

function RoomInvitationCreationModal({ isOpen, onOk, onCancel, roomId }) {
  const [form] = Form.useForm();
  const isMounted = useIsMounted();
  const { t } = useTranslation('roomInvitationCreationModal');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
    }
  }, [form, isOpen]);

  const initialFormValues = { emails: '' };
  const [isLoading, setIsLoading] = useState(false);

  const emailsValidationRules = [
    {
      validator: (_rule, value) => {
        const emails = extractEmails(value);
        if (!emails.length) {
          return Promise.reject(new Error(t('emailsRequired')));
        }
        if (emails.some(token => !inputValidators.isValidEmail(token))) {
          return Promise.reject(new Error(t('notAllEmailsValid')));
        }
        return Promise.resolve();
      }
    }
  ];

  const handleOnEmailsChange = event => {
    const element = event.target;
    const caret = element.selectionStart;
    window.requestAnimationFrame(() => {
      element.selectionStart = caret;
      element.selectionEnd = caret;
    });
  };

  const handleFormFinish = async values => {
    try {
      setIsLoading(true);
      const emails = extractEmails(values.emails);
      const invitations = await roomApiClient.addRoomInvitations({ emails, roomId });
      onOk(invitations);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalCancel = () => {
    onCancel();
  };

  const handleModalOk = () => {
    form.submit();
  };

  return !!isMounted.current && (
    <Modal
      title={t('sendRoomInvitations')}
      className='u-modal'
      onCancel={handleModalCancel}
      onOk={handleModalOk}
      open={isOpen}
      okButtonProps={{ loading: isLoading }}
      forceRender
      >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialFormValues}
        onFinish={handleFormFinish}
        className="u-modal-body"
        >
        <FormItem
          name="emails"
          label={<Info tooltip={t('emailAddressesInfo')} iconAfterContent>{t('emailAddresses')}</Info>}
          rules={emailsValidationRules}
          normalize={normalizeEmails}
          >
          <NeverScrollingTextArea onChange={handleOnEmailsChange} minRows={3} />
        </FormItem>
      </Form>
    </Modal>
  );
}

RoomInvitationCreationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired
};

export default RoomInvitationCreationModal;
