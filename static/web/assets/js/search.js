const vue = new Vue({
    el: "#app",
    data: {
        games: [],
        query: decodeURIComponent(window.location.hash.split("#")[1] || ""),
        userCTX, lang,
        timeout: null,
        toAdd: []
    },
    methods: {
        search: () => {
            window.location.hash = "#" + vue.query;
            Game.search(vue.query).then((games) => {
                vue.games.splice(0, vue.games.length);
                vue.toAdd = games;

                if (vue.timeout == null) Vue.nextTick().then(() => {
                    vue.timeout = setTimeout(() => {
                        vue.games.push(...vue.toAdd)
                        vue.timeout = null;
                    }, 300);
                });
            });
        }
    }
});

if (vue.query != "") vue.search();