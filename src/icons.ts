import { LabIcon } from '@jupyterlab/ui-components';

import prSvgstr from '../style/pullrequest.svg';
import prInsertionSvgstr from '../style/pullrequest-insertion.svg';
import prDeletionSvgstr from '../style/pullrequest-deletion.svg';
import prPlusSvgstr from '../style/pullrequest-plus.svg';

export const A_BUTTON = {
  className: 'bp3-button jp-Button'
};

export const MINIMAL_BUTTON = {
  className: `${A_BUTTON.className} bp3-minimal minimal`
};

export const DANGER_BUTTON = {
  className: `${MINIMAL_BUTTON.className} jp-PullRequestDangerHover`
};

export const prIcon = new LabIcon({
  name: 'pull-requests:pr',
  svgstr: prSvgstr
});

export const prInsertionIcon = new LabIcon({
  name: 'pull-requests:insertion',
  svgstr: prInsertionSvgstr
});

export const prDeletionIcon = new LabIcon({
  name: 'pull-requests:deletion',
  svgstr: prDeletionSvgstr
});

export const prPlusIcon = new LabIcon({
  name: 'pull-requests:plus',
  svgstr: prPlusSvgstr
});
