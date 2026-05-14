#!/bin/bash

# Configuration
# Le token GitHub doit être défini comme variable d'environnement GH_TOKEN
# Exemple: export GH_TOKEN="votre_token_ici"
if [ -z "$GH_TOKEN" ]; then
  echo "Erreur: La variable d'environnement GH_TOKEN n'est pas définie"
  echo "Utilisez: export GH_TOKEN=\"votre_token_github\""
  exit 1
fi

GITHUB_TOKEN="$GH_TOKEN"
REPO_OWNER="Clipdescript"
REPO_NAME="Infinite-Launcher"
VERSION="2.0.9"
TAG_NAME="v${VERSION}"

SHA=$(git rev-parse HEAD 2>/dev/null)

# Supprimer la release existante si elle existe
RELEASE_ID=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/tags/$TAG_NAME" \
  | grep -o '"id": [0-9]*' | head -1 | grep -o '[0-9]*')

if [ ! -z "$RELEASE_ID" ]; then
  echo "Deleting existing release..."
  curl -X DELETE \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/$RELEASE_ID"
fi

# Supprimer le tag distant s'il existe (via API)
curl -s -X DELETE \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/git/refs/tags/$TAG_NAME" >/dev/null || true

# Créer le tag distant (via API)
if [ -z "$SHA" ]; then
  echo "Error: impossible de lire le SHA git (repo non initialisé ?)"
  exit 1
fi

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/git/refs" \
  -d "{
    \"ref\": \"refs/tags/$TAG_NAME\",
    \"sha\": \"$SHA\"
  }" >/dev/null

# Créer la release via l'API GitHub
echo "Creating release $TAG_NAME..."
RELEASE_RESPONSE=$(curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases" \
  -d "{
    \"tag_name\": \"$TAG_NAME\",
    \"name\": \"Infinite Launcher $VERSION\",
    \"body\": \"Release $VERSION\\n\\nAuto-update enabled.\",
    \"draft\": false,
    \"prerelease\": false
  }")

# Extraire l'ID de la release
RELEASE_ID=$(echo "$RELEASE_RESPONSE" | grep -o '"id": [0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$RELEASE_ID" ]; then
  echo "Error creating release. Response:"
  echo "$RELEASE_RESPONSE"
  exit 1
fi

echo "Release created with ID: $RELEASE_ID"

# Uploader les fichiers nécessaires pour les mises à jour
cd "release"

# 1. Fichier EXE d'installation
echo "Uploading installer..."
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"Infinite Launcher Setup ${VERSION}.exe" \
  "https://uploads.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/$RELEASE_ID/assets?name=Infinite-Launcher-Setup-${VERSION}.exe"

# 2. Fichier blockmap (nécessaire pour les mises à jour différentielles)
echo "Uploading blockmap..."
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"Infinite Launcher Setup ${VERSION}.exe.blockmap" \
  "https://uploads.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/$RELEASE_ID/assets?name=Infinite-Launcher-Setup-${VERSION}.exe.blockmap"

# 3. Fichier latest.yml (CRUCIAL pour les mises à jour automatiques)
echo "Uploading latest.yml..."
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/x-yaml" \
  --data-binary @"latest.yml" \
  "https://uploads.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/$RELEASE_ID/assets?name=latest.yml"

echo ""
echo "✅ Release $TAG_NAME published successfully!"
echo "🔗 https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$TAG_NAME"
