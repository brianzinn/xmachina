import assert from 'assert';
import sinon, { SinonSpy } from 'sinon';

import { createMachina } from '../src/index';

describe(' > createMachina answer phone builder tests', () => {

  beforeEach(async function beforeEach() {
    sinon.spy(console, 'warn');
  });

  afterEach(async function afterEach() {
    (console.warn as SinonSpy).restore();

    sinon.restore();
  })

  enum PhoneState {
    Idle,
    Ringing,
    InCall,
    OnHold,
  };

  enum PhoneEdge {
    IncomingCall,
    AnswerPhone,
    HangUp,
    PutOnHold,
    TakeOffHold
  }

  it('Test a basic phone call is answered (check options) and hang up.', async () => {
    const machina = createMachina<PhoneState, PhoneEdge>(PhoneState.Idle)
      .addState(PhoneState.Idle, {
        edge: PhoneEdge.IncomingCall,
        nextState: PhoneState.Ringing,
        description: 'Incoming call'
      })
      .addState(PhoneState.Ringing, {
        edge: PhoneEdge.AnswerPhone,
        nextState: PhoneState.InCall,
        description: 'answer the incoming phone call'
      })
      .addState(PhoneState.InCall, {
        edge: PhoneEdge.HangUp,
        nextState: PhoneState.Idle,
        description: "End current call"
      }, async () => console.log('ending call'))
      .addState(PhoneState.InCall, {
        edge: PhoneEdge.PutOnHold,
        nextState: PhoneState.OnHold,
        description: "Put current call on hold"
      }, async () => console.log('putting call on hold'))
      .addState(PhoneState.OnHold, [{
        edge: PhoneEdge.TakeOffHold,
        nextState: PhoneState.InCall,
        description: "Stop holding call"
      }, {
        edge: PhoneEdge.HangUp,
        nextState: PhoneState.Idle,
        description: "Hang up call on hold (not nice!)"
      }])
      .build();

    const consoleWarn = console.warn as SinonSpy;
    assert.strictEqual(consoleWarn.callCount, 1, 'console.warn called once');
    assert.deepStrictEqual(consoleWarn.firstCall.args, ["overwriting state '2' onEnter (did you mean to use a transition.onEnter instead)"], 'should have logged a warning when "onEnter" was passed to builder twice');

    assert.strictEqual(PhoneState.Idle, machina.state.current);
    assert.deepStrictEqual([PhoneEdge.IncomingCall], machina.state.possibleTransitions.map(t => t.edge));

    const newState = machina.transition(PhoneEdge.IncomingCall);
    assert.strictEqual(newState!.current, PhoneState.Ringing);

    machina.transition(PhoneEdge.AnswerPhone);
    assert.strictEqual(machina.state.current, PhoneState.InCall);

    assert.deepStrictEqual([PhoneEdge.HangUp, PhoneEdge.PutOnHold], machina.state.possibleTransitions.map(t => t.edge));

    machina.transition(PhoneEdge.HangUp);
    assert.strictEqual(machina.state.current, PhoneState.Idle);
  });
});