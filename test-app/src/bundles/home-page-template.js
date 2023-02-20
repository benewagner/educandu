import React from 'react';
import PropTypes from 'prop-types';
import SiteLogo from './site-logo.js';
import { useTranslation } from 'react-i18next';
import Markdown from '../../../src/components/markdown.js';
import HomePageIllustration from './home-page-illustration.js';
import ConsentDialog from '../../../src/components/consent-dialog.js';
import { useSettings } from '../../../src/components/settings-context.js';
import DefaultPageFooter from '../../../src/components/default-page-footer.js';
import DefaultPageHeader from '../../../src/components/default-page-header.js';

function HomePageTemplate({ children }) {
  const settings = useSettings();
  const { t } = useTranslation('testApp');

  return (
    <div className="HomePageTemplate">
      <DefaultPageHeader />
      <main className="HomePageTemplate-contentArea">
        <div className="HomePageTemplate-content">
          <div className="HomePageTemplate-logo" >
            <SiteLogo readonly />
            <div className="HomePageTemplate-subtitle">{t('homePage.subtitle')}</div>
          </div>
          <div>
            {children}
            {!!settings.homepageInfo && (
              <div className="HomePageTemplate-info"><Markdown>{settings.homepageInfo}</Markdown></div>
            )}
          </div>
          <div className="HomePageTemplate-illustration">
            <HomePageIllustration />
          </div>
        </div>
      </main>
      <div className="HomePageTemplate-sponsorsFooter">
        {t('homePage.supportedBy')}
        <div className="HomePageTemplate-sponsors">
          <a className="HomePageTemplate-sponsor" href="https://stiftung-hochschullehre.de/" target="_blank" rel="noreferrer">
            <img src="/images/sih-logo.svg" />
          </a>
          <a className="HomePageTemplate-sponsor" href="https://www.hmtm.de/de/" target="_blank" rel="noreferrer">
            <img src="/images/hmtm-logo.svg" />
          </a>
        </div>
      </div>
      <DefaultPageFooter />
      <ConsentDialog />
    </div>
  );
}

HomePageTemplate.propTypes = {
  children: PropTypes.node
};

HomePageTemplate.defaultProps = {
  children: null
};

export default HomePageTemplate;
