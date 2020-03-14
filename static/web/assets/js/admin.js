const vue = new Vue({
    el: "#app",
    data: {
        createGameData: Game.loadCache() || new Game(null, "", "", null),
        createGameError: null,
        userCTX
    },
    methods: {
        createGame: function() {
            vue.createGameData.rating = parseInt(vue.createGameData.rating);
            vue.createGameData.save().then(({error, data}) => {
                if (error) vue.createGameError = error;
                else {
                    vue.createGameData = new Game(null, "", "", "");
                    vue.createGameError = null;
                    window.open("/game/" + data.id, "_blank");
                    Game.clearCache();
                }
            });
        }
    }
});