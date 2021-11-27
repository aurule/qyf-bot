"use strict";

const { transform } = require('./gameSelectTransformer');

it('creates an array of suitable objects', () => {
  const games = [
    {
      name: 'test 1',
      description: 'test game 1',
      id: 1
    },
    {
      name: 'test 2',
      description: 'test game 2',
      id: 2
    },
  ]

  const data = transform(games);

  expect(data).toEqual([
      {
        label: 'test 1',
        description: 'test game 1',
        value: '1',
      },
      {
        label: 'test 2',
        description: 'test game 2',
        value: '2',
      }
    ]
  )
})
