const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../../../graphql/app'); 
const userService = require('../../../src/services/userService');
const checkoutService = require('../../../src/services/checkoutService');
const { execute } = require('graphql');

describe('GraphQL API - Validar Checkout Controller', () => {

    afterEach(() => {
        sinon.restore();
    });

    describe('1 - Mutation: checkout', () => {
        it('Deve realizar um Checkout com sucesso', async () => {
            const dadosDoUsuario = { id: 1, email: 'pgats-turma2@example.com' };
            /* A constante resultadoDoCheckout vai receber o resultado da função. A função irá extrair a propriedade checkout de dentro dela, assim dentro da fução 
            há uma variável temporaria checkout, depois a função executa: renomeia a propriedade valorFinal para total."
            */
            const resultadoDoCheckout = (({ checkout }) => ({
                ...checkout, // Copia as propriedades do objeto checkout
                total: checkout.valorFinal // Adiciona a propriedade 'total' com o valor de 'valorFinal'
                }
            ))(require('../fixture/respostas/checkoutCartao.json').data);
            const validarToken = sinon.stub(userService, 'verifyToken').returns(dadosDoUsuario);
            const checkoutValido = sinon.stub(checkoutService, 'checkout').returns(resultadoDoCheckout);
            const checkoutMutation = require('../fixture/requisicoes/checkout/checkoutCartao.json');

            const res = await request(app)
                .post('/graphql')
                .set('Authorization', 'Bearer PAGATS-token-JWT-Turma2')
                .send({ 
                    query: checkoutMutation.query, 
                    variables: checkoutMutation.variables 
                });
            // console.log(res.body);
            // console.log(checkoutMutation);
            expect(res.status).to.equal(200);
            expect(validarToken.calledOnceWith('PAGATS-token-JWT-Turma2')).to.be.true;
            // console.log(resultadoDoCheckout);
            expect(checkoutValido.calledOnceWith(
                dadosDoUsuario.id, 
                resultadoDoCheckout.items, 
                resultadoDoCheckout.freight, 
                resultadoDoCheckout.paymentMethod)).to.be.true;
            expect(res.body.data.checkout.valorFinal).to.equal(resultadoDoCheckout.total);
        });

        it('Validar uso de um "Token inválido"', async () => {
            const validarToken = sinon.stub(userService, 'verifyToken').returns(null);
            const checkoutStub = sinon.stub(checkoutService, 'checkout');

            const checkoutMutation = require('../fixture/requisicoes/checkout/checkoutBoleto.json');
            //const checkoutVars = { items: [], freight: 0, paymentMethod: '' };

            const res = await request(app)
                .post('/graphql')
                .set('Authorization', 'Bearer invalid.token')
                .send({ query: 
                    checkoutMutation.query, 
                    variables: checkoutMutation.variables
                 });

            expect(res.status).to.equal(200);
            expect(validarToken.calledOnce).to.be.true;
            expect(checkoutStub.notCalled).to.be.true;
            expect(res.body.errors).to.be.an('array');
            expect(res.body.errors[0].message).to.equal('Token inválido');
        });
    });
});