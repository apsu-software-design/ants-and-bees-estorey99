import {AntGame, AntColony, Place, Hive} from './game';
import {Ant, EaterAnt, GuardAnt} from './ants';

import vorpal = require('vorpal');
import chalk = require('chalk');
import _ = require('lodash');

/**
 * The Vorpal library for command-line interaction
 */
const Vorpal = vorpal();
/**
 * Outputs the current game map.
 * {@link getMap}
 * @param game The current game
 */
export function showMapOf(game:AntGame){
  console.log(getMap(game));
}
/**
 * Outputs the current term, amount of food, and amount of boosts.
 * Outputs the tunnels each postion in a tunnel is shown as "====" except those which are submerged.
 * Outputs the amount of bees that will spawn in this wave. 
 *Loops through {@link places} to find any {@link Place} where an {@link Ant} is then checks for their associated icon and outputs it to that position on the map.
 *Loops  through {@link places} to find any {@link Place} where an {@link Bee} is then outputs a yellow 'B' to its positions.
 *For each {@link Place} they are checked for if they submerged. If they are submerged then that place is outputed as two lines of tildes filled in with cyan. 
 * @param game The current game
 * @returns The current game map
 */
export function getMap(game:AntGame) {
 
 /**
  * A matrix that holds all the location in the tunnels.
  * Each row represents a tunnel and each index in that row represents a position in that tunnel.
  */
  let places:Place[][] = game.getPlaces();
  let tunnelLength = places[0].length;
  let beeIcon = chalk.bgYellow.black('B');
   
  let map = '';

  map += chalk.bold('The Colony is under attack!\n');
  map += `Turn: ${game.getTurn()}, Food: ${game.getFood()}, Boosts available: [${game.getBoostNames()}]\n`;
  map += '     '+_.range(0,tunnelLength).join('    ')+'      Hive'+'\n';
   
  for(let i=0; i<places.length; i++){
    map += '    '+Array(tunnelLength+1).join('=====');
    
    if(i===0){
      map += '    ';
      let hiveBeeCount = game.getHiveBeesCount();
      if(hiveBeeCount > 0){
        map += beeIcon;
        map += (hiveBeeCount > 1 ? hiveBeeCount : ' ');
      }
    }
    map += '\n';

    map += i+')  ';
   
    for(let j=0; j<places[i].length; j++){ 
      let place:Place = places[i][j];

      map += iconFor(place.getAnt());
      map += ' '; 

      if(place.getBees().length > 0){
        map += beeIcon;
        map += (place.getBees().length > 1 ? place.getBees().length : ' ');
      } else {
        map += '  ';
      }
      map += ' '; 
    }
    map += '\n    ';
    for(let j=0; j<places[i].length; j++){
      let place = places[i][j];
      if(place.isWater()){
        map += chalk.bgCyan('~~~~')+' ';
      } else {
        map += '==== ';
      }
    }
    map += '\n';
  }
  map += '     '+_.range(0,tunnelLength).join('    ')+'\n';

  return map;
}

/**
 * Selects an Icon for an ant which the color and char of is based on ant type.
 * Grower: green 'G'
 * Thrower: red 'T'
 * Eater: magenta 'E' (if full yellow with magenta background)
 * Scuba: cyan 'S'
 * Guard: underline 'x'
 * @param ant The ant for the icon is for.
 * @returns The icon of the ant.
 */
export function iconFor(ant:Ant){
  if(ant === undefined){ return ' ' };
  let icon:string;
  switch(ant.name){
    case "Grower":
      icon = chalk.green('G'); break;
    case "Thrower":
      icon = chalk.red('T'); break;
    case "Eater":
      if((<EaterAnt>ant).isFull())
        icon = chalk.yellow.bgMagenta('E');
      else
        icon = chalk.magenta('E');
      break;
    case "Scuba":
      icon = chalk.cyan('S'); break;
    case "Guard":
      let guarded:Ant = (<GuardAnt>ant).getGuarded();
      if(guarded){
        icon = chalk.underline(iconFor(guarded)); break;
      } else {
        icon = chalk.underline('x'); break;
      }
    default:
      icon = '?';
  }
  return icon;
}

/**
 * Delimits the comandline prompt and outputs 'AvB $' in green text.
 * 'show' command outputs the current game map.
 * 'add' and 'd' command allows user to deploy an ant.
 * User tries to deploy an ant and if it does not succeed then output why it failed else update the map to show the deployed unit.
 * 'rm' command allows user to remove ant from a tunnel.
 * User tries to remove an ant and if it does not succeed then output why the removal failed else update map to remove the unit.
 * 'b' user to add a boost an ant if the boost is invalid the reason is outputed.
 * 'end turn', 'take turn', 't' will end the turn and cause ants and bees to act.
 * If won is true outputs a victory message in green text.
 * Else if the game is lost outputs a please try again message in yellow text.
 * If won is undefined then a callback is issued and the game continues.
 *
 * @param game The current game being played
 */
export function play(game:AntGame) {
  Vorpal
    .delimiter(chalk.green('AvB $'))
    .log(getMap(game))
    .show();

  Vorpal
    .command('show', 'Shows the current game board.')
    .action(function(args, callback){
      Vorpal.log(getMap(game));
      callback();
    });

  Vorpal
    .command('deploy <antType> <tunnel>', 'Deploys an ant to tunnel (as "row,col" eg. "0,6").')
    .alias('add', 'd')
    .autocomplete(['Grower','Thrower','Eater','Scuba','Guard'])
    .action(function(args, callback) {

      let error = game.deployAnt(args.antType, args.tunnel)
      if(error){
        Vorpal.log(`Invalid deployment: ${error}.`);
      }
      else {
        Vorpal.log(getMap(game));
      }
      callback();
    });

  Vorpal
    .command('remove <tunnel>', 'Removes the ant from the tunnel (as "row,col" eg. "0,6").')
    .alias('rm')
    .action(function(args, callback){
      let error = game.removeAnt(args.tunnel);
      if(error){
        Vorpal.log(`Invalid removal: ${error}.`);
      }
      else {
        Vorpal.log(getMap(game));
      }
      callback();
    });

  Vorpal
    .command('boost <boost> <tunnel>', 'Applies a boost to the ant in a tunnel (as "row,col" eg. "0,6")')
    .alias('b')
    .autocomplete({data:() => game.getBoostNames()})
    .action(function(args, callback){
      let error = game.boostAnt(args.boost, args.tunnel);
      if(error){
        Vorpal.log(`Invalid boost: ${error}`);
      }
      callback();
    })

  Vorpal
    .command('turn', 'Ends the current turn. Ants and bees will act.')
    .alias('end turn', 'take turn','t')
    .action(function(args, callback){
      game.takeTurn();
      Vorpal.log(getMap(game));
  
      let won:boolean = game.gameIsWon();
     
      if(won === true){
        Vorpal.log(chalk.green('Yaaaay---\nAll bees are vanquished. You win!\n'));
      }
      else if(won === false){
        Vorpal.log(chalk.yellow('Bzzzzz---\nThe ant queen has perished! Please try again.\n'));
      }
      else {
        callback();
      }
    });
}
