import { Sequelize } from "sequelize-typescript";
import SessionKey from "./models/sessionkey";
import User from "./models/user";
import Game from "./models/game";
import Review from "./models/review";
import * as fs from "fs";
import * as path from "path";

const sequelize: Sequelize = new Sequelize({
    database: "enquiry",
    dialect: process.platform == "darwin"? "mysql":"mariadb",
    username: "root",
    password: JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "..", "secret.json")).toString()).dbPassword,
    models: [SessionKey, User, Game, Review]
});

sequelize.query("SET FOREIGN_KEY_CHECKS=0").then(() => {
    sequelize.drop().then(() => sequelize.sync({ force: true })).then(async () => {
        let userPromises: Promise<User>[] = [];

        for (let i = 1; i <= 3; i++) {
            userPromises.push(User.signUpUser({
                username: "Username" + i,
                password: "Password" + i,
                email: `email${i}@mail.com`
            }).then(([user, key]) => {
                if (i == 1) {
                    user.permissionLevel = 1;
                    user.save();
                }
                return user;
            }));
        }

        let users: User[] = await Promise.all(userPromises);

        (Game.createGameFromOptions({
            name: "League Of Legends",
            description: "Cupidatat nostrud dolor id aliquip mollit est proident est laborum ad ut sit aute. Cillum elit culpa laborum amet. Eiusmod duis est reprehenderit laboris et culpa sint aliquip ea et pariatur in. Laboris cillum ea adipisicing laborum ut.",
            images: [
                "https://wallpaperaccess.com/full/217097.jpg",
                "https://wallpaperaccess.com/full/217097.jpg",
                "https://wallpaperaccess.com/full/217097.jpg",
                "https://wallpaperaccess.com/full/217097.jpg"
            ],
            rating: 12
        }) as Promise<Game>).then((game) => {
            for (let i = 1; i <= 10; i++) {
                (Review.createReviewFromOptions({
                    title: "Occaecat ad elit 1" + i,
                    body: "Adipisicing adipisicing aliqua do velit Lorem id sunt sunt sint. Ex id nulla commodo aute. Ipsum incididunt tempor ex id esse nulla. Dolore anim sint veniam dolor nulla ullamco amet elit sit irure eiusmod consequat id. Sint consectetur consequat sint in consequat eiusmod nulla esse cupidatat.",
                    gameID: game.id,
                    user: users[Math.floor(Math.random() * users.length)]
                }) as Promise<Review>).catch((error) => console.log(error));
            }
        });

        (Game.createGameFromOptions({
            name: "Undertale",
            description: "Incididunt nostrud sint in commodo eiusmod quis reprehenderit esse quis reprehenderit et nulla pariatur mollit. Amet deserunt irure minim commodo culpa. Do labore sunt sint labore dolore excepteur excepteur duis. In nisi sit ullamco labore in officia. Eiusmod ipsum mollit velit amet amet ad amet ad enim mollit labore dolore aliqua. Reprehenderit deserunt do excepteur fugiat cupidatat excepteur minim dolor occaecat. Consequat consectetur id commodo dolor aliqua aliqua officia occaecat eu officia aliquip ad nulla magna.",
            images: [
                "https://www.grabpcgames.com/wp-content/uploads/2018/10/full-pc-game-download-undertale.jpg",
                "https://www.gamersdecide.com/sites/default/files/styles/news_images/public/undertale_cover.jpg",
                "https://cdn.mos.cms.futurecdn.net/5nULLkfBtxNpjR5SmvmSw-1200-80.jpg",
                "https://sm.ign.com/ign_za/screenshot/u/undertale-/undertale-gameplay_yn31.jpg"
            ],
            rating: 12
        }) as Promise<Game>).then((game) => {
            for (let i = 1; i <= 10; i++) {
                Review.createReviewFromOptions({
                    title: "Occaecat ad elit 2" + i,
                    body: "Adipisicing adipisicing aliqua do velit Lorem id sunt sunt sint. Ex id nulla commodo aute. Ipsum incididunt tempor ex id esse nulla. Dolore anim sint veniam dolor nulla ullamco amet elit sit irure eiusmod consequat id. Sint consectetur consequat sint in consequat eiusmod nulla esse cupidatat.",
                    gameID: game.id,
                    user: users[Math.floor(Math.random() * users.length)]
                });
            }
        });

        sequelize.query("SET FOREIGN_KEY_CHECKS=1");
    });
})