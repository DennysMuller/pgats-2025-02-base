const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../../../graphql/app'); 
const userService = require('../../../src/services/userService');
const checkoutService = require('../../../src/services/checkoutService');
const { execute } = require('graphql');

describe('GraphQL API - Validar User Controller', () => {

    afterEach(() => {
        sinon.restore();
    });

    describe('1 - Validar Mutation: register', () => {
        it('Validar registro de usuário com sucesso', async () => {
            const usuario = { name: 'PGATS Turma 2', email: 'pgats-turam2@example.com' };
            const registrarUsuario = sinon.stub(userService, 'registerUser').returns(usuario);
            const registerMutation = require('../fixture/requisicoes/registros/registerUser.json');

            const res = await request(app)
                .post('/graphql')
                .send({ 
                    query: registerMutation.query, 
                    variables: registerMutation.variables
                 });
            //console.log(res.body);
            //console.log(registerMutation)
            expect(res.status).to.equal(200);
            expect(registrarUsuario.calledOnce).to.be.true;
            expect(registrarUsuario.calledOnceWith(
                registerMutation.variables.name,
                registerMutation.variables.email,
                registerMutation.variables.password
            )).to.be.true;
            expect(res.body.data.register).to.eql(usuario);
        });

        it('Validar o registro de usuário com um email já cadastrado', async () => {
            const registrarUsuario = sinon.stub(userService, 'registerUser').returns(null);            
            const registerMutation = require('../fixture/requisicoes/registros/registerUser.json');
            
            const res = await request(app)
                .post('/graphql')
                .send({ 
                    query: registerMutation.query, 
                    variables: registerMutation.variables
                 });
                 
            // console.log(res.body);
            // console.log(registerMutation);
            expect(res.status).to.equal(200);
            expect(registrarUsuario.calledOnce).to.be.true;
            //expect(res.body.errors).to.be.an('array');
            expect(res.body.errors[0].message).to.equal('Email já cadastrado');
        });
    });

    describe('2 - Mutation: login', () => {
        it('Deve fazer "Login bem-sucedido"', async () => {
            const autenticarUsuario = {  name: 'PAGATS Turma 2', email: 'pgats-turma2@example.com' , token: 'PGATS-token-JWT-Turma2' };
            const autenticacaoUsuario = sinon.stub(userService, 'authenticate').returns(autenticarUsuario);
            const loginMutation = require('../fixture/requisicoes/login/loginUser.json');

            const res = await request(app)
                .post('/graphql')
                .send({ 
                    query: loginMutation.query, 
                    variables: loginMutation.variables
                 });

            // console.log(res.body);
            // console.log(loginMutation.variables.email);
            // console.log(loginMutation.variables.password);
            expect(res.status).to.equal(200);
            expect(autenticacaoUsuario.calledOnce).to.be.true;
            expect(autenticacaoUsuario.calledOnceWith(
                loginMutation.variables.email, 
                loginMutation.variables.password
            )).to.be.true;

            // console.log(res.body);
            // console.log(res.body.data.login.token);
            // console.log(autenticarUsuario);         
            expect(res.body.data.login.token).to.equal(autenticarUsuario.token);
        });
    });
});