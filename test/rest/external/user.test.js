const request = require('supertest');
const app = require('../../../rest/app');
const { expect } = require('chai');

describe('User API - External', () => {
    let server;

    before((done) => {
        server = app.listen(3001, done);
    });

    after((done) => {
        server.close(done);
    });

    describe('POST /api/users/register', () => {
        it('should register a new user', async () => {
            const newUser = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/users/register')
                .send(newUser);

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('id');
            expect(res.body.name).to.equal(newUser.name);
            expect(res.body.email).to.equal(newUser.email);
        });

        it('should not register an existing user', async () => {
            const existingUser = {
                name: 'Alice',
                email: 'alice@email.com',
                password: '123'
            };

            const res = await request(app)
                .post('/api/users/register')
                .send(existingUser);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('message', 'User already exists');
        });
    });

    describe('POST /api/users/login', () => {
        it('should login an existing user', async () => {
            const user = {
                email: 'alice@email.com',
                password: '123456'
            };

            const res = await request(app)
                .post('/api/users/login')
                .send(user);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('token');
        });

        it('should not login with incorrect password', async () => {
            const user = {
                email: 'alice@email.com',
                password: 'wrongpassword'
            };

            const res = await request(app)
                .post('/api/users/login')
                .send(user);

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('message', 'Invalid credentials');
        });

        it('should not login a non-existing user', async () => {
            const user = {
                email: 'nonexistent@example.com',
                password: 'password'
            };

            const res = await request(app)
                .post('/api/users/login')
                .send(user);

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('message', 'Invalid credentials');
        });
    });
});
