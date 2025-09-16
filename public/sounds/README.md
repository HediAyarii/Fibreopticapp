# Fichiers audio pour les notifications

## Instructions pour ajouter les fichiers audio

Pour que les notifications sonores fonctionnent, vous devez ajouter deux fichiers audio dans le dossier `public/sounds/` :

### 1. reclamation.mp3
- Fichier audio court (2-3 secondes) pour les notifications de réclamation
- Format MP3 recommandé
- Volume modéré pour ne pas être trop intrusif

### 2. penalite.mp3  
- Fichier audio court (2-3 secondes) pour les notifications de pénalité
- Format MP3 recommandé
- Volume modéré pour ne pas être trop intrusif

## Alternative temporaire

Si vous n'avez pas de fichiers audio, le système utilisera les notifications du navigateur qui fonctionnent sans fichiers audio.

## Test des notifications

1. Connectez-vous en tant que technicien sur `/logintech`
2. Ouvrez le dashboard technicien
3. Depuis l'espace admin, créez une pénalité ou réclamation pour ce technicien
4. Vous devriez voir :
   - Une notification du navigateur
   - Un son (si les fichiers audio sont présents)
   - La notification dans le centre de notifications (icône cloche)

## Dépannage

- Vérifiez que les fichiers sont dans `public/sounds/`
- Vérifiez les permissions de lecture des fichiers
- Ouvrez la console du navigateur pour voir les logs de notification