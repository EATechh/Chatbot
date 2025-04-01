const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const client = new Client();

// Variável para armazenar o número do atendente humano
const NUMERO_ATENDENTE = "5511999999999@c.us"; // Substitua pelo número real

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

const userState = {};

const exibirMenuPrincipal = async (from) => {
    userState[from] = 'MENU';
    await client.sendMessage(from, `Digite uma opção:\n\n1 - Fazer um pedido\n2 - Manutenção\n3 - Falar com um atendente\n0 - Sair`);
};

client.on('message', async msg => {
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const nome = contact.pushname.split(" ")[0];
    const from = msg.from;
    const texto = msg.body.trim();

    if (!userState[from]) {
        userState[from] = 'MENU';
    }

    if (/^(oi|olá|menu|bom dia|boa tarde|boa noite)$/i.test(texto)) {
        await chat.sendStateTyping();
        await client.sendMessage(from, `Olá, ${nome}! Sou o assistente virtual da Abreu Liquigás. Como posso ajudá-lo hoje?`);
        await exibirMenuPrincipal(from);
        return;
    }

    if (userState[from] === 'MENU') {
        if (texto === '1') {
            await chat.sendStateTyping();
            await client.sendMessage(from, `💰 *Escolha o produto desejado:*\n\n1 - Água mineral 20L   R$= 20,00 reais\n2 - P2 - Gás de Lampião   R$= 50,00 reais\n3 - P5 - Gás de Fogão de 2 bocas   R$= 65,00 reais\n4 - P8 - Gás de Churrasqueira   R$= 75,00 reais\n5 - P13 - Gás de Cozinha   R$= 100,00 reais\n6 - P20 - Gás de Empilhadeira   R$= 160,00 reais\n7 - P45 - Gás Industrial   R$= 400,00 reais\n\n0 - Voltar ao menu`);
            userState[from] = 'AGUARDANDO_ESCOLHA_PRODUTO';
            return;
        }

        if (texto === '2') {
            await chat.sendStateTyping();
            await client.sendMessage(from, `Manutenção:\n\n1 - Vazamento de Gás\n2 - Registro do Gás Vencido\n0 - Voltar ao menu`);
            userState[from] = 'AGUARDANDO_OPCAO_MANUTENCAO';
            return;
        }

        if (texto === '3') {
            await chat.sendStateTyping();
            await client.sendMessage(from, `Por favor, aguarde enquanto conectamos você com um de nossos atendentes.`);
            
            // Encaminha a mensagem para o atendente humano
            const mensagemAtendente = `Cliente ${nome} (${from}) solicitou atendimento:\n\nHistórico:\n${texto}`;
            await client.sendMessage(5511963065421, mensagemAtendente);
            
            // Informa ao cliente sobre o redirecionamento
            await client.sendMessage(from, `Você foi redirecionado para nosso atendente humano. Por favor, aguarde a resposta.`);
            
            // Não volta para o menu, encerra a interação
            delete userState[from];
            return;
        }

        if (texto === '0') {
            await client.sendMessage(from, `Obrigado por entrar em contato com a Abreu Liquigás. Tenha um ótimo dia!`);
            delete userState[from];
            return;
        }
        
        // Se não for nenhuma opção válida, mostra o menu novamente
        await exibirMenuPrincipal(from);
        return;
    }

    // Restante do código permanece igual...
    if (userState[from] === 'AGUARDANDO_OPCAO_MANUTENCAO') {
        if (texto === '1') {
            await client.sendMessage(from, `Para vazamento de gás, por favor:\n1. Desligue o registro imediatamente\n2. Ventile o ambiente\n3. Não acione interruptores ou chamas\n\nUm técnico será enviado com urgência!`);
            await client.sendMessage(from, `Por favor, informe seu *Nome completo* para agendarmos ou digite 0 para voltar.`);
            userState[from] = { etapa: 'AGUARDANDO_NOME', servico: 'Vazamento de Gás' };
            return;
        }
        if (texto === '2') {
            await client.sendMessage(from, `Para registro de gás vencido, precisaremos substituir o regulador.\n\nUm técnico será enviado para realizar a troca com segurança.`);
            await client.sendMessage(from, `Por favor, informe seu *Nome completo* para agendarmos ou digite 0 para voltar.`);
            userState[from] = { etapa: 'AGUARDANDO_NOME', servico: 'Registro do Gás Vencido' };
            return;
        }
        if (texto === '0') {
            await exibirMenuPrincipal(from);
            return;
        }
        await client.sendMessage(from, `Opção inválida! Digite 1 ou 2 para manutenção ou 0 para voltar.`);
        return;
    }

    if (userState[from] === 'AGUARDANDO_ESCOLHA_PRODUTO') {
        const produtos = {
            '1': { nome: 'Água mineral 20L', preco: '20,00' },
            '2': { nome: 'P2 - Gás de Lampião', preco: '50,00' },
            '3': { nome: 'P5 - Gás de Fogão de 2 bocas', preco: '65,00' },
            '4': { nome: 'P8 - Gás de Churrasqueira', preco: '75,00' },
            '5': { nome: 'P13 - Gás de Cozinha', preco: '100,00' },
            '6': { nome: 'P20 - Gás de Empilhadeira', preco: '160,00' },
            '7': { nome: 'P45 - Gás Industrial', preco: '400,00' }
        };

        if (produtos[texto]) {
            userState[from] = { 
                etapa: 'AGUARDANDO_NOME', 
                produto: `${produtos[texto].nome} - R$ ${produtos[texto].preco}`,
                preco: produtos[texto].preco
            };
            await client.sendMessage(from, `Você escolheu: *${produtos[texto].nome} - R$ ${produtos[texto].preco}*`);
            await client.sendMessage(from, `Por favor, informe seu *Nome completo* para continuar ou digite 0 para voltar.`);
            return;
        }

        if (texto === '0') {
            await exibirMenuPrincipal(from);
            return;
        }

        await client.sendMessage(from, `Opção inválida! Escolha um produto de 1 a 7 ou digite 0 para voltar.`);
        return;
    }

    // Restante das funções permanecem iguais...
    if (userState[from].etapa === 'AGUARDANDO_NOME') {
        if (texto === '0') {
            await exibirMenuPrincipal(from);
            return;
        }
        userState[from] = { ...userState[from], nome: texto, etapa: 'AGUARDANDO_ENDERECO' };
        await client.sendMessage(from, `Obrigado, ${texto}! Agora, informe o *Endereço completo* (Rua, número, bairro) ou digite 0 para voltar.`);
        return;
    }

    if (userState[from].etapa === 'AGUARDANDO_ENDERECO') {
        if (texto === '0') {
            await exibirMenuPrincipal(from);
            return;
        }
        userState[from] = { ...userState[from], endereco: texto, etapa: 'AGUARDANDO_PAGAMENTO' };
        
        if (userState[from].servico) {
            await client.sendMessage(from, `✅ Agendamento confirmado!\n\nTécnico será enviado para:\n*${userState[from].endereco}*\n\nServiço: *${userState[from].servico}*\n\nAgradecemos pela confiança! Entraremos em contato para confirmar.`);
            delete userState[from];
            await exibirMenuPrincipal(from);
        } else {
            await client.sendMessage(from, `💳 Escolha a *Forma de pagamento*:\n\n1 - Dinheiro (informe se precisa de troco)\n2 - Cartão (débito/crédito)\n3 - Pix (QR Code)\n\n0 - Voltar ao menu`);
        }
        return;
    }

    if (userState[from].etapa === 'AGUARDANDO_PAGAMENTO') {
        if (texto === '0') {
            await exibirMenuPrincipal(from);
            return;
        }
        
        if (texto === '1') {
            userState[from].pagamento = 'Dinheiro';
            userState[from].etapa = 'AGUARDANDO_TROCO';
            await client.sendMessage(from, `Você escolheu pagar em *dinheiro*. Por favor, informe se precisará de troco e para qual valor (ex: "Preciso de troco para 200") ou digite "Sem troco".`);
            return;
        }
        
        const formasPagamento = {
            '2': 'Cartão',
            '3': 'Pix (QR Code)'
        };
        
        if (formasPagamento[texto]) {
            userState[from].pagamento = formasPagamento[texto];
            await finalizarPedido(from);
            return;
        }
        
        await client.sendMessage(from, `Opção inválida! Escolha:\n1 - Dinheiro\n2 - Cartão\n3 - Pix\n0 - Voltar`);
        return;
    }

    if (userState[from].etapa === 'AGUARDANDO_TROCO') {
        userState[from].troco = texto;
        await finalizarPedido(from);
        return;
    }

    // Se chegar aqui sem reconhecer o comando, mostra o menu principal
    await exibirMenuPrincipal(from);
});

async function finalizarPedido(from) {
    let mensagemPedido = `✅ *Pedido Confirmado!*\n\n`;
    mensagemPedido += `📦 Produto: *${userState[from].produto}*\n`;
    mensagemPedido += `🏠 Endereço: *${userState[from].endereco}*\n`;
    mensagemPedido += `💳 Pagamento: *${userState[from].pagamento}*\n`;
    
    if (userState[from].pagamento === 'Dinheiro') {
        mensagemPedido += `💰 Troco: *${userState[from].troco || 'Não informado'}*\n`;
    }
    
    if (userState[from].produto.includes('Gás de Cozinha')) {
        mensagemPedido += `\n🎁 *Parabéns!* Você ganhou um brinde especial na compra do Gás P13!\n`;
    }
    
    mensagemPedido += `\nAgradecemos pela preferência! Seu pedido será entregue em breve.`;
    
    await client.sendMessage(from, mensagemPedido);
    delete userState[from];
}
