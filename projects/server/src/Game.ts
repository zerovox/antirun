import { GameState, shuffle, PlayerMap, PassDirection } from "@tsm/shared";

enum GamePhase {
    WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
    WAITING_FOR_READY = "WAITING_FOR_READY",
    PASSING = "PASSING",
    CHARGING = "CHARGING",
    PLAYING = "PLAYING",
    SCORES = "SCORES",
}

interface Transition {
    from: GamePhase,
    to: GamePhase,
    predicate: () => boolean;
    onTransition?: () => void;
}

export class Game {
    private players: string[] = [];
    private readyPlayers: PlayerMap<boolean> = {};
    private phase: GamePhase = GamePhase.WAITING_FOR_PLAYERS;
    private currentHand: PassDirection;

    join(player: string) {
        this.assertPhase(GamePhase.WAITING_FOR_PLAYERS, () => {
            if (this.players.includes(player)) {
                return;
            }
            this.players.push(player);
        });
    }

    ready(player: string) {

    }


    subscribe(player: string, cb: (gameState: GameState) => void): () => void {

    }

    private assertPhase(phase: GamePhase, act: () => void) {
        if (this.phase !== phase) {
            throw new Error(`Expected phase ${phase} but was ${this.phase}`);
        }
        act();
        this.checkForTransitions();
        // TODO: fire updates.
    }

    private checkForTransitions() {
        const transitions: Transition[] = [{
            from: GamePhase.WAITING_FOR_PLAYERS,
            to: GamePhase.WAITING_FOR_READY,
            predicate: () => this.players.length === 4,
        }, {
            from: GamePhase.WAITING_FOR_READY,
            to: GamePhase.PASSING,
            predicate: () => this.players.every(player => this.readyPlayers[player]),
            onTransition: () => {
                this.players = shuffle(this.players);
                // TODO : Create hands.
            }
        }];

        const transition = transitions.find(t => t.from === this.phase && t.predicate());
        if (transition) {
            this.phase = transition.to;
            if (transition.onTransition) {
                transition.onTransition();
            }
        }
    }
}
