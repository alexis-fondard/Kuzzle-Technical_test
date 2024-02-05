<script setup>
import { Kuzzle, WebSocket } from 'kuzzle-sdk';
import { ref, onMounted } from 'vue';

const kuzzle = new Kuzzle(new WebSocket('localhost'));
const messageText = ref("");
const listMessage = ref([]);

const addMessageFromKuzzleResult = (notification) => {
  try {
    listMessage.value.push({
      author: notification.result._source["author"],
      message: notification.result._source["message"]
    });
  } catch (error) {
    console.error(error);
  }
};

const sendMessage = async () => {
  if (messageText.value !== "") {
    try {
      await kuzzle.query({
        controller: "chat",
        action: "sendMessage",
        author: "Alexis",
        message: messageText.value
      });
      messageText.value = "";
    } catch (error) {
      console.error(error);
    }
  }
};

const getMessages = async () => {
  try {
    const response = await kuzzle.query({
      controller: "chat",
      action: "getMessages"
    });

    listMessage.value = response.result.hits.map(hit => ({
      author: hit._source["author"],
      message: hit._source["message"]
    }));
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  connectAndSubscribe();
  getMessages();
});

async function connectAndSubscribe() {
  try {
    await kuzzle.connect();
    kuzzle.realtime.subscribe('technical-test-index', 'chat-messages', {}, addMessageFromKuzzleResult);
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div>
    <h1>Kuzzle - Test technique Alexis</h1>
    <ul id="list-message">
      <li v-for="item in listMessage" :key="item.message">
        {{ `${item.author} a écrit : ${item.message}` }}
      </li>
    </ul>
    <textarea v-model="messageText" placeholder="Ecrire un message..."></textarea>
    <button @click="sendMessage">Envoyer</button>
  </div>
</template>
