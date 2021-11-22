const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const ERROR_MESSAGE = 'Error connecting to the database';

const createApp = (repo, tokenManager) => {
    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.post('/signup', async (req, res) => {
        // Check request parameters
        const body = req.body;
        if (body.login === undefined || body.password === undefined) {
            res.status(400);
            res.send();
            return;
        }
        // Else try to find user with this login from repo
        try {
            const user = await repo.getUserByName(body.login);
            // If he exists respond with 200 + message: 'login taken'
            if (user !== undefined) {
                res.status(200);
                res.send({ message: 'Login already taken' });
                return;
            }
            // Hash password
            const hash = bcrypt.hashSync(body.password, 10);
            // Add user to DB
            const newUser = await repo.addUser(body.login, hash);
            // Generate tokens
            const tokens = await tokenManager.getTokens({ name: newUser.name, role: newUser.role });
            // Add new refresh token and new family to DB
            const newRefreshFamilyId = await repo.addRefreshFamily(newUser.id);
            await repo.addRefreshToken(tokens.refreshToken, newRefreshFamilyId);
            // Send access token and set refresh token as a cookie
            res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, sameSite: 'strict' });
            res.send({
                token: tokens.token,
            });
        } catch (e) {
            res.status(500);
            res.send({ message: ERROR_MESSAGE });
        }
    });
    app.post('/login', async (req, res) => {
        // Check request parameters
        const { body } = req;
        if (body.login === undefined || body.password === undefined) {
            res.status(400);
            res.send();
            return;
        }
        // Get user record
        try {
            const user = await repo.getUserByName(body.login);
            if (user === undefined) {
                res.status(401);
                res.send();
                return;
            }
            // Verify password
            if (!bcrypt.compareSync(body.password, user.pass)) {
                res.status(401);
                res.send();
                return;
            }
            // Invalidate all previous refresh token families
            await repo.invalidateRefreshTokenFamiliesForUser(user.id);
            // Generate tokens
            const tokens = await tokenManager.getTokens({name: user.name, role: user.role});
            // Insert new token family,
            const newRefreshFamilyId = await repo.addRefreshFamily(user.id);
            // Insert new ref. token,
            await repo.addRefreshToken(tokens.refreshToken, newRefreshFamilyId);
            // Send access token and set refresh token as a cookie
            res.cookie('refreshToken', tokens.refreshToken, {httpOnly: true, sameSite: 'strict'});
            res.send({
                token: tokens.token,
            });
        } catch (e) {
            res.status(500);
            res.send({ message: ERROR_MESSAGE });
        }
    });
    app.post('/logout', async (req, res) => {
        // Request fields should include refreshToken
        const { cookies } = req;
        if (cookies.refreshToken === undefined) {
            res.status(400);
            res.send();
            return;
        }
        // Send 401 if token doesn't exist
        try {
            const token = await repo.getRefreshToken(cookies.refreshToken);
            if (token === undefined) {
                res.status(401);
                res.send();
                return;
            }
            // Send 401 if token family doesn't exist
            const tokenFamily = await repo.getRefreshFamily(token.family);
            if (tokenFamily === undefined) {
                res.status(401);
                res.send();
                return;
            }
            // Invalidate token family
            await repo.markFamilyCompromised(tokenFamily.id);
            // Drop refreshToken cookie and respond with success
            res.cookie('refreshToken', '');
            res.status(200);
            res.send();
        } catch (e) {
            res.status(500);
            res.send({ message: ERROR_MESSAGE });
        }
    })
    app.post('/refresh', async (req, res) => {
        // Check cookie
        const { cookies } = req;
        if (cookies.refreshToken === undefined) {
            res.status(400);
            res.send();
            return;
        }
        // Get refreshToken record
        try {
            const token = await repo.getRefreshToken(cookies.refreshToken);
            if (token === undefined) {
                res.status(401);
                res.send();
                return;
            }
            // Get token family
            const tokenFamily = await repo.getRefreshFamily(token.family);
            if (tokenFamily === undefined) {
                res.status(401);
                res.send();
                return;
            }
            // If family has been compromised respond with 401
            if (tokenFamily.has_been_compromised) {
                res.status(401);
                res.send();
                return;
            }
            // Else if token has been used
            // then mark family compromised and respond 401
            if (token.has_been_used) {
                await repo.markFamilyCompromised(tokenFamily.id);
                res.status(401);
                res.send();
                return;
            }
            // Else mark token used,
            await repo.markTokenUsed(token.id);
            const user = await repo.getUserById(tokenFamily.user);
            const tokens = await tokenManager.getTokens({name: user.name, role: user.role});
            // Generate new tokens
            // Insert refresh token with existing family
            await repo.addRefreshToken(tokens.refreshToken, tokenFamily.id);
            // Send access token and set refresh token as a cookie
            res.cookie('refreshToken', tokens.refreshToken, {httpOnly: true, sameSite: 'strict'});
            res.send({
                token: tokens.token,
            });
        } catch (e) {
            res.status(500);
            res.send({ message: ERROR_MESSAGE });
        }
    });
    app.get('/user', async (req, res) => {
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
            res.status(401);
            res.send();
            return;
        }
        try {
            const token = req.headers.authorization.substr(7);
            if (!tokenManager.verify(token)) {
                res.status(401);
                res.send();
                return;
            }
            const data = tokenManager.decode(token);
            res.send(data);
        } catch (e) {
            res.status(500);
            res.send({ message: ERROR_MESSAGE });
        }
    });
    return app;
};

module.exports = { createApp };
