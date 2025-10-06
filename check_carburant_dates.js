const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkCarburantDates() {
  console.log('🔍 Vérification des dates carburant disponibles...\n');

  try {
    const response = await fetch('http://localhost:3000/api/carburant');
    const data = await response.json();
    
    console.log('Dates carburant disponibles:');
    const dates = [...new Set(data.carburant.map(c => c.date_livraison).filter(d => d))];
    dates.sort();
    
    console.log('Nombre total de dates:', dates.length);
    console.log('Premières 10 dates:');
    dates.slice(0, 10).forEach(date => console.log('  -', date));
    
    if(dates.length > 10) {
      console.log('... et', dates.length - 10, 'autres dates');
    }
    
    // Vérifier s'il y a des données pour 2025
    const dates2025 = dates.filter(d => d.includes('2025'));
    console.log('\nDates 2025:', dates2025.length);
    if(dates2025.length > 0) {
      console.log('Dates 2025 disponibles:');
      dates2025.forEach(date => console.log('  -', date));
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkCarburantDates();
