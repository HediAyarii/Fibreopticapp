// Test de la nouvelle formule RAP pour taxe 50%
const testNewRapFormula = () => {
  console.log('🧮 Test de la nouvelle formule RAP pour taxe 50%')
  console.log('📋 Nouvelle formule: RAP = Total Généré - Salaire Net - (0.5 × Charge) - Total Paiements')
  
  // Exemples de calcul
  const examples = [
    {
      nom: 'BECHIRMOULAHI MOHAMED',
      totalGenere: 2460.00,
      salaireNet: 1406.34,
      charge: 456.59,
      totalPaiements: 0.00
    },
    {
      nom: 'BENADBALLAH TAOUFIK',
      totalGenere: 0.00,
      salaireNet: 1406.34,
      charge: 456.59,
      totalPaiements: 0.00
    },
    {
      nom: 'Exemple avec paiements',
      totalGenere: 3000.00,
      salaireNet: 1500.00,
      charge: 400.00,
      totalPaiements: 500.00
    }
  ]
  
  console.log('\n📊 Exemples de calcul:')
  
  examples.forEach((example, index) => {
    console.log(`\n${index + 1}. ${example.nom}:`)
    console.log(`   - Total Généré: ${example.totalGenere}€`)
    console.log(`   - Salaire Net: ${example.salaireNet}€`)
    console.log(`   - Charge: ${example.charge}€`)
    console.log(`   - Total Paiements: ${example.totalPaiements}€`)
    
    // Ancienne formule (incorrecte)
    const ancienneFormule = example.totalGenere - example.salaireNet + (0.5 * example.charge) - example.totalPaiements
    
    // Nouvelle formule (correcte)
    const nouvelleFormule = example.totalGenere - example.salaireNet - (0.5 * example.charge) - example.totalPaiements
    
    console.log(`   - Ancienne formule: ${example.totalGenere} - ${example.salaireNet} + (0.5 × ${example.charge}) - ${example.totalPaiements} = ${ancienneFormule.toFixed(2)}€`)
    console.log(`   - Nouvelle formule: ${example.totalGenere} - ${example.salaireNet} - (0.5 × ${example.charge}) - ${example.totalPaiements} = ${nouvelleFormule.toFixed(2)}€`)
    console.log(`   - Différence: ${(nouvelleFormule - ancienneFormule).toFixed(2)}€`)
  })
  
  console.log('\n✅ Test terminé !')
  console.log('💡 La nouvelle formule soustrait (0.5 × Charge) au lieu de l\'ajouter')
}

testNewRapFormula()
