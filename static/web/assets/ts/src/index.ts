import axios from "axios";

interface APIResponse<T> {
    error: string;
    data: T;
}

class UserContext {
    public static context: UserContext;
    public sessionKey: string;

    public constructor() {
        this.load();
    }

    public isLoggedIn(test: boolean = false): boolean | Promise<boolean> {
        if (!test) return this.sessionKey != null && this.sessionKey != "";

        return axios.post("/api/user/check-key", { key: this.sessionKey }).then((response) => true).catch(() => false);
    }

    public load(): void {
        this.sessionKey = localStorage.getItem("sessionKey");
    }

    public save(): void {
        localStorage.setItem("sessionKey", this.sessionKey);
    }

    public login(email: string, password: string): Promise<APIResponse<boolean>> {
        return axios.post("/api/user/login", { email, password }).then((response) => {
            this.sessionKey = response.data.sessionKey;
            this.save();
            return { error: null, data: true };
        }).catch((error) => {
            return { error: error.response.data.message, data: false };
        });
    }

    public signup(username: string, email: string, password: string): Promise<APIResponse<boolean>> {
        return axios.post("/api/user/signup", { email, password, username }).then((response) => {
            this.sessionKey = response.data.sessionKey;
            this.save();
            return { error: null, data: true };
        }).catch((error) => {
            return { error: error.response.data.message, data: false };
        });
    }

    public key(): {key: string} {
        return {key: this.sessionKey};
    }

    public logout(): void {
        axios.post("/api/user/logout", {key: this.sessionKey});
        this.sessionKey = "";
        this.save();
    }
}

class GameReview {
    public id: number;
    public title: string;
    public body: string;
    public date: Date;

    public constructor(id: number, title: string, body: string, date: Date) {
        this.id = id;
        this.title = title;
        this.body = body;
        this.date = date;
    }

    public static fromJsonResponse(json: any): GameReview {
        return new GameReview(json.id, json.title, json.body, new Date(json.date));
    }

    public static create(title: string, body: string, game: Game): Promise<APIResponse<GameReview>> {
        return axios.post("/api/review/create", {title, body, gameID: game.id, user: UserContext.context.key()}).then((response) => {
            let review: GameReview = new GameReview(response.data.id, title, body, new Date());
            game.reviews.splice(0, 0, review);
            return { error: null, data: review };
        }).catch((error) => {
            return { error: error.response.data.message, data: null };
        });
    }
}

class Game {
    public name: string;
    public imageURL: string;
    public description: string;
    public id: number;
    public reviews: GameReview[];

    public constructor(id: number, name: string, description: string, imageURL: string, reviews: GameReview[] = null) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.imageURL = imageURL;
        this.reviews = reviews || [];
    }

    public static getFullList(id: number | string): Promise<Game> {
        return axios.get("/api/game/details/" + id).then((response) => {
            return Game.fromJsonResponse(response.data);
        });
    }

    public static search(query: string): Promise<Game[]> {
        return axios.get("/api/game/search/?q=" + encodeURIComponent(query)).then((response) => {
            return response.data.map((json: any) => Game.fromJsonResponse(json));
        });
    }

    public static fromJsonResponse(json: any): Game {
        return new Game(json.id, json.name, json.description, json.imageURL, json.reviews.map((review: any) => GameReview.fromJsonResponse(review)));
    }

    public static getPreviews(): Promise<Game[]> {
        return axios.get("/api/game/list").then((response) => {
            return response.data.map((json: any) => Game.fromJsonResponse(json));
        });
    }

    public save(): Promise<APIResponse<Game>> {
        if (this.id == null) return axios.post("/api/game/create", {
            name: this.name,
            description: this.description,
            imageURL: this.imageURL,
            user: UserContext.context.key()
        }).then((response) => {
            this.id = response.data.id;
            return { error: null, data: this };
        }).catch((error) => {
            return { error: error.response.data.message, data: null };
        });
    }
}

(window as any).Game = Game;
(window as any).GameReview = GameReview;
UserContext.context = new UserContext();
(window as any).userCTX = UserContext.context;