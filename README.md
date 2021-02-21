# xmachina
Simple  Typesafe State Machine.

name inspired from the movie ex-machina.
[![NPM version](http://img.shields.io/npm/v/xmachina.svg?style=flat-square)](https://www.npmjs.com/package/xmachina)
[![Coverage Status](https://coveralls.io/repos/github/brianzinn/xmachina/badge.svg?branch=main)](https://coveralls.io/github/brianzinn/xmachina?branch=main)

Just a simple state machine that allows working with a typesafe state machine.  Although you can use strings to represent states, also allows numbers/enums.

100% code coverage. Fluent API for building state machines or you can create you own with a Map (and extra edge properties).

To include in your project:
```bash
yarn add xmachina
```

| Create a lightswitch that starts out on - turn it off.
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
  })
  .addState(LightState.Off, {
    edge: LightTransition.TurnOn,
    nextState: LightState.On,
    description: 'turn on light switch'
  })
  .build();

assert.strictEqual(LightState.On, machina.state.current);
assert.deepStrictEqual([LightTransition.TurnOff], machina.state.possibleTransitions.map(t => t.edge));

const newState = machina.trigger(LightTransition.TurnOff);
assert.notStrictEqual(null, newState);
assert.strictEqual(newState!.current, LightState.Off);
```

## TODO:
* add observables/events