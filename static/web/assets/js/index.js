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
        games: [],
        query: "",
        userCTX
    },
    methods: {
        readMore: () => smoothScroll(window.innerHeight, 300),
        search: () => {
            window.open("/search?q=" + encodeURIComponent(vue.query), "_self");
        }
    }
});

Game.getPreviews().then((games) => {
    vue.games = games;
});