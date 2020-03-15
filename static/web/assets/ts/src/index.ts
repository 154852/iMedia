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
    public username: string;

    public constructor(id: number, title: string, body: string, username: string, date: Date) {
        this.id = id;
        this.title = title;
        this.body = body;
        this.date = date;
        this.username = username;
    }

    public dateString(onString: string): string {
        let tdn = (n: number) => ("0" + n).slice(-2);
        return tdn(this.date.getHours()) + ":" + tdn(this.date.getMinutes()) + ":" + tdn(this.date.getSeconds()) + " " + onString + " " + tdn(this.date.getDate()) + "/" + tdn(this.date.getMonth() + 1) + "/" + this.date.getFullYear();
    }

    public static fromJsonResponse(json: any): GameReview {
        return new GameReview(json.id, json.title, json.body, json.username, new Date(json.date));
    }

    public static create(title: string, body: string, game: Game): Promise<APIResponse<GameReview>> {
        return axios.post("/api/review/create", {title, body, gameID: game.id, user: UserContext.context.key()}).then((response) => {
            let review = GameReview.fromJsonResponse(response.data);
            game.reviews.splice(0, 0, review);
            return { error: null, data: review };
        }).catch((error) => {
            return { error: error.response.data.message, data: null };
        });
    }
}

class Game {
    public name: string;
    public images: string[];
    public description: string;
    public id: number;
    public reviews: GameReview[];
    public rating: number;

    public constructor(id: number, name: string, description: string, rating: number, images: string[] = null, reviews: GameReview[] = null) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.images = images || [];
        this.reviews = reviews || [];
        this.rating = rating;
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
        return new Game(json.id, json.name, json.description, json.rating, json.logoImage != null? [json.logoImage]:json.images, json.reviews == null? null:json.reviews.map((review: any) => GameReview.fromJsonResponse(review)));
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
            images: this.images,
            user: UserContext.context.key(),
            rating: this.rating
        }).then((response) => {
            this.id = response.data.id;
            return { error: null, data: this };
        }).catch((error) => {
            return { error: error.response.data.message, data: null };
        });
    }

    public cache(): void {
        localStorage.setItem("createGameCache", JSON.stringify(this));
    }

    public static loadCache(): Game {
        let jsonString: string = localStorage.getItem("createGameCache")
        if (jsonString == null) return null;
        return Game.fromJsonResponse(JSON.parse(jsonString));
    }

    public static clearCache(): void {
        localStorage.removeItem("createGameCache");
    }
}

class Language {
    public static languageMap: Map<string, Map<string, string>> = new Map([
        ["en", Language.parseLanguageString(`
login: Log In
or: or
signup: Sign Up
logout: Log Out
search: Search
readmore: Read More
accessibilitysettings: Accessibility Settings
contactus: Contact Us
search_results: Search Results
sorry_no_games_found: Sorry, no games were found with this name
some_details: Some Details About The Game
reviews: Reviews
post: Post
log_in_here: Log in here
to_post_review: to post a review of your own
posted_by: Posted by
at: at
on: on
email: Email
password: Password
username: Username
dont_have_account: Don't yet have an account? You can
signup_here: Sign up here.
already_have_account: Already have an account? You can
signin_here: sign in here.
create: Create
admintools: Admin Tools
gametitle: Game Title
game_pegi_rating: Game pegi rating
game_logo_image_url: Game Logo Image Url
game_1_image_url: Game Image 1 Url
game_2_image_url: Game Image 2 Url
game_3_image_url: Game Image 3 Url
game_description: Game Description
create_game: Create Game
`)], ["fr", Language.parseLanguageString(`
login: S'Identifier
or: ou
signup: S'Inscrire
logout: Se Déconnecter
search: Chercher
readmore: Continue de Lire
accessibilitysettings: Paramètres D'Accessibilité
contactus: Nous Contacter
search_results: Résultats de Recherche
sorry_no_games_found: Désolé, aucun jeu n'a été trouvé avec ce nom
some_details: Quelques détails sur le jeu
reviews: Commentaires
post: Publier
log_in_here: Connectez-vous ici
to_post_review: pour publier votre propre avis
posted_by: Posté par
at: à
on:
email: Email
password: Mot de passe
username: Nom d'utilisateur
dont_have_account: Vous n'avez pas encore de compte? Vous pouvez
signup_here: vous inscrire ici.
already_have_account: Vous avez déjà un compte? Vous pouvez
signin_here: vous connecter ici
create: Créer
admintools: Outils D'Administration
gametitle: Titre du Jeu
game_pegi_rating: Évaluation du jeu pegi
game_logo_image_url: URL du logo du jeu
game_1_image_url: URL de l'image du jeu 1
game_2_image_url: URL de l'image du jeu 2
game_3_image_url: URL de l'image du jeu 3
game_description: Description du jeu
create_game: Créer un jeu
`)]
]);

    public code: string;

    public constructor(code: string) {
        this.code = code;
    }

    public term(id: string): string {
        return (Language.languageMap.get(this.code) || Language.languageMap.get("en")).get(id);
    }

    public toString(): string {
        return this.code;
    }

    public static load(): Language {
        return new Language(/\/([a-z][a-z])\/.*/.exec(window.location.href)[1]);
    }

    public static parseLanguageString(s: string): Map<string, string> {
        return new Map(s.split(/\s*\n\s*/).map((x) => x.trim().split(/\s*:\s*/) as [string, string]));
    }
}

(window as any).Game = Game;
(window as any).GameReview = GameReview;
UserContext.context = new UserContext();
(window as any).userCTX = UserContext.context;
(window as any).lang = Language.load();