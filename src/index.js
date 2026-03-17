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
}
Gatling.prototype.attack = function (gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));
        
        taskQueue.push(onDone => {
            const oppositeCard = oppositePlayer.table[position];

            if (oppositeCard) {
                this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
            } else {
                this.dealDamageToPlayer(1, gameContext, onDone);
            }
        });

        taskQueue.continueWith(continuation);
    };


class Dog extends Creature {
    constructor(name = 'Пес-бандит', power = 3, ...args) {
        super(name, power, args);
    }
}

class Trasher extends Duck {
    constructor (name, max){
        super("Громила", 5);
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




// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Duck(),
];
const banditStartDeck = [
    new Trasher(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
