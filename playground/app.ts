import { Backend, Request, KuzzleRequest } from 'kuzzle';

const app = new Backend('technical-test-backend');

app.controller.register('chat', {
  actions: {
    sendMessage: {
      handler: async (request: Request) => {
        return app.sdk.document.create('technical-test-index', 'chat-messages', {
          author: request.getString('author'),
          message: request.getString('message')
        })
      }
    },
    getMessages: {
      handler: async (request: Request) => {
        return app.sdk.document.search('technical-test-index', 'chat-messages', {
          size: 50,
          sort: {
            "_kuzzle_info.createdAt": "asc"
          }
        })
      }
    }
  }
});

app.pipe.register('chat:beforeSendMessage', async (request: KuzzleRequest) => {
  console.log("Je rentre dans le register");
  try {
    const valid = await app.sdk.document.validate(
      'technical-test-index',
      'chat-messages',
      request.input.args
    );
    if (valid) {
      console.log('Message validated');
    }
  } catch (error) {
    console.error(error.message);
  }
  if (String(request.input.args.message).includes("mot impoli")) {
    console.log('Mot impoli détecté');
    request.input.args.message = "Avertissement " + request.input.args.author + ", reste poli !";
    request.input.args.author = "Administrateur";
  }
  
  return request;
});

app.start()
  .then(async () => {
    app.log.info('Application started');
    if (! await app.sdk.index.exists('technical-test-index')) {
      await app.sdk.index.create('technical-test-index');
    }

    if (! await app.sdk.collection.exists('technical-test-index', 'chat-messages')) {
      await app.sdk.collection.create('technical-test-index', 'chat-messages', {
        mappings: {
          properties: {
            author: {
              type: 'text'
            },
            message: {
              type: 'text'
            }
          }
        }
      })
    }

    await app.sdk.collection.updateSpecifications('technical-test-index','chat-messages',
    {
        strict: false,
        fields: {
            author: {
                mandatory: true,
                type: 'string'
            },
            message: {
                type: 'string',
                typeOptions:  { // Ancienne version de Kuzzle ? https://docs.kuzzle.io/core/1/guides/cookbooks/datavalidation/schema/ https://docs.kuzzle.io/core/2/guides/advanced/data-validation/ 
                    length: {
                        max : 255
                    }
                }
            }
        }
    })

    await app.sdk.realtime.subscribe('technical-test-index', 'chat-messages', {}, notification => {
      // Permet de détailler la notification reçue
      console.log(notification);
    });
  })
  .catch(console.error);
