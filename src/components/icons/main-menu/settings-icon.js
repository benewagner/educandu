import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function SettingsIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M924.15 399.8h-43c-9.18-35.02-23.11-68.1-40.97-98.6l30.45-30.49c15.66-15.68 15.65-41.09-.03-56.75l-85.01-84.9c-15.68-15.66-41.09-15.65-56.75.04l-30.46 30.5c-30.38-17.74-63.31-31.59-98.17-40.73v-43c0-22.16-17.97-40.13-40.13-40.13H439.93c-22.16 0-40.13 17.97-40.13 40.13v43c-35.02 9.18-68.1 23.11-98.6 40.97l-30.5-30.46c-15.68-15.66-41.09-15.65-56.75.04l-84.9 85.01c-15.66 15.68-15.65 41.09.03 56.75l30.5 30.46c-17.75 30.38-31.59 63.31-40.73 98.17h-43c-22.16 0-40.13 17.97-40.13 40.13v120.15c0 22.16 17.97 40.13 40.13 40.13h43c9.18 35.02 23.11 68.1 40.97 98.6l-30.45 30.49c-15.66 15.68-15.65 41.09.03 56.75l85.01 84.9c15.68 15.66 41.09 15.65 56.75-.04l30.46-30.5c30.38 17.74 63.31 31.59 98.17 40.73v43c0 22.16 17.97 40.13 40.13 40.13h120.15c22.16 0 40.13-17.97 40.13-40.13v-43c35.02-9.18 68.1-23.11 98.6-40.98l30.49 30.46c15.68 15.66 41.09 15.65 56.75-.04l84.9-85.01c15.66-15.68 15.65-41.09-.03-56.75l-30.5-30.46c17.75-30.38 31.59-63.31 40.73-98.17h43c22.16 0 40.13-17.97 40.13-40.13V439.93c.01-22.17-17.96-40.13-40.12-40.13zM500 616.18c-64.16 0-116.18-52.02-116.18-116.18 0-64.17 52.02-116.18 116.18-116.18 64.17 0 116.18 52.02 116.18 116.18 0 64.17-52.01 116.18-116.18 116.18z" />
    </svg>
  );
}

function SettingsIcon(props) {
  return (
    <Icon component={SettingsIconComponent} {...props} />
  );
}

export default SettingsIcon;
