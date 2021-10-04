
import {AntColony, Place} from './game';
/**
 * @Insect Abstract parent class for the {@link Ant} and {@link Bee} classes.
 */
export abstract class Insect {
  readonly name:string;
  /**
   * 
   * @param armor The amount of hp the {@link Insect} has. Once it become 0 or lower the Insect perishes and it is removed from the board.
   * @param place Where the Insect is located in the tunnel.
   */
  constructor(protected armor:number, protected place:Place){}

  getName():string { return this.name; }
  getArmor():number { return this.armor; }
  getPlace() { return this.place; }
  setPlace(place:Place){ this.place = place; }
/**
 * Reduces the amount of armor by the {@link amount}
 *  and if the remain armor is less than or equal to 0 the Insect is killed and removed from the board
 * @param amount The amount of damage taken and which the armor is reduced by.
 * @returns True if the Insect is dead and false if it is still alive.
 */
  reduceArmor(amount:number):boolean {
    this.armor -= amount;
    
    if(this.armor <= 0){
      console.log(this.toString()+' ran out of armor and expired');
      this
      .place.removeInsect(this);
      return true;
    }
    return false;
  }

  abstract act(colony?:AntColony):void;

  toString():string {
    return this.name + '('+(this.place ? this.place.name : '')+')';
  }
}

/**
 * @Bee The enemy. They enter each tunnel and move foward unless stuck or there is an ant or other bee directly in front of them.
 *  They move towards the hive. They sting ants for 
 */
export class Bee extends Insect {
  readonly name:string = 'Bee';
  /**
   * The current status of the bee.
   */
  private status:string;
/**
 * 
 * @param damage How much damage the bee does.
 * @param place Location of the bee.
 */
  constructor(armor:number, private damage:number, place?:Place){
    super(armor, place);
  }

  sting(ant:Ant):boolean{
    console.log(this+ ' stings '+ant+'!');
    return ant.reduceArmor(this.damage);
  }
/**
 * Checks to see if there is any ant directly in front of the bee.
 * @returns Whether there is an ant directly in front of the bee.
 */
  isBlocked():boolean {
    return this.place.getAnt() !== undefined;
  }
   /**
   * @param status Shows whether the bee is healthy, frozen, or stuck.
   */
  setStatus(status:string) { this.status = status; }
/**
 * If there is an ant in front of the bee and the bee is not cold the bee will attack the ant.
 * If the bee is still alive and there is no ant in front and it 
 * is not stuck the bee will move forward 1 to the hive.
 */
  act() {
    if(this.isBlocked()){
      if(this.status !== 'cold') {
        this.sting(this.place.getAnt());
      }
    }
    else if(this.armor > 0) {
      if(this.status !== 'stuck'){
        this.place.exitBee(this);
      }
    }    
    this.status = undefined;
  }
}

/**
 * Parent class for the various ant types.
 * @type boost 
 */
export abstract class Ant extends Insect {
  /**
   * The current boost held by the ant
   */
  protected boost:string; 
  constructor(armor:number, private foodCost:number = 0, place?:Place) {
    super(armor, place);
  }
/**
 * 
 * @returns The food cost of a specific unit.
 */
  getFoodCost():number { return this.foodCost; }
  setBoost(boost:string) { 
    this.boost = boost; 
      console.log(this.toString()+' is given a '+boost);
  }
}

/**
 * @GrowerAnt Each turn dig and uncover food or varius boosts. 
 * Cost: 1 food
 * Armor:1
 */
export class GrowerAnt extends Ant {
  readonly name:string = "Grower";
  constructor() {
    super(1,1)
  }
/**
 * Determines what the Ant digs up based on psuedorandomly generated number between 0 and 1.
 * @param colony The colony of the current game. 
 */
  act(colony:AntColony) {
    let roll = Math.random();
    if(roll < 0.6){
      colony.increaseFood(1);
    }
     else if(roll < 0.7) {
      colony.addBoost('FlyingLeaf');
    }
     else if(roll < 0.8) {
      colony.addBoost('StickyLeaf');
    }
     else if(roll < 0.9) {
      colony.addBoost('IcyLeaf');
    }  
     else if(roll < 0.95) {
      colony.addBoost('BugSpray');
    }
  }  
}

/**
 * @ThrowerAnt Throws leaves at the bees and can throw 3 special variants with boosts.
 * Cost:4 food
 * Armor:1
 */
export class ThrowerAnt extends Ant {
  readonly name:string = "Thrower";
  /**
   * The amount of damage the {@link ThrowerAnt} does to a bee.
   */
  private damage:number = 1;

  constructor() {
    super(1,4);
  }
/**
 * Determines how the {@link Throwerant} attacks based on the boost it has.
 * If FlyingLeaf is used attack the closest bee from an additional 2 distance.
 * If the bee is hit via StickyLeaf it take 1 damage and gets the stuck status and for 1 turn and can't move.
 * If the bee is hit via IcyLeaf it takes 1 damage and gets the  cold status and cannot attack for 1 turn.
 * If BugSpray is used all {@link Insect} in the tunnel take 10 damage.
 * If no boost is used the ant will attack the closest bee from up to 3 distance away for 1 damage.
 */
  act() {
   
    if(this.boost !== 'BugSpray'){
      let target;
      if(this.boost === 'FlyingLeaf')
        target = this.place.getClosestBee(5);
      else
        target = this.place.getClosestBee(3);
      if(target){
        console.log(this + ' throws a leaf at '+target);
        target.reduceArmor(this.damage);
    
        if(this.boost === 'StickyLeaf'){
          target.setStatus('stuck');
          console.log(target + ' is stuck!');
        }
        if(this.boost === 'IcyLeaf') {
          target.setStatus('cold');
          console.log(target + ' is cold!');
        }
        this.boost = undefined;
      }
    }
    else {
      console.log(this + ' sprays bug repellant everywhere!');
      let target = this.place.getClosestBee(0);
  
      while(target){
        target.reduceArmor(10);
        target = this.place.getClosestBee(0);
      }
      this.reduceArmor(10);
    }
  }
}

