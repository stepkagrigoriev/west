import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';


class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
        this._currentPower = maxPower;
    }

    get currentPower(){
        return this._currentPower;
    }

    set currentPower(newPower){
        this._currentPower = Math.min(newPower, this.maxPower);
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

class Rogue extends Creature {
    constructor(name = 'Изгой', power = 2, ...args) {
        super(name, power, ...args);

    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Rogue.setInGameCount(Rogue.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemove(gameContext, continuation) {
        Rogue.setInGameCount(Rogue.getInGameCount() - 1);
        continuation();
    }

    getBonus() {
        return Rogue.getInGameCount() * (Rogue.getInGameCount() + 1) / 2;
    }

    stealAbilities(target, gameContext) {
        if (target instanceof Rogue) return;

        const proto = Object.getPrototypeOf(target);

        const abilityNames = [
            'modifyDealedDamageToCreature',
            'modifyDealedDamageToPlayer',
            'modifyTakenDamage'
        ];

        abilityNames.forEach(name => {
            if (proto.hasOwnProperty(name)) {
                this[name] = proto[name].bind(this);
                delete proto[name];
            }
        });

        gameContext.updateView();
    }
    attack(gameContext, continuation) {
        const { oppositePlayer } = gameContext;
        const target = oppositePlayer.table.find(c => c);

        if (target) {
            this.stealAbilities(target, gameContext);
        }

        super.attack(gameContext, continuation);
    }
}

class Brewer extends Duck {
    constructor(name = "Пивовар", maxPower = 2, image) {
        super(name, maxPower, image);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const allCards = currentPlayer.table.concat(oppositePlayer.table);

        taskQueue.push(onDone => this.view.showAttack(onDone));
        taskQueue.push(onDone => {
            allCards.forEach(card => {
                if (card instanceof Duck) {
                    card.maxPower += 1;
                    card.currentPower = Math.min(card.currentPower + 2, card.maxPower);
                    card.view.signalHeal();
                    card.updateView();
                }
            });

            this.maxPower += 1;
            this.currentPower = Math.min(this.currentPower + 2, this.maxPower);
            this.view.signalHeal();
            this.updateView();
            onDone();
        });
        taskQueue.push(onDone => {
            const oppositeCard = oppositePlayer.table[position];
            if (oppositeCard) {
                this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
            } else {
                this.dealDamageToPlayer(1, gameContext, onDone);
            }
        });
        taskQueue.continueWith(continuation);
    }

    getDescriptions() {
        return ['любит пиво и всех хилит', super.getDescriptions()];
    }
}

class PseudoDuck extends Dog {
    constructor(name = "Псевдоутка", maxPower = 3, ...args) {
        super(name, maxPower, ...args);
    }
    quacks = function () {
        console.log('quack')
    };
    swims = function () {
        console.log('float: both;')
    };
    getDescriptions() {
        return ['не утка', super.getDescriptions()];
    }
}






// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Rogue(),
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
