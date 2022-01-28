import LoginForm from './login-form.js';
import React, { createRef } from 'react';
import { Modal, Input, Checkbox } from 'antd';

const confirm = Modal.confirm;
const TextArea = Input.TextArea;

export function confirmSectionDelete(t, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteSectionConfirmation'),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmDocumentDelete(t, documentTitle, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteDocumentConfirmation', { title: documentTitle }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmRoomDelete(t, roomName, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteRoomConfirmation', { roomName }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmCdnFileDelete(t, fileName, onOk, onCancel = () => {}) {
  confirm({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:deleteCdnDocumentConfirmation', { fileName }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk,
    onCancel
  });
}

export function confirmSectionHardDelete(
  t,
  onOk,
  onCancel = () => {}
) {
  let dialog = null;
  let reason = '';
  let deleteAllRevisions = false;
  let createDialogProps = null;

  const handleReasonChange = event => {
    reason = event.target.value;
    dialog.update(createDialogProps());
  };

  const handleDeleteAllRevisionsChange = event => {
    deleteAllRevisions = event.target.checked;
    dialog.update(createDialogProps());
  };

  function createContent() {
    return (
      <div>
        {t('confirmationDialogs:deleteSectionConfirmation')}
        <br />
        <b className="u-danger">
          {t('confirmationDialogs:thisActionIsIrreversible')}
        </b>
        <br />
        <br />
        <span>{t('confirmationDialogs:pleaseSpecifyAReason')}:</span>
        <br />
        <TextArea
          value={reason}
          onChange={handleReasonChange}
          />
        <br />
        <br />
        <Checkbox
          checked={deleteAllRevisions}
          onChange={handleDeleteAllRevisionsChange}
          >
          {t('confirmationDialogs:deleteAllRevisions')}
        </Checkbox>
      </div>
    );
  }

  createDialogProps = () => ({
    title: t('confirmationDialogs:areYouSure'),
    content: createContent(),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk: () => onOk({ reason, deleteAllRevisions }),
    onCancel,
    okButtonProps: {
      disabled: reason.length < 3
    }
  });

  dialog = confirm(createDialogProps());
}

export function confirmDocumentRevisionRestoration(
  t,
  revision,
  onOk,
  onCancel = () => {}
) {
  let dialog = null;
  let isRestoring = false;
  let createDialogProps = null;

  const handleOkClick = async () => {
    isRestoring = true;
    dialog.update(createDialogProps());
    try {
      await onOk();
    } finally {
      isRestoring = false;
      dialog.update(createDialogProps());
    }
  };

  createDialogProps = () => ({
    title: t('confirmationDialogs:areYouSure'),
    content: t('confirmationDialogs:restoreDocumentRevisionConfirmation', {
      revisionId: revision._id
    }),
    okText: t('common:yes'),
    okType: 'danger',
    cancelText: t('common:no'),
    onOk: handleOkClick,
    onCancel,
    okButtonProps: {
      loading: isRestoring
    }
  });

  dialog = confirm(createDialogProps());
}

export function reloginAfterSessionExpired(modal, t, onOk, onCancel) {
  const formRef = createRef();

  let dialog = null;
  let isLoggingIn = false;
  let createDialogProps = null;

  const handleLoginStarted = () => {
    isLoggingIn = true;
    dialog.update(createDialogProps());
  };

  const handleLoginSucceeded = () => {
    isLoggingIn = false;
    dialog.update(createDialogProps());
    dialog.destroy();
    dialog = null;
    onOk();
  };

  const handleLoginFailed = () => {
    isLoggingIn = false;
    dialog.update(createDialogProps());
  };

  // eslint-disable-next-line no-unused-vars
  const handleOkClick = _close => {
    formRef.current.submit();
    return true;
  };

  function createContent() {
    return (
      <div>
        <p>{t('confirmationDialogs:sessionExpiredDescription')}</p>
        <LoginForm
          formRef={formRef}
          layout="vertical"
          name="session-expired-login-form"
          onLoginFailed={handleLoginFailed}
          onLoginStarted={handleLoginStarted}
          onLoginSucceeded={handleLoginSucceeded}
          hidePasswordRecoveryLink
          hideLoginButton
          />
      </div>
    );
  }

  createDialogProps = () => ({
    title: t('confirmationDialogs:sessionExpiredTitle'),
    content: createContent(),
    okText: t('common:logon'),
    cancelText: t('common:cancel'),
    onOk: handleOkClick,
    onCancel,
    okButtonProps: {
      loading: isLoggingIn
    }
  });

  dialog = modal.confirm(createDialogProps());
}

export function confirmWithPassword(modal, t, username, onOk, onCancel = () => {}) {
  const formRef = createRef();

  let dialog = null;
  let isLoggingIn = false;
  let createDialogProps = null;

  const handleLoginStarted = () => {
    isLoggingIn = true;
    dialog.update(createDialogProps());
  };

  const handleLoginSucceeded = () => {
    isLoggingIn = false;
    dialog.update(createDialogProps());
    dialog.destroy();
    dialog = null;
    onOk();
  };

  const handleLoginFailed = () => {
    isLoggingIn = false;
    dialog.update(createDialogProps());
  };

  // eslint-disable-next-line no-unused-vars
  const handleOkClick = _close => {
    formRef.current.submit();
    return true;
  };

  const createContent = () => (
    <div>
      <p>{t('confirmationDialogs:confirmWithPasswordDescription')}</p>
      <LoginForm
        formRef={formRef}
        layout="vertical"
        fixedUsername={username}
        name="session-expired-login-form"
        onLoginFailed={handleLoginFailed}
        onLoginStarted={handleLoginStarted}
        onLoginSucceeded={handleLoginSucceeded}
        hidePasswordRecoveryLink
        hideLoginButton
        />
    </div>
  );

  createDialogProps = () => ({
    title: t('confirmationDialogs:confirmWithPasswordTitle'),
    content: createContent(),
    cancelText: t('common:cancel'),
    onCancel,
    onOk: handleOkClick,
    okText: t('common:confirm'),
    okButtonProps: {
      loading: isLoggingIn
    }
  });

  dialog = modal.confirm(createDialogProps());
}
