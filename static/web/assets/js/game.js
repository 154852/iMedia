function smoothScroll(to, millis) {
    let startS = window.scrollY;
    let startT = Date.now();
    
    let interval = setInterval(() => {
        let now = Date.now();
        if (now > startT + millis) {
            window.scrollTo(0, to);
            clearInterval(interval);
            return;
        }

        let elapsed = (now - startT) / millis;
        window.scrollTo(0, ((to - startS) * elapsed) + startS);
    }, 3);
}

const vue = new Vue({
    el: "#app",
    data: {
        game: null,
        create: new GameReview(null, "", "", null, 1, null),
        error: null,
        userCTX, lang, accessibility
    },
    methods: {
        createReview: function() {
            GameReview.create(
                vue.create.title,
                vue.create.body,
                vue.game,
                vue.create.starRating
            ).then(({error, review}) => {
                if (error) vue.error = error;
                else {
                    vue.create = new GameReview(null, "", "");
                    vue.error = null;
                    GameReview.clearCache(vue.game.id);
                }
            });
        },
        readMore: () => smoothScroll(window.innerHeight, 300)
    }
});

let gameID = window.location.pathname.match(/\/game\/([0-9]+)/)[1];

Game.getFullList(gameID).then((game) => {
    vue.game = game;
    vue.create = GameReview.loadCache(game.id) || vue.create;
});