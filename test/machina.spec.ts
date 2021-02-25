import assert from 'assert';
import { createMachina } from '../src';

describe(' > machina specific tests', () => {
  enum LightState {
    On,
    Off
  };

  enum LightTransition {
    TurnOff,
    TurnOn
  }

  it('Transition before starting machina will throw an error.', (done: (err?: any) => void) => {
    const machina = createMachina<LightState, LightTransition>(LightState.On)
      .addState(LightState.On, {
        on: LightTransition.TurnOff,
        nextState: LightState.Off,
        description: 'turn off light switch'
      })
      .addState(LightState.Off, {
        on: LightTransition.TurnOn,
        nextState: LightState.On,
        description: 'turn on light switch'
      })
      .build(); // does not start, but .buildAndStart() does.

      // assert.throws(() => {
        const promise = machina.transition(LightTransition.TurnOff);
        promise
          .catch((error) => {
            assert.ok(error instanceof Error, "expecting an error to be thrown");
            assert.strictEqual(error.message, 'Must start() Machine before transition(...).')
            done();
          })
          .then(() => assert.fail("Promise should not resolve"));
      // }, (err) => {
      //   console.error('err:', err);
      //   return err instanceof Error && err.message === 'Must start() Machine before transition(...).'
      // });
      // })
  });

});