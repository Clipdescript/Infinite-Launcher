import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste d'URLs d'images Minecraft de haute qualité (libres de droits)
const imageOptions = [
  {
    name: 'Minecraft Epic Landscape 1',
    url: 'https://images.pexels.com/photos/7862662/pexels-photo-7862662.jpeg?auto=compress&cs=tinysrgb&w=1920',
    description: 'Paysage Minecraft épique avec montagnes'
  },
  {
    name: 'Minecraft Sunset Scene',
    url: 'https://images.pexels.com/photos/7862497/pexels-photo-7862497.jpeg?auto=compress&cs=tinysrgb&w=1920',
    description: 'Scène de coucher de soleil Minecraft'
  },
  {
    name: 'Minecraft Village',
    url: 'https://images.pexels.com/photos/7862504/pexels-photo-7862504.jpeg?auto=compress&cs=tinysrgb&w=1920',
    description: 'Village Minecraft pittoresque'
  },
  {
    name: 'Minecraft Modern Build',
    url: 'https://picsum.photos/1920/1080',
    description: 'Image aléatoire haute qualité (fallback)'
  }
];

// Sélectionner la première image par défaut
const selectedImage = imageOptions[0];

const outputPath = path.join(__dirname, 'src', 'assets', 'Fond.jpg');

console.log('🎮 Téléchargement d\'une nouvelle image de fond pour le launcher...');
console.log('🖼️  Image sélectionnée:', selectedImage.name);
console.log('📝 Description:', selectedImage.description);
console.log('📥 Source:', selectedImage.url);
console.log('💾 Destination:', outputPath);
console.log('');

// Fonction pour télécharger l'image
function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    const request = https.get(url, (response) => {
      // Gérer les redirections
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        console.log('↪️  Redirection détectée vers:', response.headers.location);
        file.close();
        fs.unlinkSync(dest);
        return downloadImage(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Échec du téléchargement: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      let lastPercent = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const percent = Math.floor((downloadedSize / totalSize) * 100);
          if (percent !== lastPercent && percent % 5 === 0) {
            process.stdout.write(`\r⏳ Progression: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB / ${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
            lastPercent = percent;
          }
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`\r✅ Image téléchargée avec succès! (${(downloadedSize / 1024 / 1024).toFixed(2)} MB)                    `);
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      reject(err);
    });
    
    file.on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      reject(err);
    });
  });
}

// Sauvegarder l'ancienne image
const backupPath = path.join(__dirname, 'src', 'assets', 'Fond_backup_old.jpg');
if (fs.existsSync(outputPath)) {
  console.log('💾 Sauvegarde de l\'ancienne image...');
  fs.copyFileSync(outputPath, backupPath);
  console.log('✅ Ancienne image sauvegardée dans Fond_backup_old.jpg\n');
}

// Télécharger la nouvelle image
downloadImage(selectedImage.url, outputPath)
  .then(() => {
    console.log('\n🎉 Terminé! Votre launcher a maintenant un nouveau fond magnifique!');
    console.log('🔄 Relancez votre application pour voir le changement.');
    console.log('\n💡 Astuce: Si vous voulez essayer une autre image, modifiez le script');
    console.log('   et changez imageOptions[0] par imageOptions[1], [2], etc.');
  })
  .catch((err) => {
    console.error('\n❌ Erreur lors du téléchargement:', err.message);
    
    // Restaurer l'ancienne image en cas d'erreur
    if (fs.existsSync(backupPath)) {
      console.log('🔄 Restauration de l\'ancienne image...');
      fs.copyFileSync(backupPath, outputPath);
      console.log('✅ Ancienne image restaurée');
    }
    
    console.log('\n💡 Essayez une autre source d\'image en modifiant le script.');
    process.exit(1);
  });
