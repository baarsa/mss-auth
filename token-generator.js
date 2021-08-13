const jwt = require('jsonwebtoken');
const crs = require('crypto-random-string');
const {
    JWT_SECRET,
    TOKEN_EXPIRATION,
} = process.env;

const tokenGenerator = {
    getTokens: async (data) => {
        const token = await jwt.sign(data, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
        return {
            token,
            refreshToken: crs({length: 60}),
        };
    }
};

module.exports = { tokenGenerator };
