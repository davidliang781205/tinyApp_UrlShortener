const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");


const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};



// *********************** Routing ***********************

app.get("/urls", (req, res) => {
    let templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars);
});

// -------------- urls Create --------------

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

// -------------- urls Update --------------
app.get("/urls/:id", (req, res) => {
    let templateVars = {
        shortURL: req.params.id,
        longURL: urlDatabase[req.params.id]
    };
    res.render("urls_show", templateVars);
});

app.post("/urls/:id/update", (req, res) => {
    let templateVars = {
        shortURL: req.params.id,
        longURL: urlDatabase[req.params.id]
    };
    urlDatabase[req.params.id] = checkHttpOnInput(req.body.longURL);
    res.redirect("/urls");
});


// -------------- urls Generate --------------

app.post("/urls", (req, res) => {
    let longURL = req.body.longURL;
    let shortenCode = generateRandomString();

    if (longURL.length < 1) {

    } else {
        urlDatabase[shortenCode] = checkHttpOnInput(longURL);

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
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
});




// *********************** 404 ***********************
app.use((request, response) => {
    response.status(404).send('Not Found\n');
})



// *********************** Port ***********************
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});



// *********************** Functions ***********************
function generateRandomString() {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 6; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function checkHttpOnInput(url) {
    if (url[0] != 'h' && url[1] != 't' && url[2] != 't' && url[3] != 'p') {
        url = 'http://' + url;
    }
    return url;
}