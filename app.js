const express = require('express');
const bcrypt = require('bcrypt');

const createApp = (repo, tokenGenerator) => {
    const app = express();
    app.use(express.json());
    app.get('/', (req, res) => {
        res.send('Hello World');
    });
    app.post('/signup', (req, res) => {
        // are ther login and pass in request?
        const body = req.body;
        if (body.login === undefined || body.password === undefined) {
            res.status(400);
            res.send();
            return;
        }
        // if no respond 400
        // else get user with this login from repo
        const user = repo.getUserByName(body.login);
        // if he exists respond with 200 + message: 'login taken'
        if (user !== undefined) {
            res.status(200);
            res.send({ message: 'Login already taken' });
            return;
        }
        // else hash password,
        const hash = bcrypt.hashSync(body.password, 10);
        // insert user (name, hpass, role 1) into repo,
        const newUser = repo.addUser(body.login, hash);
        // generate tokens,
        const tokens = tokenGenerator.getTokens({ user: newUser.login, role: newUser.role });
        // insert new token family,
        const newRefreshFamily = repo.addRefreshFamily(newUser.id);
        // insert new ref. token,
        repo.addRefreshToken(tokens.refreshToken, newRefreshFamily.id);
        // send tokens
        res.send(tokens);
    });
    app.post('/login', (req, res) => {
        // are there login/pass?
        const { body } = req;
        if (body.login === undefined || body.password === undefined) {
            res.status(400);
            res.send();
            return;
        }
        // if no, go 400
        //const hashedPassword = bcrypt.hashSync(body.password, 10);
        //const user = repo.getUserByNameAndPassword(body.login, hashedPassword);
        const user = repo.getUserByName(body.login);
        // else get corresp user from repo (with hashed pass)
        if (user === undefined) {
            res.status(401);
            res.send();
            return;
        }
        if (!bcrypt.compareSync(body.password, user.password)) {
            res.status(401);
            res.send();
            return;
        }
        // if no such user, go 401
        // else create ref family, tokens, return them
        const tokens = tokenGenerator.getTokens({ user: user.login, role: user.role });
        // insert new token family,
        const newRefreshFamily = repo.addRefreshFamily(user.id);
        // insert new ref. token,
        repo.addRefreshToken(tokens.refreshToken, newRefreshFamily.id);
        // send tokens
        res.send(tokens);
    });
    app.post('/refresh', (req, res) => {
        // check fields
        const { body } = req;
        if (body.refreshToken === undefined) {
            res.status(400);
            res.send();
            return;
        }
        // no ? 400
        const token = repo.getRefreshToken(body.refreshToken);
        if (token === undefined) {
            res.status(401);
            res.send();
            return;
        }
        // else get token and its family from repo
        const tokenFamily = repo.getRefreshFamily(token.family);
        if (tokenFamily === undefined) {
            res.status(401);
            res.send();
            return;
        }
        // no ? 401
        // else if family compromised
        if (tokenFamily.has_been_compromised) {
            res.status(401);
            res.send();
            return;
        }
        // then go 401
        // else if token been used
        if (token.has_been_used) {
            repo.markFamilyCompromised(tokenFamily.id);
            res.status(401);
            res.send();
            return;
        }
        // then mark family compromised and go 401
        // else mark token used,
        repo.markTokenUsed(token.id);
        const user = repo.getUserById(tokenFamily.user);
        const tokens = tokenGenerator.getTokens({ user: user.login, role: user.role });
        // gen new tokens
        repo.addRefreshToken(tokens.refreshToken, tokenFamily.id);
        // insert refresh token with existing family
        // send tokens
        res.send(tokens);
    });
    return app;
};

module.exports = { createApp };
