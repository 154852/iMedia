import { Sequelize } from "sequelize-typescript";
import SessionKey from "./models/sessionkey";
import User from "./models/user";
import Game from "./models/game";
import Review from "./models/review";
import * as fs from "fs";
import * as path from "path";

const sequelize: Sequelize = new Sequelize({
    database: "enquiry",
    dialect: "mariadb",
    username: "root",
    password: JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "..", "secret.json")).toString()).dbPassword,
    models: [SessionKey, User, Game, Review]
});

sequelize.drop().then(() => sequelize.sync({ force: true })).then(() => {
    for (let i = 1; i <= 3; i++) {
        User.signUpUser({
            username: "Username" + i,
            password: "Password" + i,
            email: `email${i}@mail.com`
        }).then(([user, key]) => {
            if (i == 1) {
                user.permissionLevel = 1;
                user.save();
            }
        });
    }

    const titles: string[] = [
        "Commodo incididunt nostrud tempor nostrud labore incididunt commodo eiusmod excepteur.",
        "Magna reprehenderit minim exercitation laboris velit officia cupidatat voluptate excepteur incididunt commodo.",
        "Esse nisi exercitation non deserunt labore minim incididunt deserunt.",
        "Ex ullamco nulla labore tempor voluptate occaecat.",
        "Excepteur ipsum in consectetur mollit ex esse ad aliqua tempor elit.",
        "Excepteur Lorem mollit Lorem sit commodo.",
        "Ut eiusmod in veniam ea incididunt magna proident pariatur sint do tempor laborum labore.",
        "Excepteur ipsum id occaecat veniam ea duis officia eiusmod eu reprehenderit et aliqua ut.",
        "Et sunt magna excepteur quis aute do non aute minim consectetur cupidatat ex."
    ];

    (Game.createGameFromOptions({
        name: "League Of Legends",
        description: "A description",
        imageURL: "https://wallpaperaccess.com/full/217097.jpg"
    }) as Promise<Game>).then((game) => {
        for (let i = 1; i <= 10; i++) {
            Review.createReviewFromOptions({
                title: "Occaecat ad elit voluptate magna aliquip non voluptate aute culpa dolore anim. " + game.id + ":" + i,
                body: "A review, with index" + (i - 1),
                gameID: game.id
            });
        }
    });

    (Game.createGameFromOptions({
        name: "Undertale",
        description: "Another description",
        imageURL: "https://fontmeme.com/images/undertale-font.jpg"
    }) as Promise<Game>).then((game) => {
        for (let i = 1; i <= 10; i++) {
            Review.createReviewFromOptions({
                title: "Occaecat ad elit voluptate magna aliquip non voluptate aute culpa dolore anim. " + game.id + ":" + i,
                body: "A review, with index" + (i - 1),
                gameID: game.id
            });
        }
    });
});