import assert from 'assert';
import sinon, { SinonSpy } from 'sinon';

import { createMachina, Machina } from '../src/index';

describe(' > createMachina nested machinas', () => {

  beforeEach(async function beforeEach() {
    sinon.spy(console, 'warn');
  });

  afterEach(async function afterEach() {
    (console.warn as SinonSpy).restore();

    sinon.restore();
  })

  enum LightState {
    Green = 'Green',
    Red = 'Red',
    Amber = 'Amber'
  };

  enum LightTransition {
    TurnGreen = 'TurnGreen',
    TurnAmber = 'TurnAmber',
    TurnRed = 'TurnRed'
  }

  enum PedestrianState {
    Walk = 'Walk',
    Wait = 'Wait',
    Stop = 'Stop'
  }

  enum PedestrianTransition {
    ToWalk = 'ToWalk',
    ToWait = 'ToWait',
    ToStop = 'ToStop'
  }

  // const sleep = (ms: number): Promise<void> => {
  //   return new Promise<void>((resolve) => {
  //     setTimeout(resolve, ms);
  //   });
  // }

  it('Simple nested machinas child and parent communication.', async () => {
    const pedestrianMachina = createMachina<PedestrianState, PedestrianTransition>(PedestrianState.Stop, 'pedestrian-machina')
      .addState(
        PedestrianState.Stop,
        {
          on: PedestrianTransition.ToWalk,
          nextState: PedestrianState.Walk,
          description: 'to walking...'
        }, {
          onEnter: async (nodeState, machina) => {
            if (machina.parent === null) {
              console.log('not linked as nested machine yet.')
            } else {
              console.log('notifying parent safe to turn green again')
              const afterTransitionState = await machina.parent.transition(LightTransition.TurnGreen);
              assert.notStrictEqual(null, afterTransitionState, 'after transition state should NOT be null');
            }
          }
        }
      )
      .addState(
        PedestrianState.Walk,
        {
          on: PedestrianTransition.ToWait,
          nextState: PedestrianState.Wait,
          description: 'to waiting...'
        }, {
          onEnter: async (machina) => {console.log('pedestrian to walking')}
        }
      )
      .addState(
        PedestrianState.Wait,
        {
          on: PedestrianTransition.ToStop,
          nextState: PedestrianState.Stop,
          description: "to stopped"
        })
      .buildAndStart();

    const lightsMachina = createMachina<LightState, LightTransition>(LightState.Green, 'lights-machina')
      .addState(LightState.Green, {
        on: LightTransition.TurnAmber,
        nextState: LightState.Amber,
        description: 'turn amber'
      })
      .addState(
        LightState.Amber,
        {
          on: LightTransition.TurnRed,
          nextState: LightState.Red,
          description: 'turn amber'
        },
        {
          onEnter: async (machina) => {console.log('turned amber')}
        }
      )
      .addState(LightState.Red, {
        on: LightTransition.TurnGreen,
        nextState: LightState.Green,
        description: "turn green"
      }, {
        nestedMachinas: [pedestrianMachina],
        onEnter: async (nodeState, machina) => {
          console.log('turned red', machina.state.current);
          assert.strictEqual(machina.state.current, LightState.Red, 'Should be "Red" onEnter.');
          const { nestedMachinas } = machina.state;
          assert.strictEqual(nestedMachinas.length, 1, 'Red Light should have a nested machina for Pedestrian Light states');
          assert.strictEqual(nestedMachinas[0].name, 'pedestrian-machina');
          await nestedMachinas[0].transition(PedestrianTransition.ToWalk);
        }
      })
      .buildAndStart();

    assert.strictEqual(lightsMachina.name, 'lights-machina');
    assert.strictEqual(lightsMachina.parent, null, 'main machina should not be assigned a parent');
    // pedestrian state should be "stopped" when the light is green.
    assert.strictEqual(pedestrianMachina.state.current, PedestrianState.Stop, 'should start out "Stopped"');
    await lightsMachina.transition(LightTransition.TurnAmber);
    assert.strictEqual(pedestrianMachina.state.current, PedestrianState.Stop, 'should still be "Stopped"');
    await lightsMachina.transition(LightTransition.TurnRed);

    assert.strictEqual(pedestrianMachina.state.current, PedestrianState.Walk, 'should have switched to "Walk" after a sleep...');
    await pedestrianMachina.transition(PedestrianTransition.ToWait);

    assert.strictEqual(lightsMachina.state.current, LightState.Red);
    // now we put pedestrian to stop and it should trigger the light to "Green".
    await pedestrianMachina.transition(PedestrianTransition.ToStop);
    assert.strictEqual(pedestrianMachina.state.current, PedestrianState.Stop, 'Pedestrian state should now be "Stopped"');

    assert.strictEqual(lightsMachina.state.current, LightState.Green, 'Should have switched to green from signal from Pedestrian indicating walking had stopped.');
  });
});