/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

const customers = [];

function verifyIfExistAccountCpf(req, res, next) {
  const { cpf } = req.headers;
  const customer = customers.find((customer) => customer.cpf === cpf);
  if (!customer) {
    return res.status(400).json({ error: 'customer not found!' });
  }

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  return balance;
}

app.post('/account', (req, res) => {
  const { cpf, name } = req.body;
  const customersAlreadyExist = customers.some((customer) => {
    return customer.cpf === cpf;
  });

  if (customersAlreadyExist) {
    return res.status(400).json({ error: 'customer already exists!' });
  }
  customers.push({ id: uuidv4(), name, cpf, statement: [] });

  return res.status(201).json('Conta criada com sucesso!').send();
});

// app.use(verifyIfExistAccountCpf);
app.get('/statement/', verifyIfExistAccountCpf, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

app.get('/statement/:data', verifyIfExistAccountCpf, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + ' 00:00');
  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString(),
  );

  return res.json(statement);
});

app.post('/deposit', verifyIfExistAccountCpf, (req, res) => {
  const { customer } = req;
  const { description, amount } = req.body;

  if (!description || !amount) {
    return res.status(400).json({ error: 'description or amount not send' });
  }

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  };
  customer.statement.push(statementOperation);

  return res.status(201).json('OPERAÇÃO CONCLUÍDA').send();
});

app.post('/withdraw', verifyIfExistAccountCpf, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: 'insufficient funds!' });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit',
  };

  customer.statement.push(statementOperation);

  return res
    .status(201)
    .json(`SAQUE CONCLUÍDO, Saldo: ${getBalance(customer.statement)}`)
    .send();
});

app.put('/account', verifyIfExistAccountCpf, (req, res) => {
  const { customer } = req;
  const { name } = req.body;
  const oldname = customer.name;
  customer.name = name;

  return res
    .status(201)
    .json(`Nome atualizado de ${oldname}, para ${customer.name}`);
});

app.get('/account', verifyIfExistAccountCpf, (req, res) => {
  const { customer } = req;
  const user = {
    name: customer.name,
    cpf: customer.cpf,
  };
  return res.json(user);
});

app.delete('/account', verifyIfExistAccountCpf, (req, res) => {
  const { customer } = req;
  const index = customers.findIndex((c) => c.cpf === customer.cpf);

  customers.splice(index, 1);

  return res.status(200).json(customers);
});

app.get('/balance', verifyIfExistAccountCpf, (req, res) => {
  const { customer } = req;
  const balance = getBalance(customer.statement);
  return res.status(200).json(`Saldo: ${balance}`);
});

const port = 3335;
//
app.listen(port, console.log('On-fire, http://localhost:3335'));
