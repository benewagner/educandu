import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DebouncedInput from './debounced-input.js';
import { useService } from './container-context.js';
import { SOURCE_TYPE } from '../domain/constants.js';
import PublicIcon from './icons/general/public-icon.js';
import ClientConfig from '../bootstrap/client-config.js';
import PrivateIcon from './icons/general/private-icon.js';
import ResourcePicker from './resource-picker/resource-picker.js';
import { GlobalOutlined, WarningOutlined, YoutubeOutlined } from '@ant-design/icons';
import { getSourceType, getPortableUrl, getPersistableUrl } from '../utils/source-utils.js';

function UrlInput({ value, allowedSourceTypes, onChange }) {
  const { t } = useTranslation('urlInput');
  const clientConfig = useService(ClientConfig);

  const portableUrl = useMemo(() => {
    return getPortableUrl({ url: value, cdnRootUrl: clientConfig.cdnRootUrl });
  }, [value, clientConfig]);

  const sourceType = useMemo(() => {
    const newSourceType = getSourceType({ url: value, cdnRootUrl: clientConfig.cdnRootUrl });
    return allowedSourceTypes.includes(newSourceType) ? newSourceType : SOURCE_TYPE.unsupported;
  }, [clientConfig.cdnRootUrl, value, allowedSourceTypes]);

  const inputPrefixIcon = useMemo(() => {
    switch (sourceType) {
      case SOURCE_TYPE.none:
        return null;
      case SOURCE_TYPE.youtube:
        return <YoutubeOutlined />;
      case SOURCE_TYPE.internalPublic:
        return <PublicIcon />;
      case SOURCE_TYPE.internalPrivate:
        return <PrivateIcon />;
      case SOURCE_TYPE.external:
        return <GlobalOutlined />;
      default:
        return <WarningOutlined />;
    }
  }, [sourceType]);

  const handleInputValueChange = newValue => {
    onChange(getPersistableUrl({ url: newValue, cdnRootUrl: clientConfig.cdnRootUrl }));
  };

  const renderInputPrefix = () => {
    const tooltipTitle = `${t('common:source')}: ${t(`tooltip_${sourceType}`)}`;
    return (
      <Tooltip title={tooltipTitle}>
        <div className={classNames('UrlInput-prefix', { 'UrlInput-prefix--error': sourceType === SOURCE_TYPE.unsupported })}>
          {inputPrefixIcon}
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="UrlInput u-input-and-button">
      <DebouncedInput
        value={portableUrl}
        addonBefore={renderInputPrefix()}
        onChange={handleInputValueChange}
        />
      <ResourcePicker url={portableUrl} onUrlChange={handleInputValueChange} />
    </div>
  );
}

UrlInput.propTypes = {
  allowedSourceTypes: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string
};

UrlInput.defaultProps = {
  allowedSourceTypes: Object.values(SOURCE_TYPE),
  value: ''
};

export default UrlInput;
