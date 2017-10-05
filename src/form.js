import React, { Component } from 'react';
import PropTypes from 'prop-types';

import getValue from './getValue';

export default function form({
  fields: defaultFields = [],
  validate: defaultValidate = () => ({}),
} = {}) {
  return Wrapped => class FormWrapper extends Component {
    static defaultProps = {
      fields: defaultFields,
      validate: defaultValidate,
    }

    static childContextTypes = {
      form: PropTypes.object,
      fields: PropTypes.object,
    }

    static propTypes = {
      fields: PropTypes.array,
      validate: PropTypes.func,
      value: PropTypes.object,
      touched: PropTypes.object,
      onTouch: PropTypes.func,
      onChange: PropTypes.func,
      onValidate: PropTypes.func,
    }

    state = {
      errors: {},
      valid: undefined,
    }

    componentWillMount() {
      const values = this.props.value || {};
      this.setState({ values });

      const touched = this.props.touched || {};
      this.setState({ touched });

      this.handleValidate(values);
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.value !== undefined) {
        const values = nextProps.value;
        this.setState({ values });
        this.handleValidate(values, nextProps.validate);
      } else if (nextProps.validate !== undefined) {
        this.handleValidate(this.state.values, nextProps.validate);
      }
      if (nextProps.touched !== undefined) {
        const touched = nextProps.touched;
        this.setState({ touched });
      }
    }

    setValues(values) {
      if (values === undefined) return;
      if (this.props.value !== undefined) {
        this.broadcastChange(values);
      } else {
        this.setState({ values }, () => this.broadcastChange(values));
        this.handleValidate(values);
      }
    }

    setErrors(errors) {
      const valid = Object.keys(errors).length === 0;
      if (valid !== this.state.valid) {
        this.setState({ valid });
        if (this.props.onValidate) this.props.onValidate(valid);
      }
      this.setState({ errors });
    }

    handleValidate(values, validate = this.props.validate) {
      const errors = validate(values);
      if (errors.then instanceof Function) {
        errors.then(errs => this.setErrors(errs));
      } else {
        this.setErrors(errors);
      }
    }

    broadcastChange = (values) => {
      if (this.props.onChange) this.props.onChange(values);
    }

    broadcastTouched = (touched) => {
      if (this.props.onTouch) this.props.onTouch(touched);
    }

    handleChange(name, e) {
      const value = getValue(e);
      const values = {
        ...this.state.values,
        [name]: value,
      };

      if (value === this.state.values[name]) return;
      this.setValues(values);
    }

    updateTouched(touched) {
      if (this.props.touched !== undefined) {
        this.broadcastTouched(touched);
      } else {
        this.setState({ touched }, () => this.broadcastTouched(touched));
      }
    }

    touch(preVals, toVal = true) {
      const vals = preVals.filter(v => this.props.fields.indexOf(v) !== -1);
      const alreadySet =
        vals.reduce((acc, name) => acc && this.state.touched[name] === toVal, true);
      if (alreadySet) return;

      const touched = vals.reduce((acc, name) => ({ ...acc, [name]: toVal }), this.state.touched);

      this.updateTouched(touched);
    }

    formProps() {
      return {
        isValid: () => this.state.valid,
        touch: (vals = []) => this.touch(vals),
        forceValidate: () => this.touch(this.props.fields),
        untouch: (vals = []) => this.touch(vals, false),
        resetTouched: () => this.touch(this.props.fields, false),
        values: () => this.state.values,
        onValues: (values) => {
          this.setValues(values);
        },
      };
    }

    baseProps(name) {
      const { values } = this.state;
      return {
        onChange: e => this.handleChange(name, e),
        onBlur: () => this.touch([name]),
        value: values[name] || '',
        checked: typeof values[name] === 'boolean' ? values[name] : undefined,
      };
    }

    makeField(name) {
      const { errors, touched } = this.state;
      const baseProps = this.baseProps(name);
      return {
        ...baseProps,
        error: touched[name] ? errors[name] : undefined,
        props: baseProps,
      };
    }

    makeFields() {
      return this.props.fields
        .reduce((acc, name) => ({ ...acc, [name]: this.makeField(name) }), {});
    }

    generatedProps() {
      return {
        form: this.formProps(),
        fields: this.makeFields(),
      };
    }

    getChildContext() {
      return this.generatedProps();
    }

    render() {
      // eslint-disable-next-line no-unused-vars
      const { value, onChange, onValidate, validate, fields, ...otherProps } = this.props;
      return <Wrapped {...otherProps} {...this.generatedProps()} />;
    }
  };
}
