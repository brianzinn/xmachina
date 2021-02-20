# xmachina
Simple  Typesafe State Machine.

name inspired from the movie ex-machina.

Just a simple state machine that allows working with a typesafe state machine.  Although you can use strings to represent states, also allows numbers/enums.

Has a fluent API for building state machines or you can create you own with a Map.

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

const machina = createMachina<LightState, Transition<LightState>>(LightState.On)
  .addState(LightState.On, {
    name: 'off',
    nextState: LightState.Off,
    description: 'turn off light switch'
  })
  .addState(LightState.Off, {
    name: 'on',
    nextState: LightState.On,
    description: 'turn on light switch'
  })
  .build();

assert.strictEqual(LightState.On, machina.state.current);
assert.deepStrictEqual(['off'], machina.state.possibleTransitions.map(t => t.name));

const newState = machina.transitionTo('off');
```

## TODO:
* add observables