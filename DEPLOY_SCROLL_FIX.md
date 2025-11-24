# Instructions pour corriger le scroll en production

## Sur le VPS (ubuntu@vps-ab4736a5)

Connectez-vous au VPS et exécutez les commandes suivantes :

```bash
cd ~/Fibreopticapp

# Méthode 1: Utiliser le script de rebuild
chmod +x rebuild-production.sh
./rebuild-production.sh

# OU Méthode 2: Manuellement
git pull origin staging
rm -rf .next
rm -rf node_modules/.cache
npm run build
pm2 restart fibreoptic-app
pm2 status
```

## Pourquoi le scroll ne fonctionnait pas en production ?

1. **Cache de build Next.js** - Les fichiers `.next` en cache contenaient l'ancien CSS
2. **Styles Tailwind non appliqués** - Les classes CSS dynamiques n'étaient pas générées correctement
3. **Solution appliquée** - Ajout de styles inline (`style={{}}`) pour forcer les propriétés overflow en production

## Vérifications après le rebuild

1. Vider le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
2. Ouvrir la section Matériel
3. Cliquer sur "Détails" d'un employé
4. Vérifier que le scroll vertical fonctionne dans la fenêtre modale

## En cas de problème persistant

Si le problème persiste après le rebuild :

```bash
# Nettoyer complètement et reinstaller
cd ~/Fibreopticapp
git pull origin staging
rm -rf .next
rm -rf node_modules
npm install
npm run build
pm2 restart fibreoptic-app
```
