import React, { Component } from 'react';
import PropTypes from 'prop-types';


export default class ResetFormButton extends Component {
  static propTypes = {
    children: PropTypes.string,
    resetTouched: PropTypes.boolean,
  }

  static contextTypes = {
    form: PropTypes.object.isRequired,
  }

  handleClick(e) {
    e.preventDefault();
    this.context.form.onValues({});
    if (this.props.resetTouched) {
      this.context.form.resetTouched();
    }
  }

  render() {
    const { children, resetTouched: ignored, ...rest } = this.props;

    return (
      <button {...rest} onClick={e => this.handleClick(e)}>
        {children || 'Reset'}
      </button>
    );
  }
}
