import { css } from 'styled-components';

import teinte from 'theme/teinte';
import contrastingColor from 'util/contrastingColor';

const menuItemStyles = css`
  & ~ .dropdown-menu > li > a {
    color: ${teinte.primary.tre};

    :hover,
    :focus {
      color: ${contrastingColor(teinte.secondary.due)};
      background-color: ${teinte.secondary.due};
    }
  }

  & ~ .dropdown-menu > .active > a {
    background-color: ${teinte.tertiary.due};
    color: ${contrastingColor(teinte.tertiary.due)};

    :hover,
    :focus {
      background-color: ${teinte.tertiary.uno};
      color: ${contrastingColor(teinte.tertiary.uno)};
    }
  }

  & ~ .dropdown-menu > .disabled > a {
    background-color: ${teinte.secondary.due};
    color: ${contrastingColor(teinte.secondary.due, 'AA')};

    :hover {
      color: ${contrastingColor(teinte.secondary.due, 'AA')};
    }
  }
`;

export default menuItemStyles;
