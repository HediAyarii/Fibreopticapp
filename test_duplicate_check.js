const fetch = require('node-fetch');

async function testDuplicateCheck() {
  console.log('🧪 Test de la fonction de vérification des doublons\n');
  console.log('⚠️  ATTENTION: Cette action va supprimer les doublons!\n');
  
  try {
    console.log('📊 Appel de l\'API...');
    const response = await fetch('http://localhost:3000/api/duplicates-check');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('\n✅ RÉSULTATS:');
    console.log('═'.repeat(60));
    console.log(`Groupes de doublons: ${data.totalDuplicateGroups}`);
    console.log(`Doublons supprimés: ${data.deletedCount}`);
    console.log(`Entrées _DUP_ nettoyées: ${data.dupCleanedCount}`);
    console.log(`Nettoyage final: ${data.finalCleanedCount || 0}`);
    console.log(`TOTAL supprimé: ${data.totalCleaned}`);
    console.log(`Temps d'exécution: ${data.executionTime}`);
    console.log('═'.repeat(60));
    
    if (data.summary && data.summary.length > 0) {
      console.log('\n📋 Exemples de doublons traités:');
      data.summary.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.num_inter} | ${s.date_rdv} | ${s.statut} (${s.count}x)`);
      });
    }
    
    console.log(`\n💬 ${data.message}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDuplicateCheck();
