const Firestore = require("@google-cloud/firestore");
const { Timestamp } = require("@google-cloud/firestore");
const FIRESTORE_COLLECTION_NAME = process.env.FIRESTORE_COLLECTION_NAME;
const GCP_PROJECT = process.env.GCP_PROJECT;

const firestore = new Firestore({
  projectId: GCP_PROJECT,
});

const firestoreCollection = firestore.collection(FIRESTORE_COLLECTION_NAME);

const getLastMessage = async (transaction) => {
  const lastMessageDoc = await transaction.get(getLastMessageRef());
  if (lastMessageDoc.exists) {
    return lastMessageDoc.data();
  }
};

const lockBottle = async (transaction, user) => {
  transaction.update(getLastMessageRef(), {
    lockUserId: user.userId,
    lockDate: Timestamp.now(),
  });
};

const createEmptyMessage = (transaction) => {
  transaction.set(getLastMessageRef(), {
    lastUpdate: Timestamp.now(),
    message: "",
  });
};

const getLastMessageRef = () => {
  return firestoreCollection.doc("lastMessage");
};

const storeNewMessage = async (transaction, newMessage) => {
  const newMessageData = {
    ...newMessage,
    lastUpdate: Timestamp.now(),
  };

  transaction.update(getLastMessageRef(), {
    ...newMessageData,
    lockUserId: null,
    lockDate: null,
  });

  transaction.set(
    firestoreCollection.doc(`${newMessage.userId}_${new Date().getTime()}`),
    newMessageData
  );
};

module.exports = {
  createEmptyMessage,
  firestoreCollection,
  firestore,
  getLastMessage,
  lockBottle,
  storeNewMessage,
};
