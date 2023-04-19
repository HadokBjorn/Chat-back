# API-Chat

# **POST** `/participants`

Deve receber (pelo `body` do request), um parâmetro **name**, contendo o nome do participante a ser cadastrado na sala:

```jsx
{
    name: "João"
}
```

- **name** deve ser string não vazia (caso algum erro seja encontrado, retornar **status 422**).
- o cadastro de um nome que já está sendo usado  retorna **status 409**.
- Salva o participante na coleção de nome `participants` com o MongoDB, no formato:

```jsx
{
    name: 'xxx',
    lastStatus: 123456789745 //data de entrada do usuário em milesegundos
}
```

- Salva com o MongoDB uma mensagem na collection `messages` com o seguinte formato:

```jsx
{ 
    from: 'xxx',
    to: 'Todos',
    text: 'entra na sala...',
    type: 'status',
    time: 'HH:mm:ss'
}
```

- `xxx` é substituído pelo nome do usuário que acabou de entrar na sala.
- em caso de sucesso, retornar **status 201**.

# **GET** `/participants`

- Retorna a lista de todos os participantes.
- Caso não haja nenhum participante na sala, o retorno é um array vazio.

# **POST** `/messages`

Deve receber (pelo `body` da request), os parâmetros `to`, `text` e `type`:

```jsx
{
    to: "Maria",
    text: "oi sumida rs",
    type: "private_message"
}
```

- caso algum erro seja encontrado, retorna **status 422**.
- **to** e **text** devem ser strings não vazias.
- **type** só pode ser `message` ou `private_message`.
- Em caso de sucesso, retorna **status 201**.

# **GET** `/messages`

- Retorna as mensagens:
- mensagens que aquele usuário poderia ver. Ou seja: deve entregar todas as mensagens **públicas,** todas as mensagens com o remetente `“Todos”` e todas as mensagens privadas enviadas para ele (`to`) ou por ele (`from`).
- Para isso, o cliente envia um header `User` para identificar quem está fazendo a requisição.
- Essa rota aceita um valor que define a quantidade de mensagens que o cliente gostaria de obter. Esse parâmetro deve se chamar `limit`. Ou seja, o request do cliente deve ser feito pela URL:

```jsx
    http://localhost:5000/messages?limit=100
```

- Caso não seja informado um `limit`, todas as mensagens devem são retornadas.
- Caso tenha sido fornecido um `limit`, por exemplo 100, somente as últimas 100 mensagens mais recentes são retornadas.
- Caso o limite seja um valor inválido (0, negativo ou string não numérica), retorna o **status 422**.
#

# **POST** `/status`

- Recebe por um **header** na requisição, chamado `User`, o nome do participante a ser atualizado.
- Caso este header não seja passado, retorna o **status 404**.
- Caso este participante não conste na lista de participantes, será retornado um **status 404.**
- Por fim, em caso de sucesso, retornar **status 200.**

# **DELETE** `/messages/ID_DA_MENSAGEM`

- Deve receber por um **header** na requisição, chamado `User`, o nome do participante que deseja deletar a mensagem.
- Deve receber por **path params** o ID da mensagem a ser deletada.
- Caso não exista mensagem com o id recebido, retorna **status 404.**
- Caso o usuário do header não seja o dono da mensagem, retorna **status 401.**
- Se tudo estiver ok, remove a mensagem da coleção `messages`.

# **PUT** `/messages/ID_DA_MENSAGEM`

- **PUT** `/messages/ID_DA_MENSAGEM`
- Deve receber (pelo body da request), os parâmetros `to`, `text` e `type`:

```jsx
{
    to: "Maria",
    text: "oi sumida rs",
    type: "private_message"
}
```

- Deve receber por um **header** na requisição, chamado `User`, o nome do participante que deseja atualizar a mensagem.
- caso algum erro seja encontrado, retorna **status 422**.
- **to** e **text** devem ser strings não vazias.
- **type** só pode ser `message` ou `private_message`.

- Deve receber por **path params** o ID da mensagem a ser atualizada.
- Caso não exista mensagem com o id recebido, retorna **status 404.**
- Caso o usuário do header não seja o dono da mensagem, retorna **status 401.**
- Em caso de sucesso atualiza a mensagem da coleção `messages` com os dados do body.
