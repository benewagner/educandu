import moment from 'moment';
import Alert from './alert.js';
import PropTypes from 'prop-types';
import Logger from '../common/logger.js';
import cloneDeep from '../utils/clone-deep.js';
import { useTranslation } from 'react-i18next';
import errorHelper from '../ui/error-helper.js';
import inputValidators from '../utils/input-validators.js';
import LanguageSelect from './localization/language-select.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { useDateFormat, useLocale } from './locale-context.js';
import LessonApiClient from '../api-clients/lesson-api-client.js';
import { lessonMetadataShape } from '../ui/default-prop-types.js';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Form, Modal, Input, DatePicker, Collapse, Select, InputNumber, Checkbox } from 'antd';

const FormItem = Form.Item;
const CollapsePanel = Collapse.Panel;

const logger = new Logger(import.meta.url);

export const LESSON_MODAL_MODE = {
  create: 'create',
  update: 'update'
};

const LESSON_SEQUENCE_INTERVAL = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  yearly: 'yearly'
};

const MOMENT_INTERVAL_UNITS = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
};

function getDefaultLanguageFromUiLanguage(uiLanguage) {
  switch (uiLanguage) {
    case 'de': return 'de';
    default: return 'en';
  }
}

function LessonMetadataModal({ initialLessonMetadata, mode, allowMultiple, isVisible, onSave, onCancel }) {
  const formRef = useRef(null);
  const { dateTimeFormat } = useDateFormat();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('lessonMetadataModal');
  const lessonApiClient = useSessionAwareApiClient(LessonApiClient);

  const [loading, setLoading] = useState(false);

  const [hasDueDate, setHasDueDate] = useState(false);
  const [isSequenceExpanded, setIsSequenceExpanded] = useState(false);

  const titleValidationRules = [
    {
      required: true,
      message: t('titleRequired'),
      whitespace: true
    }
  ];

  const slugValidationRules = [
    {
      validator: (rule, value) => {
        return value && !inputValidators.isValidSlug(value)
          ? Promise.reject(new Error(t('common:invalidSlug')))
          : Promise.resolve();
      }
    }
  ];

  const initialValues = {
    title: initialLessonMetadata.title || t('newLesson'),
    slug: initialLessonMetadata.slug || '',
    language: initialLessonMetadata.language || getDefaultLanguageFromUiLanguage(uiLanguage),
    dueOn: initialLessonMetadata.dueOn ? moment(initialLessonMetadata.dueOn) : null,
    enableSequence: false,
    sequenceInterval: LESSON_SEQUENCE_INTERVAL.weekly,
    sequenceCount: 3
  };

  const lessonSequenceIntervalOptions = useMemo(() => {
    return Object.values(LESSON_SEQUENCE_INTERVAL).map(value => ({ value, label: t(`common:${value}`) }));
  }, [t]);

  useEffect(() => {
    if (isVisible) {
      setHasDueDate(false);
      setIsSequenceExpanded(false);
      formRef.current?.resetFields();
    }
  }, [isVisible]);

  const handleOk = () => {
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleValuesChange = (_, { dueOn }) => {
    setHasDueDate(!!dueOn);
  };

  const handleFinish = async ({ title, slug, language, dueOn, enableSequence, sequenceInterval, sequenceCount }) => {
    try {
      setLoading(true);

      const mappedLesson = {
        lessonId: initialLessonMetadata._id,
        roomId: initialLessonMetadata.roomId,
        title,
        slug: slug || '',
        language,
        dueOn: dueOn ? dueOn.toISOString() : ''
      };

      if (mode === LESSON_MODAL_MODE.create) {
        const savedLessons = [];
        const lessonsToSave = enableSequence && sequenceCount > 1 && dueOn
          ? Array.from({ length: sequenceCount }, (_, index) => ({
            ...cloneDeep(mappedLesson),
            lessonId: null,
            title: `${mappedLesson.title} (${index + 1})`,
            slug: mappedLesson.slug ? `${mappedLesson.slug}/${index + 1}` : '',
            dueOn: moment(dueOn).add(index, MOMENT_INTERVAL_UNITS[sequenceInterval]).toISOString()
          }))
          : [mappedLesson];

        for (const lessonToSave of lessonsToSave) {
          // eslint-disable-next-line no-await-in-loop
          savedLessons.push(await lessonApiClient.addLesson(lessonToSave));
        }

        onSave(allowMultiple ? savedLessons : savedLessons[0]);
      } else {
        const savedLesson = await lessonApiClient.updateLessonMetadata(mappedLesson);
        onSave(savedLesson);
      }
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    } finally {
      setLoading(false);
    }
  };

  const disabledMorningHours = [...Array(7).keys()];
  const disabledEveningHours = [...Array(24).keys()].splice(21);
  const disabledMinutes = [...Array(60).keys()].filter(minute => minute % 5 !== 0);
  const firstEnabledHour = disabledMorningHours[disabledMorningHours.length - 1] + 1;

  const disabledTime = () => {
    return {
      disabledHours: () => [...disabledMorningHours, ...disabledEveningHours],
      disabledMinutes: () => disabledMinutes
    };
  };

  const handleSequenceCollapseChange = ([value]) => {
    setIsSequenceExpanded(value === 'sequence');
    formRef.current?.setFieldsValue({ enableSequence: value === 'sequence' });
  };

  return (
    <Modal
      title={mode === LESSON_MODAL_MODE.create ? t('newLesson') : t('editLesson')}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      visible={isVisible}
      okButtonProps={{ loading }}
      okText={t('common:save')}
      >
      <Form onFinish={handleFinish} onValuesChange={handleValuesChange} name="new-lesson-form" ref={formRef} layout="vertical" initialValues={initialValues}>
        <FormItem label={t('common:title')} name="title" rules={titleValidationRules}>
          <Input />
        </FormItem>
        <FormItem label={t('common:language')} name="language">
          <LanguageSelect />
        </FormItem>
        <FormItem label={t('common:slug')} name="slug" rules={slugValidationRules}>
          <Input />
        </FormItem>
        <FormItem label={t('dueOn')} name="dueOn">
          <DatePicker
            inputReadOnly
            style={{ width: '100%' }}
            format={dateTimeFormat}
            disabledTime={disabledTime}
            showTime={{ defaultValue: moment(`${firstEnabledHour}:00`, 'HH:mm'), format: 'HH:mm', hideDisabledOptions: true }}
            />
        </FormItem>
        <FormItem name="enableSequence" valuePropName="checked" hidden>
          <Checkbox />
        </FormItem>
        {mode === LESSON_MODAL_MODE.create && allowMultiple && (
          <Collapse className="LessonMetadataModal-sequenceCollapse" activeKey={isSequenceExpanded ? ['sequence'] : []} onChange={handleSequenceCollapseChange} ghost>
            <CollapsePanel header={t('createSequence')} key="sequence" forceRender>
              <Alert className="LessonMetadataModal-sequenceInfo" message={t('sequenceInfoBoxHeader')} description={t('sequenceInfoBoxDescription')} />
              <FormItem label={t('sequenceInterval')} name="sequenceInterval">
                <Select options={lessonSequenceIntervalOptions} disabled={!hasDueDate} />
              </FormItem>
              <FormItem label={t('sequenceCount')} name="sequenceCount" rules={[{ type: 'integer', min: 1, max: 100 }]}>
                <InputNumber style={{ width: '100%' }} disabled={!hasDueDate} min={1} max={100} />
              </FormItem>
            </CollapsePanel>
          </Collapse>
        )}
      </Form>
    </Modal>
  );
}

LessonMetadataModal.propTypes = {
  allowMultiple: PropTypes.bool,
  initialLessonMetadata: PropTypes.oneOfType([
    PropTypes.shape({ roomId: PropTypes.string.isRequired }),
    lessonMetadataShape
  ]).isRequired,
  isVisible: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(Object.values(LESSON_MODAL_MODE)).isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func
};

LessonMetadataModal.defaultProps = {
  allowMultiple: false,
  onCancel: () => {},
  onSave: () => {}
};

export default LessonMetadataModal;
