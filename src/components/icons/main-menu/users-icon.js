import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function UsersIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'currentColor' }} d="M498.23 85.74c52.89 0 102.61 20.6 140 57.99 37.4 37.4 57.99 87.12 57.99 140s-20.6 102.61-57.99 140c-37.4 37.4-87.12 57.99-140 57.99-52.89 0-102.61-20.6-140-57.99-37.4-37.4-57.99-87.12-57.99-140s20.6-102.61 57.99-140c37.4-37.39 87.12-57.99 140-57.99m0-61.31c-143.21 0-259.31 116.1-259.31 259.31s116.1 259.31 259.31 259.31 259.31-116.1 259.31-259.31S641.44 24.43 498.23 24.43zm91.17 643.61c31.55 0 62.86 4.61 93.07 13.7 29.81 8.97 57.83 22.08 83.29 38.97 52.27 34.68 90.4 82.9 110.28 139.46 4.63 13.18 10.61 31.3 17.86 54.08H106.1c7.24-22.79 13.22-40.9 17.86-54.08 19.88-56.56 58.01-104.78 110.28-139.46 25.45-16.89 53.48-30 83.29-38.97 30.21-9.09 61.53-13.7 93.07-13.7h178.8m0-61.31H410.6c-151.68 0-294.19 90.01-344.48 233.11-7.7 21.89-18.14 54.46-29.6 91.41-6.81 21.96 9.59 44.31 32.58 44.31h861.81c22.99 0 39.39-22.35 32.58-44.31-11.46-36.95-21.91-69.52-29.6-91.41-50.3-143.1-192.81-233.11-344.49-233.11z" />
    </svg>
  );
}

function UsersIcon(props) {
  return (
    <Icon component={UsersIconComponent} {...props} />
  );
}

export default UsersIcon;
