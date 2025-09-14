const request = require('supertest');
const { expect } = require('chai');
require('dotenv').config();

// Use the env variable if available, otherwise fallback to localhost:4000
const BASE_URL = process.env.BASE_URL_GRAPHQL || 'http://localhost:4000';

describe('GraphQL API - External Tests', () => {
    let token;

    before(async function() {
        this.timeout(10000);
        try {
            // A simple query to check if the server is up
            const healthCheckRes = await request(BASE_URL)
                .post('/graphql')
                .send({ query: '{ __schema { types { name } } }' })
                .timeout(5000);

            if (healthCheckRes.status !== 200) {
                throw new Error('GraphQL server not responding correctly');
            }

            // Login to get a token for authenticated tests
            const loginMutation = `
                mutation Login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        token
                    }
                }
            `;
            const loginVars = { email: 'alice@email.com', password: '123456' };

            const res = await request(BASE_URL)
                .post('/graphql')
                .send({ query: loginMutation, variables: loginVars });

            if (res.body.errors) {
                 throw new Error(`Login failed in before hook: ${res.body.errors[0].message}`);
            }
            
            token = res.body.data.login.token;
            expect(token).to.be.a('string');

        } catch (error) {
            throw new Error(`❌ Server not available at: ${BASE_URL} :/ Connection refused - Server offline. Error: ${error.message}`);
        }
    });

    describe('Mutation: register', () => {
        it('should register a new user', async () => {
            const registerMutation = `
                mutation Register($name: String!, $email: String!, $password: String!) {
                    register(name: $name, email: $email, password: $password) {
                        name
                        email
                    }
                }
            `;
            const userVars = {
                name: 'GraphQL User',
                email: `test.user.${Date.now()}@example.com`,
                password: 'password123'
            };

            const res = await request(BASE_URL)
                .post('/graphql')
                .send({ query: registerMutation, variables: userVars });

            expect(res.status).to.equal(200);
            expect(res.body.data.register.name).to.equal(userVars.name);
            expect(res.body.data.register.email).to.equal(userVars.email);
        });

        it('should not register a user with an existing email', async () => {
            const registerMutation = `
                mutation Register($name: String!, $email: String!, $password: String!) {
                    register(name: $name, email: $email, password: $password) {
                        name
                        email
                    }
                }
            `;
            const userVars = {
                name: 'Alice',
                email: 'alice@email.com',
                password: 'password123'
            };

            const res = await request(BASE_URL)
                .post('/graphql')
                .send({ query: registerMutation, variables: userVars });

            expect(res.status).to.equal(200);
            expect(res.body.errors).to.be.an('array');
            expect(res.body.errors[0].message).to.equal('Email já cadastrado');
        });
    });

    describe('Query: users', () => {
        it('should return a list of users', async () => {
            const usersQuery = '{ users { name email } }';

            const res = await request(BASE_URL)
                .post('/graphql')
                .send({ query: usersQuery });

            expect(res.status).to.equal(200);
            expect(res.body.data.users).to.be.an('array');
            expect(res.body.data.users.length).to.be.greaterThan(0);
            expect(res.body.data.users[0]).to.have.property('name');
            expect(res.body.data.users[0]).to.have.property('email');
        });
    });

    describe('Mutation: checkout', () => {
        it('should perform a checkout for an authenticated user', async () => {
            const checkoutMutation = `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod) {
                        valorFinal
                        paymentMethod
                        items {
                            productId
                            quantity
                        }
                    }
                }
            `;
            const checkoutVars = {
                items: [{ productId: 1, quantity: 1 }],
                freight: 10.5,
                paymentMethod: 'credit_card'
            };

            const res = await request(BASE_URL)
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({ query: checkoutMutation, variables: checkoutVars });

            expect(res.status).to.equal(200);
            expect(res.body.data.checkout).to.have.property('valorFinal');
            expect(res.body.data.checkout.paymentMethod).to.equal(checkoutVars.paymentMethod);
            expect(res.body.data.checkout.items[0].productId).to.equal(checkoutVars.items[0].productId);
        });

        it('should not perform a checkout for an unauthenticated user', async () => {
            const checkoutMutation = `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod) {
                        valorFinal
                    }
                }
            `;
             const checkoutVars = {
                items: [{ productId: 1, quantity: 1 }],
                freight: 10.5,
                paymentMethod: 'credit_card'
            };

            const res = await request(BASE_URL)
                .post('/graphql')
                .send({ query: checkoutMutation, variables: checkoutVars });

            expect(res.status).to.equal(200);
            expect(res.body.errors).to.be.an('array');
            expect(res.body.errors[0].message).to.equal('Token inválido');
        });
    });
});