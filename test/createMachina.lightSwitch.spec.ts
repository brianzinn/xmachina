import assert from 'assert';
import { createMachina } from '../src';

describe(' > createMachina light switch builder tests', () => {
  enum LightState {
    On,
    Off
  };

  enum LightTransition {
    TurnOff,
    TurnOn
  }

  it('Toggle basic test by transition object', async () => {
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
      .build();

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.edge));

    const newState = machina.transition(machina.state.possibleTransitions[0].edge);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  });

  it('Toggle basic test by transition name (string)', async () => {
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
      .build();

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.edge));

    const newState = machina.transition(LightTransition.TurnOff);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  });

  it('Toggle basic test by transition name (string)', async () => {
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
      .build();

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.edge));

    // cannot traverse to "on" it's already "on".
    const newState = machina.transition(LightTransition.TurnOn);
    assert.strictEqual(null, newState);
  });

  it('Toggle basic test by transition object (add states as arrays)', async () => {
    const machina = createMachina<LightState, LightTransition>(LightState.On)
      .addState(LightState.On, [{
        edge: LightTransition.TurnOff,
        nextState: LightState.Off,
        description: 'turn off light switch'
      }])
      .addState(LightState.Off, [{
        edge: LightTransition.TurnOn,
        nextState: LightState.On,
        description: 'turn on light switch'
      }])
      .build();

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.edge));

    const newState = machina.transition(LightTransition.TurnOff);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  });
})