import assert from 'assert';
import { createMachina } from '../src';

describe(' > createMachina light switch builder tests', () => {
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
      })
      .addState(PhoneState.InCall, {
        edge: PhoneEdge.PutOnHold,
        nextState: PhoneState.OnHold,
        description: "Put current call on hold"
      })
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

    assert.strictEqual(PhoneState.Idle, machina.state.current);
    assert.deepStrictEqual([PhoneEdge.IncomingCall], machina.state.possibleTransitions.map(t => t.edge));

    const newState = machina.trigger(PhoneEdge.IncomingCall);
    assert.strictEqual(newState!.current, PhoneState.Ringing);

    machina.trigger(PhoneEdge.AnswerPhone);
    assert.strictEqual(machina.state.current, PhoneState.InCall);

    assert.deepStrictEqual([PhoneEdge.HangUp, PhoneEdge.PutOnHold], machina.state.possibleTransitions.map(t => t.edge));

    machina.trigger(PhoneEdge.HangUp);
    assert.strictEqual(machina.state.current, PhoneState.Idle);
  });
});