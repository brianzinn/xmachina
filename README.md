# xmachina
Simple State Machine - Small footprint - no dependencies.  Easy to create and includes built-in optional event subscriptions.

[![NPM version](http://img.shields.io/npm/v/xmachina.svg?style=flat-square)](https://www.npmjs.com/package/xmachina)
[![Coverage Status](https://coveralls.io/repos/github/brianzinn/xmachina/badge.svg?branch=main)](https://coveralls.io/github/brianzinn/xmachina?branch=main)

Allows working with a typesafe state machine in either node or browser.  Although you can use strings to represent states, also allows numbers/enums.  Pub/sub mechanism for events is also typesafe.

100% code coverage. Fluent API for building state machines or you can create you own with a Map (and extra edge properties by extending `Transition`).

Can declare callbacks for `onEnter` and `onLeave` for states as well as per transition, but the powerful subscription mechanism makes it easy to track all state/transition changes.

To include in your project:
```bash
yarn add xmachina
```

| Create a lightswitch that starts out on and then turn it off.
```typescript
const LightState = {
  On: 'On',
  Off: 'Off',
}

const LightTransition = {
  TurnOff: 'TurnOff',
  TurnOn: 'TurnOn'
}

const machina = createMachina(LightState.On)
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

// before starting you can register for events in a strongly typed manner.
// subscribe to ALL events
const observeEveryting = machina.subscribe((eventData) => console.log(`all: ${eventData.}`, eventData));
// there are optional subscribe parameters
machina.subscribe((eventData) => console.log(`received: ${eventData.event} -> ${eventData.value.new}`));
// you can filter the subscriptions you will receive by state/transition only and optionally by a single value.
machina.subscribe((eventData) => console.log(`single: ${eventData.event} -> ${eventData.value.new}`), NotificationType.StateEnter, LightState.On);
machina.start();
// all: StateEnter -> On
// single: StateEnter -> On
const newState = machina.trigger(LightTransition.TurnOff);
// all: StateEnter -> Off
```

<details>
  <summary>same example from :arrow_up: in TypeScript</summary>

```typescript
// string enums are optional - supports all enum types
enum LightState {
  On = 'On',
  Off = 'Off'
};

enum LightTransition {
  TurnOff = 'TurnOff',
  TurnOn = 'TurnOn'
}

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

// before starting you can register for events in a strongly typed manner.
// subscribe to ALL events
const observeEveryting = machina.subscribe((eventData: EventData<LightState | LightTransition>) => console.log(`all: ${eventData.}`, eventData));
// there are optional subscribe parameters
machina.subscribe((eventData: EventData<LightState | LightTransition>) => console.log(`received: ${eventData.event} -> ${eventData.value.new}`));
machina.subscribe((eventData: EventData<LightState | LightTransition>) => console.log(`single: ${eventData.event} -> ${eventData.value.new}`), NotificationType.StateEnter, LightState.On);
machina.start();
// all: StateEnter -> On
// single: StateEnter -> On
const newState = machina.trigger(LightTransition.TurnOff);
// all: StateEnter -> Off
```
</details>

---

The same state machine can be built declaratively without the fluent builder - the declaration is a bit lengthy to allow extending transitions with custom properties/method.:
```typescript
const machina = new Machina(LightState.On, new Map([
  [LightState.On,
  {
    outEdges: [{
      description: 'turn off light',
      nextState: LightState.Off,
      on: LightEdge.TurnOff
    }]
  }],
  [LightState.Off, {
    outEdges: [{
      description: 'turn on light',
      nextState: LightState.On,
      on: LightEdge.TurnOn
    }]
  }]
]))
```

<details>
  <summary>same example from :arrow_up: in TypeScript</summary>

```typescript
const machina = new Machina(LightState.On, new Map<LightState, NodeState<LightState, LightEdge, Transition<LightState, LightEdge>>>([
  [LightState.On,
  {
    outEdges: [{
      description: 'turn off light',
      nextState: LightState.Off,
      on: LightEdge.TurnOff
    }]
  }],
  [LightState.Off, {
    outEdges: [{
      description: 'turn on light',
      nextState: LightState.On,
      on: LightEdge.TurnOn
    }]
  }]
]))
```
</details>

---

Name inspired from the movie ex-machina, but a tribute to popular library xstate (did not find machina.js till after - it does not look to be actively maintained).
Why create a new library when there was already so many alternatives?
1. :white_check_mark: small footprint 38kB (xstate is 682 kB)
2. :white_check_mark: allow enumerations/numbers as first class citizens (not just strings)
3. :white_check_mark: strong typing without forcing strings values on transitions
4. :white_check_mark: easy pub/sub that supports subscriptions optionally with filters at subscription time
5. :white_check_mark: async transitions. can choose to just call or await/handle promise

## TODO:
* add events when navigating transitions
* add hierarchy example for state machines