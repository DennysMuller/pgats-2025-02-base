const request = require('supertest');
const app = require('../../../rest/app');
const { expect } = require('chai');

describe('Checkout API - External', () => {
    let server;
    let token;

    before(async () => {
        server = app.listen(3002);
        const user = {
            email: 'alice@email.com',
            password: '123456'
        };
        const res = await request(app).post('/api/users/login').send(user);
        token = res.body.token;
    });

    after((done) => {
        server.close(done);
    });

    describe('POST /api/checkout', () => {
        it('should process checkout successfully with credit card', async () => {
            const checkoutData = {
                items: [
                    { productId: 1, quantity: 2 },
                    { productId: 2, quantity: 1 }
                ],
                freight: 50,
                paymentMethod: 'credit_card',
                cardData: { number: '1234', expiry: '12/25', cvv: '123' }
            };

            const res = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send(checkoutData);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('valorFinal');
            // (100 * 2 + 200 * 1 + 50) * 0.95 = 427.5
            expect(res.body.valorFinal).to.equal(427.5);
        });

        it('should process checkout successfully with another payment method', async () => {
            const checkoutData = {
                items: [
                    { productId: 1, quantity: 1 }
                ],
                freight: 20,
                paymentMethod: 'boleto'
            };

            const res = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send(checkoutData);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('valorFinal');
            // 100 * 1 + 20 = 120
            expect(res.body.valorFinal).to.equal(120);
        });

        it('should return error for invalid token', async () => {
            const checkoutData = {
                items: [{ productId: 1, quantity: 1 }],
                freight: 10,
                paymentMethod: 'boleto'
            };

            const res = await request(app)
                .post('/api/checkout')
                .set('Authorization', 'Bearer invalidtoken')
                .send(checkoutData);

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('error', 'Token inválido');
        });

        it('should return error for non-existing product', async () => {
            const checkoutData = {
                items: [{ productId: 999, quantity: 1 }],
                freight: 10,
                paymentMethod: 'boleto'
            };

            const res = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send(checkoutData);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error', 'Produto não encontrado');
        });

        it('should return error for credit card payment without card data', async () => {
            const checkoutData = {
                items: [{ productId: 1, quantity: 1 }],
                freight: 10,
                paymentMethod: 'credit_card'
            };

            const res = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send(checkoutData);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error', 'Dados do cartão obrigatórios para pagamento com cartão');
        });
    });
});
