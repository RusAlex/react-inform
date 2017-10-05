import { expect } from 'chai';
import React from 'react';
import { spy } from 'sinon';
import { mount } from 'enzyme';

import form from '../src/form';

const fields = ['field'];
const validate = ({ field }) => {
  const errors = {};
  if (!field) errors.field = 'REQUIRED';
  else if (field === 'INVALID') errors.field = 'FIELD INVALID';
  return errors;
};

function MyForm({ fields: formFields }) {
  return (
    <div>
      <input type="text" {...formFields.field.props} />
      <span>{formFields.field.error}</span>
    </div>
  );
}

describe('form', () => {
  let props;
  let WrappedForm;
  const render = () => mount(<WrappedForm {...props} />);

  beforeEach(() => {
    WrappedForm = form({ fields, validate })(MyForm);
    props = { foo: 'bar' };
  });

  it('renders the underlying class', () => {
    expect(render().find(MyForm).length).to.equal(1);
  });

  it('passes extra props through', () => {
    expect(render().find(MyForm).props().foo).to.equal('bar');
  });

  it('does not pass errors before change / blur', () => {
    expect(render().find('span').text()).to.equal('');
  });

  describe('fields', () => {
    describe('onChange', () => {
      describe('when there is not a value prop', () => {
        const change = () => {
          const comp = render();
          comp.find(MyForm).props().fields.field.onChange('newValue');
          return comp.update();
        };

        it('changes the value prop', () => {
          expect(change().find(MyForm).props().fields.field.value).to.equal('newValue');
        });
      });

      describe('when there is a value prop', () => {
        const change = () => {
          const comp = render();
          comp.find(MyForm).props().fields.field.onChange('newValue');
          return comp;
        };

        beforeEach(() => {
          props = {
            value: {
              field: 'staticValue',
            },
          };
        });

        it('does not change the value prop', () => {
          expect(change().find(MyForm).props().fields.field.value).to.equal('staticValue');
        });
      });

      describe('when changed to a boolean value', () => {
        const change = () => {
          const comp = render();
          comp.find(MyForm).props().fields.field.onChange(true);
          return comp.update();
        };

        it('passes the checked property', () => {
          expect(change().find(MyForm).props().fields.field.checked).to.equal(true);
        });

        describe('when changed to a string later', () => {
          const backToString = () => {
            const comp = change();
            comp.find(MyForm).props().fields.field.onChange('anything');
            return comp.update();
          };

          it('removes the checked property', () => {
            expect(backToString().find(MyForm).props().fields.field.checked).to.equal(undefined);
          });
        });
      });
    });

    describe('asyncValidation', () => {
      describe('when the value is invalid', () => {
        const asyncChange = () => {
          const comp = render();
          comp.find('input').simulate('blur');
          return Promise.resolve(comp);
        };
        beforeEach(() => {
          function asyncValidate(values) {
            const errors = validate(values);
            return Promise.resolve(errors);
          }
          WrappedForm = form({ fields, validate: asyncValidate })(MyForm);
        });

        it('passes down the error property', () =>
          asyncChange().then((comp) => {
            expect(comp.find('span').text()).to.equal('REQUIRED');
          }),
        );
      });
    });

    describe('onBlur', () => {
      beforeEach(() => {
        props = {
          onTouch: spy(),
        };
      });

      describe('when the value is invalid', () => {
        const blur = () => {
          const comp = render();
          comp.find('input').simulate('blur');
          return comp;
        };

        it('passes down the error property', () => {
          expect(blur().find('span').text()).to.equal('REQUIRED');
        });

        it('calls the onTouch listenr', () => {
          blur();
          expect(props.onTouch.calledOnce).to.equal(true);
          expect(props.onTouch.getCall(0).args[0]).to.deep.equal({ field: true });
        });

        describe('when there is a touched false prop', () => {
          beforeEach(() => {
            props = {
              ...props,
              touched: { field: false },
            };
          });

          it('does not pass the error', () => {
            expect(blur().find('span').text()).to.equal('');
          });

          it('calls the onTouch listenr', () => {
            blur();
            expect(props.onTouch.calledOnce).to.equal(true);
            expect(props.onTouch.getCall(0).args[0]).to.deep.equal({ field: true });
          });
        });

        describe('when there is a touched tru prop', () => {
          beforeEach(() => {
            props = {
              ...props,
              touched: { field: true },
            };
          });

          it('passes down the error', () => {
            expect(blur().find('span').text()).to.equal('REQUIRED');
          });

          it('does not call the onTouch prop', () => {
            blur();
            expect(props.onTouch.callCount).to.equal(0);
          });
        });
      });

      describe('when the value is valid', () => {
        const blur = () => {
          const comp = render();
          comp.instance().setValues({ field: 'valid' });
          comp.find('input').simulate('blur');
          return comp;
        };

        it('does not pass down the error property', () => {
          expect(blur().find('span').text()).to.equal('');
        });

        it('calls the onTouch listenr', () => {
          blur();
          expect(props.onTouch.calledOnce).to.equal(true);
          expect(props.onTouch.getCall(0).args[0]).to.deep.equal({ field: true });
        });
      });
    });
  });

  describe('form prop', () => {
    describe('isValid', () => {
      describe('when there are errors', () => {
        beforeEach(() => {
          props = {
            value: {
              field: '',
            },
          };
        });

        it('returns false', () => {
          expect(render().find(MyForm).props().form.isValid()).to.equal(false);
        });
      });

      describe('when there are no errors', () => {
        beforeEach(() => {
          props = {
            value: {
              field: 'valid',
            },
          };
        });

        it('returns true', () => {
          expect(render().find(MyForm).props().form.isValid()).to.equal(true);
        });
      });
    });

    describe('forceValidate', () => {
      describe('when the field is invalid', () => {
        const force = () => {
          const comp = render();
          comp.find(MyForm).props().form.forceValidate();
          return comp;
        };

        it('returns false', () => {
          expect(force().find('span').text()).to.equal('REQUIRED');
        });
      });
    });

    describe('touch', () => {
      beforeEach(() => {
        props = {
          onTouch: spy(),
        };
      });

      describe('when the field is invalid', () => {
        describe('when fieldname is passed', () => {
          const touch = () => {
            const comp = render();
            comp.find(MyForm).props().form.touch(['field']);
            return comp;
          };

          it('shows the error', () => {
            expect(touch().find('span').text()).to.equal('REQUIRED');
          });

          it('calls the onTouch handler', () => {
            touch();
            expect(props.onTouch.calledOnce).to.equal(true);
            expect(props.onTouch.getCall(0).args[0]).to.deep.equal({ field: true });
          });

          describe('when there is a touched false prop', () => {
            beforeEach(() => {
              props = {
                ...props,
                touched: { field: false },
              };
            });

            it('does not show the error', () => {
              expect(touch().find('span').text()).to.equal('');
            });

            it('calls the onTouch handler', () => {
              touch();
              expect(props.onTouch.calledOnce).to.equal(true);
              expect(props.onTouch.getCall(0).args[0]).to.deep.equal({ field: true });
            });
          });
        });


        describe('when non-existent fieldname is passed', () => {
          const touch = () => {
            const comp = render();
            comp.find(MyForm).props().form.touch(['another']);
            return comp;
          };

          it('does not show the error', () => {
            expect(touch().find('span').text()).to.equal('');
          });

          it('does not call the onTouch prop', () => {
            touch();
            expect(props.onTouch.callCount).to.eq(0);
          });

          describe('when there is a touched true prop', () => {
            beforeEach(() => {
              props = {
                ...props,
                touched: { field: true },
              };
            });

            it('shows the error', () => {
              expect(touch().find('span').text()).to.equal('REQUIRED');
            });

            it('does not call the onTouch prop', () => {
              touch();
              expect(props.onTouch.callCount).to.eq(0);
            });
          });
        });
      });
    });

    describe('untouch', () => {
      beforeEach(() => {
        props = {
          onTouch: spy(),
        };
      });

      describe('when the field is invalid', () => {
        describe('when fieldname is passed', () => {
          const touch = () => {
            const comp = render();
            comp.find(MyForm).props().form.forceValidate();
            props.onTouch.reset();
            comp.find(MyForm).props().form.untouch(['field']);
            return comp;
          };

          it('does not show the error', () => {
            expect(touch().find('span').text()).to.equal('');
          });

          it('calls the onTouch prop', () => {
            touch();
            expect(props.onTouch.calledOnce).to.equal(true);
            expect(props.onTouch.getCall(0).args[0]).to.deep.equal({ field: false });
          });

          describe('when there is a touched true prop', () => {
            beforeEach(() => {
              props = {
                ...props,
                touched: { field: true },
              };
            });

            it('shows the error', () => {
              expect(touch().find('span').text()).to.equal('REQUIRED');
            });

            it('calls the onTouch prop', () => {
              touch();
              expect(props.onTouch.callCount).to.eq(1);
              expect(props.onTouch.getCall(0).args[0]).to.deep.eq({ field: false });
            });
          });
        });

        describe('non-existent fieldname is passed', () => {
          const touch = () => {
            const comp = render();
            comp.find(MyForm).props().form.forceValidate();
            props.onTouch.reset();
            comp.find(MyForm).props().form.untouch(['another']);
            return comp;
          };

          it('shows the error', () => {
            expect(touch().find('span').text()).to.equal('REQUIRED');
          });

          it('does not call the onTouch prop', () => {
            touch();
            expect(props.onTouch.callCount).to.equal(0);
          });

          describe('when there is a touched false prop', () => {
            beforeEach(() => {
              props = {
                ...props,
                touched: { field: false },
              };
            });

            it('shows the error', () => {
              expect(touch().find('span').text()).to.equal('');
            });

            it('does not call the onTouch prop', () => {
              touch();
              expect(props.onTouch.callCount).to.eq(0);
            });
          });
        });
      });
    });

    describe('resetTouched', () => {
      describe('when the field is invalid', () => {
        const reset = () => {
          const comp = render();
          comp.find(MyForm).props().form.forceValidate();
          comp.find(MyForm).props().form.resetTouched();
          return comp;
        };

        it('does not show the error', () => {
          expect(reset().find('span').text()).to.equal('');
        });
      });
    });

    describe('values', () => {
      const change = () => {
        const comp = render();
        comp.find(MyForm).props().fields.field.onChange('test');
        return comp;
      };

      it('returns the values', () => {
        expect(change().find(MyForm).props().form.values()).to.deep.equal({ field: 'test' });
      });
    });

    describe('onValues', () => {
      describe('when there is no value prop', () => {
        const onValues = () => {
          const comp = render();
          comp.find(MyForm).props().form.onValues({ field: 'INVALID' });
          return comp;
        };

        beforeEach(() => {
          props = {
            onChange: spy(),
          };
        });

        it('calls the onChange listener', () => {
          onValues();
          expect(props.onChange.calledOnce).to.equal(true);
          expect(props.onChange.calledWith({ field: 'INVALID' })).to.equal(true);
        });

        it('changes the values', () => {
          expect(onValues().find(MyForm).props().form.values()).to.deep.equal({ field: 'INVALID' });
        });

        it('detects invalid form state', () => {
          expect(onValues().find(MyForm).props().form.isValid()).to.equal(false);
        });

        describe('when there is a value already set by onValues()', () => {
          const changes = () => {
            const comp = onValues();
            comp.find(MyForm).props().form.onValues({ field: 'VALID' });
            return comp;
          };

          beforeEach(() => {
            props = {
              onChange: spy(),
            };
          });

          it('calls the onChange listener', () => {
            changes();
            expect(props.onChange.calledTwice).to.equal(true);
            expect(props.onChange.firstCall.calledWith({ field: 'INVALID' })).to.equal(true);
            expect(props.onChange.secondCall.calledWith({ field: 'VALID' })).to.equal(true);
          });

          it('changes the values', () => {
            expect(changes().find(MyForm).props().form.values())
              .to
              .deep
              .equal({ field: 'VALID' });
          });

          it('detects valid form state', () => {
            expect(changes().find(MyForm).props().form.isValid()).to.equal(true);
          });
        });
      });

      describe('when there is a value prop', () => {
        const values = () => {
          const comp = render();
          comp.find(MyForm).props().form.onValues({ field: 'VALID' });
          return comp;
        };

        beforeEach(() => {
          props = {
            value: {
              field: 'staticValue',
            },
            onChange: spy(),
          };
        });

        it('does not change the values', () => {
          expect(values().find(MyForm).props().form.values())
            .to
            .deep
            .equal({ field: 'staticValue' });
        });

        it('calls the onChange listener', () => {
          values();
          expect(props.onChange.calledOnce).to.equal(true);
          expect(props.onChange.calledWith({ field: 'VALID' })).to.equal(true);
        });
      });
    });
  });

  describe('props from parent', () => {
    describe('onValidate', () => {
      beforeEach(() => {
        props = {
          onValidate: spy(),
        };
      });

      describe('when fields are valid', () => {
        beforeEach(() => {
          props = {
            ...props,
            value: {
              field: 'valid',
            },
          };
        });

        it('is called with true', () => {
          render();
          expect(props.onValidate.calledOnce).to.equal(true);
          expect(props.onValidate.calledWith(true)).to.equal(true);
        });
      });

      describe('when fields are invalid', () => {
        it('is called with false', () => {
          render();
          expect(props.onValidate.calledOnce).to.equal(true);
          expect(props.onValidate.calledWith(false)).to.equal(true);
        });
      });

      describe('when fields are invalid multiple times in a row', () => {
        const invalidAgain = () => {
          const comp = render();
          comp.setProps({ value: { field: 'INVALID' } });
          return comp;
        };

        it('is called once with false', () => {
          invalidAgain();
          expect(props.onValidate.calledWith(false)).to.equal(true);
          expect(props.onValidate.calledOnce).to.equal(true);
        });
      });
    });
  });
});
