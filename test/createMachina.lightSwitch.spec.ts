import assert from 'assert';
import { createMachina, Transition } from '../src';

describe(' > createMachina builder tests', () => {
  it('Toggle basic test by transition object', async () => {
    enum LightState {
      On,
      Off
    };

    const machina = createMachina<LightState, Transition<LightState>>(LightState.On)
      .addState(LightState.On, {
        name: 'off',
        nextState: LightState.Off,
        description: 'turn off light switch'
      })
      .addState(LightState.Off, {
        name: 'on',
        nextState: LightState.On,
        description: 'turn on light switch'
      })
      .build();

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual(['off'], machina.state.possibleTransitions.map(t => t.name));

    const newState = machina.transitionTo(machina.state.possibleTransitions[0]);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  });

  it('Toggle basic test by transition name (string)', async () => {
    enum LightState {
      On,
      Off
    };

    const machina = createMachina<LightState, Transition<LightState>>(LightState.On)
      .addState(LightState.On, {
        name: 'off',
        nextState: LightState.Off,
        description: 'turn off light switch'
      })
      .addState(LightState.Off, {
        name: 'on',
        nextState: LightState.On,
        description: 'turn on light switch'
      })
      .build();

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual(['off'], machina.state.possibleTransitions.map(t => t.name));

    const newState = machina.transitionTo('off');
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  });
})