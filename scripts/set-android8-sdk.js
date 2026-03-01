const fs = require('fs');
const path = require('path');

const variablesGradle = path.join(process.cwd(), 'android', 'variables.gradle');

if (!fs.existsSync(variablesGradle)) {
  console.log('android/variables.gradle не найден. Сначала выполните: npx cap add android');
  process.exit(0);
}

let content = fs.readFileSync(variablesGradle, 'utf8');

const setValue = (name, value) => {
  const rx = new RegExp(`(${name}\\s*=\\s*)\\d+`);
  if (rx.test(content)) {
    content = content.replace(rx, `$1${value}`);
  } else {
    content += `\n${name} = ${value}\n`;
  }
};

setValue('minSdkVersion', 26);
setValue('compileSdkVersion', 34);
setValue('targetSdkVersion', 34);

fs.writeFileSync(variablesGradle, content, 'utf8');
console.log('Готово: Android SDK настроен (minSdkVersion=26, targetSdkVersion=34).');
