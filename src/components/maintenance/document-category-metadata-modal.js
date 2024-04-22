import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Form, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import { useService } from '../container-context.js';
import { SAVE_DOCUMENT_CATEGORY_RESULT } from '../../domain/constants.js';
import { maxDocumentCategoryNameLength } from '../../domain/validation-constants.js';
import DocumentCategoryApiClient from '../../api-clients/document-category-api-client.js';

function DocumentCategoryMetadataModal({ isOpen, isEditing, initialDocumentCategory, onSave, onClose }) {
  const [form] = Form.useForm();
  const { t } = useTranslation('documentCategoryMetadataModal');
  const documentCategoryApiClient = useService(DocumentCategoryApiClient);

  const [namesInUse, setNamesInUse] = useState([]);

  const nameValidationRules = [{
    required: true,
    message: t('nameRequired'),
    whitespace: true
  },
  {
    validator: (_rule, value) => {
      return value && namesInUse.includes(value.trim())
        ? Promise.reject(new Error(t('nameIsInUse')))
        : Promise.resolve();
    }
  }
  ];

  const handleOk = () => {
    form.submit();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleModalFormFinish = async ({ name, description }) => {

    const { result, documentCategory } = await documentCategoryApiClient.requestCreation({
      name: name.trim(),
      description: description.trim()
    });

    switch (result) {
      case SAVE_DOCUMENT_CATEGORY_RESULT.success:
        onSave(documentCategory);
        form.resetFields();
        return true;
      case SAVE_DOCUMENT_CATEGORY_RESULT.duplicateName:
        setNamesInUse(prevState => [...prevState, name.trim()]);
        setTimeout(() => form.validateFields(['name'], { force: true }), 0);
        return false;
      default:
        throw new Error(`Unknown result: ${result}`);
    }
  };

  const renderModalFormNameInputCount = ({ count, maxLength }) => {
    return (
      <div className="u-input-count">{`${count} / ${maxLength}`}</div>
    );
  };

  return (
    <Modal
      width="80%"
      open={isOpen}
      maskClosable={false}
      okText={t('common:create')}
      cancelText={t('common:cancel')}
      title={isEditing ? t('modalEditTitle') : t('modalCreateTitle')}
      onOk={handleOk}
      onCancel={handleCancel}
      >
      <Form
        form={form}
        layout="vertical"
        className="u-modal-body"
        validateTrigger="onSubmit"
        onFinish={handleModalFormFinish}
        >
        <Form.Item
          name="name"
          label={t('common:name')}
          rules={nameValidationRules}
          initialValue={initialDocumentCategory.name}
          >
          <Input
            maxLength={maxDocumentCategoryNameLength}
            showCount={{ formatter: renderModalFormNameInputCount }}
            />
        </Form.Item>
        <Form.Item
          name="description"
          label={t('common:description')}
          initialValue={initialDocumentCategory.description}
          >
          <MarkdownInput preview minRows={5} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

DocumentCategoryMetadataModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  initialDocumentCategory: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default DocumentCategoryMetadataModal;
