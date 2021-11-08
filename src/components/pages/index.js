import React, { useState } from 'react';
import Page from '../page.js';
import DocView from '../doc-view.js';
import PropTypes from 'prop-types';
import { getHomeUrl, getSearchUrl } from '../../utils/urls.js';
import ElmuLogo from '../elmu-logo.js';
import { Button, Input } from 'antd';
import { useService } from '../container-context.js';
import { useLanguage } from '../language-context.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import { documentShape, homeLanguageShape } from '../../ui/default-prop-types.js';

function Index({ initialState }) {
  const [searchText, setSearchText] = useState('');

  const { language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const { document: doc, homeLanguages, currentHomeLanguageIndex } = initialState;
  const currentHomeLanguage = homeLanguages[currentHomeLanguageIndex];

  const handleSearchClick = () => {
    window.location = getSearchUrl(searchText.trim());
  };

  const handleSearchTextChanged = event => {
    setSearchText(event.target.value);
  };

  const languageNames = languageNameProvider.getData(language);

  return (
    <Page fullScreen>
      <div className="IndexPage">
        <div className="IndexPage-title">
          <ElmuLogo size="big" readonly />
        </div>
        <div className="IndexPage-languageLinks">
          {homeLanguages.map((hl, index) => (
            <Button key={index.toString()} type="link" href={getHomeUrl(index === 0 ? null : hl.language)}>
              <CountryFlagAndName
                code={languageNames[hl.language]?.flag || null}
                name={languageNames[hl.language]?.name || null}
                flagOnly
                />
            </Button>
          ))}
        </div>
        {currentHomeLanguage && (
          <div className="IndexPage-search">
            <Input
              size="large"
              className="IndexPage-searchInput"
              placeholder={currentHomeLanguage.searchFieldPlaceholder}
              autoFocus
              value={searchText}
              onChange={handleSearchTextChanged}
              />
            <Button
              size="large"
              onClick={handleSearchClick}
              type="primary"
              disabled={!searchText || !searchText.trim()}
              className="IndexPage-searchButton"
              >
              {currentHomeLanguage.searchFieldButton}
            </Button>
          </div>
        )}
        {doc && <DocView documentOrRevision={doc} />}
      </div>
    </Page>
  );
}

Index.propTypes = {
  initialState: PropTypes.shape({
    document: documentShape,
    homeLanguages: PropTypes.arrayOf(homeLanguageShape).isRequired,
    currentHomeLanguageIndex: PropTypes.number.isRequired
  }).isRequired
};

export default Index;
