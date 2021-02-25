import assert from 'assert';
import sinon from 'sinon';

import { createMachina } from '../src';
import { EventData } from '../src/subscriptions/EventData';
import { EventState } from '../src/subscriptions/EventState';
import { NotificationType } from '../src/subscriptions/NotificationType';
import { Observer } from '../src/subscriptions/Observer';

describe(' > test subscribe/unsubscribe and event notification/value filtering.', () => {
  enum LightState {
    On = "On",
    Off = "Off"
  };

  enum LightTransition {
    TurnOff = "TurnOff",
    TurnOn = "TurnOn"
  }

  beforeEach(async function beforeEach() {
  });

  afterEach(async function afterEach() {
    sinon.restore();
  })

  it('Test basic transition', async () => {
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

    const callback = (eventData: EventData<LightState | LightTransition>) => {
      console.log('callback called');
    }
    const callbackSpy = sinon.spy(callback);
    machina.subscribe(callbackSpy)
    machina.start();

    assert.strictEqual(callbackSpy.callCount, 1);
    assert.deepStrictEqual(callbackSpy.firstCall.args, [{
      event: 'StateEnter',
      notificationType: NotificationType.StateEnter,
      value: {
        old: null,
        new: LightState.On
      }
    }, {
      skipNextObservers: false
    }]);
  });

  it('Transition with multiple observers and unsubscribes completing from event queue.', (done: (err?: any) => void) => {
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

    const callback = (eventData: EventData<LightState | LightTransition>) => {
      console.log(`callback received: ${eventData.event} => ${eventData.value.new}`);
    }
    const callbackSpy = sinon.spy(callback);
    const observer = machina.subscribe(callbackSpy);
    assert.notStrictEqual(null, observer, "If observer is NULL we are not subscribed.");
    machina.start();

    assert.strictEqual(callbackSpy.callCount, 1, 'should have been called one (from start)');
    assert.deepStrictEqual(callbackSpy.firstCall.args, [{
      event: 'StateEnter',
      notificationType: NotificationType.StateEnter,
      value: {
        new: LightState.On,
        old: null
      }
    }, {
      skipNextObservers: false
    }]);

    machina.transition(LightTransition.TurnOff).then(() => {
      machina.transition(LightTransition.TurnOn).then(() => {
        assert.strictEqual(5, callbackSpy.callCount, 'should have been called 5 times now. 1 x enter. 2 x exit. 2 x enter');

        const unsubscribed = machina.unsubscribe(observer!);
        assert.ok(unsubscribed, "expecting unsubscribe to return 'true' to indicate successful unsubscribe.");
        setTimeout(() => {
          // setTimeout allows the deferred unsubscribe to occur.
          machina.transition(LightTransition.TurnOff).then(() => {
            machina.transition(LightTransition.TurnOn).then(() => {
              try {
                assert.strictEqual(5, callbackSpy.callCount, 'should still be 5, since we are unsubscribed now');
                done();
              } catch (e) {
                done(e);
              }
            })
          });
        }, 1);
      });
    });
  });

  it('Transition with multiple observers and multiple unsubscribes (of same observer) completing from event queue.', async () => {
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

    const callback = (eventData: EventData<LightState | LightTransition>) => {
      console.log(`callback received: ${eventData.event} => ${eventData.value.new}`);
    }
    const callbackSpy = sinon.spy(callback);
    const observer = machina.subscribe(callbackSpy);
    assert.notStrictEqual(null, observer, "If observer is NULL we are not subscribed.");
    machina.start();

    assert.strictEqual(callbackSpy.callCount, 1, 'should have been called one (from start)');
    assert.deepStrictEqual(callbackSpy.firstCall.args, [{
      event: 'StateEnter',
      notificationType: NotificationType.StateEnter,
      value: {
        new: LightState.On,
        old: null
      }
    }, {
      skipNextObservers: false
    }]);

    await machina.transition(LightTransition.TurnOff);
    await machina.transition(LightTransition.TurnOn);

    assert.strictEqual(5, callbackSpy.callCount, 'should have been called 5 times now (3 times enter, twice leave)');

    const unsubscribed1 = machina.unsubscribe(observer!);
    assert.ok(unsubscribed1, "expecting unsubscribe to return 'true' to indicate successful unsubscribe.");

    const unsubscribed2 = machina.unsubscribe(observer!);
    assert.ok(unsubscribed2, "expecting unsubscribe to return 'true' to indicate successful unsubscribe.");

    assert.strictEqual(5, callbackSpy.callCount, 'should still be 5, since we are unsubscribed now');
    await machina.transition(LightTransition.TurnOff);
    await machina.transition(LightTransition.TurnOn);
    assert.strictEqual(5, callbackSpy.callCount, 'should still be 5, since we are unsubscribed now');
  });

  it('insertFirst not used has multiple subscribers - should be called in the order they are added.', async () => {
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

    const callback1 = (eventData) => console.log(`callback received: ${eventData.event} => ${eventData.value.new}`);
    const callback2 = (eventData) => console.log(`callback received: ${eventData.event} => ${eventData.value.new}`);

    const callbackSpy1 = sinon.spy(callback1);
    const observer1 = machina.subscribe(callbackSpy1);
    assert.notStrictEqual(null, observer1, "If observer is NULL we are not subscribed.");

    const callbackSpy2 = sinon.spy(callback2);
    const observer2 = machina.subscribe(callbackSpy2);
    assert.notStrictEqual(null, observer2, "If observer is NULL we are not subscribed.");
    machina.start();

    assert.strictEqual(callbackSpy1.callCount, 1, 'should have been called one (from start)');
    assert.deepStrictEqual(callbackSpy1.firstCall.args, [{
      event: 'StateEnter',
      notificationType: NotificationType.StateEnter,
      value: {
        new: LightState.On,
        old: null
      }
    }, {
      skipNextObservers: false
    }]);

    assert.strictEqual(callbackSpy2.callCount, 1, 'should have been called one (from start)');
    assert.deepStrictEqual(callbackSpy2.firstCall.args, [{
      event: 'StateEnter',
      notificationType: NotificationType.StateEnter,
      value: {
        new: LightState.On,
        old: null
      }
    }, {
      skipNextObservers: false
    }]);

    assert.ok(callbackSpy1.calledBefore(callbackSpy2), "callback 2 should be called first");
  });

  it('insertFirst IS used has multiple subscribers - insertFirst should be called before the other previously subscribed observers.', async () => {
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

    const callback1 = (eventData: EventData<LightState | LightTransition>) => {
      console.log(`callback received: ${eventData.event} => ${eventData.value.new}`);
    }
    const callback2 = (eventData: EventData<LightState | LightTransition>) => {
      console.log(`callback received: ${eventData.event} => ${eventData.value.new}`);
    }
    const callbackSpy1 = sinon.spy(callback1);
    const observer1 = machina.subscribe(callbackSpy1);
    assert.notStrictEqual(null, observer1, "If observer is NULL we are not subscribed.");

    const callbackSpy2 = sinon.spy(callback2);
    const observer2 = machina.subscribe(callbackSpy2, undefined, undefined, true);
    assert.notStrictEqual(null, observer2, "If observer is NULL we are not subscribed.");
    machina.start();

    assert.strictEqual(callbackSpy1.callCount, 1, 'should have been called one (from start)');
    assert.deepStrictEqual(callbackSpy1.firstCall.args, [{
      event: 'StateEnter',
      notificationType: NotificationType.StateEnter,
      value: {
        new: LightState.On,
        old: null
      }
    }, {
      skipNextObservers: false
    }]);

    assert.strictEqual(callbackSpy2.callCount, 1, 'should have been called one (from start)');
    assert.deepStrictEqual(callbackSpy2.firstCall.args, [{
      event: 'StateEnter',
      notificationType: NotificationType.StateEnter,
      value: {
        new: LightState.On,
        old: null
      }
    }, {
      skipNextObservers: false
    }]);

    assert.ok(callbackSpy2.calledBefore(callbackSpy1), "callback 2 should be called first");
  });

  it('basic test unsubscribe observer without timeout (ensure unregistered are not notified).', async () => {
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

    const callback = (eventData: EventData<LightState | LightTransition>) => {
      console.log(`callback received: ${eventData.event} => ${eventData.value.new}`);
    }
    const callbackSpy = sinon.spy(callback);
    const observer = machina.subscribe(callbackSpy);
    assert.notStrictEqual(null, observer, "If observer is NULL we are not subscribed.");
    machina.start();

    assert.strictEqual(callbackSpy.callCount, 1, 'should have been called one (from start)');
    assert.deepStrictEqual(callbackSpy.firstCall.args, [{
      event: 'StateEnter',
      notificationType: NotificationType.StateEnter,
      value: {
        new: LightState.On,
        old: null
      }
    }, {
      skipNextObservers: false
    }]);

    await machina.transition(LightTransition.TurnOff);
    await machina.transition(LightTransition.TurnOn);

    assert.strictEqual(5, callbackSpy.callCount, 'should have been called 5 times now (enter, leave, enter, leave, enter)');

    const unsubscribed = machina.unsubscribe(observer);
    assert.ok(unsubscribed, "expecting unsubscribe to return 'true' to indicate successful unsubscribe.");

    await machina.transition(LightTransition.TurnOff);
    await machina.transition(LightTransition.TurnOn);
    assert.strictEqual(5, callbackSpy.callCount, 'should still be 5, since we are unsubscribed now');
  });

  it('unsubscribe callback without timeout (ensure unregistered are not notified).', async () => {
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

    const callback1 = (eventData) => console.log(`callback1received: ${eventData.event} => ${eventData.value.new}`);
    const callback1Spy = sinon.spy(callback1);
    machina.subscribe(callback1Spy);

    const callback2 = (eventData) => console.log(`callback received: ${eventData.event} => ${eventData.value.new}`);
    const callback2Spy = sinon.spy(callback2);
    machina.subscribe(callback2Spy);

    machina.start();

    assert.strictEqual(callback1Spy.callCount, 1, 'should have been called one (from start)');
    assert.strictEqual(callback2Spy.callCount, 1, 'should have been called two (from start)');

    await machina.transition(LightTransition.TurnOff);
    await machina.transition(LightTransition.TurnOn);

    assert.strictEqual(5, callback1Spy.callCount, 'should have been called 5 times now (enter, leave, enter, leave, enter)');
    assert.strictEqual(5, callback2Spy.callCount, 'should have been called 5 times now (enter, leave, enter, leave, enter)');

    const unsubscribed = machina.unsubscribeCallback(callback2Spy);
    assert.ok(unsubscribed, "expecting unsubscribe to return 'true' to indicate successful unsubscribe.");

    await machina.transition(LightTransition.TurnOff);
    await machina.transition(LightTransition.TurnOn);
    assert.strictEqual(9, callback1Spy.callCount, 'should be 9 (still subscribed) --  (enter, leave, enter, leave, enter, leave, enter, leave, enter)');
    assert.strictEqual(5, callback2Spy.callCount, 'should still be 5, since we are unsubscribed now --  (enter, leave, enter, leave, enter)');
  });

  it('unsubscribe callback that is not registered will return false.', async () => {
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

    const callback1 = (eventData) => console.log(`callback received: ${eventData.event} => ${eventData.value.old}->${eventData.value.new}`);
    const callback1Spy = sinon.spy(callback1);
    machina.subscribe(callback1Spy);

    machina.start();

    assert.strictEqual(callback1Spy.callCount, 1, 'should have been called one (from start)');

    await machina.transition(LightTransition.TurnOff);
    await machina.transition(LightTransition.TurnOn);

    assert.strictEqual(5, callback1Spy.callCount, 'should have been called 5 times now  (enter, leave, enter, leave, enter)');

    const unsubscribed = machina.unsubscribeCallback(null as any as (eventData: EventData<LightState | LightTransition>, eventState: EventState) => void);
    assert.strictEqual(unsubscribed, false, "expecting unsubscribe to return 'false' to indicate unsuccessful unsubscribe.");

    await machina.transition(LightTransition.TurnOff);
    await machina.transition(LightTransition.TurnOn);
    assert.strictEqual(9, callback1Spy.callCount, 'should be 9 (still subscribed) -- (enter, leave, enter, leave, enter, leave, enter, enter, leave)');
  });

  it('Subscribe for single notification should only notify once.', async () => {
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

    const callback = (eventData: EventData<LightState | LightTransition>) => {
      console.log(`callback received: ${eventData.event} => ${eventData.value.new}`);
    }
    const callbackSpy = sinon.spy(callback);
    const observer = machina.subscribe(callbackSpy, undefined, undefined, undefined, true);
    assert.notStrictEqual(null, observer, "If observer is NULL we are not subscribed.");
    machina.start();

    assert.strictEqual(callbackSpy.callCount, 1, 'should have been called once (from start)');
    assert.deepStrictEqual(callbackSpy.firstCall.args, [{
      event: 'StateEnter',
      notificationType: NotificationType.StateEnter,
      value: {
        new: LightState.On,
        old: null
      }
    }, {
      skipNextObservers: false
    }]);

    await machina.transition(LightTransition.TurnOff);
    await machina.transition(LightTransition.TurnOn);

    assert.strictEqual(1, callbackSpy.callCount, 'should have been called once only');
  });

  it('setting skipNextObservers should mean they are not notified.', async () => {
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

    const callback1 = (eventData: EventData<LightState | LightTransition>, eventState: EventState) => {
      eventState.skipNextObservers = true;
    }
    const callback2 = (eventData: EventData<LightState | LightTransition>) => {
      console.log(`callback2 received: ${eventData.event} => ${eventData.value.new}`);
    }
    const callbackSpy1 = sinon.spy(callback1);
    const observer1 = machina.subscribe(callbackSpy1);
    assert.notStrictEqual(null, observer1, "If observer is NULL we are not subscribed.");

    const callbackSpy2 = sinon.spy(callback2);
    const observer2 = machina.subscribe(callbackSpy2);
    assert.notStrictEqual(null, observer2, "If observer is NULL we are not subscribed.");
    machina.start();

    assert.strictEqual(callbackSpy1.callCount, 1, 'should have been called one (from start) and it sets skipNextObservers to true');
    assert.strictEqual(callbackSpy2.callCount, 0, 'should have been called, since skipNextObservers was set from first subscribed');
  });

  it('Subscribe missing callback should return null.', async () => {
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

    const observer = machina.subscribe(null as any as () => {});
    assert.strictEqual(observer, null, 'should be NULL when no observer created.');
  });

  it('Unsubscribe for falsey value should return false', () => {
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

    const wasUnsubscribed = machina.unsubscribe(null as any as Observer<LightState, LightTransition>);
    assert.strictEqual(wasUnsubscribed, false, 'should return "false" when no observer created.');
  })

  it('Unsubscribe for non-existant observer returns not successful', () => {
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

    const wasUnsubscribed = machina.unsubscribe({} as any as Observer<LightState, LightTransition>);
    assert.strictEqual(wasUnsubscribed, false, 'should return "false" when no observer created.');
  })

  it('Subscription with NotificationType and State filter on', async () => {
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

    const callback = (eventData) => console.log(`callback received: ${eventData.event} => ${eventData.value.new}`);
    const callbackSpy = sinon.spy(callback);
    machina.subscribe(callbackSpy, NotificationType.StateEnter, LightState.On, false, false);
    machina.start();

    // initial state entered from 'start'
    assert.strictEqual(callbackSpy.callCount, 1);

    await machina.transition(LightTransition.TurnOff);
    assert.strictEqual(callbackSpy.callCount, 1);

    await machina.transition(LightTransition.TurnOn);
    assert.strictEqual(callbackSpy.callCount, 2);
  });

})