import React from 'react';
import urls from '../utils/urls.js';

export default function DefaultHeaderLogo() {
  const renderImage = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 354.33072 354.33072"
      version="1.1"
      height="50"
      width="50"
      >
      <g>
        <path
          d="M 35.433594,0 A 35.436542,35.436542 0 0 0 0,35.433594 V 318.89844 a 35.436542,35.436542 0 0 0 35.433594,35.43359 H 318.89844 a 35.436542,35.436542 0 0 0 35.43164,-35.43359 V 35.433594 A 35.436542,35.436542 0 0 0 318.89844,0 Z m 35.43164,35.433594 H 283.46484 a 35.436542,35.436542 0 0 1 35.4336,35.433594 V 283.46484 a 35.436542,35.436542 0 0 1 -35.4336,35.4336 H 70.865234 a 35.436542,35.436542 0 0 1 -35.43164,-35.4336 V 70.867188 a 35.436542,35.436542 0 0 1 35.43164,-35.433594 z"
          style={{ fill: '#0d6868' }}
          />
        <path
          d="m 177.16602,53.150391 c -55.23577,0 -100.017583,44.779837 -100.017582,100.015629 0,37.01261 20.109765,69.32724 49.996092,86.62304 v 27.38672 c 0,18.83887 15.167,34.00586 34.00586,34.00586 h 32.00391 c 18.83883,0 34.00586,-15.16699 34.00586,-34.00586 v -27.37109 c 29.90137,-17.29193 50.02148,-49.6148 50.02148,-86.63867 0,-55.235792 -44.77985,-100.015629 -100.01562,-100.015629 z m 26.16601,199.958989 c 1.39757,0.0263 2.62348,1.02655 2.88672,2.45703 0.30104,1.63479 -0.7715,3.19329 -2.40625,3.49414 l -49.67383,9.14062 c -1.63483,0.30104 -3.1933,-0.77146 -3.49414,-2.40625 -0.30104,-1.63483 0.77341,-3.19329 2.4082,-3.49414 l 49.67383,-9.14062 c 0.20435,-0.0376 0.40582,-0.0545 0.60547,-0.0508 z m -0.0254,15.83007 c 1.39759,0.0263 2.62348,1.02855 2.88672,2.45899 0.30104,1.63483 -0.77341,3.1933 -2.4082,3.49414 l -49.67383,9.14062 c -1.63483,0.30104 -3.19135,-0.77337 -3.49219,-2.4082 -0.30104,-1.63483 0.77146,-3.1933 2.40625,-3.49414 l 49.67383,-9.14063 c 0.20435,-0.0376 0.40777,-0.0545 0.60742,-0.0508 z"
          style={{ fill: '#0d6868' }}
          />
      </g>
    </svg>);

  return (
    <a style={{ display: 'flex' }} href={urls.getHomeUrl()}>{renderImage()}</a>
  );
}
