const { contextBridge } = require('electron');
const path = require('path');
const fs = require('fs');

// Загружаем package.json
const packagePath = path.join(__dirname, 'package.json');
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

contextBridge.exposeInMainWorld('appInfo', {
  get: () => ({
    name: packageData.name,
    version: packageData.version,
    description: packageData.description,
    author: packageData.author,
    license: packageData.license,
  }),
});

/*contextBridge.exposeInMainWorld('api', {
  // Заглушка: список фейковых изображений
  getImages: async () => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      title: `Картинка ${i + 1}`,
      thumb: `https://placehold.co/300x400?text=Image+${i + 1}`
    }));
  }
});*/