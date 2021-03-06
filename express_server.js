const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');

app.use(express.static(__dirname + '/public'));
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'fluffybunny'],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const urlDatabase = {
    'b2xVn2': {
        url: 'http://www.lighthouselabs.ca',
        userID: 'a',
        dateCreated: new Date('2016', '0', '25').toISOString().slice(0, 10)
    },
    '9sm5xK': {
        url: 'http://www.google.com',
        userID: 'a',
        dateCreated: new Date().toISOString().slice(0, 10)
    },
    '123456': {
        url: 'http://www.facebook.com',
        userID: 'userRandomID',
        dateCreated: new Date().toISOString().slice(0, 10)
    }
};

const users = {
    'userRandomID': {
        id: 'userRandomID',
        email: 'user@example.com',
        password: bcrypt.hashSync('purple-monkey-dinosaur', 10)
    },
    'user2RandomID': {
        id: 'user2RandomID',
        email: 'user2@example.com',
        password: bcrypt.hashSync('dishwasher-funk', 10)
    },
    'a': {
        id: 'a',
        email: '123@456.com',
        password: bcrypt.hashSync('123', 10)
    }
}

// *********************** Functions ***********************
/**
 * Generate 6 random characters as shortURL 
 * @return {String} 
 */
function generateRandomString() {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 6; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

/**
 * Check if new url has http at front
 * @param {String} url
 * @return {String} 
 */
function checkHttpOnInput(url) {
    if (url[0] != 'h' && url[1] != 't' && url[2] != 't' && url[3] != 'p' && url[4] != ':') {
        url = 'http://' + url;
    }
    return url;
}

// *********************** Routing ***********************
app.get('/', (req, res) => {
    res.render('login');
});

app.get('/urls', (req, res) => {
    let userData = {};
    for (data in urlDatabase) {
        if (urlDatabase[data]['userID'] === req.session.userID) {
            userData[data] = urlDatabase[data];
        }
    }

    let templateVars = {
        user: users[req.session.userID],
        urls: userData
    };

    if (req.session.userID) {
        res.render('urls_index', templateVars);
    } else {
        res.status(401).render('error', {
            error_message: 'Please log in to access this page.',
            error_code: res.statusCode
        });
    }
});

// -------------- urls Create --------------

app.get('/urls/new', (req, res) => {
    let templateVars = {
        user: users[req.session.userID]
    }
    if (req.session.userID) {
        res.render('urls_new', templateVars);
    } else {
        res.status(401).render('error', {
            error_message: 'Please log in to access this page.',
            error_code: res.statusCode
        });
    }

});

// -------------- urls Update --------------
app.get('/urls/:id', (req, res) => {
    if (!urlDatabase[req.params.id]) {
        res.status(404).render('error', {
            error_message: 'Page not found.',
            error_code: res.statusCode
        });
    }

    if (req.session.userID === urlDatabase[req.params.id]['userID']) {
        let templateVars = {
            user: users[req.session.userID],
            shortURL: req.params.id,
            longURL: urlDatabase[req.params.id]['url']
        };
        res.render('urls_show', templateVars);
    } else {
        res.status(403).render('error', {
            error_message: 'Forbidden.  Only owner of this url can edit this.',
            error_code: res.statusCode
        });
    }


});

app.post('/urls/:id/update', (req, res) => {
    if (req.session.userID === urlDatabase[req.params.id]['userID']) {
        urlDatabase[req.params.id] = {
            url: checkHttpOnInput(req.body.longURL),
            userID: req.session.userID,
            dateCreated: new Date().toISOString().slice(0, 10)
        };
        res.redirect('/urls');
    } else {
        res.status(403).render('error', {
            error_message: 'Forbidden.  Only owner of this url can edit this.',
            error_code: res.statusCode
        });
    }
});


// -------------- urls Generate --------------

app.post('/urls', (req, res) => {
    let longURL = req.body.longURL;
    let shortenCode = generateRandomString();

    urlDatabase[shortenCode] = {
        url: checkHttpOnInput(longURL),
        userID: req.session.userID,
        dateCreated: new Date().toISOString().slice(0, 10)
    };

    res.redirect(`/urls/${shortenCode}`);

});

// -------------- urls Delete --------------

app.post('/urls/:id/delete', (req, res) => {
    if (req.session.userID === urlDatabase[req.params.id]['userID']) {
        delete urlDatabase[req.params.id];
    } else {
        res.status(403).render('error', {
            error_message: 'Forbidden.  Only owner of this url can delete this.',
            error_code: res.statusCode
        });
    }

    res.redirect('/urls');
});

// -------------- urls Redirect --------------

app.get('/u/:shortURL', (req, res) => {
    let longURL = urlDatabase[req.params.shortURL]['url'];

    res.redirect(longURL);
});

// -------------- urls Login/out --------------
app.post('/login', (req, res) => {
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
        res.status(401).render('error', {
            error_message: 'User not found.',
            error_code: res.statusCode
        });
    } else {
        // Check password
        if (bcrypt.compareSync(userPassword, currentUser.password)) {
            req.session.userID = currentUser.id;
            res.redirect('/urls');
        } else {
            res.status(401).render('error', {
                error_message: 'Incorrect Email or Password.',
                error_code: res.statusCode
            });
        }
    }
});

app.post('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

// -------------- urls register --------------

app.get('/register', (req, res) => {
    let templateVars = {
        user: users[req.session.userID]
    };

    res.render('register', templateVars);
});

app.post('/register', (req, res) => {
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
        req.session.userID = userID;
        users[userID] = {
            id: userID,
            email: userEmail,
            password: bcrypt.hashSync(userPassword, 10)
        }
        res.redirect('/urls');
    }
});
// *********************** Error Message ***********************



// *********************** 404 ***********************
app.use((req, res) => {
    res.status(404).render('error', {
        error_message: 'Page not found.',
        error_code: res.statusCode
    });
})



// *********************** Port ***********************
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});