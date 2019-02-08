import React from 'react';
import { shallow } from 'enzyme';

import { Error } from 'quill-component-library/dist/componentLibrary';

describe('Error component', () => {
  const error = 'You did something wrong.'

  const wrapper = shallow(<Error error={error} />)
  it('renders a p element with the class error', () => {
    expect(wrapper.find('p.error')).toHaveLength(1)
  })

  it('renders the error it is passed', () => {
    expect(wrapper.text()).toEqual(error)
  })

})
