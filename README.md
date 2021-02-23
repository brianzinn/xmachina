# xmachina
Simple  Typesafe State Machine.

[![NPM version](http://img.shields.io/npm/v/xmachina.svg?style=flat-square)](https://www.npmjs.com/package/xmachina)
[![Coverage Status](https://coveralls.io/repos/github/brianzinn/xmachina/badge.svg?branch=main)](https://coveralls.io/github/brianzinn/xmachina?branch=main)

A simple state machine that allows working with a typesafe state machine in either node or browser.  Although you can use strings to represent states, also allows numbers/enums.

100% code coverage. Fluent API for building state machines or you can create you own with a Map (and extra edge properties).

Can declare events for onEnter for states as well as per transition.

To include in your project:
```bash
yarn add xmachina
```

| Create a lightswitch that starts out on and then turn it off.
```typescript
enum LightState {
  On,
  Off
};

enum LightTransition {
  TurnOff,
  TurnOn
}

const machina = createMachina<LightState, LightTransition>(LightState.On)
  .addState(LightState.On, {
    edge: LightTransition.TurnOff,
    nextState: LightState.Off,
    description: 'turn off light switch'
  }, async () => console.log('light turned on'))
  .addState(LightState.Off, {
    edge: LightTransition.TurnOn,
    nextState: LightState.On,
    description: 'turn on light switch'
  }, async () => console.log('light turned off'))
  .build();

// before starting you can register for events in a strongly typed manner.
// subscribe to ALL events
const observeEveryting = machina.subscribe((eventData: EventData<LightState | LightTransition>) => console.log('all', eventData));
// subscribe only for the Light is turned on:
machina.subscribe((eventData: EventData<LightState | LightTransition>) => console.log('all', eventData), NotificationType.StateEnter, LightState.On);
// start machine initiates "StateEnter" for the initial configured state.
machina.start();
assert.strictEqual(LightState.On, machina.state.current);
assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.edge));

const newState = machina.trigger(LightTransition.TurnOff);
assert.strictEqual(newState?.current, LightState.Off);
```

The same state machine can be built declaratively without the fluent builder - the declaration is a bit lengthy to allow extending transitions with custom properties/method.:
```typescript
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

```

Name inspired from the movie ex-machina, but a tribute to popular library xstate (did not find machina.js till after - it does not look to be actively maintained).

## TODO:
* add events when leaving State and navigating transitions
* add hierarchy example for state machines