import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import CustomAlert from './custom-alert.js';
import ConsentDialog from './consent-dialog.js';
import DefaultPageHeader from './default-page-header.js';
import DefaultPageFooter from './default-page-footer.js';

function DefaultPageTemplate({ children, fullScreen, focusHeader, contentHeader, alerts, headerRef, contentRef }) {
  const contentAreaClasses = classNames({
    'DefaultPageTemplate-contentArea': true,
    'DefaultPageTemplate-contentArea--fullScreen': fullScreen
  });

  const contentClasses = classNames({
    'DefaultPageTemplate-content': true,
    'DefaultPageTemplate-content--fullScreen': fullScreen
  });

  const renderAlert = (alert, index) => {
    const shouldRenderAlert = !fullScreen || alert.showInFullScreen;

    if (!shouldRenderAlert) {
      return null;
    }

    return (
      <CustomAlert
        banner
        key={index}
        type={alert.type}
        message={alert.message}
        closable={alert.closable || false}
        onClose={alert.onClose || (() => { })}
        />
    );
  };

  return (
    <div className="DefaultPageTemplate">
      <DefaultPageHeader focusContent={focusHeader} headerRef={headerRef} />
      <main className={contentAreaClasses}>
        {contentHeader}
        <div className={contentClasses} ref={contentRef}>
          {!!alerts?.length && (
            <div className="DefaultPageTemplate-contentAlerts">
              {alerts.map(renderAlert)}
            </div>
          )}
          {children}
        </div>
      </main>
      {!focusHeader && <DefaultPageFooter />}
      <ConsentDialog />
    </div>
  );
}

DefaultPageTemplate.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.node.isRequired,
    type: PropTypes.string,
    closable: PropTypes.bool,
    onClose: PropTypes.func
  })),
  children: PropTypes.node,
  fullScreen: PropTypes.bool,
  focusHeader: PropTypes.node,
  contentHeader: PropTypes.node,
  headerRef: PropTypes.object,
  contentRef: PropTypes.object
};

DefaultPageTemplate.defaultProps = {
  alerts: [],
  children: null,
  fullScreen: false,
  focusHeader: null,
  contentHeader: null,
  headerRef: null,
  contentRef: null
};

export default DefaultPageTemplate;
