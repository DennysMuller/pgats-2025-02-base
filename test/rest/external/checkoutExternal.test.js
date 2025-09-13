const request = require('supertest');
const { expect } = require('chai');
require('dotenv').config();

describe('1 - Validar a API Checkout - External', () => {
    /*
    before(async () => {
        const respostaLogin = await request(process.env.BASE_URL_REST)
            .post('/api/users/login')
            .send({
                email: 'alice@email.com',
                password: '123456'
            });
        token = respostaLogin.body.token;
        //console.log(token);
    });
    */
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
                /* console.error('❌ Erro ao conectar com o servidor:', 
                        error.code === 'ECONNREFUSED' ? 'Conexão recusada - Servidor offline' || 
                        error.message.includes('connect ECONNREFUSED') || 
                        error.response && error.response.status: 500);
                */
                throw new Error(`❌ Servidor não disponível em: ${process.env.BASE_URL_REST} :/ Conexão recusada - Servidor offline`);
        }
    });


    describe('Validar "Realizar checkout" POST /api/checkout', () => {
        it('Validar o processo de finalização da compra com sucesso no cartão de crédito', async () => {
            const dadosDaCompra = {
                items: [
                    { productId: 1, quantity: 2 },
                    { productId: 2, quantity: 1 }
                ],
                freight: 33.33,
                paymentMethod: 'credit_card',
                cardData: { number: '1234', expiry: '12/25', cvv: '123' }
            };

            const res = await request(process.env.BASE_URL_REST)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send(dadosDaCompra);

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('valorFinal').to.be.equal(411.66);
            // (100 * 2 + 200 * 1 + 33.33) * 0.95 = 411.66
        });

        it('Validar o processo de finalização da compra com sucesso no boleto', async () => {
            const dadosDaCompra = {
                items: [
                    { productId: 1, quantity: 3 },
                    { productId: 2, quantity: 1 }
                ],
                freight: 27.98,
                paymentMethod: 'boleto'
            };

            const res = await request(process.env.BASE_URL_REST)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send(dadosDaCompra);

            expect(res.status).to.equal(200);
            // (100 * 3) + (200 * 1) + 27.98 = 120
            expect(res.body).to.have.property('valorFinal').to.be.equal(527.98);
            
        });

        it('Validar uso de um "Token inválido, Error: Unauthorized"', async () => {
            const dadosDaCompra = {
                items: [{ productId: 1, quantity: 1 }],
                freight: 9.93933333333333336,
                paymentMethod: 'boleto'
            };

            const res = await request(process.env.BASE_URL_REST)
                .post('/api/checkout')
                .set('Authorization', 'Bearer pgats-token-invalido')
                .send(dadosDaCompra);

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('error', 'Token inválido');
        });

        it('Validar o uso de produtos inexistentes, "Error: Bad Request"', async () => {
            const dadosDaCompra = {
                items: [
                    { productId: 0, quantity: 12 },
                    { productId: 999, quantity: 5 },
                    { productId: 2.3, quantity: 1 }
                ],
                freight: 19.34,
                paymentMethod: 'boleto'
            };

            const res = await request(process.env.BASE_URL_REST)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send(dadosDaCompra);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error', 'Produto não encontrado');
        });

        it('Validar pagamento no cartão sem dados do cartão, "Error: Bad Request"', async () => {
            const dadosDaCompra = {
                items: [{ productId: 1, quantity: 1 },
                    { productId: 2, quantity: 5 }
                ],
                freight: 19.23333333333336,
                paymentMethod: 'credit_card'
            };

            const res = await request(process.env.BASE_URL_REST)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send(dadosDaCompra);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error', 'Dados do cartão obrigatórios para pagamento com cartão');
        });
    });
});
