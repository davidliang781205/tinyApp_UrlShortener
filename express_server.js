const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");


const urlDatabase = {
    "b2xVn2": {
        url: "http://www.lighthouselabs.ca",
        userID: "a"
    },
    "9sm5xK": {
        url: "http://www.google.com",
        userID: "a"
    },
    "123456": {
        url: "http://www.facebook.com",
        userID: "userRandomID"
    }
};

const users = {
    "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur"
    },
    "user2RandomID": {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk"
    },
    "a": {
        id: "a",
        email: "123@456.com",
        password: "123"
    }
}





// *********************** Routing ***********************
app.get("/", (req, res) => {
    res.render("login");
});

app.get("/urls", (req, res) => {
    let userData = {};
    for (data in urlDatabase) {
        if (urlDatabase[data]['userID'] === req.cookies["userID"]) {
            userData[data] = urlDatabase[data]['url'];
        }
    }

    let templateVars = {
        user: users[req.cookies["userID"]],
        urls: userData
    };

    if (req.cookies["userID"]) {
        res.render("urls_index", templateVars);
    } else {
        res.redirect('/');
    }
});

// -------------- urls Create --------------

app.get("/urls/new", (req, res) => {
    let templateVars = {
        user: users[req.cookies["userID"]]
    }
    if (req.cookies["userID"]) {
        res.render("urls_new", templateVars);
    } else {
        res.redirect('/');
    }

});

// -------------- urls Update --------------
app.get("/urls/:id", (req, res) => {
    let templateVars = {
        user: users[req.cookies["userID"]],
        shortURL: req.params.id,
        longURL: urlDatabase[req.params.id]['url']
    };

    if (req.cookies["userID"]) {
        res.render("urls_show", templateVars);
    } else {
        res.redirect('/');
    }
});

app.post("/urls/:id/update", (req, res) => {
    urlDatabase[req.params.id] = {
        url: checkHttpOnInput(req.body.longURL),
        userID: req.cookies["userID"]
    };
    res.redirect("/urls");
});


// -------------- urls Generate --------------

app.post("/urls", (req, res) => {
    let longURL = req.body.longURL;
    let shortenCode = generateRandomString();

    if (longURL.length < 1) {

    } else {
        urlDatabase[shortenCode] = {
            url: checkHttpOnInput(longURL),
            userID: req.cookies["userID"]
        };
    }
    res.redirect(`/urls/${shortenCode}`);

});

// -------------- urls Delete --------------

app.post("/urls/:id/delete", (req, res) => {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');

});

// -------------- urls Redirect --------------

app.get("/u/:shortURL", (req, res) => {
    let longURL = urlDatabase[req.params.shortURL]['url'];
    res.redirect(longURL);
});

// -------------- urls Login/out --------------
app.post("/login", (req, res) => {
    let userEmail = req.body.email;
    let userPassword = req.body.password;
    let currentUser;
    for (user in users) {
        // Check if email exists in current record 
        if (users[user].email === userEmail) {
            currentUser = users[user];
        }
    }
    // If cannot find user
    if (!currentUser) {
        res.status(400).render('error', {
            error_message: 'User not found.',
            error_code: res.statusCode
        });
    } else {
        // Check password
        if (currentUser.password === userPassword) {
            res.cookie('userID', currentUser.id);
            res.redirect("/urls");
        } else {
            res.status(400).render('error', {
                error_message: 'Incorrect Email or Password.',
                error_code: res.statusCode
            });
        }
    }

});

app.post("/logout", (req, res) => {
    res.clearCookie('userID');
    res.redirect("/");
});

// -------------- urls register --------------

app.get("/register", (req, res) => {
    let templateVars = {
        user: users[req.cookies["userID"]]
    };
    res.render('register', templateVars);
});

app.post("/register", (req, res) => {
    let userEmail = req.body.email;
    let userPassword = req.body.password;
    let userID = generateRandomString();
    let userExist = false;

    for (key in users) {
        if (users[key].email === userEmail) {
            userExist = true;
        }
    }

    if (userExist) {
        res.status(400).render('error', {
            error_message: 'This email has already registered.',
            error_code: res.statusCode
        });
    } else {
        res.cookie('userID', userID);
        users[userID] = {
            id: userID,
            email: userEmail,
            password: userPassword
        }
        res.redirect('/urls');

    }


});
// *********************** Error Message ***********************



// *********************** 404 ***********************
app.use((request, response) => {
    response.status(404).send('Not Found\n');
})



// *********************** Port ***********************
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});



// *********************** Functions ***********************

// Generate 6 random characters as shortURL 
function generateRandomString() {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 6; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

// Check if new url has http at front
function checkHttpOnInput(url) {
    if (url[0] != 'h' && url[1] != 't' && url[2] != 't' && url[3] != 'p') {
        url = 'http://' + url;
    }
    return url;
}