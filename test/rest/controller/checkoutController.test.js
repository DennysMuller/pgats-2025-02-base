const request = require('supertest');
const sinon = require('sinon');
const { expect } = require('chai');
const app = require('../../../rest/app');
const checkoutService = require('../../../src/services/checkoutService');
const userService = require('../../../src/services/userService');

describe('1 - Validar o Checkout Controller', () => {
    let verifyTokenStub, checkoutStub;

    before(() => {
        verifyTokenStub = sinon.stub(userService, 'verifyToken');
        checkoutStub = sinon.stub(checkoutService, 'checkout');
    });

    after(() => {
        sinon.restore();
    });

    describe('Validar "Registrar checkout" POST /api/checkout', () => {
        it('Simular um "Checkout realizado" com sucesso', async () => {
            const dadosUsuarios = { id: 5, email: 'pgats-turma2@example.com' };
            const resultadoCheckout = { total: 100.97 };
            verifyTokenStub.returns(dadosUsuarios);
            checkoutStub.returns({ ...resultadoCheckout, paymentMethod: 'boleto', valorFinal: 100.97, freight: 10 });

            const res = await request(app)
                .post('/api/checkout')
                .set('Authorization', 'Bearer pagats-token-valido')
                .send({ items: [], freight: 10, paymentMethod: 'boleto' });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('valorFinal', 100.97);
            expect(res.body).to.have.property('paymentMethod', 'boleto');
            expect(res.body).to.have.property('freight', 10);
        });

        it('Simular um uso de um "Token inválido"', async () => {
            verifyTokenStub.returns(null);

            const res = await request(app)
                .post('/api/checkout')
                .set('Authorization', 'Bearer pagats-token-invalido')
                .send({ items: [], freight: 10, paymentMethod: 'boleto' });

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('error', 'Token inválido');
        });

        it('Validar "Erro no checkout", ', async () => {
            const dadosUsuarios = { id: 1, email: 'pgats-turma2@example.com' };
            verifyTokenStub.returns(dadosUsuarios);
            checkoutStub.throws(new Error('Error: Bad Request'));

            const res = await request(app)
                .post('/api/checkout')
                .set('Authorization', 'Bearer pagats-token-valido')
                .send({ items: [], freight: 10, paymentMethod: 'boleto' });

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error', 'Error: Bad Request');
        });

    });
});
