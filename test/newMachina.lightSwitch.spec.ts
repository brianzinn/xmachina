import assert from 'assert';

import { Machina, NodeState, Transition } from "../src"

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
    const machina = new Machina(LightState.On, new Map<LightState, NodeState<LightState, LightEdge, Transition<LightState, LightEdge>>>([
      [LightState.On,
      {
        outEdges: [{
          edge: LightEdge.TurnOff,
          description: 'turn off light',
          nextState: LightState.Off
        }],
        onEnter: async () => console.log('light turned on')
      }],
      [LightState.Off, {
        outEdges: [{
          edge: LightEdge.TurnOn,
          description: 'turn on light',
          nextState: LightState.On
        }],
        onEnter: async () => console.log('light turned off')
      }]
    ]))
    machina.start();
    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightEdge.TurnOff], machina.state.possibleTransitions.map(t => t.edge));

    const newState = machina.transition(LightEdge.TurnOff);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  })
})