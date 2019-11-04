import React from 'react';
// eslint-disable-next-line no-restricted-imports
import { DropdownButton as BootstrapDropdownButton } from 'react-bootstrap';
import styled from 'styled-components';

import menuItemStyles from './styles/menuItem';
import buttonStyles from './styles/button';

const DropdownButton = React.memo(styled(BootstrapDropdownButton)`
  ${props => buttonStyles(props)};

  ${menuItemStyles};
`);

export default DropdownButton;
