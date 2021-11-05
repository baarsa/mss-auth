const request = require('supertest');
const { createApp } = require('./app');
const { createMockRepo, createMockTokenGenerator } = require('./mocks');

let mockRepo;
let mockTokenGenerator;
let app;
// What is this test (unit, integration) and should we test changes/interaction with repo?

describe('app', () => {
    beforeEach(() => {
        mockRepo = createMockRepo();
        mockTokenGenerator = createMockTokenGenerator();
        app = createApp(mockRepo, mockTokenGenerator);
    });
    beforeAll(() => {
        expect.extend({
            toHaveCookie: (headers, cookieName) => {
                return {
                    message: () => `Expected ${headers} to contain cookie ${cookieName}`,
                    pass: headers['set-cookie'] !== undefined
                    && headers['set-cookie'].some(cookie => cookie.startsWith(cookieName)) };
            },
        });
    });
    describe('/signup', () => {
        it('should reject with 400 if request doesnt contain login', () => {
            return request(app)
                .post('/signup')
                .send({password: 'abcdef'})
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(400);
        });
        // todo add more cases
        it('should return access token and set refreshToken cookie', () => {
            return request(app)
                .post('/signup')
                .send({login: 'bob_dylan', password: 'abcdef'})
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('token');
                    expect(response.headers).toHaveCookie('refreshToken');
                });
        });
    });
    describe('/login', () => {
        it('should reject with 401 for wrong credentials', () => {
            return request(app)
                .post('/login')
                .send({ login: 'Adrian', password: 'abcdefg'})
                .expect(401);
        });
        it('should return access token and set refreshToken cookie', () => {
            return request(app)
                .post('/login')
                .send({ login: 'Adrian', password: 'abcdef'})
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('token');
                    expect(response.headers).toHaveCookie('refreshToken');
                });
        });
    });
    describe('/logout', () => {
        it('should reject with 400 if request doesnt contain token', () => {
            return request(app)
                .post('/logout')
                .send({ })
                .expect(400);
        });
        it('should return 200 otherwise', () => {
            return request(app)
                .post('/logout')
                .set('Cookie', ['refreshToken=ok_rf'])
                .send()
                .expect(200);
        });
    });
    describe('/refresh', () => {
        it('should reject with 400 if request doesnt contain token', () => {
            return request(app)
                .post('/refresh')
                .send({ })
                .expect(400);
        });
        it('should reject with 401 if token family has been compromised', () => {
            return request(app)
                .post('/refresh')
                .set('Cookie', ['refreshToken=rf_of_compromised_family'])
                .send()
                .expect(401);
        });
        it('should reject with 401 if token has been used', () => {
            return request(app)
                .post('/refresh')
                .set('Cookie', ['refreshToken=used_rf'])
                .send()
                .expect(401);
        });
        it('should return new access and refresh tokens otherwise', () => {
            return request(app)
                .post('/refresh')
                .set('Cookie', ['refreshToken=ok_rf'])
                .send()
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('token');
                    expect(response.headers).toHaveCookie('refreshToken');
                });
        });
    });
    describe('/user', () => {
        it('should reject with 401 if no token', () => {
            return request(app)
                .get('/user')
                .expect(401);
        });
        it('should reject with 401 if token is invalid', () => {
            return request(app)
                .get('/user')
                .set({ Authorization: 'Bearer example-token-invalid' })
                .expect(401);
        });
        it('should return user name and role', () => {
            return request(app)
                .get('/user')
                .set({ Authorization: 'Bearer example-token-valid' })
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('name');
                    expect(response.body).toHaveProperty('role');
                });
        });
    });
});
