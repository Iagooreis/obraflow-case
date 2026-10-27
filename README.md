# ObraFlow — Pedidos de compra

Implementação do desafio técnico da ObraFlow.

A aplicação possui uma página inicial e uma API para cadastrar fornecedores,
obras, usuários e pedidos de compra. O backend calcula os totais, escolhe a
regra de alçada da obra e registra aprovações e rejeições em sequência, com
persistência em SQLite e testes automatizados.

O enunciado original está em [DESAFIO.md](DESAFIO.md).

## Tecnologias

- Python 3.12+
- FastAPI e Uvicorn
- SQLAlchemy e SQLite
- Jinja2 e HTML
- pytest, HTTPX e Ruff

## Como executar

Pré-requisitos: Python 3.12 ou superior e uv instalado.

Na raiz do projeto, instale as dependências:

```bash
uv sync
```

Crie as tabelas:

```bash
uv run python -c 'from app.database import engine; from app.models import Base; Base.metadata.create_all(engine)'
```

Para criar as tabelas e carregar dados de demonstração em um banco vazio,
execute:

```bash
uv run python -m scripts.seed_demo
```

O script cria duas obras, um fornecedor, dois usuários, regras de alçada e
pedidos pendente, aprovado e rejeitado. Uma segunda execução não duplica os
dados de demonstração.

Inicie o servidor:

```bash
uv run uvicorn app.main:app --reload
```

- Página inicial: http://127.0.0.1:8000
- Documentação interativa da API: http://127.0.0.1:8000/docs

O banco é armazenado no arquivo local `obraflow.db`.
A configuração pode ser alterada pela variável `DATABASE_URL`,
conforme o arquivo `.env.example`.

## API disponível

| Método | Rota | Operação |
|---|---|---|
| POST | `/api/fornecedores` | Cadastrar fornecedor |
| GET | `/api/fornecedores` | Listar fornecedores |
| POST | `/api/obras` | Cadastrar obra |
| GET | `/api/obras` | Listar obras |
| POST | `/api/usuarios` | Cadastrar usuário |
| GET | `/api/usuarios` | Listar usuários |
| GET | `/api/obras/{id_obra}/alcadas` | Consultar faixas e aprovadores da obra |
| PUT | `/api/obras/{id_obra}/alcadas` | Substituir a configuração de alçadas da obra |
| POST | `/api/pedidos` | Criar pedido com itens e calcular o total |
| GET | `/api/pedidos` | Listar pedidos e o aprovador atual |
| GET | `/api/pedidos/{id_pedido}` | Consultar itens e histórico de aprovação |
| POST | `/api/pedidos/{id_pedido}/decisoes` | Aprovar ou rejeitar a etapa atual |

Exemplo de corpo para cadastro de fornecedor:

```json
{
  "nome_fornecedor": "Materiais Exemplo",
  "cnpj": "00000000000001",
  "rua": "Rua Principal, 100",
  "cidade": "Salvador"
}
```

O cadastro de fornecedor retorna 201 quando realizado, 422 para dados inválidos
e 409 quando o CNPJ já está cadastrado.

A validação do CNPJ verifica o formato de 14 dígitos,
sem calcular os dígitos verificadores.

Para cadastrar uma obra, envie `{"nome_obra": "Residencial Horizonte"}`
para `POST /api/obras`. O nome é obrigatório, tem até 200 caracteres
e espaços nas extremidades são removidos.

Para cadastrar um usuário, envie `{"nome_usuario": "Amanda"}`
para `POST /api/usuarios`. O nome é obrigatório e tem até 150 caracteres.

Para configurar as alçadas, envie um PUT para
`/api/obras/{id_obra}/alcadas` com os IDs dos usuários cadastrados:

```json
{
  "faixas": [
    {"limite_superior_centavos": 1000000, "aprovadores": [1]},
    {"limite_superior_centavos": null, "aprovadores": [1, 2]}
  ]
}
```

Nesse exemplo, pedidos até R$ 10.000,00 exigirão o usuário 1; acima desse
valor, o usuário 1 aprovará antes do usuário 2. O limite `null` indica a
última faixa, sem valor máximo. A ordem dos IDs define a ordem de aprovação.
O PUT substitui todas as faixas anteriores da obra em uma transação;
`{"faixas": []}` remove todas. O GET devolve a configuração salva.
Obra inexistente retorna 404; limites repetidos, fora de ordem ou
usuários inexistentes retornam 422.

Exemplo de criação de pedido:

```json
{
  "id_obra": 1,
  "id_fornecedor": 1,
  "data_pedido": "2026-10-27",
  "itens": [
    {
      "descricao": "Tinta",
      "quantidade": "1.5",
      "unidade": "l",
      "preco_unitario": "20.00"
    }
  ]
}
```

O backend calcula e salva o total em centavos, identifica a faixa aplicável
ao valor completo do pedido e copia seus aprovadores para as etapas do pedido.
Uma obra sem faixa aplicável impede a criação com resposta 422. O GET de
detalhes mostra itens, etapas, decisões e motivo de rejeição; a listagem
mostra o aprovador atual dos pedidos pendentes.

Para decidir uma etapa, envie, por exemplo,
`{"id_usuario": 1, "acao": "APROVAR"}` para
`POST /api/pedidos/{id_pedido}/decisoes`. Para rejeitar, use
`"acao": "REJEITAR"` e informe `"motivo"`. O sistema exige que o ID
informado corresponda ao aprovador da etapa atual, impede decisões fora de
ordem e encerra o fluxo após rejeição ou aprovação da última etapa.
Nesta versão de demonstração, o ID é informado pelo cliente; não há
autenticação de usuários.

## Testes

```bash
uv run pytest
```

Os testes utilizam um banco temporário separado para cada cenário.

Para verificar o código e sua formatação:

```bash
uv run ruff check app tests scripts
uv run ruff format --check app tests scripts
```

## Decisões técnicas

- SQLite simplifica a execução local, dispensando um servidor de banco.
- Rotas, serviços e repositórios separam a comunicação HTTP,
  as regras de negócio e o acesso aos dados.
- Jinja2 renderiza páginas HTML no servidor.
- A validação dos dados ocorre nos schemas; o banco também impõe
  restrições de formato e unicidade do CNPJ.
- Faixas de alçada pertencem a uma obra e têm limites crescentes em centavos.
  Os aprovadores são vinculados por ID e sua posição define a ordem.
- A configuração completa é substituída em uma transação SQLite iniciada
  antes das leituras de validação, evitando alterações parciais ou misturadas.
- Valores são calculados com `Decimal` e salvos em centavos. A criação do
  pedido salva cabeçalho, itens e etapas na mesma transação.
- Os aprovadores são copiados para o pedido no momento da criação; editar a
  alçada da obra não altera a sequência dos pedidos já existentes.
- Cada decisão atualiza a etapa e o pedido na mesma transação. O próximo
  aprovador só pode decidir após a aprovação da etapa anterior.
- A criação inicial das tabelas usa `create_all`, que não substitui
  migrations para alterações futuras de estrutura.

## Próximas etapas

Construir as telas de cadastro de pedidos, acompanhamento das decisões e
configuração das alçadas, com estados de carregamento, validação e layout
responsivo.

## Reaproveitamento

A base foi adaptada da branch `feat/api-fastapi` do projeto
[licitacoes-db-lab](https://github.com/Iagooreis/licitacoes-db-lab).
