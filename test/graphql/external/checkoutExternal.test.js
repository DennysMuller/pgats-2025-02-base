const request = require('supertest');
const { expect } = require('chai');
require('dotenv').config();

describe('GraphQL API - External Tests', () => {
    before(async function() {
        this.timeout(10000); 

        try {
            // 1. Verificar se a API GraphQL está online com uma query de introspecção válida
            const healthCheckRes = await request(process.env.BASE_URL_GRAPHQL)
                .post('')
                .send({ 
                    query: '{ __schema { types { name } } }'
                 }) 
                .timeout(5000);

            if (healthCheckRes.status >= 500) {
                throw new Error(`Servidor retornou status ${healthCheckRes.status}. Não está operando corretamente.`);
            }

            // 2. Fazer login para obter o token para os testes
            const loginUser = require('../fixture/requisicoes/login/loginUserValido.json')
            const resposta = await request(process.env.BASE_URL_GRAPHQL)
                .post('')
                .send(loginUser);

            if (!resposta.body.data || !resposta.body.data.login) {
                const errorMessage = resposta.body.errors ? resposta.body.errors[0].message : 'Resposta de login inválida';
                throw new Error(`Falha ao fazer login: ${errorMessage}`);
            }
            //console.log(resposta.body.data.login.token);
            token = resposta.body.data.login.token;
            expect(token).to.be.a('string');

        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error(`❌ Servidor não disponível em: ${process.env.BASE_URL_GRAPHQL}. Conexão recusada.`);
            }
            throw error;
        }
    });

    describe('1 - Validar Mutation: checkout', () => {
        it('Validar um checkout para um usuário autenticado com sucesso', async () => {
            const checkoutMutation = require('../fixture/requisicoes/checkout/checkoutCartao.json');

            const res = await request(process.env.BASE_URL_GRAPHQL)
                .post('')
                .set('Authorization', `Bearer ${token}`)
                .send({ 
                    query: checkoutMutation.query, 
                    variables: checkoutMutation.variables
                });
            
            // console.log(res.body.data.checkout.valorFinal);
            expect(res.status).to.equal(200);
            expect(res.body.data.checkout).to.have.property('valorFinal');
            expect(res.body.data.checkout.paymentMethod).to.equal(checkoutMutation.variables.paymentMethod);
            expect(res.body.data.checkout.items[0].productId).to.equal(checkoutMutation.variables.items[0].productId);
        });

        it('Validar um checkout para um usuário NÃO autenticado', async () => {
            const checkoutMutation = require('../fixture/requisicoes/checkout/checkoutBoleto.json');

            const res = await request(process.env.BASE_URL_GRAPHQL)
                .post('/graphql')
                .send({ 
                    query: checkoutMutation.query, 
                    variables: checkoutMutation.variables
                 });
            
            // console.log(res.body);
            expect(res.status).to.equal(200);
            expect(res.body.errors).to.be.an('array');
            expect(res.body.errors[0].message).to.equal('Token inválido');
        });
    });
});