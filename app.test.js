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
    it('should say hello', (done) => {
        request(app)
            .get('/')
            .expect('Content-Type', /text\/html/)
            .expect(200, 'Hello World', done);
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
        it('should return access and refresh tokens', () => {
            return request(app)
                .post('/signup')
                .send({login: 'bob_dylan', password: 'abcdef'})
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('token');
                    expect(response.body).toHaveProperty('refreshToken');
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
        it('should return access and refresh tokens', () => {
            return request(app)
                .post('/login')
                .send({ login: 'Adrian', password: 'abcdef'})
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('token');
                    expect(response.body).toHaveProperty('refreshToken');
                });
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
                .send({ refreshToken: 'rf_of_compromised_family' })
                .expect(401);
        });
        it('should reject with 401 if token has been used', () => {
            return request(app)
                .post('/refresh')
                .send({ refreshToken: 'used_rf' })
                .expect(401);
        });
        it('should return new access and refresh tokens otherwise', () => {
            return request(app)
                .post('/refresh')
                .send({ refreshToken: 'ok_rf' })
                .expect(200)
                .then((response) => {
                    expect(response.body).toHaveProperty('token');
                    expect(response.body).toHaveProperty('refreshToken');
                });
        });
    });
});
