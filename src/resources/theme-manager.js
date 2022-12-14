import { getNumberFromString } from '../utils/number-utils.js';

class ThemeManager {
  constructor(lessVariables) {
    this._lessVariables = lessVariables;
  }

  getThemeToken() {
    const themeToken = {
      // Seed tokens
      fontFamily: this._lessVariables['@edu-font-family'],
      fontSize: getNumberFromString(this._lessVariables['@edu-font-size-base']),
      borderRadius: getNumberFromString(this._lessVariables['@edu-border-radius-base']),
      colorPrimary: this._lessVariables['@edu-primary-color-light'],
      colorTextBase: this._lessVariables['@edu-text-color'],
      colorError: this._lessVariables['@edu-error-color'],
      colorSuccess: this._lessVariables['@edu-success-color'],
      colorInfo: this._lessVariables['@edu-info-color'],
      controlHeight: getNumberFromString(this._lessVariables['@edu-control-height-base']),

      // Map tokens
      colorText: this._lessVariables['@edu-text-color'],
      colorBorder: this._lessVariables['@edu-border-color-base'],
      colorBorderSecondary: this._lessVariables['@edu-border-color-light'],
      colorBgSpotlight: this._lessVariables['@edu-tooltip-background-color'],
      fontSizeHeading1: getNumberFromString(this._lessVariables['@edu-heading-1-size']),
      fontSizeHeading2: getNumberFromString(this._lessVariables['@edu-heading-2-size']),
      fontSizeHeading3: getNumberFromString(this._lessVariables['@edu-heading-3-size']),
      fontSizeHeading4: getNumberFromString(this._lessVariables['@edu-heading-4-size']),
      fontSizeHeading5: getNumberFromString(this._lessVariables['@edu-heading-5-size']),
      fontSizeLG: getNumberFromString(this._lessVariables['@edu-font-size-lg']),
      fontSizeSM: getNumberFromString(this._lessVariables['@edu-font-size-sm']),

      // Alias tokens
      colorTextHeading: this._lessVariables['@edu-label-color'],
      colorTextDescription: this._lessVariables['@edu-text-color'],
      colorTextDisabled: this._lessVariables['@edu-disabled-color'],
      colorLink: this._lessVariables['@edu-link-color'],
      colorLinkHover: this._lessVariables['@edu-link-hover-color'],
      colorLinkActive: this._lessVariables['@edu-link-active-color'],
      linkDecoration: this._lessVariables['@edu-link-decoration'],
      fontWeightStrong: 400, // Table header
      controlOutlineWidth: getNumberFromString(this._lessVariables['@edu-outline-width'])
    };

    return themeToken;
  }
}

export default ThemeManager;
