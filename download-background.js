import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL d'une belle image Minecraft de haute qualité (Unsplash - libre de droits)
// Cette image représente un paysage Minecraft épique et moderne
const imageUrl = 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=2574&auto=format&fit=crop';

// Alternative: Image Minecraft officielle style (via Picsum avec seed minecraft)
// const imageUrl = 'https://picsum.photos/seed/minecraft-landscape/1920/1080';

const outputPath = path.join(__dirname, 'src', 'assets', 'Fond.jpg');

console.log('🎮 Téléchargement d\'une nouvelle image de fond pour le launcher...');
console.log('📥 Source:', imageUrl);
console.log('💾 Destination:', outputPath);

// Fonction pour télécharger l'image
function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      // Gérer les redirections
      if (response.statusCode === 301 || response.statusCode === 302) {
        console.log('↪️  Redirection détectée...');
        return downloadImage(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Échec du téléchargement: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r⏳ Progression: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB)`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n✅ Image téléchargée avec succès!');
        console.log(`📊 Taille: ${(downloadedSize / 1024 / 1024).toFixed(2)} MB`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Supprimer le fichier en cas d'erreur
      reject(err);
    });
    
    file.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Sauvegarder l'ancienne image
const backupPath = path.join(__dirname, 'src', 'assets', 'Fond_backup.jpg');
if (fs.existsSync(outputPath)) {
  console.log('💾 Sauvegarde de l\'ancienne image...');
  fs.copyFileSync(outputPath, backupPath);
  console.log('✅ Ancienne image sauvegardée dans Fond_backup.jpg');
}

// Télécharger la nouvelle image
downloadImage(imageUrl, outputPath)
  .then(() => {
    console.log('\n🎉 Terminé! Votre launcher a maintenant un nouveau fond magnifique!');
    console.log('🔄 Relancez votre application pour voir le changement.');
  })
  .catch((err) => {
    console.error('\n❌ Erreur lors du téléchargement:', err.message);
    
    // Restaurer l'ancienne image en cas d'erreur
    if (fs.existsSync(backupPath)) {
      console.log('🔄 Restauration de l\'ancienne image...');
      fs.copyFileSync(backupPath, outputPath);
      console.log('✅ Ancienne image restaurée');
    }
    
    process.exit(1);
  });
