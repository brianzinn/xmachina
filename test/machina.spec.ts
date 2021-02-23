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

  it('Transition before starting machina will throw an error.', async () => {
    const machina = createMachina<LightState, LightTransition>(LightState.On)
      .addState(LightState.On, {
        edge: LightTransition.TurnOff,
        nextState: LightState.Off,
        description: 'turn off light switch'
      })
      .addState(LightState.Off, {
        edge: LightTransition.TurnOn,
        nextState: LightState.On,
        description: 'turn on light switch'
      })
      .build(); // does not start, but .buildAndStart() does.

      assert.throws(() => {
        machina.transition(LightTransition.TurnOff);
      }, (err) => err instanceof Error && err.message === 'Must start() Machine before transition(...).');
  });
});