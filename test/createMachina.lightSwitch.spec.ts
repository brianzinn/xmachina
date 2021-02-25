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
        on: LightTransition.TurnOff,
        nextState: LightState.Off,
        description: 'turn off light switch'
      })
      .addState(LightState.Off, {
        on: LightTransition.TurnOn,
        nextState: LightState.On,
        description: 'turn on light switch'
      })
      .build();
    machina.start();

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.on));

    const newState = await machina.transition(machina.state.possibleTransitions[0].on);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  });

  it('Toggle basic test by transition name (string)', async () => {
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
      .buildAndStart();

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.on));

    const newState = await machina.transition(LightTransition.TurnOff);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  });

  it('Toggle basic test by transition name (string)', async () => {
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
      .buildAndStart();

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.on));

    // cannot traverse to "on" it's already "on".
    const newState = await machina.transition(LightTransition.TurnOn);
    assert.strictEqual(null, newState);
  });

  it('Toggle basic test by transition object (add states as arrays)', async () => {
    const machina = createMachina<LightState, LightTransition>(LightState.On)
      .addState(LightState.On, [{
        on: LightTransition.TurnOff,
        nextState: LightState.Off,
        description: 'turn off light switch'
      }])
      .addState(LightState.Off, [{
        on: LightTransition.TurnOn,
        nextState: LightState.On,
        description: 'turn on light switch'
      }])
      .buildAndStart();

    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.on));

    const newState = await machina.transition(LightTransition.TurnOff);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  });
})