/**
 * @EaterAnt Eats a bee whole and digests it for 3 turns.
 * Being attacked or killed may cause the digesting bee to be coughed up.
 * Cost: 4 food.
 * Armour: 2.
 */
export class EaterAnt extends Ant {
  readonly name:string = "Eater";
  /**The amount of turns a single bee has been digested.
   *Once 3 turns pass the bee is digested and the Ant can eat another bee.
   */
  private turnsEating:number = 0;
  /**
   * Where the bee that is currently being digested is held.
   */
  private stomach:Place = new Place('stomach');
  constructor() {
    super(2,4)
  }

  isFull():boolean {
    return this.stomach.getBees().length > 0;
  }
  /**
   * The {@link EaterAnt} tries to eat the bee directly in front of the ant
   * if it is not already digesting another ant.
   * If the ant is already digesting a bee {@link turnsEating} is incremented.
   */
  act() {
    console.log("eating: "+this.turnsEating);
    if(this.turnsEating == 0){
      console.log("try to eat");
      let target = this.place.getClosestBee(0);
      if(target) {
        console.log(this + ' eats '+target+'!');
        this.place.removeBee(target);
        this.stomach.addBee(target);
        this.turnsEating = 1;
      }
    } else {
      if(this.turnsEating > 3){
        this.stomach.removeBee(this.stomach.getBees()[0]);
        this.turnsEating = 0;
      } 
      else 
        this.turnsEating++;
    }
  }  
/**
 * Reduces the armor of the EaterAnt and spits up any bee being digested for 1 turn if it survives.
 * If the EaterAnt dies spits out the bee curently being digested.
 * @param amount Amount the EaterAnt's armor is reduced by.
 * @returns Armor left after being reduced.
 */
  reduceArmor(amount:number):boolean {
    this.armor -= amount;
    console.log('armor reduced to: '+this.armor);
    if(this.armor > 0){
      if(this.turnsEating == 1){
        let eaten = this.stomach.getBees()[0];
        this.stomach.removeBee(eaten);
        this.place.addBee(eaten);
        console.log(this + ' coughs up '+eaten+'!');
        this.turnsEating = 3;
      }
    }
    else if(this.armor <= 0){
      if(this.turnsEating > 0 && this.turnsEating <= 2){
        let eaten = this.stomach.getBees()[0];
        this.stomach.removeBee(eaten);
        this.place.addBee(eaten);
        console.log(this + ' coughs up '+eaten+'!');
      }
      return super.reduceArmor(amount);
    }
    return false;
  }
}

/**
 * @ScubaAnt Attacks the same as the {@link ThrowerAnt}
 *  ,but with the addition it can survive in water filled tunnels.
 * Cost: 5 food.
 * Armor: 1.
 */
export class ScubaAnt extends Ant {
  readonly name:string = "Scuba";
  private damage:number = 1;

  constructor() {
    super(1,5)
  }
/**
 * Determines how the Scubaant attacks based on the boost it has.
 * If FlyingLeaf is used the Scubaant can attack the bee from up to an additional 2 distance.
 * If the bee is hit via StickyLeaf it take 1 damage and gets the stuck status and for 1 turn and can't move.
 * If the bee is hit via IcyLeaf it takes 1 damage and gets the  cold status and cannot attack for 1 turn.
 * If BugSpray is used all {@link Insects} in the tunnel take 10 damage.
 * If no boost is used the ScubaAnt will attack the closest bee in 3 distance for 1 damage.
 */
  act() {
    if(this.boost !== 'BugSpray'){
      let target;
      if(this.boost === 'FlyingLeaf')
        target = this.place.getClosestBee(5);
      else
        target = this.place.getClosestBee(3);

      if(target){
        console.log(this + ' throws a leaf at '+target);
        target.reduceArmor(this.damage);
    
        if(this.boost === 'StickyLeaf'){
          target.setStatus('stuck');
          console.log(target + ' is stuck!');
        }
        if(this.boost === 'IcyLeaf') {
          target.setStatus('cold');
          console.log(target + ' is cold!');
        }
        this.boost = undefined;
      }
    }
    else {
      console.log(this + ' sprays bug repellant everywhere!');
      let target = this.place.getClosestBee(0);
      while(target){
        target.reduceArmor(10);
        target = this.place.getClosestBee(0);
      }
      this.reduceArmor(10);
    }
  }
}

/**
 * @GuardAnt Protects any other ant in the tunnel with it. 
 * This is the only way to have more than one ant in the tunnel.
 * The GuardAnt is incapable of attacking.
 * Cost: 4 food. 
 * Armor: 2.
 */
export class GuardAnt extends Ant {
  readonly name:string = "Guard";

  constructor() {
    super(2,4)
  }
/**
 * Gets the other ant in the tunnel with the GuardedAnt.
 * @returns The other ant in the tunnel.
 */
  getGuarded():Ant {
    return this.place.getGuardedAnt();
  }

  act() {}
}
