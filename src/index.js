import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';


class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }

    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()];
    }
}

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card instanceof Duck;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}




class Duck extends Creature {
    constructor(name = 'Утка', power = 2, ...args) {
        super(name, power, args);
    }

    quacks() {
         console.log('quack') 
    }

    swims() {
         console.log('float: both;') 
    }
}

class Gatling extends Creature {
    constructor() {
        super("Гатлинг", 6);
    }
    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));
        
        for(let position = 0; position < oppositePlayer.table.length; position++) {
            taskQueue.push(onDone => {
                const oppCard = oppositePlayer.table[position];
                if (oppCard) {
                    this.dealDamageToCreature(2, oppCard, gameContext, onDone);
                }
            });
        };
        taskQueue.continueWith(continuation);
    }
}



class Dog extends Creature {
    constructor(name = 'Пес-бандит', power = 3, ...args) {
        super(name, power, args);
    }
}

class Trasher extends Duck {
    constructor (name = 'Громила', power = 5, ...args){
        super(name, power, args);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {
            continuation(value - 1)
        });
    }

    getDescriptions() {
        return ['получает на 1 меньше урона', super.getDescriptions()];
    }

}

class Lad extends Dog {
    constructor(name = 'Браток', power = 2, ...args) {
        super(name, power, args);
    }
    
    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemove(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    }

    getBonus() {
        return Lad.getInGameCount() * (Lad.getInGameCount() + 1) / 2;
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) { 
        continuation(value + this.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (value - this.getBonus() < 0) {
            this.view.signalAbility(() => {
                continuation(0);
            });
            return;
        }
        continuation(value - this.getBonus());
    }

    getDescriptions() {
        return ['чем их больше, тем они сильнее', super.getDescriptions()];
    }
}




// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];
const banditStartDeck = [
    new Lad(),
    new Lad(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
