const vue = new Vue({
    el: "#app",
    data: {
        games: [],
        query: decodeURIComponent(window.location.search.split("=")[1] || ""),
        userCTX
    },
    methods: {
        search: () => {
            Game.search(vue.query).then((games) => {
                vue.games.splice(0, vue.games.length);
                vue.games.push(...games);
            });
        }
    }
});

if (vue.query != "") vue.search();