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

const imageDir: string = path.join(__dirname, "..", "..", "static", "web", "assets", "images", "downloaded");
fs.readdir(imageDir, (err, files) => {
    files.forEach((file) => fs.unlink(path.join(imageDir, file), () => {}));
});

const words: string[] = `\
irure quis dolor non amet aute cillum commodo amet fugiat nostrud aliquip esse sit adipisicing sit deserunt eu nulla magna deserunt ad amet do consequat est incididunt veniam mollit adipisicing sint ut ex non dolore consectetur ex laborum elit labore cupidatat laboris elit \
consectetur et esse labore occaecat nisi nulla ut fugiat do dolor mollit eiusmod eiusmod anim adipisicing culpa commodo eiusmod esse ea consectetur consectetur amet fugiat qui et deserunt exercitation minim\
`.split(/\s+/);

function randInt(min: number, max: number) {
    return Math.round(min + (Math.random() * (max - min)));
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateText(charCount: number, sentenced: boolean = false): string {
    if (!sentenced) {
        const selectedWords: string[] = [];
        charCount -= 1;
        while (true) {
            let word: string = words[randInt(0, words.length - 1)];
            if (word.length > charCount) break;
            selectedWords.push(word);
            charCount -= word.length + 1;
        }
        return capitalize(selectedWords.join(" ")) + ".";
    }

    let sentences: string[] = [];
    while (true) {
        let sentence: string = generateText(Math.min(charCount, 78 + randInt(-18, 18)), false);
        if (sentence.length + 10 > charCount) break;
        sentences.push(sentence);
        charCount -= sentence.length + 1;
    }

    return sentences.join(" ");
}

function generateNoSpaceText(wordCount: number, join: string = "", doCapitalize: boolean = true): string {
    const selectedWords: string[] = [];
    for (let i = 0; i < wordCount; i++) selectedWords.push(words[randInt(0, words.length - 1)]);

    if (doCapitalize) return selectedWords.map((w) => capitalize(w)).join(join);
    else return selectedWords.join(join);
}

let users: User[];

function randomizeGame(name: string, images: string[], pegiRating: number) {
    (Game.createGameFromOptions({
        name: name,
        description: generateText(255, true),
        images: images,
        rating: pegiRating
    }, imageDir, "/assets/images/downloaded") as Promise<Game>).then((game) => {
        for (let i = 1; i <= 10; i++) {
            (Review.createReviewFromOptions({
                title: generateText(6 * 10, false),
                body: generateText(255, true),
                gameID: game.id,
                user: users[Math.floor(Math.random() * users.length)],
                starRating: Math.random() * 6
            }) as Promise<Review>).catch((error) => console.log(error));
        }
    });
}

sequelize.query("SET FOREIGN_KEY_CHECKS=0").then(() => {
    sequelize.drop().then(() => sequelize.sync({ force: true })).then(async () => {
        sequelize.query("SET FOREIGN_KEY_CHECKS=1");

        let userPromises: Promise<User>[] = [];

        User.signUpUser({
            username: "admin",
            password: "password",
            email: `admin@mail.com`
        }).then(([user, key]) => {
            user.permissionLevel = 1;
            user.save();
        });

        for (let i = 0; i < 20; i++) {
            userPromises.push(User.signUpUser({
                username: generateNoSpaceText(2) + randInt(10, 99),
                password: "password",
                email: `${generateNoSpaceText(3, "-", false)}@mail.com`
            }).then(([user, key]) => user));
        }

        users = await Promise.all(userPromises);

        SessionKey.destroy({ where: {} });

        randomizeGame("League Of Legends", [
            "https://wallpaperaccess.com/full/217097.jpg",
            "https://inkhive.com/wp-content/uploads/2019/05/league-of-legends.jpg",
            "https://dotesports-media.nyc3.cdn.digitaloceanspaces.com/wp-content/uploads/2018/08/11091152/b2e83fab-31f4-4672-a745-1c3e9ed34912.jpg",
            "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRjrwY-WhRxWAYH16ACKC1N1tDQGDWu1EeCGUeMh7vKp62A1-vO"
        ], 12);

        randomizeGame("Undertale", [
            "https://www.grabpcgames.com/wp-content/uploads/2018/10/full-pc-game-download-undertale.jpg",
            "https://www.gamersdecide.com/sites/default/files/styles/news_images/public/undertale_cover.jpg",
            "https://cdn.mos.cms.futurecdn.net/5nULLkfBtxNpjR5SmvmSw-1200-80.jpg",
            "https://sm.ign.com/ign_za/screenshot/u/undertale-/undertale-gameplay_yn31.jpg"
        ], 9);

        randomizeGame("Cyberpunk 2077", [
            "https://i.redd.it/citis0476wi41.jpg",
            "https://cdn.mos.cms.futurecdn.net/rLh7Dh7EKo8F6zmDtXYp8W.jpg",
            "https://mp1st.com/wp-content/uploads/2020/03/Cyberpunk-2077-multiplayer.jpg",
            "https://pbs.twimg.com/media/D83hHvSVsAAw0HF.jpg"
        ], 18);

        randomizeGame("Doom Eternal", [
            "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRprUoldqC9sfoUiRCu0ZsEW6gfMCfTF_ZAH82EDN0ebp78fGKU",
            "https://venturebeat.com/wp-content/uploads/2020/01/doom-eternal-4.jpg?w=1200&strip=all",
            "https://cdn1.thr.com/sites/default/files/2019/06/doom_eternal-publicity-h_2019.jpg",
            "https://www.thesixthaxis.com/wp-content/uploads/2020/03/DoomEternal-RIL2.jpg"
        ], 18);
    });
})