import { expect } from 'chai';
import { spy } from 'sinon';
import React from 'react';
import { mount } from 'enzyme';

import form from '../src/form';

const DummyInput = () => null;

// For testing the different combinations of form setup
describe('combinations', () => {
  const descriptor = {
    fields: ['test'],
    validate: ({ test }) => {
      if (test === 'valid') return {};
      return { test: 'Must be valid' };
    },
  };

  const combinations = [
    {
      name: 'in decorator-no parent',
      propHandler: (comp, changeSpy) => {
        comp.setProps({ onChange: changeSpy });
      },
      form: (
        form(descriptor)(
          ({ fields }) => <DummyInput {...fields.test} />
        )
      ),
    }, {
      name: 'in decorator-parent changes',
      propHandler: (comp, changeSpy) => {
        const props = {
          onChange: value => {
            changeSpy(value);
            props.value = value;
            comp.setProps(props);
          },
        };
        comp.setProps(props);
      },
      form: (
        form(descriptor)(
          ({ fields }) => <DummyInput type="text" {...fields.test} />
        )
      ),
    }, {
      name: 'in props-no parent',
      propHandler: (comp, changeSpy) => {
        comp.setProps({
          onChange: changeSpy,
          ...descriptor,
        });
      },
      form: (
        form()(
          ({ fields }) => <DummyInput type="text" {...fields.test} />
        )
      ),
    }, {
      name: 'in props-parent changes',
      propHandler: (comp, changeSpy) => {
        const props = {
          onChange: value => {
            changeSpy(value);
            props.value = value;
            comp.setProps(props);
          },
          ...descriptor,
        };
        comp.setProps(props);
      },
      form: (
        form()(
          ({ fields }) => <DummyInput type="text" {...fields.test} />
        )
      ),
    },
  ];

  combinations.forEach(({ name, propHandler, form: Form }) => {
    describe(name, () => {
      let onChange;
      beforeEach(() => {
        onChange = spy();
      });

      const render = () => {
        const comp = mount(<Form />);
        propHandler(comp, onChange);
        return comp;
      };

      it('has the right starting value', () => {
        expect(render().find(DummyInput).props().value).to.eq('');
      });

      it('has no errors initially', () => {
        expect(render().find(DummyInput).props().error).to.eq(undefined);
      });

      it('does not call onChange initially', () => {
        render();
        expect(onChange.callCount).to.eq(0);
      });

      describe('when changed to invalid', () => {
        const changed = () => {
          const comp = render();
          comp.find(DummyInput).props().onChange('invalid');
          return comp.update();
        };

        it('has the right value', () => {
          expect(changed().find(DummyInput).props().value).to.eq('invalid');
        });

        it('has no error', () => {
          expect(changed().find(DummyInput).props().error).to.eq(undefined);
        });

        it('calls onChange once', () => {
          changed();
          expect(onChange.calledOnce).to.eq(true);
        });

        it('calls onChange with the change value', () => {
          changed();
          expect(onChange.calledWith({ test: 'invalid' })).to.eq(true);
        });

        describe('when blurred', () => {
          const blurred = () => {
            const comp = changed();
            comp.find(DummyInput).props().onBlur();
            return comp.update();
          };

          it('has the right value', () => {
            expect(blurred().find(DummyInput).props().value).to.eq('invalid');
          });

          it('has the error', () => {
            expect(blurred().find(DummyInput).props().error).to.eq('Must be valid');
          });

          it('calls onChange once', () => {
            blurred();
            expect(onChange.calledOnce).to.eq(true);
          });

          it('calls onChange with the change value', () => {
            blurred();
            expect(onChange.calledWith({ test: 'invalid' })).to.eq(true);
          });

          describe('when message changes', () => {
            const invalidate = () => {
              const comp = blurred();
              const props = {
                ...comp.props(),
                validate: ({ test }) => (test === undefined ? {} : { test: 'Different message' }),
              };
              comp.setProps(props);
              return comp;
            };

            it('has an error', () => {
              expect(invalidate().find(DummyInput).props().error).to.eq('Different message');
            });

            it('does not call onChange again', () => {
              invalidate();
              expect(onChange.calledOnce).to.eq(true);
            });
          });
        });
      });

      describe('when changed to valid', () => {
        const changed = () => {
          const comp = render();
          comp.find(DummyInput).props().onChange('valid');
          return comp.update();
        };

        it('has the right value', () => {
          expect(changed().find(DummyInput).props().value).to.eq('valid');
        });

        it('has no error', () => {
          expect(changed().find(DummyInput).props().error).to.eq(undefined);
        });

        it('calls onChange once', () => {
          changed();
          expect(onChange.calledOnce).to.eq(true);
        });

        it('calls onChange with the change value', () => {
          changed();
          expect(onChange.calledWith({ test: 'valid' })).to.eq(true);
        });

        describe('when blurred', () => {
          const blurred = () => {
            const comp = changed();
            comp.find(DummyInput).props().onBlur();
            return comp.update();
          };

          it('has the right value', () => {
            expect(blurred().find(DummyInput).props().value).to.eq('valid');
          });

          it('has no error', () => {
            expect(blurred().find(DummyInput).props().error).to.eq(undefined);
          });

          it('calls onChange once', () => {
            blurred();
            expect(onChange.calledOnce).to.eq(true);
          });

          it('calls onChange with the change value', () => {
            blurred();
            expect(onChange.calledWith({ test: 'valid' })).to.eq(true);
          });

          describe('when validate rejects value', () => {
            const invalidate = () => {
              const comp = blurred();
              const props = {
                ...comp.props(),
                validate: ({ test }) => (test === 'valid' ? { test: 'Must not be valid' } : {}),
              };
              comp.setProps(props);
              return comp;
            };

            it('has an error', () => {
              expect(invalidate().find(DummyInput).props().error).to.eq('Must not be valid');
            });

            it('does not call onChange again', () => {
              invalidate();
              expect(onChange.calledOnce).to.eq(true);
            });

            describe('when validate prop is removed', () => {
              const revalidate = () => {
                const comp = invalidate();
                const props = {
                  ...comp.props(),
                  validate: undefined,
                };
                comp.setProps(props);
                return comp;
              };

              it('removes the error', () => {
                expect(revalidate().find(DummyInput).props().error).to.eq(undefined);
              });

              it('does not call onChange again', () => {
                revalidate();
                expect(onChange.calledOnce).to.eq(true);
              });
            });
          });

          describe('when validate and value change to be invalid', () => {
            const invalidate = () => {
              const comp = blurred();
              comp.find(DummyInput).props().onChange('other');
              const props = {
                ...comp.props(),
                validate: ({ test }) => (test === 'other' ? { test: 'suddenly invalid' } : {}),
              };
              comp.setProps(props);
              return comp;
            };

            it('has an error', () => {
              expect(invalidate().find(DummyInput).props().error).to.eq('suddenly invalid');
            });

            it('calls onChange again', () => {
              invalidate();
              expect(onChange.calledTwice).to.eq(true);
            });

            it('calls onChange with new value', () => {
              invalidate();
              expect(onChange.getCall(1).args[0]).to.deep.eq({ test: 'other' });
            });
          });
        });
      });

      describe('when value changes to invalid', () => {
        const changed = () => {
          const comp = render();
          comp.setProps({
            ...comp.props(),
            value: { test: 'invalid' },
          });
          return comp;
        };

        it('has the right value', () => {
          expect(changed().find(DummyInput).props().value).to.eq('invalid');
        });

        it('has no error', () => {
          expect(changed().find(DummyInput).props().error).to.eq(undefined);
        });

        it('does not call onChange', () => {
          changed();
          expect(onChange.callCount).to.eq(0);
        });

        describe('when blurred', () => {
          const blurred = () => {
            const comp = changed();
            comp.find(DummyInput).props().onBlur();
            return comp.update();
          };

          it('has the right value', () => {
            expect(blurred().find(DummyInput).props().value).to.eq('invalid');
          });

          it('has the error', () => {
            expect(blurred().find(DummyInput).props().error).to.eq('Must be valid');
          });

          it('does not call onChange', () => {
            blurred();
            expect(onChange.callCount).to.eq(0);
          });

          describe('when message changes', () => {
            const invalidate = () => {
              const comp = blurred();
              const props = {
                ...comp.props(),
                validate: ({ test }) => (test === undefined ? {} : { test: 'Different message' }),
              };
              comp.setProps(props);
              return comp;
            };

            it('has an error', () => {
              expect(invalidate().find(DummyInput).props().error).to.eq('Different message');
            });

            it('does not call onChange', () => {
              invalidate();
              expect(onChange.callCount).to.eq(0);
            });
          });
        });
      });

      describe('when value changes to valid', () => {
        const changed = () => {
          const comp = render();
          comp.setProps({
            ...comp.props(),
            value: { test: 'valid' },
          });
          return comp;
        };

        it('has the right value', () => {
          expect(changed().find(DummyInput).props().value).to.eq('valid');
        });

        it('has no error', () => {
          expect(changed().find(DummyInput).props().error).to.eq(undefined);
        });

        it('does not call onChange', () => {
          changed();
          expect(onChange.callCount).to.eq(0);
        });

        describe('when blurred', () => {
          const blurred = () => {
            const comp = changed();
            comp.find(DummyInput).props().onBlur();
            return comp;
          };

          it('has the right value', () => {
            expect(blurred().find(DummyInput).props().value).to.eq('valid');
          });

          it('has no error', () => {
            expect(blurred().find(DummyInput).props().error).to.eq(undefined);
          });

          it('does not call onChange', () => {
            blurred();
            expect(onChange.callCount).to.eq(0);
          });

          describe('when validate rejects value', () => {
            const invalidate = () => {
              const comp = blurred();
              const props = {
                ...comp.props(),
                validate: ({ test }) => (test === 'valid' ? { test: 'Must not be valid' } : {}),
              };
              comp.setProps(props);
              return comp;
            };

            it('has an error', () => {
              expect(invalidate().find(DummyInput).props().error).to.eq('Must not be valid');
            });

            it('does not call onChange', () => {
              invalidate();
              expect(onChange.callCount).to.eq(0);
            });

            describe('when validate prop is removed', () => {
              const revalidate = () => {
                const comp = invalidate();
                const props = {
                  ...comp.props(),
                  validate: undefined,
                };
                comp.setProps(props);
                return comp;
              };

              it('removes the error', () => {
                expect(revalidate().find(DummyInput).props().error).to.eq(undefined);
              });

              it('does not call onChange', () => {
                revalidate();
                expect(onChange.callCount).to.eq(0);
              });
            });
          });

          describe('when validate and value change to be invalid', () => {
            const invalidate = () => {
              const comp = blurred();
              const props = {
                ...comp.props(),
                value: { test: 'other' },
                validate: ({ test }) => (test === 'other' ? { test: 'suddenly invalid' } : {}),
              };
              comp.setProps(props);
              return comp;
            };

            it('has an error', () => {
              expect(invalidate().find(DummyInput).props().error).to.eq('suddenly invalid');
            });

            it('does not call onChange', () => {
              invalidate();
              expect(onChange.callCount).to.eq(0);
            });
          });
        });
      });
    });
  });
});
