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
        it('should reject with 400 if request doesnt contain login', (done) => {
            request(app)
                .post('/signup')
                .send({password: 'abcdef'})
                .expect(400, done);
        });
        // todo add more cases
        it('should return access and refresh tokens', (done) => {
            request(app)
                .post('/signup')
                .send({login: 'bob_dylan', password: 'abcdef'})
                .expect(200, mockTokenGenerator.getGeneratedTokens[0], done);
        });
    });
    describe('/login', () => {
        it('should reject with 401 for wrong credentials', (done) => {
            request(app)
                .post('/login')
                .send({ login: 'Adrian', password: 'abcdefg'})
                .expect(401, done);
        });
        it('should return access and refresh tokens', (done) => {
            request(app)
                .post('/login')
                .send({ login: 'Adrian', password: 'abcdef'})
                .expect(200, mockTokenGenerator.getGeneratedTokens[0], done);
        });
    });
    describe('/refresh', () => {
        it('should reject with 400 if request doesnt contain token', (done) => {
            request(app)
                .post('/login')
                .send({ })
                .expect(400, done);
        });
        it('should reject with 401 if token family has been compromised', (done) => {
            request(app)
                .post('/login')
                .send({ token: 'rf_of_compromised_family' })
                .expect(401, done);
        });
        it('should reject with 401 if token has been used', (done) => {
            request(app)
                .post('/login')
                .send({ token: 'used_rf' })
                .expect(401, done);
        });
        it('should return new access and refresh tokens otherwise', (done) => {
            request(app)
                .post('/login')
                .send({ token: 'ok_rf' })
                .expect(200, mockTokenGenerator.getGeneratedTokens[0], done);
        });
    });
});
