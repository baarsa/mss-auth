const jwt = require('jsonwebtoken');
const crs = require('crypto-random-string');
const {
    JWT_SECRET,
    TOKEN_EXPIRATION,
} = process.env;

const tokenManager = {
    getTokens: async (data) => {
        const token = await jwt.sign(data, JWT_SECRET, { expiresIn: Number(TOKEN_EXPIRATION) });
        return {
            token,
            refreshToken: crs({length: 60}),
        };
    },
    verify: (token) => {
        try {
            jwt.verify(token, JWT_SECRET);
            return true;
        } catch (e) {
            return false;
        }
    },
    decode: (token) => jwt.decode(token),
};

module.exports = { tokenManager };
