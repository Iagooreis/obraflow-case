const form = document.querySelector("#pedido-form");
const itens = document.querySelector("#itens");
const totalPedido = document.querySelector("#total-pedido");
const salvarPedido = document.querySelector("#salvar-pedido");
const mensagem = document.querySelector("#mensagem");
let enviando = false;

function paraInteiroDecimal(valor, casas) {
    const texto = valor.trim().replace(",", ".");
    const padrao = new RegExp(`^\\d+(?:\\.\\d{1,${casas}})?$`);

    if (!padrao.test(texto)) return null;

    const [inteiro, fracao = ""] = texto.split(".");
    return BigInt(inteiro) * 10n ** BigInt(casas)
        + BigInt(fracao.padEnd(casas, "0"));
}

function formatarCentavos(centavos) {
    const reais = centavos / 100n;
    const fracao = String(centavos % 100n).padStart(2, "0");
    return `R$ ${new Intl.NumberFormat("pt-BR").format(reais)},${fracao}`;
}

function atualizarTotais() {
    let soma = 0n;
    let itensValidos = true;

    for (const item of itens.querySelectorAll(".item")) {
        const quantidade = paraInteiroDecimal(
            item.querySelector(".quantidade").value, 3
        );
        const preco = paraInteiroDecimal(
            item.querySelector(".preco").value, 2
        );

        let totalItem = 0n;
        if (quantidade === null || quantidade <= 0n || preco === null) {
            itensValidos = false;
        } else {
            totalItem = (quantidade * preco + 500n) / 1000n;
        }

        item.querySelector(".total-item").textContent =
            formatarCentavos(totalItem);
        soma += totalItem;
    }

    totalPedido.textContent = formatarCentavos(soma);

    const textosValidos = [
        ...itens.querySelectorAll(".descricao, .unidade")
    ].every((campo) => campo.value.trim().length > 0);

    salvarPedido.disabled = (
        enviando || !itensValidos || !textosValidos || !form.checkValidity()
    );
}

function renumerarItens() {
    itens.querySelectorAll(".item").forEach((item, indice) => {
        item.querySelector("legend").textContent = `Item ${indice + 1}`;
    });
}

document.querySelector("#adicionar-item").addEventListener("click", () => {
    const novoItem = itens.querySelector(".item").cloneNode(true);

    novoItem.querySelectorAll("input").forEach((campo) => {
        campo.value = "";
    });

    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "remover-item";
    remover.textContent = "Remover item";
    novoItem.append(remover);

    itens.append(novoItem);
    renumerarItens();
    atualizarTotais();
});

itens.addEventListener("click", (evento) => {
    if (!evento.target.classList.contains("remover-item")) return;

    evento.target.closest(".item").remove();
    renumerarItens();
    atualizarTotais();
});

form.addEventListener("input", atualizarTotais);
form.addEventListener("change", atualizarTotais);

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    atualizarTotais();
    if (salvarPedido.disabled) return;

    const dados = {
        id_obra: Number(document.querySelector("#id_obra").value),
        id_fornecedor: Number(document.querySelector("#id_fornecedor").value),
        data_pedido: document.querySelector("#data_pedido").value,
        observacoes: document.querySelector("#observacoes").value.trim() || null,
        itens: [...itens.querySelectorAll(".item")].map((item) => ({
            descricao: item.querySelector(".descricao").value.trim(),
            quantidade: item.querySelector(".quantidade").value,
            unidade: item.querySelector(".unidade").value.trim(),
            preco_unitario: item.querySelector(".preco").value,
        })),
    };

    enviando = true;
    salvarPedido.disabled = true;
    salvarPedido.textContent = "Cadastrando...";
    mensagem.textContent = "";
    mensagem.className = "";

    try {
        const resposta = await fetch("/api/pedidos", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(dados),
        });
        const resultado = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            mensagem.className = "erro";
            const detalhe = resultado.detail;
            mensagem.textContent = Array.isArray(detalhe)
                ? detalhe.map((erro) => erro.msg).join("; ")
                : detalhe || "Não foi possível cadastrar o pedido.";
            return;
        }

        mensagem.className = "sucesso";
        mensagem.textContent =
            `Pedido #${resultado.id_pedido} cadastrado. ` +
            `Total: ${formatarCentavos(BigInt(resultado.total_centavos))}.`;

        form.reset();
        [...itens.querySelectorAll(".item")].slice(1).forEach(
            (item) => item.remove()
        );
        renumerarItens();
    } catch {
        mensagem.className = "erro";
        mensagem.textContent = "Não foi possível conectar ao servidor.";
    } finally {
        enviando = false;
        salvarPedido.textContent = "Cadastrar pedido";
        atualizarTotais();
    }
});

atualizarTotais();