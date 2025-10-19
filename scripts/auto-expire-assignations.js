#!/usr/bin/env node

/**
 * Script pour libérer automatiquement les assignations de cartes carburant expirées
 * Ce script peut être exécuté via un cron job quotidien
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_ENDPOINT = '/api/carburant-auto-expire';

/**
 * Exécute la libération automatique des assignations expirées
 */
async function libererAssignationsExpirees() {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}${API_ENDPOINT}`;
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    console.log(`🔄 Exécution de la libération automatique des assignations expirées...`);
    console.log(`📡 URL: ${url}`);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auto-Expire-Script/1.0'
      },
      timeout: 30000 // 30 secondes de timeout
    };
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 200 && result.success) {
            console.log(`✅ Libération automatique terminée avec succès`);
            console.log(`📊 Résultats:`);
            console.log(`   - Assignations expirées détectées: ${result.expired_count}`);
            console.log(`   - Assignations libérées: ${result.liberated_count}`);
            
            if (result.liberated_assignations && result.liberated_assignations.length > 0) {
              console.log(`📋 Assignations libérées:`);
              result.liberated_assignations.forEach((assignment, index) => {
                console.log(`   ${index + 1}. Carte ${assignment.carte_id} - Employé ${assignment.employe_id} (expirée le ${assignment.date_fin})`);
              });
            }
            
            resolve(result);
          } else {
            console.error(`❌ Erreur lors de la libération automatique:`, result.error || 'Erreur inconnue');
            reject(new Error(result.error || 'Erreur inconnue'));
          }
        } catch (parseError) {
          console.error(`❌ Erreur lors du parsing de la réponse:`, parseError.message);
          console.error(`📄 Réponse brute:`, data);
          reject(parseError);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Erreur de connexion:`, error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error(`❌ Timeout de la requête (30s)`);
      req.destroy();
      reject(new Error('Timeout de la requête'));
    });
    
    req.end();
  });
}

/**
 * Vérifie les assignations qui vont expirer
 */
async function verifierAssignationsExpirantes() {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}${API_ENDPOINT}`;
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    console.log(`📊 Vérification des assignations expirantes...`);
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auto-Expire-Script/1.0'
      },
      timeout: 15000 // 15 secondes de timeout
    };
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 200 && result.success) {
            console.log(`📊 Résultats de la vérification:`);
            console.log(`   - Assignations expirées: ${result.summary.expired_count}`);
            console.log(`   - Assignations expirant dans 7 jours: ${result.summary.upcoming_count}`);
            
            if (result.expired_assignations && result.expired_assignations.length > 0) {
              console.log(`⚠️  Assignations déjà expirées:`);
              result.expired_assignations.forEach((assignment, index) => {
                console.log(`   ${index + 1}. Carte ${assignment.carte_id} - ${assignment.prenom} ${assignment.nom} (expirée le ${assignment.date_fin})`);
              });
            }
            
            if (result.upcoming_expiry && result.upcoming_expiry.length > 0) {
              console.log(`📅 Assignations expirant bientôt:`);
              result.upcoming_expiry.forEach((assignment, index) => {
                console.log(`   ${index + 1}. Carte ${assignment.carte_id} - ${assignment.prenom} ${assignment.nom} (expire le ${assignment.date_fin})`);
              });
            }
            
            resolve(result);
          } else {
            console.error(`❌ Erreur lors de la vérification:`, result.error || 'Erreur inconnue');
            reject(new Error(result.error || 'Erreur inconnue'));
          }
        } catch (parseError) {
          console.error(`❌ Erreur lors du parsing de la réponse:`, parseError.message);
          reject(parseError);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Erreur de connexion:`, error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error(`❌ Timeout de la requête (15s)`);
      req.destroy();
      reject(new Error('Timeout de la requête'));
    });
    
    req.end();
  });
}

/**
 * Fonction principale
 */
async function main() {
  const startTime = new Date();
  console.log(`🚀 Début du script de libération automatique des assignations`);
  console.log(`⏰ Heure de début: ${startTime.toLocaleString('fr-FR')}`);
  
  try {
    // Vérifier d'abord les assignations expirantes
    await verifierAssignationsExpirantes();
    
    // Puis libérer les assignations expirées
    await libererAssignationsExpirees();
    
    const endTime = new Date();
    const duration = endTime - startTime;
    
    console.log(`✅ Script terminé avec succès`);
    console.log(`⏰ Heure de fin: ${endTime.toLocaleString('fr-FR')}`);
    console.log(`⏱️  Durée totale: ${duration}ms`);
    
    process.exit(0);
    
  } catch (error) {
    console.error(`❌ Erreur fatale:`, error.message);
    console.error(`📊 Stack trace:`, error.stack);
    
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  libererAssignationsExpirees,
  verifierAssignationsExpirantes,
  main
};


