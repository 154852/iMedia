const vue = new Vue({
    el: "#app",
    data: {
        createGameData: new Game(null, "", "", ""),
        createGameError: null,
        userCTX
    },
    methods: {
        createGame: function() {
            vue.createGameData.save().then(({error, data}) => {
                if (error) vue.createGameError = error;
                else {
                    vue.createGameData = new Game(null, "", "", "");
                    vue.createGameError = null;
                    window.open("/game/" + data.id, "_blank");
                }
            });
        }
    }
});