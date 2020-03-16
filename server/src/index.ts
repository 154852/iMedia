import * as express from "express";
import * as path from "path";
import * as bodyParser from "body-parser";
import { Sequelize } from "sequelize-typescript";
import User, { SignUpOptions, LoginOptions } from "./models/user";
import SessionKey from "./models/sessionkey";
import * as security from "./security";
import Game from "./models/game";
import Review from "./models/review";
import * as fs from "fs";

const app: express.Express = express();
const port: number = 12357;

const sequelize: Sequelize = new Sequelize({
    database: "enquiry",
    dialect: process.platform == "darwin"? "mysql":"mariadb",
    username: "root",
    password: JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "..", "secret.json")).toString()).dbPassword,
    models: [SessionKey, User, Game, Review]
});

const staticDir: string = path.join(__dirname, "..", "..", "static", "web");

app.get("/", (req: express.Request, res: express.Response) => {
    let redirect: string = "/" + (req.headers["accept-language"] || "en").split(/:|,|-/)[0];
    res.status(307).setHeader("Location", redirect);
    res.send(`<a href='${redirect}'>Redirect</a>`);
});

app.use(bodyParser.json());

app.get("/sitemap.txt", (req: express.Request, res: express.Response, next: () => void) => {
    res.type("txt").send(["/", "/search", "/login", "/register"].map((x) => "https://enquiry.thundernerds.org" + x).join("\n"));
});

app.post("/api/**", (req: express.Request, res: express.Response, next: () => void) => {
    if (!req.is("json")) {
        return res.status(400).send({
            code: "ERR_BAD_REQUEST",
            message: "All api calls must be json"
        });
    }
    
    next();
});

app.post("/api/user/signup", (req: express.Request, res: express.Response) => {
    User.signUpUser(req.body as SignUpOptions).then(([user, key]: [User, SessionKey]) => {
        res.status(200).send({
            sessionKey: key.stringValue
        });
    }).catch((reason) => {
        let message: string = reason.errors[0].message;

        res.status(400).send({
            code: "ERR_INVALID_USER_CREDENTIALS",
            message: message
        });
    });
});

app.post("/api/user/login", (req: express.Request, res: express.Response) => {
    User.loginUser(req.body as LoginOptions).then(([user, key]: [User, SessionKey]) => {
        if (user == null) {
            res.status(400).send({
                error: "ERR_INCORRECT_USER_CREDENTIALS",
                message: "Either your email or password was incorrect"
            });
        } else {
            res.status(200).send({
                sessionKey: key.stringValue
            });
        }
    });
});

app.post("/api/user/logout", (req: express.Request, res: express.Response) => {
    User.logoutUser(req.body.key).then((user: User) => {
        if (user == null) {
            res.status(400).send({
                error: "ERR_INCORRECT_SESSION_KEY",
                message: "Could not find this session key"
            });
        } else {
            res.status(200).send({success: true});
        }
    })
});

app.post("/api/user/check-key", (req: express.Request, res: express.Response) => {
    User.getFromKey(req.body.key).then((user: User) => {
        if (user == null) {
            res.status(400).send({
                error: "ERR_INCORRECT_SESSION_KEY",
                message: "The session key is invalid"
            });
        } else {
            res.status(200).send({
                username: user.username
            });
        }
    })
});

app.post("/api/game/create", (req: express.Request, res: express.Response) => {
    Game.creationActivity.doesAllowUserInfo(req.body.user).then((acceptable) => {
        if (acceptable) {
            let promise: string | Promise<Game> = Game.createGameFromOptions(req.body, path.join(staticDir, "assets", "images", "downloaded"), "/assets/images/downloaded");
            if (typeof promise == "string") {
                return res.status(400).send({
                    error: "ERR_INVALID_GAME_DETAILS",
                    message: promise
                });
            } else (promise as Promise<Game>).then((game) => {
                return res.status(200).send({
                    id: game.id
                });
            }).catch((error) => {
                return res.status(400).send({
                    error: "ERR_INVALID_GAME_DETAILS",
                    message: error.toString()
                });
            });
        }
        else return res.status(400).send({
            error: "ERR_INCORRECT_PERMISSIONS",
            message: "The permissions associated with this user do not allow you to do this"
        });
    }).catch((error) => {
        return res.status(400).send({
            error: "ERR_INCORRECT_SESSION_KEY",
            message: "Please log in first"
        });
    });
});

app.get("/api/game/list", (req: express.Request, res: express.Response) => {
    Game.list().then((games) => {
        res.status(200).send(games);
    });
});

app.get("/api/game/search", (req: express.Request, res: express.Response) => {
    Game.search(req.query.q).then((games) => {
        res.status(200).send(games);
    });
});

app.get("/api/game/details/:game", (req: express.Request, res: express.Response) => {
    Game.details(parseInt(req.params.game)).then((game) => {
        if (game == null) return res.status(404).send({
            error: "ERR_GAME_NOT_FOUND",
            message: "No game could be found with this id"
        });

        return res.status(200).send(game);
    });
});

app.post("/api/review/create", (req: express.Request, res: express.Response) => {
    Review.creationActivity.doesAllowUserInfoWithUserReturn(req.body.user).then(([acceptable, user]) => {
        if (acceptable) {
            let promise: string | Promise<Review> = Review.createReviewFromOptions(Object.assign(req.body, {user}));
            if (typeof promise == "string") {
                return res.status(400).send({
                    error: "ERR_INVALID_REVIEW_DETAILS",
                    message: promise
                });
            } else (promise as Promise<Review>).then(async (review) => {
                res.status(200).send(await review.getReturnable());
            }).catch((error) => {
                return res.status(400).send({
                    error: "ERR_INVALID_REVIEW_DETAILS",
                    message: "A review with this name already exists"
                });
            });
        } else return res.status(400).send({
            error: "ERR_INCORRECT_PERMISSIONS",
            message: "The permissions associated with this user do not allow you to do this"
        });
    }).catch((error) => {
        return res.status(400).send({
            error: "ERR_INCORRECT_SESSION_KEY",
            message: "Please log in first"
        });
    });
});

app.use("/api/**", (req: express.Request, res: express.Response) => {
    res.status(404).send({
        error: "ERR_INVALID_COMMAND",
        message: "No api function with this command could be found"
    });
});

app.get("/:lang/game/:id", (req: express.Request, res: express.Response) => {
    res.sendFile(path.join(staticDir, "game.html"));
});

app.get("/site.webmanifest", (req: express.Request, res: express.Response) => {
    res.sendFile(path.join(staticDir, "site.webmanifest"));
});

app.use("/assets", express.static(path.join(staticDir, "assets")));
app.use("/:lang/", express.static(path.join(staticDir), {extensions: ["html"]}));
app.use("/**", (req: express.Request, res: express.Response) => {
    res.status(404).send("Page not found");
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});