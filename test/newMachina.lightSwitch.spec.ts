import assert from 'assert';

import { Machina, Transition } from "../src"

describe(' > new Machina(...) tests', () => {
  it('Toggle basic test by transition object', async () => {
    enum LightState {
      On,
      Off
    };
    const machina = new Machina(LightState.On, new Map<LightState, Transition<LightState>[]>([
      [LightState.On, [{
        description: 'turn off light',
        name: 'off',
        nextState: LightState.Off
      }]],
      [LightState.Off, [{
        description: 'turn on light',
        name: 'on',
        nextState: LightState.On
      }]]
    ]))

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual(['off'], machina.state.possibleTransitions.map(t => t.name));

    const newState = machina.transitionTo(machina.state.possibleTransitions[0]);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  })
})