const vue = new Vue({
    el: "#app",
    data: {
        username: "",
        password: "",
        email: "",
        error: null,
        userCTX
    },
    methods: {
        login: function() {
            userCTX.login(vue.email, vue.password).then(({error, data}) => {
                if (error) vue.error = error;
                else window.open("/", "_self");
            });
        },

        register: function() {
            userCTX.signup(vue.username, vue.email, vue.password).then(({error, data}) => {
                console.log(error, data)
                if (error) vue.error = error;
            //     else window.open("/", "_self");
            });
        }
    }
});