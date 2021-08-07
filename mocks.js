const crs = require('crypto-random-string');

const createMockRepo = () => {
    const users = [
        { id: 1, login: 'Adrian', password: '$2a$12$iYeWUaCfCzDLOYg14ZQUteYnk2x3Go8EmQSBa/K6PsksalCfauIpm', role: 1 },
        { id: 2, login: 'Benjamin', password: '$2a$12$iYeWUaCfCzDLOYg14ZQUteYnk2x3Go8EmQSBa/K6PsksalCfauIpm', role: 1 }
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
        getUserByName: (login) => users.find(user => user.login === login),
        addUser: (login, password) => users.push({
            id: ++currentUserId,
            login,
            password, // hashed
            role: 2,
        }),
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
        markFamilyCompromised: (familyId) => refreshFamilies.find(item => item.id === familyId).compromised = true,
        markTokenUsed: (tokenId) => refreshTokens.find(item => item.id === tokenId).used = true,
    };
    return mockRepo;
};

const createMockTokenGenerator = () => {
    const generatedTokens = [];
    const mockTokenGenerator = {
        getGeneratedTokens: () => generatedTokens,
        getTokens: (data) => {
            const newTokens = {
                token: crs({ length: 60 }),
                refreshToken: crs({ length: 60 }),
            };
            this.generatedTokens.push(newTokens);
            return newTokens;
        }
    };
    return mockTokenGenerator;
};

module.exports = { createMockRepo, createMockTokenGenerator };
