const {
  getLastMessage,
  firestore,
  lockBottle,
  createEmptyMessage,
  storeNewMessage,
} = require("./firestore");
const { dateDifferenceInMinutes } = require("./dateUtils");
const initBot = (bot) => {
  bot.start((ctx) =>
    ctx.reply(
      "Usa il comando /bottle per ricevere o inviare un messaggio anonimo!"
    )
  );

  bot.command("bottle", async (ctx) => {
    await firestore.runTransaction(async (transaction) => {
      const lastMessage = await getLastMessage(transaction);

      if (canSendBottle(ctx, lastMessage)) {
        if (lastMessage && lastMessage.message) {
          sendLastMessage(ctx, lastMessage);
        } else {
          ctx.reply("Sei il primo a spedire una bottiglia!");
          createEmptyMessage(transaction);
        }
        await createNewBottleMessage(ctx, transaction);
      } else {
        ctx.reply("Non è arrivata nessuna bottiglia sulla tua spiaggia!");
      }
    });
  });

  bot.on("message", async (ctx) => {
    await firestore.runTransaction(async (transaction) => {
      const lastMessage = await getLastMessage(transaction);

      if (isBottleOwner(ctx, lastMessage)) {
        const newMessage = {
          message: ctx.message.text,
          userId: ctx.message.from.id,
          userName: ctx.message.from.username,
          firstName: ctx.message.from.first_name,
          lastName: ctx.message.from.last_name,
        };

        await storeNewMessage(transaction, newMessage);

        ctx.reply("Messaggio inviato!");
      } else
        ctx.reply(
          "Non hai la bottiglia in tuo possesso (o è scaduto il tempo), non puoi scrivere!\n\nRiprova con /bottle"
        );
    });
  });

  bot.catch((err, ctx) => {
    console.error("[Bot] Error", err);
    return ctx.reply(
      `Si è verificato un errore mentre elaboravo ${ctx.updateType}`,
      err
    );
  });
};

const canSendBottle = (ctx, lastMessage) => {
  if (!lastMessage) {
    return true;
  }

  if (lastMessage.lockUserId) {
    return (
      lastMessage.lockUserId === ctx.message.from.id ||
      dateDifferenceInMinutes(new Date(), lastMessage.lockDate.toDate()) > 1
    );
  } else {
    return (
      lastMessage.lastUpdate &&
      dateDifferenceInMinutes(new Date(), lastMessage.lastUpdate.toDate()) > 1
    );
  }
};

const isBottleOwner = (ctx, lastMessage) => {
  return (
    lastMessage &&
    lastMessage.lockUserId === ctx.message.from.id &&
    dateDifferenceInMinutes(new Date(), lastMessage.lockDate.toDate()) <= 1
  );
};

const createNewBottleMessage = async (ctx, transaction) => {
  await lockBottle(transaction, {
    userId: ctx.message.from.id,
  });

  ctx.reply("Scrivi il tuo messaggio e invialo!");
};

const sendLastMessage = (ctx, lastMessage) => {
  ctx.reply(
    `Apri la bottiglia e trovi un messaggio!\n\n"${lastMessage.message}" di ${lastMessage.firstName} ${lastMessage.lastName}`
  );
};

module.exports = { initBot };
