import { Form, Modal } from 'antd';
import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import React, { useState, useRef } from 'react';
import EmailFormItem from './email-form-item.js';
import RoomApiClient from '../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';

const logger = new Logger(import.meta.url);

function RoomInvitationCreationModal({ isVisible, onClose, roomId }) {
  const formRef = useRef(null);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const { t } = useTranslation('roomInvitationCreationModal');

  const initialFormValues = { email: null };
  const [isLoading, setIsLoading] = useState(false);

  const handleFormFinish = async values => {
    try {
      setIsLoading(true);
      await roomApiClient.addRoomInvitation({ email: values.email, roomId });
      onClose(true);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (formRef.current) {
      formRef.current.resetFields();
    }
    onClose(false);
  };

  const handleSubmitForm = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  return (
    <Modal
      title={t('newRoomInvitation')}
      onCancel={handleCancel}
      onOk={handleSubmitForm}
      maskClosable={false}
      visible={isVisible}
      okButtonProps={{ loading: isLoading }}
      >
      <Form name="new-room-invitation-form" initialValues={initialFormValues} onFinish={handleFormFinish} ref={formRef} layout="vertical">
        <EmailFormItem name="email" />
      </Form>
    </Modal>
  );
}

RoomInvitationCreationModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired
};

export default RoomInvitationCreationModal;
