import assert from 'assert';
import { on } from 'events';
import sinon from 'sinon';

import { Machina, MachinaBuilder, NodeState, Transition } from "../src"
import { EventData } from '../src/subscriptions/EventData';
import { NotificationType } from '../src/subscriptions/NotificationType';

describe(' > new Machina(...) tests', () => {
  enum LightState {
    On,
    Off
  };

  enum LightTransition {
    TurnOff,
    TurnOn
  }

  it('new Machine(...) with 2 states', async () => {
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

  it('new Machine(...) onEnter is called.', async () => {
    const onTransition1 = async () => { console.log('onTransition1')}
    const callbackSpy1 = sinon.spy(onTransition1);

    const onTransition2 = async () => { console.log('onTransition2')}
    const callbackSpy2 = sinon.spy(onTransition2);

    const machina = new Machina(LightState.On, new Map<LightState, NodeState<LightState, LightTransition, Transition<LightState, LightTransition>>>([
      [LightState.On,
      {
        outEdges: [{
          on: LightTransition.TurnOff,
          description: 'turn off light',
          nextState: LightState.Off,
          onTransition: callbackSpy1
        }],
        onEnter: async () => console.log('Enter "Off" state'),
        onLeave: async () => console.log('Leave "Off" state')
      }],
      [LightState.Off, {
        outEdges: [{
          on: LightTransition.TurnOn,
          description: 'turn on light',
          nextState: LightState.On,
          onTransition: callbackSpy2
        }]
      }]
    ]))
    machina.start();

    assert.strictEqual(callbackSpy1.callCount, 0, 'should not have been called from start().');
    assert.strictEqual(callbackSpy2.callCount, 0, 'should not have been called from start().')

    await machina.transition(LightTransition.TurnOff);

    assert.strictEqual(callbackSpy1.callCount, 1, 'should have been called from "TurnOff" transition.');
    assert.strictEqual(callbackSpy2.callCount, 0, 'should still be zero (TurnOn transition has not been followed).')

    await machina.transition(LightTransition.TurnOn);

    assert.strictEqual(callbackSpy1.callCount, 1, 'should still be at 1.');
    assert.strictEqual(callbackSpy2.callCount, 1, 'should have been called from "TurnOn" transition.')
  })

  it('new Machine(...) self transition receives all events.', async () => {
    enum StateSelf {
      On = "On",
      Off = "Off"
    }

    enum TransitionSelf {
      TurnOn = "TurnOn",
      /**
       * this means switch "on" when it's already "on"
       */
      TurnOnAgain = "TurnOnAgain",
      TurnOff = "TurnOff"
    }

    const machina = new Machina(StateSelf.On, new Map<StateSelf, NodeState<StateSelf, TransitionSelf, Transition<StateSelf, TransitionSelf>>>([
      [StateSelf.On,
      {
        outEdges: [{
          on: TransitionSelf.TurnOff,
          description: 'turn off light',
          nextState: StateSelf.Off
        }, {
          on: TransitionSelf.TurnOnAgain,
          description: 'turn on an already on light',
          nextState: StateSelf.On
        }]
      }],
      [StateSelf.Off, {
        outEdges: [{
          on: TransitionSelf.TurnOn,
          description: 'turn on light',
          nextState: StateSelf.On
        }]
      }]
    ]))
    const eventCallback = async (eventData: EventData<StateSelf | TransitionSelf>) => {
      console.log(`received event "${eventData.event}" ${eventData.value.old} --> ${eventData.value.new}`);
    };

    const eventCallbackSpy = sinon.spy(eventCallback);

    machina.subscribe(eventCallbackSpy);
    machina.start();

    assert.strictEqual(eventCallbackSpy.callCount, 1, 'should have been called from start() for init state enter.');
    const expectedFirstCall: EventData<StateSelf> = {
      "event": "StateEnter",
      "notificationType": NotificationType.StateEnter,
      "value": {
        "new": StateSelf.On,
        "old": null
      }
    };
    assert.deepStrictEqual(eventCallbackSpy.firstCall.args[0], expectedFirstCall , 'first call args should match (not testing middleware context)');

    await machina.transition(TransitionSelf.TurnOnAgain);
    assert.strictEqual(eventCallbackSpy.callCount, 4, 'Should now have left state, transitioned and entered the new state.');
    const expectedSecondCall: EventData<StateSelf> = {
      "event": "StateLeave",
      "notificationType": NotificationType.StateLeave,
      "value": {
        "new": StateSelf.On,
        "old": StateSelf.On
      }
    };
    assert.deepStrictEqual(eventCallbackSpy.secondCall.args[0], expectedSecondCall , 'second call args should match (not testing middleware context)');

    const expectedThirdCall: EventData<TransitionSelf> = {
      "event": "Transition",
      "notificationType": NotificationType.Transition,
      "value": {
        "new": TransitionSelf.TurnOnAgain,
        "old": null
      }
    };
    assert.deepStrictEqual(eventCallbackSpy.thirdCall.args[0], expectedThirdCall , 'third call args should match (not testing middleware context)');

    const expectedFourthCall: EventData<StateSelf> = {
      "event": "StateEnter",
      "notificationType": NotificationType.StateEnter,
      "value": {
        "new": StateSelf.On,
        "old": StateSelf.On
      }
    };
    assert.deepStrictEqual(eventCallbackSpy.getCalls()[3].args[0], expectedFourthCall , 'fourth call args should match (not testing middleware context)');
  })

  it('new Machine(...) self transition receives only State events.', async () => {
    enum StateSelf {
      On = "On",
      Off = "Off"
    }

    enum TransitionSelf {
      TurnOn = "TurnOn",
      /**
       * this means switch "on" when it's already "on"
       */
      TurnOnAgain = "TurnOnAgain",
      TurnOff = "TurnOff"
    }

    const machina = new Machina(StateSelf.On, new Map<StateSelf, NodeState<StateSelf, TransitionSelf, Transition<StateSelf, TransitionSelf>>>([
      [StateSelf.On,
      {
        outEdges: [{
          on: TransitionSelf.TurnOff,
          description: 'turn off light',
          nextState: StateSelf.Off
        }, {
          on: TransitionSelf.TurnOnAgain,
          description: 'turn on an already on light',
          nextState: StateSelf.On
        }]
      }],
      [StateSelf.Off, {
        outEdges: [{
          on: TransitionSelf.TurnOn,
          description: 'turn on light',
          nextState: StateSelf.On
        }]
      }]
    ]))
    const eventCallback = async (eventData: EventData<StateSelf | TransitionSelf>) => {
      console.log(`received event "${eventData.event}" ${eventData.value.old} --> ${eventData.value.new}`);
    };

    const eventCallbackSpy = sinon.spy(eventCallback);

    machina.subscribe(eventCallbackSpy, NotificationType.StateEnter | NotificationType.StateLeave);
    machina.start();

    assert.strictEqual(eventCallbackSpy.callCount, 1, 'should have been called from start() for init state enter.');
    const expectedFirstCall: EventData<StateSelf> = {
      "event": "StateEnter",
      "notificationType": NotificationType.StateEnter,
      "value": {
        "new": StateSelf.On,
        "old": null
      }
    };
    assert.deepStrictEqual(eventCallbackSpy.firstCall.args[0], expectedFirstCall , 'first call args should match (not testing middleware context)');

    await machina.transition(TransitionSelf.TurnOnAgain);
    assert.strictEqual(eventCallbackSpy.callCount, 3, 'Should now have left state, transitioned and entered the new state.');
    const expectedSecondCall: EventData<StateSelf> = {
      "event": "StateLeave",
      "notificationType": NotificationType.StateLeave,
      "value": {
        "new": StateSelf.On,
        "old": StateSelf.On
      }
    };
    assert.deepStrictEqual(eventCallbackSpy.secondCall.args[0], expectedSecondCall , 'second call args should match (not testing middleware context)');

    const expectedThirdCall: EventData<StateSelf> = {
      "event": "StateEnter",
      "notificationType": NotificationType.StateEnter,
      "value": {
        "new": StateSelf.On,
        "old": StateSelf.On
      }
    };
    assert.deepStrictEqual(eventCallbackSpy.thirdCall.args[0], expectedThirdCall , 'third call args should match (not testing middleware context)');
  })
})