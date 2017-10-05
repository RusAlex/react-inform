import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class FeedbackFormSubmit extends Component {
  static propTypes = {
    onInvalid: PropTypes.func,
    onClick: PropTypes.func,
  }

  static contextTypes = {
    form: PropTypes.object.isRequired,
  }

  handleClick(e) {
    if (!this.context.form.isValid()) {
      e.preventDefault();
      this.context.form.forceValidate();
      if (this.props.onInvalid) this.props.onInvalid(e);
    }
    if (this.props.onClick) this.props.onClick(e);
  }

  render() {
    return (
      <input type="submit" {...this.props} onClick={e => this.handleClick(e)} />
    );
  }
}
