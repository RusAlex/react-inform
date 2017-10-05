import React from 'react';
import PropTypes from 'prop-types';

export default function DisabledFormSubmit(props, context) {
  return (
    <input type="submit" disabled={!context.form.isValid()} {...props} />
  );
}

DisabledFormSubmit.contextTypes = {
  form: PropTypes.object.isRequired,
};
