import assert from 'assert';

import { Machina, Transition } from "../src"

describe(' > new Machina(...) tests', () => {
  enum LightState {
    On,
    Off
  };

  enum LightEdge {
    TurnOff,
    TurnOn
  }

  it('Toggle basic test by transition object', async () => {
    const machina = new Machina(LightState.On, new Map<LightState, Transition<LightState, LightEdge>[]>([
      [LightState.On, [{
        edge: LightEdge.TurnOff,
        description: 'turn off light',
        nextState: LightState.Off
      }]],
      [LightState.Off, [{
        edge: LightEdge.TurnOn,
        description: 'turn on light',
        nextState: LightState.On
      }]]
    ]))

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightEdge.TurnOff], machina.state.possibleTransitions.map(t => t.edge));

    const newState = machina.trigger(LightEdge.TurnOff);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  })
})