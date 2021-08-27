const crs = require('crypto-random-string');

const createMockRepo = () => {
    const users = [
        { id: 1, login: 'Adrian', pass: '$2b$10$Vr4NNENrBAQCkUo4uyLMtOEOYhSr.kPhV9yE2ddUk2.20wKfgYf32', role: 1 },
        { id: 2, login: 'Benjamin', pass: '$2b$10$Vr4NNENrBAQCkUo4uyLMtOEOYhSr.kPhV9yE2ddUk2.20wKfgYf32', role: 1 }
    ];
    let currentUserId = 1;
    const refreshFamilies = [
        {
            id: 1,
            user: 1,
            has_been_compromised: false,
        },
        {
            id: 2,
            user: 2,
            has_been_compromised: true,
        }
    ];
    let currentFamilyId = 2;
    const refreshTokens = [
        {
            id: 1,
            value: 'ok_rf',
            family: 1,
            has_been_used: false,
        },
        {
            id: 2,
            value: 'rf_of_compromised_family',
            family: 2,
            has_been_used: false,
        },
        {
            id: 3,
            value: 'used_rf',
            family: 1,
            has_been_used: true,
        },
    ];
    let currentTokenId = 3;
    const mockRepo = {
        getUserById: (id) => users.find(user => user.id === id),
        getUserByName: (login) => users.find(user => user.login === login),
        getUserByNameAndPassword: (login, password) => users.find(user => user.login === login && user.password === password),
        addUser: (login, password) => {
            const newUser = {
                id: ++currentUserId,
                login,
                password, // hashed
                role: 2,
            };
            users.push(newUser);
            return newUser;
        },
        addRefreshFamily: (userId) => refreshFamilies.push({
            id: ++currentFamilyId,
            user: userId,
            has_been_compromised: false,
        }),
        addRefreshToken: (token, familyId) => refreshTokens.push({
            id: ++currentTokenId,
            value: token,
            family: familyId,
            has_been_used: false,
        }),
        getRefreshToken: (token) => refreshTokens.find(item => item.value === token),
        getRefreshFamily: (familyId) => refreshFamilies.find(item => item.id === familyId),
        markFamilyCompromised: (familyId) => refreshFamilies.find(item => item.id === familyId).compromised = true,
        markTokenUsed: (tokenId) => refreshTokens.find(item => item.id === tokenId).used = true,
    };
    return mockRepo;
};

const createMockTokenGenerator = () => {
    const generatedTokens = [];
    const mockTokenGenerator = {
        getTokens: (data) => {
            const newTokens = {
                token: crs({ length: 60 }),
                refreshToken: crs({ length: 60 }),
            };
            generatedTokens.push(newTokens);
            return newTokens;
        },
        verify: (token) => token === 'example-token-valid',
        decode: () => ({ name: 'Charlie', role: 'admin' })
    };
    return mockTokenGenerator;
};

module.exports = { createMockRepo, createMockTokenGenerator };
