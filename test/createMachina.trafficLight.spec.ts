import assert from 'assert';
import sinon, { SinonSpy } from 'sinon';

import { createMachina } from '../src';

describe(' > createMachina traffic light builder tests', () => {
  enum LightState {
    Green,
    Amber,
    Red,
  };

  enum LightTransitions {
    Next
  }

  beforeEach(async function beforeEach() {
    sinon.spy(console, 'log');
    sinon.spy(console, 'error');
  });

  afterEach(async function afterEach() {
    (console.log as SinonSpy).restore();
    (console.error as SinonSpy).restore();

    sinon.restore();
  });

  it('Test traffic light with multiple out edges and onEnter.', async () => {
    const machina = createMachina<LightState, LightTransitions>(LightState.Green)
      .addState(LightState.Green, {
        edge: LightTransitions.Next,
        nextState: LightState.Amber,
        description: 'to amber'
      }, async () => console.log('turning green'))
      .addState(LightState.Amber, {
        edge: LightTransitions.Next,
        nextState: LightState.Red,
        description: 'to red'
      }, async () => console.log('turning amber'))
      .addState(LightState.Red, {
        edge: LightTransitions.Next,
        nextState: LightState.Green,
        description: "to green"
      }, async () => console.log('turning red'))
      .buildAndStart();

    assert.strictEqual(LightState.Green, machina.state.current);
    // todo: put in timers and mock them...
    const logger = console.log as SinonSpy;
    assert.strictEqual(logger.callCount, 1, 'console.log called once');
    assert.deepStrictEqual(logger.firstCall.args, ['turning green'], 'should have logged when green was entered (on init)');

    machina.transition(LightTransitions.Next);
    assert.strictEqual(logger.callCount, 2, 'console.log called twice (once for each transition)');
    assert.deepStrictEqual(logger.secondCall.args, ['turning amber'], 'should have logged when turning amber (from green transition)');
  });
});