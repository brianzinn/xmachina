import assert from 'assert';
import sinon, { SinonSpy } from 'sinon';

import { createMachina } from '../src/index';

describe(' > createMachina multiple transitions from single state and duplicate callback declarations', () => {

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

  it('Adding onEnter for a state multiple times generates a warning.', async () => {
    createMachina<PhoneState, PhoneEdge>(PhoneState.Idle)
      .addState(PhoneState.Idle, {
        on: PhoneEdge.IncomingCall,
        nextState: PhoneState.Ringing,
        description: 'Incoming call'
      })
      .addState(PhoneState.Ringing, {
        on: PhoneEdge.AnswerPhone,
        nextState: PhoneState.InCall,
        description: 'answer the incoming phone call'
      })
      .addState(PhoneState.InCall, {
        on: PhoneEdge.HangUp,
        nextState: PhoneState.Idle,
        description: "End current call"
      }, async () => console.log('in call'))
      .addState(PhoneState.InCall, {
        on: PhoneEdge.PutOnHold,
        nextState: PhoneState.OnHold,
        description: "Put current call on hold"
      }, async () => console.log('in call'))
      .addState(PhoneState.OnHold, [{
        on: PhoneEdge.TakeOffHold,
        nextState: PhoneState.InCall,
        description: "Stop holding call"
      }, {
        on: PhoneEdge.HangUp,
        nextState: PhoneState.Idle,
        description: "Hang up call on hold (not nice!)"
      }])
      .buildAndStart();

    const consoleWarn = console.warn as SinonSpy;
    assert.strictEqual(consoleWarn.callCount, 1, 'console.warn called once');
    assert.deepStrictEqual(consoleWarn.firstCall.args, ["overwriting state '2' onEnter (did you mean to use a transition callback instead?)"], 'should have logged a warning when "onEnter" was passed to builder twice');
  });

  it('Adding onLeave for a state multiple times generates a warning.', async () => {
    createMachina<PhoneState, PhoneEdge>(PhoneState.Idle)
      .addState(PhoneState.Idle, {
        on: PhoneEdge.IncomingCall,
        nextState: PhoneState.Ringing,
        description: 'Incoming call'
      })
      .addState(PhoneState.Ringing, {
        on: PhoneEdge.AnswerPhone,
        nextState: PhoneState.InCall,
        description: 'answer the incoming phone call'
      })
      .addState(PhoneState.InCall, {
          on: PhoneEdge.HangUp,
          nextState: PhoneState.Idle,
          description: "End current call"
        },
        undefined,
        async () => console.log('not "in call"')
      )
      .addState(PhoneState.InCall, {
          on: PhoneEdge.PutOnHold,
          nextState: PhoneState.OnHold,
          description: "Put current call on hold"
        },
        undefined,
        async () => console.log('not "in call"')
      )
      .addState(PhoneState.OnHold, [{
        on: PhoneEdge.TakeOffHold,
        nextState: PhoneState.InCall,
        description: "Stop holding call"
      }, {
        on: PhoneEdge.HangUp,
        nextState: PhoneState.Idle,
        description: "Hang up call on hold (not nice!)"
      }])
      .buildAndStart();

    const consoleWarn = console.warn as SinonSpy;
    assert.strictEqual(consoleWarn.callCount, 1, 'console.warn called once');
    assert.deepStrictEqual(consoleWarn.firstCall.args, ["overwriting state '2' onLeave (did you mean to use a transition callback instead?)"], 'should have logged a warning when "onLeave" was passed to builder twice');
  });

  it('Multiple out transitions are reported states are available.', async () => {
    const machina = createMachina<PhoneState, PhoneEdge>(PhoneState.Idle)
      .addState(PhoneState.Idle, {
        on: PhoneEdge.IncomingCall,
        nextState: PhoneState.Ringing,
        description: 'Incoming call'
      })
      .addState(PhoneState.Ringing, {
        on: PhoneEdge.AnswerPhone,
        nextState: PhoneState.InCall,
        description: 'answer the incoming phone call'
      })
      .addState(PhoneState.InCall, {
        on: PhoneEdge.HangUp,
        nextState: PhoneState.Idle,
        description: "End current call"
      })
      .addState(PhoneState.InCall, {
        on: PhoneEdge.PutOnHold,
        nextState: PhoneState.OnHold,
        description: "Put current call on hold"
      })
      .addState(PhoneState.OnHold, [{
        on: PhoneEdge.TakeOffHold,
        nextState: PhoneState.InCall,
        description: "Stop holding call"
      }, {
        on: PhoneEdge.HangUp,
        nextState: PhoneState.Idle,
        description: "Hang up call on hold (not nice!)"
      }])
      .buildAndStart();

    assert.strictEqual(PhoneState.Idle, machina.state.current);
    assert.deepStrictEqual([PhoneEdge.IncomingCall], machina.state.possibleTransitions.map(t => t.on));

    const newState = await machina.transition(PhoneEdge.IncomingCall);
    assert.strictEqual(newState!.current, PhoneState.Ringing);

    await machina.transition(PhoneEdge.AnswerPhone);
    assert.strictEqual(machina.state.current, PhoneState.InCall, 'expecting current state to be InCall');

    assert.deepStrictEqual([PhoneEdge.HangUp, PhoneEdge.PutOnHold], machina.state.possibleTransitions.map(t => t.on));

    await machina.transition(PhoneEdge.HangUp);
    assert.strictEqual(machina.state.current, PhoneState.Idle);
  });

});