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
    description: 'turn off light switch',
    edge: LightTransition.TurnOff,
    nextState: LightState.Off
  })
  .addState(LightState.Off, {
    description: 'turn on light switch'
    edge: LightTransition.TurnOn,
    nextState: LightState.On
  })
  .build();

// before calling start() you can register for notifications (you can register 'after' start(), but will miss events from before you subscribe)
machina.subscribe((eventData) => console.log(`received: ${eventData.event} -> ${eventData.value.new}`));
// there are optional subscribe parameters that are strongly typed to State/Transition
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

// before calling start() you can register for notifications (you can register 'after' start(), but will miss events from before you subscribe)
machina.subscribe((eventData: EventData<LightState | LightTransition>) => console.log(`received: ${eventData.event} -> ${eventData.value.new}`));
// there are optional subscribe parameters that are strongly typed to State/Transition
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

The code examples don't show the full API, but besides registering for events via pub/sub you can also pass in callbacks for `onEnter`/`onLeave` of State and when `onTransition` is traversed between states.
```javascript
const LightState = {
  On: 'On',
  Off: 'Off',
}

const LightTransition = {
  TurnOff: 'TurnOff',
  TurnOn: 'TurnOn'
}

// with fluent/builder API
const machina = createMachina(LightState.On)
  .addState(LightState.On, {
      description: 'turn off light switch',
      edge: LightTransition.TurnOff,
      nextState: LightState.Off,
      onTransition: async () => console.log('TurnOff transition')
    },
    async () => console.log('Enter "On" state'),
    async () => console.log('Leave "On" state')
  )
  .addState(LightState.Off, {
      description: 'turn on light switch',
      edge: LightTransition.TurnOn,
      nextState: LightState.On,
      onTransition: async () => console.log('TurnOn transition')
    },
    async () => console.log('Enter "Off" state'),
    async () => console.log('Leave "Off" state')
  )
  .buildAndStart();

// with Machina constructor
const machina = new Machina(LightState.On, new Map([
  [LightState.On,
  {
    outEdges: [{
      on: LightTransition.TurnOff,
      description: 'turn off light',
      nextState: LightState.Off,
      onTransition: async () => console.log('TurnOff transition')
    }],
    onEnter: async () => console.log('Enter "On" state'),
    onLeave: async () => console.log('Leave "On" state')
  }],
  [LightState.Off, {
    outEdges: [{
      on: LightTransition.TurnOn,
      description: 'turn on light',
      nextState: LightState.On,
      onTransition: async () => console.log('TurnOn transition')
    }],
    onEnter: async () => console.log('Enter "Off" state'),
    onLeave: async () => console.log('Leave "Off" state')
  }]
]))
machina.start();
```

Name inspired from the movie ex-machina, but a tribute to popular library xstate (did not find machina.js till after - it does not look to be actively maintained).
Why create a new library when there was already so many alternatives?
1. :white_check_mark: small footprint ~40kB NPM (includes maps and typings)
2. :white_check_mark: allow enumerations/numbers as first class citizens (not just strings)
3. :white_check_mark: strong typing without forcing strings values on transitions
4. :white_check_mark: easy pub/sub that supports subscriptions optionally with filters at subscription time
5. :white_check_mark: async transitions. can choose to just call or await/handle promise
6. :white_check_mark: nested hierarchies

The library is intentionally minimalistic.  It is intentional that application state is managed outside of the state machine - will be showing examples of that in the recipes.

## TODO:
* add api/recipes page

[live react 3D demo](https://brianzinn.github.io/xmachina-semaforo/)

Made with ♥ by Brian Zinn
