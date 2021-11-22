// when and how connect/disconnect
const createRepo = (conn) => {
    const repo = {
        getUserById: async (id) => {
            const results = await conn.execute('SELECT u.id id, u.name name, u.pass pass, r.name role FROM user u JOIN role r ON r.id = u.role WHERE u.id=?', [id]);
            return results[0].length === 0 ? undefined : results[0][0];
        },
        getUserByName: async (login) => {
            const results = await conn.execute('SELECT u.id id, u.name name, u.pass pass, r.name role FROM user u JOIN role r ON r.id = u.role WHERE u.name=?', [login]);
            return results[0].length === 0 ? undefined : { id: results[0][0].id, name: results[0][0].name, pass: results[0][0].pass, role: results[0][0].role };
        },
        addUser: async (login, password) => {
            const newUser = [
                login,
                password, // hashed
                2,
            ];
            const results = await conn.execute('INSERT INTO user (name, pass, role) VALUES (?, ?, ?)', newUser);
            return (await repo.getUserById(results[0].insertId));
        },
        addRefreshFamily: async (userId) => {
            const newRefreshFamily = [
                userId,
                false,
            ];
            const results = await conn.execute('INSERT INTO refresh_family (user, has_been_compromised) VALUES (?, ?)', newRefreshFamily);
            return results[0].insertId;
        },
        addRefreshToken: async (token, familyId) => {
            const newRefreshToken = [
                token,
                familyId,
                false,
            ];
            return conn.execute('INSERT INTO refresh_token (value, family, has_been_used) VALUES (?, ?, ?)', newRefreshToken);
        },
        getRefreshToken: async (token) => {
            const results = await conn.execute('SELECT * FROM refresh_token WHERE value=?', [token]);
            return results[0].length === 0
                ? undefined
                : {
                    ...results[0][0],
                    has_been_used: results[0][0].has_been_used === 1,
                };
        },
        getRefreshFamily: async (familyId) => {
            const results = await conn.execute('SELECT * FROM refresh_family WHERE id=?', [familyId]);
            return results[0].length === 0
                ? undefined
                : {
                    ...results[0][0],
                    has_been_compromised: results[0][0].has_been_compromised === 1,
                };
        },
        markFamilyCompromised: async (familyId) => {
            return conn.execute('UPDATE refresh_family SET has_been_compromised=1 WHERE id=?', [familyId]);
        },
        markTokenUsed: async (tokenId) => {
            return conn.execute('UPDATE refresh_token SET has_been_used=1 WHERE id=?', [tokenId]);
        },
        invalidateRefreshTokenFamiliesForUser: async (id) => {
            return conn.execute('UPDATE refresh_family rf SET rf.has_been_compromised=1 WHERE rf.user=?', [id]);
        }
    };
    return repo;
};

module.exports = { createRepo };
