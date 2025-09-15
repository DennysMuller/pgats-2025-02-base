const request = require('supertest');
const { expect } = require('chai');
require('dotenv').config();

describe('GraphQL API - External Tests', () => {
/*
    before(async function() {
            this.timeout(10000);
    
            try {
                // Verificar se o servidor está online
                const healthCheck = await request(process.env.BASE_URL_GRAPHQL)
                    .post('')
                    .timeout(5000);
    
                if (healthCheck.status !== 200) {
                    console.log(healthCheck.status)
                    throw new Error('Servidor não está respondendo corretamente');
                }
    
                // Prossegue com login
                const respostaLogin = await request(process.env.BASE_URL_GRAPHQL)
                    .post('')
                    .send({
                        email: 'alice@email.com',
                        password: '123456'
                    });
    
                token = respostaLogin.body.token;
                // console.log(token);
                
                } catch (error) {
                    /* console.error('❌ Erro ao conectar com o servidor:', 
                            error.code === 'ECONNREFUSED' ? 'Conexão recusada - Servidor offline' || 
                            error.message.includes('connect ECONNREFUSED') || 
                            error.response && error.response.status: 500);
                    
                    throw new Error(`❌ Servidor não disponível em: ${process.env.BASE_URL_GRAPHQL} :/ Conexão recusada - Servidor offline`);
            }
        });*/

    describe('1 - Validar Mutation: register', () => {
        it('Validar registro de usuário com sucesso', async () => {
            const registarUsuario = require('../fixture/requisicoes/registros/registerUser.json');

            const res = await request(process.env.BASE_URL_GRAPHQL)
                .post('')
                .send({ 
                    query: registarUsuario.query, 
                    variables: registarUsuario.variables 
                });

            expect(res.status).to.equal(200);
            expect(res.body.data.register.name).to.equal(registarUsuario.variables.name);
            expect(res.body.data.register.email).to.equal(registarUsuario.variables.email);
        });

        it('Validar o registro de usuário com um email já cadastrado', async () => {
            const registarUsuario = require('../fixture/requisicoes/registros/registerUser.json');

            const res = await request(process.env.BASE_URL_GRAPHQL)
                .post('')
                .send({ 
                    query: registarUsuario.query, 
                    variables: registarUsuario.variables 
                });

            expect(res.status).to.equal(200);
            expect(res.body.errors).to.be.an('array');
            expect(res.body.errors[0].message).to.equal('Email já cadastrado');
        });
    });

    describe('2 - Validar a Query: users', () => {
        it('Validar o retorno de usuários registrados', async () => {
            const consultarUsuario = require('../fixture/requisicoes/registros/userQuery.json');

            const res = await request(process.env.BASE_URL_GRAPHQL)
                .post('')
                .send({ query: consultarUsuario.query });

            // console.log(res.body.data.users.length);
            // console.log(consultarUsuario);
            expect(res.status).to.equal(200);
            expect(res.body.data.users).to.be.an('array');
            expect(res.body.data.users.length).to.be.greaterThan(0);
            expect(res.body.data.users[0]).to.have.property('name');
            expect(res.body.data.users[0]).to.have.property('email');
        });
    });
});