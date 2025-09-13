const request = require('supertest');
const { expect } = require('chai');
require('dotenv').config();

describe('2 - Validar o User - External', () => {

    before(async function() {
        this.timeout(10000);

        try {
            // Verificar se o servidor está online
            const healthCheck = await request(process.env.BASE_URL_REST)
                .get('/api-docs/')
                .timeout(5000);

            if (healthCheck.status !== 200) {
                throw new Error('Servidor não está respondendo corretamente');
            }

            // Prossegue com login
            const respostaLogin = await request(process.env.BASE_URL_REST)
                .post('/api/users/login')
                .send({
                    email: 'alice@email.com',
                    password: '123456'
                });

            token = respostaLogin.body.token;
            // console.log(token);
            
            } catch (error) {
                throw new Error(`❌ Servidor não disponível em: ${process.env.BASE_URL_REST} :/ Conexão recusada - Servidor offline`);
        }
    });

    describe('Validar "Registrar usuário" POST /api/users/register', () => {
        it('Validar o registro de um novo usuário', async () => {
            const novoUsuario = { 
                    name: 'PGATS Turma 2', 
                    email: 'pgats-turma2@example.com', 
                    password: 'password123'
            };

            const res = await request(process.env.BASE_URL_REST)
                .post('/api/users/register')
                .send(novoUsuario);

            // console.log(res.body);
            expect(res.status).to.equal(201);
            expect(res.body.user).to.have.property('name').to.be.equal(novoUsuario.name);
            expect(res.body.user).to.have.property('email').to.be.equal(novoUsuario.email);
        });

        it('Validar não permitir o registro de um usuário já existente, "Error: Bad Request"', async () => {
            const usuarioExistente = {
                name: 'Alice',
                email: 'alice@email.com',
                password: '123'
            };

            const res = await request(process.env.BASE_URL_REST)
                .post('/api/users/register')
                .send(usuarioExistente);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error', 'Email já cadastrado');
        });
    });

    describe('Validar "Login do usuário" POST /api/users/login', () => {
        it('Deve fazer "Login bem-sucedido"', async () => {
            const usuario = {
                email: 'alice@email.com',
                password: '123456'
            };

            const res = await request(process.env.BASE_URL_REST)
                .post('/api/users/login')
                .send(usuario);

            expect(res.status).to.equal(200);
            // console.log(res.body);
            expect(res.body).to.have.property('token');
        });

        it('Validar "Credenciais inválidas"', async () => {
            const usuario = {
                email: 'bob@email.com',
                password: 'pagats-turma2'
            };

            const res = await request(process.env.BASE_URL_REST)
                .post('/api/users/login')
                .send(usuario);

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('error', 'Credenciais inválidas');
        });

        it('Não deve fazer "Login mal-sucedido"', async () => {
            const usuarioInvalido = {
                email: 'pgats-turma3@example.com',
                password: 'password'
            };

            const res = await request(process.env.BASE_URL_REST)
                .post('/api/users/login')
                .send(usuarioInvalido);
            
            // console.log(res.body);
            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('error', 'Credenciais inválidas');
        });
    });
});
