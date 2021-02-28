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
    const machina = createMachina<LightState, LightTransition>(LightState.On, 'light-machina')
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

      assert.strictEqual(false, machina.isStarted);

      // assert.throws(() => {
        const promise = machina.transition(LightTransition.TurnOff);
        promise
          .catch((error) => {
            assert.ok(error instanceof Error, "expecting an error to be thrown");
            assert.strictEqual(error.message, "Must start() machina 'light-machina' before transition(...).")
            done();
          })
          .then(() => assert.fail("Promise should not resolve"));
      // }, (err) => {
      //   console.error('err:', err);
      //   return err instanceof Error && err.message === 'Must start() Machine before transition(...).'
      // });
      // })
  });

  it('Transition with started machina should be started.', async () => {
    const machina = createMachina<LightState, LightTransition>(LightState.On, 'light-machina')
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
      .buildAndStart(); // does not start, but .buildAndStart() does.

      assert.strictEqual(true, machina.isStarted);
  });

});