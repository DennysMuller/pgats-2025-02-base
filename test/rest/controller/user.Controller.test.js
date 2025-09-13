const request = require('supertest');
const sinon = require('sinon');
const { expect } = require('chai');
const app = require('../../../rest/app');
const userService = require('../../../src/services/userService');

describe('2 - Validar o User Controllert', () => {
    let registerStub, authenticateStub;

    before(() => {
        registerStub = sinon.stub(userService, 'registerUser');
        authenticateStub = sinon.stub(userService, 'authenticate');
    });

    after(() => {
        sinon.restore();
    });

    describe('Validar "Registrar usuário" POST /api/users/register', () => {
        it('Validar o registro de um novo usuário', async () => {
            const novoUsuario = { name: 'PGATS Turma 2', email: 'pgats-turma2@example.com'};
            registerStub.returns(novoUsuario);

            const res = await request(app)
                .post('/api/users/register')
                .send({ name: 'PGATS Turma 2', email: 'pgats-turma2@example.com', password: 'password123' });
            // console.log(res.body);
            expect(res.status).to.equal(201);
            expect(res.body.user).to.have.property('name', novoUsuario.name);
            expect(res.body.user).to.have.property('email', novoUsuario.email);
            
        });

        it('Validar não permitir o registro de um usuário já existente, "Error: Bad Request"', async () => {
            registerStub.returns(null);

            const res = await request(app)
                .post('/api/users/register')
                .send({ name: 'Alice', email: 'alice@email.com', password: '123' });

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error', 'Email já cadastrado');
        });

    });

    describe('Validar "Login do usuário" POST /api/users/login', () => {
        it('Deve fazer "Login bem-sucedido"', async () => {
            const token = { token: 'pagats-token-valido' };
            authenticateStub.returns(token);

            const res = await request(app)
                .post('/api/users/login')
                .send({ email: 'alice@email.com', password: '123456' });

            // console.log(res.body);
            expect(res.status).to.equal(200);
            expect(res.body).to.deep.equal(token);
        });

        it('Validar "Credenciais inválidas"', async () => {
            authenticateStub.returns(null);

            const res = await request(app)
                .post('/api/users/login')
                .send({ email: 'alice@email.com', password: 'pgats-turma2' });

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('error', 'Credenciais inválidas');
        });
    });
});
