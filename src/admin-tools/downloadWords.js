const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Collections to export
const collections = [
  'words',
  'categories',
  'users',
  'greeting-images',
];

async function exportWords() {
  const snapshot = await db.collection('words').get();

  const data = [];

  snapshot.forEach((doc) => {
    const word = doc.data();
    data.push({
      level: word.level,
      index: word.index,
      category: word.category,
      chinese: word.chinese,
      english: word.english,
      pinyin: word.pinyin,
      phrase: word.phrase,
      sentence: word.sentence,
      image: word.image
    });
  });

  const filePath = path.join(__dirname, `backup/words.json`);

  const sortedData = data.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }

    return a.level - b.level;
  });

  const dataString = JSON.stringify(sortedData);
  const formatedString = dataString.replaceAll('},{', '},\n{');
  fs.writeFileSync(filePath, formatedString);
  // fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`✅ Exported words (${data.length} docs)`);
}

async function exportCategories() {
  const snapshot = await db.collection('categories').get();

  const data = [];

  snapshot.forEach((doc) => {
    const category = doc.data();
    data.push({
      category: category.category,
      cname: category.cname,
      sequence: category.sequence
    });
  });

  const filePath = path.join(__dirname, `backup/categories.json`);

  const sortedData = data.sort((a, b) => {
    return a.sequence - b.sequence;
  });

  const dataString = JSON.stringify(sortedData);
  const formatedString = dataString.replaceAll('},{', '},\n{');
  fs.writeFileSync(filePath, formatedString);

  console.log(`✅ Exported categories (${data.length} docs)`);
}

async function exportUsers() {
  const snapshot = await db.collection('users').get();

  const data = [];

  snapshot.forEach((doc) => {
    const user = doc.data();
    data.push({
      email: user.email,
      allowed: user.allowed,
      level: user.level,
      role: user.role,
      name: user.name
    });
  });

  const filePath = path.join(__dirname, `backup/users.json`);

  const sortedData = data.sort((a, b) => {
    return a.sequence - b.sequence;
  });

  const dataString = JSON.stringify(sortedData);
  const formatedString = dataString.replaceAll('},{', '},\n{');
  fs.writeFileSync(filePath, formatedString);

  console.log(`✅ Exported users (${data.length} docs)`);
}

async function exportAll() {
  try {
    await exportWords();
    await exportCategories();
    await exportUsers();
    // for (const collection of collections) {
    //   await exportCollection(collection);
    // }
    console.log('\n🎉 All collections exported successfully.');
    process.exit();
  } catch (error) {
    console.error('❌ Error exporting collections:', error);
    process.exit(1);
  }
}

exportAll();
