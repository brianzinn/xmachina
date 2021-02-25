import assert from 'assert';
import sinon from 'sinon';

import { Machina, NodeState, Transition } from "../src"

describe(' > new Machina(...) tests', () => {
  enum LightState {
    On,
    Off
  };

  enum LightTransition {
    TurnOff,
    TurnOn
  }

  it('new Machine(...) with transitions', async () => {
    const machina = new Machina(LightState.On, new Map<LightState, NodeState<LightState, LightTransition, Transition<LightState, LightTransition>>>([
      [LightState.On,
      {
        outEdges: [{
          on: LightTransition.TurnOff,
          description: 'turn off light',
          nextState: LightState.Off
        }]
      }],
      [LightState.Off, {
        outEdges: [{
          on: LightTransition.TurnOn,
          description: 'turn on light',
          nextState: LightState.On
        }]
      }]
    ]))
    machina.start();
    assert.strictEqual(LightState.On, machina.state.current);
    assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.on));

    const newState = await machina.transition(LightTransition.TurnOff);
    assert.notStrictEqual(null, newState);
    assert.strictEqual(newState!.current, LightState.Off);
  })

  it('new Machine(...) onEnter is called.', async () => {
    const onEnter1 = async () => { console.log('onEnter1')}
    const callbackSpy1 = sinon.spy(onEnter1);

    const onEnter2 = async () => { console.log('onEnter2')}
    const callbackSpy2 = sinon.spy(onEnter2);

    const machina = new Machina(LightState.On, new Map<LightState, NodeState<LightState, LightTransition, Transition<LightState, LightTransition>>>([
      [LightState.On,
      {
        outEdges: [{
          on: LightTransition.TurnOff,
          description: 'turn off light',
          nextState: LightState.Off
        }],
        onEnter: callbackSpy1
      }],
      [LightState.Off, {
        outEdges: [{
          on: LightTransition.TurnOn,
          description: 'turn on light',
          nextState: LightState.On
        }],
        onEnter: callbackSpy2
      }]
    ]))
    machina.start();

    assert.strictEqual(callbackSpy1.callCount, 1, 'should have been called from start().');
    assert.strictEqual(callbackSpy2.callCount, 0, 'should not have been called from start().')

    await machina.transition(LightTransition.TurnOff);

    assert.strictEqual(callbackSpy1.callCount, 1, 'should not trigger again on transition out.');
    assert.strictEqual(callbackSpy2.callCount, 1, 'should have been called when entering "Off".')

    await machina.transition(LightTransition.TurnOn);

    assert.strictEqual(callbackSpy1.callCount, 2, 'should trigger when transitioning back to "On".');
    assert.strictEqual(callbackSpy2.callCount, 1, 'should not have been called when entering "On".')
  })

  it('new Machine(...) onLeave is called.', async () => {
    const onLeave1 = async () => { console.log('onLeave1')}
    const callbackSpy1 = sinon.spy(onLeave1);

    const onLeave2 = async () => { console.log('onLeave2')}
    const callbackSpy2 = sinon.spy(onLeave2);

    const machina = new Machina(LightState.On, new Map<LightState, NodeState<LightState, LightTransition, Transition<LightState, LightTransition>>>([
      [LightState.On,
      {
        outEdges: [{
          on: LightTransition.TurnOff,
          description: 'turn off light',
          nextState: LightState.Off
        }],
        onLeave: callbackSpy1
      }],
      [LightState.Off, {
        outEdges: [{
          on: LightTransition.TurnOn,
          description: 'turn on light',
          nextState: LightState.On
        }],
        onLeave: callbackSpy2
      }]
    ]))
    machina.start();

    assert.strictEqual(callbackSpy1.callCount, 0, 'should not have been called from start().');
    assert.strictEqual(callbackSpy2.callCount, 0, 'should not have been called from start().')

    await machina.transition(LightTransition.TurnOff);

    assert.strictEqual(callbackSpy1.callCount, 1, 'should trigger when leaving "On".');
    assert.strictEqual(callbackSpy2.callCount, 0, 'should not be called until we leave "Off" state.')

    await machina.transition(LightTransition.TurnOn);

    assert.strictEqual(callbackSpy1.callCount, 1, 'should not trigger when we transition from "Off".');
    assert.strictEqual(callbackSpy2.callCount, 1, 'should be called when we leave "Off".')

    await machina.transition(LightTransition.TurnOff);

    assert.strictEqual(callbackSpy1.callCount, 2, 'should trigger when we transition from "On".');
    assert.strictEqual(callbackSpy2.callCount, 1, 'should not be called when we leave "On".')
  })
})