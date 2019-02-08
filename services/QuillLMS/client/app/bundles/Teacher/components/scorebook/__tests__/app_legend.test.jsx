import React from 'react';
import { shallow } from 'enzyme';

import AppLegend from '../app_legend.jsx'

describe('AppLegend component', () => {

  it('should render', () => {
    const wrapper = shallow(<AppLegend/>)
    expect(wrapper).toMatchSnapshot();
  });

})
