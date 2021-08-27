const express = require('express');
const bcrypt = require('bcrypt');

const createApp = (repo, tokenManager) => {
    const app = express();
    app.use(express.json());
    app.get('/', (req, res) => {
        res.send('Hello World');
    });
    app.post('/signup', async (req, res) => {
        // are ther login and pass in request?
        const body = req.body;
        if (body.login === undefined || body.password === undefined) {
            res.status(400);
            res.send();
            return;
        }
        // if no respond 400
        // else get user with this login from repo
        try {
        const user = await repo.getUserByName(body.login);
        // if he exists respond with 200 + message: 'login taken'
        if (user !== undefined) {
            res.status(200);
            res.send({ message: 'Login already taken' });
            return;
        }
        // else hash password,
        const hash = bcrypt.hashSync(body.password, 10);
        // insert user (name, hpass, role 1) into repo,
        const newUser = await repo.addUser(body.login, hash);
        // generate tokens,
        const tokens = await tokenManager.getTokens({ name: newUser.name, role: newUser.role });
        // insert new token family,
            // addRefreshFamily -return id
        const newRefreshFamilyId = await repo.addRefreshFamily(newUser.id);
        // insert new ref. token,
        await repo.addRefreshToken(tokens.refreshToken, newRefreshFamilyId);
        // send tokens
        res.send(tokens);
        } catch (e) {
            res.status(500);
            res.send({ message: e.message });
        }
    });
    app.post('/login', async (req, res) => {
        // are there login/pass?
        const { body } = req;
        if (body.login === undefined || body.password === undefined) {
            res.status(400);
            res.send();
            return;
        }
        // if no, go 400
        const user = await repo.getUserByName(body.login);
        // else get corresp user from repo (with hashed pass)
        if (user === undefined) {
            res.status(401);
            res.send();
            return;
        }
        if (!bcrypt.compareSync(body.password, user.pass)) {
            res.status(401);
            res.send();
            return;
        }
        // if no such user, go 401
        // else create ref family, tokens, return them
        const tokens = await tokenManager.getTokens({ name: user.name, role: user.role });
        // insert new token family,
        const newRefreshFamilyId = await repo.addRefreshFamily(user.id);
        // insert new ref. token,
        await repo.addRefreshToken(tokens.refreshToken, newRefreshFamilyId);
        // send tokens
        res.send(tokens);
    });
    app.post('/refresh', async (req, res) => {
        // check fields
        const { body } = req;
        if (body.refreshToken === undefined) {
            res.status(400);
            res.send();
            return; //a
        }
        // no ? 400
        const token = await repo.getRefreshToken(body.refreshToken);
        if (token === undefined) {
            res.status(401);
            res.send();
            return;
        }
        // else get token and its family from repo
        const tokenFamily = await repo.getRefreshFamily(token.family);
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
            await repo.markFamilyCompromised(tokenFamily.id);
            res.status(401);
            res.send();
            return;
        }
        // then mark family compromised and go 401
        // else mark token used,
        await repo.markTokenUsed(token.id);
        const user = await repo.getUserById(tokenFamily.user);
        const tokens = await tokenManager.getTokens({ name: user.name, role: user.role });
        // gen new tokens
        await repo.addRefreshToken(tokens.refreshToken, tokenFamily.id);
        // insert refresh token with existing family
        // send tokens
        res.send(tokens);
    });
    app.get('/user', async (req, res) => {
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
            res.status(401);
            res.send();
            return;
        }
        const token = req.headers.authorization.substr(7);
        if (!tokenManager.verify(token)) {
            res.status(401);
            res.send();
            return;
        }
        const data = tokenManager.decode(token);
        res.send(data);
    });
    return app;
};

module.exports = { createApp };
